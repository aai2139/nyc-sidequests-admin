import "server-only";

import { GoogleGenAI, Type } from "@google/genai";
import type { GenerationControls } from "@/lib/generation-controls";

type Input = { neighborhood: string; budgetMin: number; budgetMax: number; partySize: number; vibe: string; preferences: string; controls?: GenerationControls };
type Place = { name: string; address: string; mapQuery: string; latitude: number; longitude: number };
type Stop = { label: string; activity: string; places: Place[] };

export async function generateAdminMedia(input: Input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured.");
  const primaryModel = input.controls?.modelName || process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const qualityFallbackModel = process.env.GEMINI_QUALITY_FALLBACK_MODEL || "gemini-3.6-flash";
  const emergencyFallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
  const promptText = [
    "Create one concise NYC sidequest with between two and five sequential stops.",
    `Area: ${input.neighborhood}`,
    `Per-person budget: $${input.budgetMin}–$${input.budgetMax}`,
    `Party size: ${input.partySize}`,
    `Vibe: ${input.vibe}`,
    `Preferences: ${JSON.stringify(input.preferences || "None")}`,
    "Return a playful title, one-sentence hook, two to five stops, and a concise budget note.",
    "Choose the stop count that creates the strongest, most cohesive outing. Use fewer stops when extra stops would weaken the route, timing, or budget.",
    "If an activity requires choosing a business or hidden destination, name one to three real specific options. Broad park, waterfront, or neighborhood strolls can use the named area itself.",
    "Every place needs a proper name, useful address or area description, and precise map search query.",
    "Do not repeat area, budget, party size, or vibe in the title and hook when those facts are already metadata.",
    "Keep the route geographically practical. Never claim live prices, hours, accessibility, or availability.",
    ...(input.controls?.promptSteps.length ? ["Active admin prompt-chain steps:", ...input.controls.promptSteps] : []),
    ...(input.controls?.terms.length ? [`Active vocabulary and guidance terms: ${JSON.stringify(input.controls.terms)}`] : []),
    ...(input.controls?.examples.length ? [`Approved generation examples: ${JSON.stringify(input.controls.examples)}`] : []),
  ].join("\n");
  const startedAt = Date.now();
  const ai = new GoogleGenAI({ apiKey });
  const generate = (model: string) => ai.models.generateContent({
    model, contents: promptText, config: {
      httpOptions: { timeout: 35_000, retryOptions: { attempts: 2 } },
      temperature: 0.82,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING }, hook: { type: Type.STRING }, budgetNote: { type: Type.STRING },
          stops: { type: Type.ARRAY, minItems: 2, maxItems: 5, items: { type: Type.OBJECT, properties: {
            label: { type: Type.STRING }, activity: { type: Type.STRING }, places: { type: Type.ARRAY, minItems: 1, maxItems: 3, items: { type: Type.OBJECT, properties: {
              name: { type: Type.STRING }, address: { type: Type.STRING }, mapQuery: { type: Type.STRING },
            }, required: ["name", "address", "mapQuery"] } },
          }, required: ["label", "activity", "places"] } },
        },
        required: ["title", "hook", "budgetNote", "stops"],
      },
    },
  });
  let modelName = primaryModel;
  let response: Awaited<ReturnType<typeof generate>> | undefined;
  let lastError: unknown;
  const modelChain = [...new Set([primaryModel, qualityFallbackModel, emergencyFallbackModel])];
  for (const [index, model] of modelChain.entries()) {
    try { response = await generate(model); modelName = model; break; }
    catch (error) {
      lastError = error;
      if (!temporary(error) || index === modelChain.length - 1) throw error;
      console.warn(`Gemini ${model} was temporarily unavailable; trying ${modelChain[index + 1]}`);
    }
  }
  if (!response) throw lastError ?? new Error("The model returned no content.");
  if (!response.text) throw new Error("The model returned no content.");
  const parsed = JSON.parse(response.text) as { title?: unknown; hook?: unknown; budgetNote?: unknown; stops?: unknown[] };
  const rawStops = Array.isArray(parsed.stops) ? parsed.stops.slice(0, 5) : [];
  const stops: Stop[] = [];
  for (const raw of rawStops) {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const rawPlaces = Array.isArray(item.places) ? item.places.slice(0, 3) : [];
    const places: Place[] = [];
    for (const rawPlace of rawPlaces) {
      const place = rawPlace && typeof rawPlace === "object" ? rawPlace as Record<string, unknown> : {};
      const name = clean(place.name, 100);
      const address = clean(place.address, 160);
      const mapQuery = clean(place.mapQuery, 180);
      const location = await geocode(mapQuery || address);
      if (name && address && mapQuery && location) places.push({ name, address, mapQuery, ...location });
    }
    if (!places.length) throw new Error(`Could not map ${clean(item.label, 50) || "a stop"}.`);
    stops.push({ label: clean(item.label, 50), activity: clean(item.activity, 220), places });
  }
  const title = clean(parsed.title, 100);
  const hook = clean(parsed.hook, 240);
  const budgetNote = clean(parsed.budgetNote, 240);
  if (!title || !hook || !budgetNote || stops.length < 2 || stops.length > 5) throw new Error("The generated media was incomplete.");
  const cover = await findCover(input.neighborhood, stops[0].places[0]?.name || title);
  return { title, hook, budgetNote, stops, cover, promptText, modelName, rawResponseText: response.text, latencyMs: Date.now() - startedAt };
}

async function geocode(query: string) {
  const geoKey = process.env.GEOAPIFY_API_KEY;
  if (geoKey) {
    const params = new URLSearchParams({ text: `${query}, New York City, NY`, format: "json", limit: "1", filter: "rect:-74.259,40.477,-73.700,40.917", apiKey: geoKey });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);
    if (response.ok) {
      const body = await response.json() as { results?: Array<{ lat?: number; lon?: number }> };
      const result = body.results?.[0];
      if (Number.isFinite(result?.lat) && Number.isFinite(result?.lon)) return { latitude: Number(result!.lat), longitude: Number(result!.lon) };
    }
  }
  const params = new URLSearchParams({ q: `${query}, New York City, NY`, format: "jsonv2", limit: "1", countrycodes: "us", viewbox: "-74.259,40.917,-73.700,40.477", bounded: "1" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": "NYC-Sidequests-Admin/1.0" } });
  if (!response.ok) return null;
  const body = await response.json() as Array<{ lat?: string; lon?: string }>;
  const latitude = Number(body[0]?.lat); const longitude = Number(body[0]?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

async function findCover(neighborhood: string, place: string) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ query: `${place} ${neighborhood} New York City`, orientation: "landscape", size: "large", per_page: "5" });
  const response = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } });
  if (!response.ok) return null;
  const body = await response.json() as { photos?: Array<{ id: number; url: string; photographer: string; alt?: string; src: { large2x: string } }> };
  const photo = body.photos?.[0];
  return photo ? { url: photo.src.large2x, alt: photo.alt || `${neighborhood} in New York City`, credit: `${photo.photographer} · Pexels`, creditUrl: photo.url, source: "pexels", key: `pexels:${photo.id}` } : null;
}

function clean(value: unknown, max: number) { return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : ""; }
function temporary(error: unknown) { const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status) : 0; const message = error instanceof Error ? error.message.toLowerCase() : ""; return status === 408 || status === 429 || status >= 500 || /high demand|unavailable|timeout|aborted/.test(message); }

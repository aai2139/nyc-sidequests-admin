import GenerateForm from "./generate-form";

export default function NewMediaPage() {
  return <><header className="page-heading"><div><p className="eyebrow">Create AI media</p><h1>Commission a new quest</h1><p>The model drafts it, location services verify the stops, and the result publishes to the public app.</p></div></header><section className="form-panel"><GenerateForm /></section></>;
}

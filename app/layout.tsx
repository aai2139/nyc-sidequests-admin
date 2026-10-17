import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sidequests Control Room",
  description: "Secure administration and analytics for NYC Sidequests.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Hunt POS",
  description: "Auto Hunt Car Care — point of sale, ledgers, AI estimates, and reward points.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

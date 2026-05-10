import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surveyor IKL",
  description: "Paperless IKL survey app for MSME/TPP inspections",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">{children}</body>
    </html>
  );
}

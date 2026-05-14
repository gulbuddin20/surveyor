import type { Metadata } from "next";
import { AppToaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIKLINGO",
  description: "Form Kesehatan Lingkungan Online",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <AppToaster>{children}</AppToaster>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mockstack — Dashboard Mock API",
  description: "Kelola endpoint mock API kamu: path, method, params, dan payload.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="h-7 w-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-mono font-bold text-sm group-hover:bg-accent/25 transition-colors">
                {"{ }"}
              </span>
              <span className="font-semibold tracking-tight text-ink">
                Mock<span className="text-accent">stack</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-surface2 transition-colors"
              >
                Semua endpoint
              </Link>
              <Link
                href="/endpoints/new"
                className="px-3 py-1.5 rounded-md bg-accent text-canvas font-medium hover:bg-accent/90 transition-colors"
              >
                + Endpoint baru
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

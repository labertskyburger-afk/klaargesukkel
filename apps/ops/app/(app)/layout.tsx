import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-widest text-ink"
          >
            Klaargesukkel <span className="text-teal">Ops</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-ink/70">
            <Link href="/projects" className="hover:text-ink">
              Projects
            </Link>
            <Link href="/clients" className="hover:text-ink">
              Clients
            </Link>
            <Link href="/eyespy" className="hover:text-ink">
              EyeSpy
            </Link>
            <Link href="/eyespy/sources" className="hover:text-ink">
              Sources
            </Link>
            <a href="/api/logout" className="text-ink/40 hover:text-ink">
              Sign out
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

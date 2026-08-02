export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gold">
          Dinner System
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">Check your email</h1>
        <p className="mt-3 text-sm text-muted">
          We sent a sign-in link. Open it on this device to get in — the link expires after a
          while, so if it doesn&apos;t work, just come back here and request a new one.
        </p>
      </div>
    </main>
  );
}

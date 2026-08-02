import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", formData);
        }}
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-8"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-gold">
          Dinner System
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          We&apos;ll email you a link — no password to remember.
        </p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoFocus
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-text outline-none focus:border-gold"
        />

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Send sign-in link
        </button>
      </form>
    </main>
  );
}

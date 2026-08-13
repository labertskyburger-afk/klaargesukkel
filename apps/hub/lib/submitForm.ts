// A killed/crashed serverless function (no DB configured yet, a timeout,
// etc.) returns a non-JSON error body, not the { error: "..." } shape our
// own routes return on a handled validation failure — res.json() throwing
// on that would otherwise surface a raw "Unexpected end of JSON input" to
// the user instead of a readable message. Same failure mode as the
// merge-themes timeout bug in apps/ops, fixed the same way here up front.
export async function postJson<T = unknown>(
  url: string,
  body: unknown
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: (T & { error?: string }) | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return { ok: false, data: null, error: data?.error ?? "Something went wrong — please try again." };
  }
  return { ok: true, data: data as T, error: null };
}

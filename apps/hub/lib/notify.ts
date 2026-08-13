import { Resend } from "resend";

// Interim notification path until WhatsApp Business API access clears (see
// ideas.json's Get It Sorted entry — blocked on Meta business verification,
// shared with Sukkel Bot). Every submission is stored in Postgres regardless
// of whether this send succeeds, so nothing is lost if email is briefly
// misconfigured — this is a notification, not the system of record.
const FROM = "Get It Sorted <notifications@klaargesukkel.com>";

export async function notifyNewSubmission(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) {
    console.warn("RESEND_API_KEY/NOTIFY_EMAIL not set — skipping submission notification email");
    return;
  }
  try {
    // Constructed lazily, only once a key is confirmed present — the Resend
    // SDK throws immediately on an empty/missing key at construction time
    // (not just at send time), which broke the build when this was a
    // module-level singleton evaluated during Next's page-data collection.
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: FROM, to: notifyEmail, subject, html });
  } catch (err) {
    // Never let a notification failure fail the actual submission — the
    // record's already in Postgres by the time this is called.
    console.error("notifyNewSubmission failed:", err);
  }
}

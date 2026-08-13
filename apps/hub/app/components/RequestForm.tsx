"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { postJson } from "@/lib/submitForm";

export const SERVICE_CATEGORIES = [
  "Handyman and minor repairs",
  "Plumbing",
  "Auto electrical",
  "Small-business bookkeeping and administration",
  "Something else",
];

const URGENCIES = [
  { value: "emergency", label: "Emergency — needed right away" },
  { value: "this_week", label: "This week" },
  { value: "flexible", label: "Flexible — no rush" },
];

const CONTACT_METHODS = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";
const labelClass = "block text-sm font-medium text-ink";

export default function RequestForm() {
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [suburb, setSuburb] = useState("");
  const [urgency, setUrgency] = useState("this_week");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const startedRef = useRef(false);
  const submittedRef = useRef(false);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent(AnalyticsEvent.RequestFormStarted);
    }
  }

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setCategory(detail);
        markStarted();
        trackEvent(AnalyticsEvent.ServiceCategorySelected, { category: detail });
      }
    }
    window.addEventListener("gis:selectCategory", handler);
    return () => window.removeEventListener("gis:selectCategory", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (startedRef.current && !submittedRef.current) {
        trackEvent(AnalyticsEvent.RequestFormAbandoned);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { ok, data, error: submitError } = await postJson<{ referenceCode: string }>("/api/requests", {
      summary,
      category,
      suburb,
      urgency,
      description,
      name,
      contactMethod,
      phone: phone || undefined,
      email: email || undefined,
      consentGiven,
    });
    if (!ok || !data) {
      setError(submitError);
      setLoading(false);
      return;
    }
    submittedRef.current = true;
    trackEvent(AnalyticsEvent.RequestFormSubmitted, { category, urgency });
    setReferenceCode(data.referenceCode);
    setLoading(false);
  }

  if (referenceCode) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal-panel p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Request received</p>
        <h3 className="mt-2 text-2xl font-bold text-ink">We&apos;ve got it — reference {referenceCode}</h3>
        <p className="mt-3 max-w-md text-ink/70">
          We&apos;ll review this and connect you with a suitable local provider. Most requests get a
          response within a business day — keep an eye on your {contactMethod === "email" ? "email" : "phone"}.
        </p>
        <p className="mt-3 max-w-md text-sm text-ink/50">
          Quote reference <strong className="text-ink">{referenceCode}</strong> if you follow up before
          you hear from us.
        </p>
        {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hi, following up on request ${referenceCode}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(AnalyticsEvent.WhatsappContactClicked, { location: "request_success" })}
            className="mt-6 inline-block rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Message us on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={markStarted} className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="summary">
            What needs sorting?
          </label>
          <input
            id="summary"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Leaking pipe under the kitchen sink"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="category">
            Service category
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select one
            </option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="suburb">
            Suburb
          </label>
          <input
            id="suburb"
            required
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g. Durbanville, Bellville, Brackenfell"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>How urgent is it?</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {URGENCIES.map((u) => (
              <label
                key={u.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                  urgency === u.value
                    ? "border-teal bg-teal-panel text-teal"
                    : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={u.value}
                  checked={urgency === u.value}
                  onChange={() => setUrgency(u.value)}
                  className="sr-only"
                />
                {u.label}
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="description">
            Short description
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few more details — when it started, what you've already tried, anything a provider should know."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="name">
            Your name
          </label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Preferred contact method</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {CONTACT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                  contactMethod === m.value
                    ? "border-teal bg-teal-panel text-teal"
                    : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="contactMethod"
                  value={m.value}
                  checked={contactMethod === m.value}
                  onChange={() => setContactMethod(m.value)}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone number {contactMethod !== "email" && <span className="text-teal">*</span>}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email {contactMethod === "email" && <span className="text-teal">*</span>}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-ink/70">
        <input
          type="checkbox"
          required
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink/30 text-teal focus:ring-teal"
        />
        I agree that Get It Sorted can share these details with a suitable local provider so they can
        contact me about this request.
      </label>

      {error && <p className="mt-4 text-sm font-medium text-amber">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Sending…" : "Get something sorted"}
      </button>
      <p className="mt-3 text-xs text-ink/40">
        It&apos;s free. No lead fees. No hidden commissions.
      </p>
    </form>
  );
}

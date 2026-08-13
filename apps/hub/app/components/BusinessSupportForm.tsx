"use client";

import { useState } from "react";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { postJson } from "@/lib/submitForm";

const SUPPORT_AREAS = [
  "Bookkeeping and financial visibility",
  "Payroll, HR and time-and-attendance",
  "Budgeting and forecasting",
  "Simple workflows and operating systems",
  "Business plans and finance applications",
  "Reporting and practical dashboards",
  "Strategy, automation and growth support",
  "Custom software and systems (ordering, booking, automation)",
  "Not sure yet",
];

const CONTACT_METHODS = [
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";
const labelClass = "block text-sm font-medium text-ink";

export default function BusinessSupportForm() {
  const [businessName, setBusinessName] = useState("");
  const [businessSize, setBusinessSize] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [supportArea, setSupportArea] = useState("");
  const [contactMethod, setContactMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { ok, data, error: submitError } = await postJson<{ referenceCode: string }>(
      "/api/business-support",
      {
        businessName,
        businessSize: businessSize || undefined,
        mainProblem,
        supportArea: supportArea || undefined,
        contactMethod,
        phone: phone || undefined,
        email: email || undefined,
      }
    );
    if (!ok || !data) {
      setError(submitError);
      setLoading(false);
      return;
    }
    trackEvent(AnalyticsEvent.BusinessSupportSubmitted, { supportArea: supportArea || "unspecified" });
    setReferenceCode(data.referenceCode);
    setLoading(false);
  }

  if (referenceCode) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal-panel p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Enquiry received</p>
        <h3 className="mt-2 text-2xl font-bold text-ink">Thanks — reference {referenceCode}</h3>
        <p className="mt-3 max-w-md text-ink/70">
          We&apos;ll be in touch to understand what&apos;s actually getting in the way before suggesting
          anything.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="businessName">
            Business name
          </label>
          <input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="businessSize">
            Business size (optional)
          </label>
          <input
            id="businessSize"
            value={businessSize}
            onChange={(e) => setBusinessSize(e.target.value)}
            placeholder="e.g. Just me, 2-5 people, 6-20 people"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="mainProblem">
            What&apos;s the main problem right now?
          </label>
          <textarea
            id="mainProblem"
            required
            rows={3}
            value={mainProblem}
            onChange={(e) => setMainProblem(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="supportArea">
            Which area feels closest? (optional)
          </label>
          <select
            id="supportArea"
            value={supportArea}
            onChange={(e) => setSupportArea(e.target.value)}
            className={inputClass}
          >
            <option value="">Not sure — let&apos;s talk</option>
            {SUPPORT_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
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
            Phone or email
          </label>
          <input
            id="phone"
            value={phone || email}
            onChange={(e) => (contactMethod === "email" ? setEmail(e.target.value) : setPhone(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-amber">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Sending…" : "Help me sort out my business"}
      </button>
    </form>
  );
}

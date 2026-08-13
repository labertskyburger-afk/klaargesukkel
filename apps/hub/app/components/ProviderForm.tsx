"use client";

import { useRef, useState } from "react";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { postJson } from "@/lib/submitForm";

const inputClass =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";
const labelClass = "block text-sm font-medium text-ink";

export default function ProviderForm() {
  const [applicantName, setApplicantName] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [areasServed, setAreasServed] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [references, setReferences] = useState("");
  const [availability, setAvailability] = useState("");
  const [hasInsurance, setHasInsurance] = useState(false);
  const [afterServiceNotes, setAfterServiceNotes] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const startedRef = useRef(false);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent(AnalyticsEvent.ProviderFormStarted);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { ok, data, error: submitError } = await postJson<{ referenceCode: string }>(
      "/api/provider-applications",
      {
        applicantName,
        isBusiness,
        phone,
        email,
        servicesOffered,
        areasServed,
        yearsExperience: yearsExperience || undefined,
        qualifications: qualifications || undefined,
        references: references || undefined,
        availability: availability || undefined,
        hasInsurance,
        afterServiceNotes: afterServiceNotes || undefined,
        consentGiven,
      }
    );
    if (!ok || !data) {
      setError(submitError);
      setLoading(false);
      return;
    }
    trackEvent(AnalyticsEvent.ProviderFormSubmitted);
    setReferenceCode(data.referenceCode);
    setLoading(false);
  }

  if (referenceCode) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal-panel p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Application received</p>
        <h3 className="mt-2 text-2xl font-bold text-ink">Thanks — reference {referenceCode}</h3>
        <p className="mt-3 max-w-md text-ink/70">
          We&apos;ll review your details and be in touch about verification and next steps. Real work
          comes from response time, communication and completed jobs — not from paying us anything.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={markStarted}
      className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="applicantName">
            Your name or business name
          </label>
          <input
            id="applicantName"
            required
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className={inputClass}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">
            <input
              type="checkbox"
              checked={isBusiness}
              onChange={(e) => setIsBusiness(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-ink/30 text-teal focus:ring-teal"
            />
            This is a registered business, not an individual
          </label>
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="servicesOffered">
            What services do you offer?
          </label>
          <textarea
            id="servicesOffered"
            required
            rows={2}
            value={servicesOffered}
            onChange={(e) => setServicesOffered(e.target.value)}
            placeholder="e.g. Plumbing — geysers, leaks, blockages"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="areasServed">
            Which areas do you serve?
          </label>
          <input
            id="areasServed"
            required
            value={areasServed}
            onChange={(e) => setAreasServed(e.target.value)}
            placeholder="e.g. Durbanville, Bellville, Brackenfell"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="yearsExperience">
            Years of experience
          </label>
          <input
            id="yearsExperience"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="qualifications">
            Qualifications or certifications
          </label>
          <input
            id="qualifications"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="availability">
            Availability
          </label>
          <input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Weekdays, emergency callouts"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="references">
            References (optional)
          </label>
          <input
            id="references"
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={hasInsurance}
              onChange={(e) => setHasInsurance(e.target.checked)}
              className="h-4 w-4 rounded border-ink/30 text-teal focus:ring-teal"
            />
            I carry liability/public insurance relevant to my work
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="afterServiceNotes">
            How do you handle it if something isn&apos;t right after the job?
          </label>
          <textarea
            id="afterServiceNotes"
            rows={2}
            value={afterServiceNotes}
            onChange={(e) => setAfterServiceNotes(e.target.value)}
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
        I agree to Get It Sorted&apos;s provider terms and to reasonable verification checks.
      </label>

      {error && <p className="mt-4 text-sm font-medium text-amber">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Sending…" : "Join the provider network"}
      </button>
    </form>
  );
}

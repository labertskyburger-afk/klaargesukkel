"use client";

import { track } from "@vercel/analytics";

// Vercel Analytics — cookieless, no consent banner needed, zero new external
// account (unlike Plausible/Fathom, which would be another "ask Albert for
// credentials" blocker). Named events per the Get It Sorted brief section 8.
// Never pass free-text form content as a property — category/urgency/source
// are fine (bounded, non-identifying), descriptions/names/contact details
// are not.
export const AnalyticsEvent = {
  PrimaryCtaClicked: "primary_cta_clicked",
  ProviderCtaClicked: "provider_cta_clicked",
  BusinessSupportCtaClicked: "business_support_cta_clicked",
  RequestFormStarted: "request_form_started",
  RequestFormSubmitted: "request_form_submitted",
  RequestFormAbandoned: "request_form_abandoned",
  ProviderFormStarted: "provider_form_started",
  ProviderFormSubmitted: "provider_form_submitted",
  BusinessSupportSubmitted: "business_support_submitted",
  WhatsappContactClicked: "whatsapp_contact_clicked",
  ServiceCategorySelected: "service_category_selected",
} as const;

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  track(name, withSource(props));
}

function withSource(
  props?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  if (typeof window === "undefined") return props ?? {};
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") ?? params.get("ref") ?? undefined;
  const campaign = params.get("utm_campaign") ?? undefined;
  return {
    ...props,
    ...(source ? { source } : {}),
    ...(campaign ? { campaign } : {}),
  };
}

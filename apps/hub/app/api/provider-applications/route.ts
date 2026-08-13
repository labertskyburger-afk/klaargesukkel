import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferenceCode } from "@/lib/referenceCode";
import { notifyNewSubmission } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const {
    applicantName,
    isBusiness,
    phone,
    email,
    servicesOffered,
    areasServed,
    yearsExperience,
    qualifications,
    references,
    availability,
    hasInsurance,
    afterServiceNotes,
    consentGiven,
  } = body;

  if (!applicantName || typeof applicantName !== "string") {
    return NextResponse.json({ error: "Please add your name or business name." }, { status: 400 });
  }
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Please add a phone number." }, { status: 400 });
  }
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Please add an email address." }, { status: 400 });
  }
  if (!servicesOffered || typeof servicesOffered !== "string") {
    return NextResponse.json({ error: "Please describe what services you offer." }, { status: 400 });
  }
  if (!areasServed || typeof areasServed !== "string") {
    return NextResponse.json({ error: "Please tell us which areas you serve." }, { status: 400 });
  }
  if (!consentGiven) {
    return NextResponse.json(
      { error: "Please confirm you agree to verification and the provider terms." },
      { status: 400 }
    );
  }

  const referenceCode = generateReferenceCode("GISP");

  const application = await prisma.providerApplication.create({
    data: {
      referenceCode,
      applicantName,
      isBusiness: !!isBusiness,
      phone,
      email,
      servicesOffered,
      areasServed,
      yearsExperience: yearsExperience || null,
      qualifications: qualifications || null,
      references: references || null,
      availability: availability || null,
      hasInsurance: typeof hasInsurance === "boolean" ? hasInsurance : null,
      afterServiceNotes: afterServiceNotes || null,
      consentGiven: true,
    },
  });

  await notifyNewSubmission(
    `New provider application — ${referenceCode}`,
    `<p><strong>${applicantName}</strong> (${phone}, ${email}) wants to join as a provider.</p>
     <p>Services: ${servicesOffered}</p>
     <p>Areas: ${areasServed}</p>
     <p>Reference: ${referenceCode}</p>`
  );

  return NextResponse.json({ referenceCode, id: application.id });
}

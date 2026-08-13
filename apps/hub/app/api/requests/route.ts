import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferenceCode } from "@/lib/referenceCode";
import { notifyNewSubmission } from "@/lib/notify";

export const dynamic = "force-dynamic";

const URGENCIES = new Set(["emergency", "this_week", "flexible"]);
const CONTACT_METHODS = new Set(["phone", "email", "whatsapp"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { summary, category, description, suburb, urgency, name, contactMethod, phone, email, consentGiven } =
    body;

  if (!summary || typeof summary !== "string") {
    return NextResponse.json({ error: "Please tell us what needs sorting." }, { status: 400 });
  }
  if (!category || typeof category !== "string") {
    return NextResponse.json({ error: "Please select a service category." }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim().length < 5) {
    return NextResponse.json({ error: "Please add a short description." }, { status: 400 });
  }
  if (!suburb || typeof suburb !== "string") {
    return NextResponse.json({ error: "Please tell us your suburb." }, { status: 400 });
  }
  if (!URGENCIES.has(urgency)) {
    return NextResponse.json({ error: "Please select how urgent this is." }, { status: 400 });
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }
  if (!CONTACT_METHODS.has(contactMethod)) {
    return NextResponse.json({ error: "Please select a preferred contact method." }, { status: 400 });
  }
  if (!phone && !email) {
    return NextResponse.json({ error: "Please add a phone number or email." }, { status: 400 });
  }
  if (!consentGiven) {
    return NextResponse.json(
      { error: "Please confirm we can share your details with a suitable provider." },
      { status: 400 }
    );
  }

  const referenceCode = generateReferenceCode("GIS");

  const request = await prisma.serviceRequest.create({
    data: {
      referenceCode,
      summary,
      category,
      description,
      suburb,
      urgency,
      name,
      contactMethod,
      phone: phone || null,
      email: email || null,
      consentGiven: true,
    },
  });

  await notifyNewSubmission(
    `New service request — ${referenceCode}`,
    `<p><strong>${name}</strong> needs help with <strong>${summary}</strong> (${category}) in <strong>${suburb}</strong> (${urgency.replace("_", " ")}).</p>
     <p>${description}</p>
     <p>Contact via ${contactMethod}: ${phone || email}</p>
     <p>Reference: ${referenceCode}</p>`
  );

  return NextResponse.json({ referenceCode, id: request.id });
}

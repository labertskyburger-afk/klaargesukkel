import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferenceCode } from "@/lib/referenceCode";
import { notifyNewSubmission } from "@/lib/notify";

export const dynamic = "force-dynamic";

const CONTACT_METHODS = new Set(["phone", "email", "whatsapp"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { businessName, businessSize, mainProblem, supportArea, contactMethod, phone, email } = body;

  if (!businessName || typeof businessName !== "string") {
    return NextResponse.json({ error: "Please add your business name." }, { status: 400 });
  }
  if (!mainProblem || typeof mainProblem !== "string" || mainProblem.trim().length < 5) {
    return NextResponse.json({ error: "Please describe the main problem." }, { status: 400 });
  }
  if (!CONTACT_METHODS.has(contactMethod)) {
    return NextResponse.json({ error: "Please select a preferred contact method." }, { status: 400 });
  }
  if (!phone && !email) {
    return NextResponse.json({ error: "Please add a phone number or email." }, { status: 400 });
  }

  const referenceCode = generateReferenceCode("GISB");

  const enquiry = await prisma.businessSupportEnquiry.create({
    data: {
      referenceCode,
      businessName,
      businessSize: businessSize || null,
      mainProblem,
      supportArea: supportArea || null,
      contactMethod,
      phone: phone || null,
      email: email || null,
    },
  });

  await notifyNewSubmission(
    `New business-support enquiry — ${referenceCode}`,
    `<p><strong>${businessName}</strong> needs help with: ${supportArea || "(not specified)"}</p>
     <p>${mainProblem}</p>
     <p>Contact via ${contactMethod}: ${phone || email}</p>
     <p>Reference: ${referenceCode}</p>`
  );

  return NextResponse.json({ referenceCode, id: enquiry.id });
}

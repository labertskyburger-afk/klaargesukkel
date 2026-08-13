-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('phone', 'email', 'whatsapp');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('emergency', 'this_week', 'flexible');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('received', 'in_progress', 'resolved');

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "name" TEXT NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderApplication" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "isBusiness" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "servicesOffered" TEXT NOT NULL,
    "areasServed" TEXT NOT NULL,
    "yearsExperience" TEXT,
    "qualifications" TEXT,
    "references" TEXT,
    "availability" TEXT,
    "hasInsurance" BOOLEAN,
    "afterServiceNotes" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSupportEnquiry" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessSize" TEXT,
    "mainProblem" TEXT NOT NULL,
    "supportArea" TEXT,
    "contactMethod" "ContactMethod" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSupportEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_referenceCode_key" ON "ServiceRequest"("referenceCode");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderApplication_referenceCode_key" ON "ProviderApplication"("referenceCode");

-- CreateIndex
CREATE INDEX "ProviderApplication_status_idx" ON "ProviderApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSupportEnquiry_referenceCode_key" ON "BusinessSupportEnquiry"("referenceCode");

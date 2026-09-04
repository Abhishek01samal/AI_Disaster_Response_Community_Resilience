-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('LOCATION', 'MEDICAL_INFORMATION', 'EMERGENCY_CONTACT', 'COMMUNITY_REPORT', 'MEDIA_UPLOAD', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('POINT', 'AREA', 'BUILDING', 'SHELTER', 'CAMP', 'HOSPITAL', 'DEPOT', 'SCHOOL', 'BRIDGE', 'ROAD', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('FLOOD', 'MEDICAL', 'FIRE', 'TRAPPED', 'MISSING_PERSON', 'ROAD_BLOCKAGE', 'INFRASTRUCTURE_DAMAGE', 'STRUCTURAL_DANGER', 'LANDSLIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "HazardType" AS ENUM ('FLOOD', 'CYCLONE', 'EARTHQUAKE', 'LANDSLIDE', 'FIRE', 'HEATWAVE', 'STORM', 'OTHER');

-- CreateEnum
CREATE TYPE "ShelterStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'EVACUATING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('WATER', 'FOOD', 'MEDICINE', 'BLANKET', 'CLOTHING', 'BABY_FOOD', 'SANITATION', 'TRANSPORT', 'POWER', 'MEDICAL_SUPPLIES', 'VOLUNTEERS', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ALLOCATED', 'EXHAUSTED');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ALLOCATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PROPOSED', 'HUMAN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESPONDER_REQUESTED', 'RESPONDER_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceState" AS ENUM ('OFFICIAL', 'VERIFIED', 'COMMUNITY', 'AI_SIGNAL', 'STALE');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'ALLOCATED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('DISASTER_RESPONSE', 'SOS_RESPONSE', 'INCIDENT_ANALYSIS', 'ROUTE_RECOMMENDATION', 'RESOURCE_MATCHING', 'EARLY_WARNING');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('DATA_REFINEMENT', 'VALIDATION', 'MASTER', 'RISK', 'ROUTE', 'RESOURCE', 'RESPONSE', 'EVALUATION');

-- CreateEnum
CREATE TYPE "AgentExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('APPROVED', 'APPROVED_WITH_REVIEW', 'BLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'Volunteer';
ALTER TYPE "Role" ADD VALUE 'ReliefOperator';
ALTER TYPE "Role" ADD VALUE 'MedicalOperator';
ALTER TYPE "Role" ADD VALUE 'Responder';
ALTER TYPE "Role" ADD VALUE 'GovernmentOfficer';

-- DropForeignKey
ALTER TABLE "OAuthProvider" DROP CONSTRAINT "OAuthProvider_userId_fkey";

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAssistanceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdSize" INTEGER,
    "childrenCount" INTEGER,
    "elderlyCount" INTEGER,
    "mobilityAssistance" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairRequired" BOOLEAN NOT NULL DEFAULT false,
    "visualAssistance" BOOLEAN NOT NULL DEFAULT false,
    "hearingAssistance" BOOLEAN NOT NULL DEFAULT false,
    "transportAssistance" BOOLEAN NOT NULL DEFAULT false,
    "medicalHelpRequired" BOOLEAN NOT NULL DEFAULT false,
    "criticalMedicationNeeded" BOOLEAN NOT NULL DEFAULT false,
    "emergencyNote" TEXT,
    "preferredLanguage" TEXT,
    "notificationPreference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAssistanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "purpose" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floors" INTEGER,
    "capacity" INTEGER,
    "officiallyDesignated" BOOLEAN NOT NULL DEFAULT false,
    "accessibility" BOOLEAN NOT NULL DEFAULT false,
    "suitabilityScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "priority" "Priority" NOT NULL,
    "sourceState" "SourceState" NOT NULL,
    "verification" "VerificationStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "sourceState" "SourceState" NOT NULL,
    "verification" "VerificationStatus" NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "affectedArea" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HazardZone" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "polygon" JSONB,
    "sourceState" "SourceState" NOT NULL,
    "verification" "VerificationStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HazardZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelter" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "occupied" INTEGER NOT NULL DEFAULT 0,
    "officiallyDesignated" BOOLEAN NOT NULL DEFAULT false,
    "accessibility" BOOLEAN NOT NULL DEFAULT false,
    "status" "ShelterStatus" NOT NULL DEFAULT 'OPEN',
    "safetyScore" DOUBLE PRECISION,
    "medicalSupport" BOOLEAN NOT NULL DEFAULT false,
    "waterAvailable" BOOLEAN NOT NULL DEFAULT false,
    "foodAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "shelterId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliefNeed" (
    "id" TEXT NOT NULL,
    "shelterId" TEXT,
    "type" "ResourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReliefNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceOffer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT,
    "type" "ResourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceMatch" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "matchedQuantity" DOUBLE PRECISION NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "status" "MatchStatus" NOT NULL DEFAULT 'PROPOSED',
    "reasons" JSONB,
    "humanConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emergencyType" "IncidentType" NOT NULL,
    "peopleAffected" INTEGER NOT NULL DEFAULT 1,
    "trapped" BOOLEAN NOT NULL DEFAULT false,
    "medicalHelpRequired" BOOLEAN NOT NULL DEFAULT false,
    "locationShared" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priority" "Priority" NOT NULL DEFAULT 'P2',
    "status" "SOSStatus" NOT NULL DEFAULT 'ACTIVE',
    "emergencyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambulance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AmbulanceStatus" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ambulance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulanceAssignment" (
    "id" TEXT NOT NULL,
    "ambulanceId" TEXT NOT NULL,
    "sosRequestId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL,
    "etaMinutes" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AmbulanceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "text" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "sourceState" "SourceState" NOT NULL DEFAULT 'COMMUNITY',
    "verification" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "incidentId" TEXT,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT,
    "type" "ResourceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'OFFERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentWorkflow" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT,
    "workflowType" "WorkflowType" NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "status" "AgentExecutionStatus" NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "confidence" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "evidenceSupported" BOOLEAN NOT NULL DEFAULT false,
    "sourceVerified" BOOLEAN NOT NULL DEFAULT false,
    "confidenceAcceptable" BOOLEAN NOT NULL DEFAULT false,
    "dataFresh" BOOLEAN NOT NULL DEFAULT false,
    "outputsConsistent" BOOLEAN NOT NULL DEFAULT false,
    "safetyPolicyPassed" BOOLEAN NOT NULL DEFAULT false,
    "explainabilityPresent" BOOLEAN NOT NULL DEFAULT false,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reasons" JSONB,
    "approvedOutputs" JSONB,
    "blockedOutputs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "incidentId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "UserLocation_userId_idx" ON "UserLocation"("userId");

-- CreateIndex
CREATE INDEX "UserLocation_capturedAt_idx" ON "UserLocation"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAssistanceProfile_userId_key" ON "UserAssistanceProfile"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_userId_consentType_idx" ON "UserConsent"("userId", "consentType");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Location_district_idx" ON "Location"("district");

-- CreateIndex
CREATE INDEX "Building_locationId_idx" ON "Building"("locationId");

-- CreateIndex
CREATE INDEX "Incident_incidentType_idx" ON "Incident"("incidentType");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_priority_idx" ON "Incident"("priority");

-- CreateIndex
CREATE INDEX "Incident_reportedAt_idx" ON "Incident"("reportedAt");

-- CreateIndex
CREATE INDEX "Alert_hazardType_idx" ON "Alert"("hazardType");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- CreateIndex
CREATE INDEX "Alert_issuedAt_idx" ON "Alert"("issuedAt");

-- CreateIndex
CREATE INDEX "HazardZone_hazardType_idx" ON "HazardZone"("hazardType");

-- CreateIndex
CREATE INDEX "HazardZone_severity_idx" ON "HazardZone"("severity");

-- CreateIndex
CREATE INDEX "Shelter_status_idx" ON "Shelter"("status");

-- CreateIndex
CREATE INDEX "Shelter_locationId_idx" ON "Shelter"("locationId");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "ReliefNeed_type_idx" ON "ReliefNeed"("type");

-- CreateIndex
CREATE INDEX "ReliefNeed_status_idx" ON "ReliefNeed"("status");

-- CreateIndex
CREATE INDEX "ResourceOffer_userId_idx" ON "ResourceOffer"("userId");

-- CreateIndex
CREATE INDEX "ResourceOffer_type_idx" ON "ResourceOffer"("type");

-- CreateIndex
CREATE INDEX "ResourceOffer_status_idx" ON "ResourceOffer"("status");

-- CreateIndex
CREATE INDEX "ResourceMatch_status_idx" ON "ResourceMatch"("status");

-- CreateIndex
CREATE INDEX "SOSRequest_userId_idx" ON "SOSRequest"("userId");

-- CreateIndex
CREATE INDEX "SOSRequest_priority_idx" ON "SOSRequest"("priority");

-- CreateIndex
CREATE INDEX "SOSRequest_status_idx" ON "SOSRequest"("status");

-- CreateIndex
CREATE INDEX "SOSRequest_createdAt_idx" ON "SOSRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Ambulance_status_idx" ON "Ambulance"("status");

-- CreateIndex
CREATE INDEX "AmbulanceAssignment_ambulanceId_idx" ON "AmbulanceAssignment"("ambulanceId");

-- CreateIndex
CREATE INDEX "AmbulanceAssignment_sosRequestId_idx" ON "AmbulanceAssignment"("sosRequestId");

-- CreateIndex
CREATE INDEX "CommunityReport_userId_idx" ON "CommunityReport"("userId");

-- CreateIndex
CREATE INDEX "CommunityReport_incidentType_idx" ON "CommunityReport"("incidentType");

-- CreateIndex
CREATE INDEX "CommunityReport_verification_idx" ON "CommunityReport"("verification");

-- CreateIndex
CREATE INDEX "CommunityReport_reportedAt_idx" ON "CommunityReport"("reportedAt");

-- CreateIndex
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");

-- CreateIndex
CREATE INDEX "Donation_type_idx" ON "Donation"("type");

-- CreateIndex
CREATE INDEX "AgentWorkflow_eventId_idx" ON "AgentWorkflow"("eventId");

-- CreateIndex
CREATE INDEX "AgentWorkflow_userId_idx" ON "AgentWorkflow"("userId");

-- CreateIndex
CREATE INDEX "AgentWorkflow_status_idx" ON "AgentWorkflow"("status");

-- CreateIndex
CREATE INDEX "AgentExecution_workflowId_idx" ON "AgentExecution"("workflowId");

-- CreateIndex
CREATE INDEX "AgentExecution_agentType_idx" ON "AgentExecution"("agentType");

-- CreateIndex
CREATE INDEX "AgentExecution_status_idx" ON "AgentExecution"("status");

-- CreateIndex
CREATE INDEX "EvaluationResult_workflowId_idx" ON "EvaluationResult"("workflowId");

-- CreateIndex
CREATE INDEX "EvaluationResult_status_idx" ON "EvaluationResult"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_incidentId_idx" ON "AuditEvent"("incidentId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_idx" ON "AuditEvent"("entityType");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "OAuthProvider" ADD CONSTRAINT "OAuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssistanceProfile" ADD CONSTRAINT "UserAssistanceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HazardZone" ADD CONSTRAINT "HazardZone_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelter" ADD CONSTRAINT "Shelter_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliefNeed" ADD CONSTRAINT "ReliefNeed_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceOffer" ADD CONSTRAINT "ResourceOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceOffer" ADD CONSTRAINT "ResourceOffer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceMatch" ADD CONSTRAINT "ResourceMatch_needId_fkey" FOREIGN KEY ("needId") REFERENCES "ReliefNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceMatch" ADD CONSTRAINT "ResourceMatch_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ResourceOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSRequest" ADD CONSTRAINT "SOSRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceAssignment" ADD CONSTRAINT "AmbulanceAssignment_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceAssignment" ADD CONSTRAINT "AmbulanceAssignment_sosRequestId_fkey" FOREIGN KEY ("sosRequestId") REFERENCES "SOSRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AgentWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

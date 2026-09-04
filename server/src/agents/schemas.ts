import { z } from "zod";

const locationSchema = z.object({
  name: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
});

const sourceSchema = z.object({
  type: z.enum(["OFFICIAL", "VERIFIED", "COMMUNITY", "AI_SIGNAL"]),
  sourceId: z.string(),
  verification: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
});

export const refinementInputSchema = z.object({
  rawId: z.string().optional(),
  rawText: z.string(),
  language: z.string().optional().default("en"),
  source: sourceSchema,
  locationText: z.string().optional().nullable(),
  locationHint: z.object({ lat: z.number(), lng: z.number() }).optional(),
  receivedAt: z.string(),
  userId: z.string().optional(),
  role: z.string().optional(),
});

export const refinementOutputSchema = z.object({
  eventId: z.string(),
  eventType: z.enum([
    "FLOOD_REPORT",
    "MEDICAL",
    "FIRE",
    "TRAPPED",
    "MISSING_PERSON",
    "ROAD_BLOCKAGE",
    "INFRASTRUCTURE_DAMAGE",
    "STRUCTURAL_DANGER",
    "LANDSLIDE",
    "OTHER",
  ]),
  normalizedText: z.string(),
  location: locationSchema,
  source: sourceSchema,
  timestamp: z.string(),
  confidence: z.number().min(0).max(1),
  possibleDuplicate: z.boolean(),
  evidence: z.object({ originalText: z.string() }),
});

export const validationOutputSchema = z.object({
  eventId: z.string(),
  validationStatus: z.enum(["VALID", "UNCERTAIN", "INVALID"]),
  checks: z.object({
    schemaValid: z.boolean(),
    locationValid: z.boolean(),
    timestampValid: z.boolean(),
    sourceValid: z.boolean(),
    contentRelevant: z.boolean(),
    rateLimitPassed: z.boolean(),
    duplicateCheckPassed: z.boolean(),
  }),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  validatedAt: z.string(),
});

export const riskInputSchema = z.object({
  eventId: z.string(),
  hazardType: z.string(),
  location: z.object({
    name: z.string().nullable().optional(),
    lat: z.number(),
    lng: z.number(),
  }),
  reports: z.array(
    z.object({
      reportId: z.string(),
      text: z.string(),
      source: z.string(),
      timestamp: z.string(),
    })
  ),
  officialAlerts: z.array(
    z.object({
      alertId: z.string(),
      severity: z.string().optional(),
      source: z.string(),
      timestamp: z.string(),
    })
  ),
});

export const riskOutputSchema = z.object({
  eventId: z.string(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  hazardType: z.string(),
  affectedZones: z.array(z.string()),
  priorityScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  sourceState: z.enum(["AI_SIGNAL", "OFFICIAL", "VERIFIED"]),
  reasons: z.array(z.string()),
  duplicateCluster: z
    .object({
      similarReports: z.number(),
      clusterId: z.string().optional(),
    })
    .nullable(),
  timestamp: z.string(),
});

export const routeInputSchema = z.object({
  eventId: z.string(),
  user: z.object({
    location: z.object({
      name: z.string().nullable().optional(),
      lat: z.number(),
      lng: z.number(),
    }),
    peopleCount: z.number(),
    accessibilityRequired: z.boolean(),
  }),
  risk: z.object({
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    hazardType: z.string(),
    affectedZones: z.array(z.string()),
  }),
  safeLocations: z.array(
    z.object({
      locationId: z.string(),
      name: z.string(),
      capacity: z.number().optional(),
      occupied: z.number().optional(),
      officiallyDesignated: z.boolean().optional(),
      accessibility: z.boolean().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    })
  ),
  roadClosures: z.array(
    z.object({ roadId: z.string(), status: z.string(), reason: z.string() })
  ),
});

export const routeOutputSchema = z.object({
  eventId: z.string(),
  recommendedLocation: z
    .object({
      locationId: z.string(),
      name: z.string(),
      confidence: z.number().min(0).max(1),
      reason: z.string(),
    })
    .nullable(),
  rankedLocations: z.array(
    z.object({
      locationId: z.string(),
      name: z.string(),
      score: z.number(),
      reason: z.string(),
    })
  ),
  confidence: z.number().min(0).max(1),
  timestamp: z.string(),
});

export const resourceInputSchema = z.object({
  eventId: z.string(),
  needs: z.array(
    z.object({
      needId: z.string(),
      type: z.string(),
      quantity: z.number(),
      unit: z.string(),
      locationId: z.string().optional(),
    })
  ),
  offers: z.array(
    z.object({
      offerId: z.string(),
      type: z.string(),
      quantity: z.number(),
      unit: z.string(),
      provider: z.string(),
      locationId: z.string().optional(),
    })
  ),
  camps: z.array(
    z.object({
      campId: z.string(),
      name: z.string(),
      capacity: z.number(),
      occupied: z.number(),
    })
  ),
});

export const resourceOutputSchema = z.object({
  eventId: z.string(),
  matches: z.array(
    z.object({
      needId: z.string(),
      offerId: z.string(),
      matchedQuantity: z.number(),
      matchScore: z.number(),
      status: z.string(),
      reasons: z.array(z.string()),
    })
  ),
  unmatchedNeeds: z.array(
    z.object({
      needId: z.string(),
      remainingQuantity: z.number(),
      unit: z.string(),
    })
  ),
  requiresHumanConfirmation: z.boolean(),
  timestamp: z.string(),
});

export const responseInputSchema = z.object({
  eventId: z.string(),
  sosRequest: z
    .object({
      sosId: z.string(),
      userId: z.string().optional(),
      emergencyType: z.string(),
      peopleAffected: z.number(),
      trapped: z.boolean(),
      medicalHelpRequired: z.boolean(),
      locationConsent: z.boolean(),
      location: z.object({ lat: z.number(), lng: z.number() }),
      timestamp: z.string(),
    })
    .nullable(),
  availableResponders: z.array(
    z.object({
      responderId: z.string(),
      type: z.string(),
      status: z.string().optional(),
      distanceKm: z.number(),
    })
  ),
});

export const responseOutputSchema = z.object({
  sosId: z.string().nullable(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).nullable(),
  status: z.enum([
    "NOT_REQUIRED",
    "NO_RESPONDER_AVAILABLE",
    "RESPONDER_REQUESTED",
  ]),
  responder: z
    .object({
      responderId: z.string(),
      type: z.string(),
    })
    .nullable(),
  etaMinutes: z.number().nullable(),
  locationShared: z.boolean(),
  simulated: z.boolean(),
  reason: z.array(z.string()),
  timestamp: z.string(),
});

export const evaluationOutputSchema = z.object({
  workflowId: z.string(),
  evaluationStatus: z.enum(["APPROVED", "APPROVED_WITH_REVIEW", "BLOCKED"]),
  checks: z.object({
    evidenceSupported: z.boolean(),
    sourceVerified: z.boolean(),
    confidenceAcceptable: z.boolean(),
    dataFresh: z.boolean(),
    agentOutputsConsistent: z.boolean(),
    safetyPolicyPassed: z.boolean(),
    explainabilityPresent: z.boolean(),
  }),
  humanReviewRequired: z.boolean(),
  reviewReasons: z.array(z.string()),
  approvedOutputs: z.array(z.string()),
  blockedOutputs: z.array(z.string()),
  timestamp: z.string(),
});

export const orchestratorOutputSchema = z.object({
  workflowId: z.string(),
  eventId: z.string(),
  status: z.enum(["STARTED", "COMPLETED", "BLOCKED", "REVIEW_REQUIRED"]),
  tasks: z.array(
    z.object({
      agent: z.enum(["RISK", "ROUTE", "RESOURCE", "RESPONSE"]),
      taskId: z.string(),
      status: z.enum(["QUEUED", "RUNNING", "SUCCESS", "FAILED"]),
    })
  ),
});

export type RefinementInput = z.infer<typeof refinementInputSchema>;
export type RefinementOutput = z.infer<typeof refinementOutputSchema>;
export type ValidationOutput = z.infer<typeof validationOutputSchema>;
export type RiskInput = z.infer<typeof riskInputSchema>;
export type RiskOutput = z.infer<typeof riskOutputSchema>;
export type RouteInput = z.infer<typeof routeInputSchema>;
export type RouteOutput = z.infer<typeof routeOutputSchema>;
export type ResourceInput = z.infer<typeof resourceInputSchema>;
export type ResourceOutput = z.infer<typeof resourceOutputSchema>;
export type ResponseInput = z.infer<typeof responseInputSchema>;
export type ResponseOutput = z.infer<typeof responseOutputSchema>;
export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;
export type OrchestratorOutput = z.infer<typeof orchestratorOutputSchema>;

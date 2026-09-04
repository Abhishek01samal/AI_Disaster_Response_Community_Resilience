import { z } from "zod";

const submitReportSchema = z.object({
  rawText: z.string().min(1, "rawText is required"),
  language: z.string().optional(),
  locationText: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const submitSosSchema = z.object({
  emergencyType: z.string().min(1, "emergencyType is required"),
  peopleAffected: z.number().min(1),
  trapped: z.boolean().optional().default(false),
  medicalHelpRequired: z.boolean().optional().default(false),
  locationConsent: z.boolean().optional().default(true),
  lat: z.number(),
  lng: z.number(),
});

export type SubmitReportBody = z.infer<typeof submitReportSchema>;
export type SubmitSosBody = z.infer<typeof submitSosSchema>;
export { submitReportSchema, submitSosSchema };

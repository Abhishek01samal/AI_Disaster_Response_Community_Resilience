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
  emergencyNote: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

const confirmMatchSchema = z.object({
  matchId: z.string().min(1),
  decision: z.enum(["CONFIRM", "REJECT"]).default("CONFIRM"),
});

export type SubmitReportBody = z.infer<typeof submitReportSchema>;
export type SubmitSosBody = z.infer<typeof submitSosSchema>;
export type ChatBody = z.infer<typeof chatSchema>;
export type ConfirmMatchBody = z.infer<typeof confirmMatchSchema>;
export {
  submitReportSchema,
  submitSosSchema,
  chatSchema,
  confirmMatchSchema,
};

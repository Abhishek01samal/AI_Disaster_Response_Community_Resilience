import type { AgentStep, ConsoleSnapshot } from "../snapshot";

/** Fixed intent set — the LLM must not invent new intents. */
export type ChatIntent =
  | "CHECK_RISK"
  | "FIND_SAFE_LOCATION"
  | "GET_ROUTE"
  | "FILE_SOS"
  | "CHECK_SOS_STATUS"
  | "SUBMIT_REPORT"
  | "CHECK_SHELTER"
  | "REQUEST_RESOURCE"
  | "GENERAL_SAFETY_INFO"
  | "SMALL_TALK"
  | "ESCALATE_TO_HUMAN"
  | "MUTATE_SCENARIO"
  | "LOAD_REGION"
  | "CLARIFY";

export type IntentClassification = {
  intent: ChatIntent;
  confidence: number;
  reason: string;
  /** Secondary intent when message mixes report + emergency (e.g. rising water + trapped). */
  secondary?: ChatIntent;
};

export type SosEmergencyType =
  | "trapped"
  | "medical"
  | "flooded"
  | "fire"
  | "injured"
  | "missing"
  | "other";

export type SosFlowState =
  | "SOS_START"
  | "SOS_PEOPLE_COUNT"
  | "SOS_MEDICAL_CHECK"
  | "SOS_LOCATION_CONSENT"
  | "SOS_CONFIRM"
  | "SOS_SUBMITTED"
  | "IDLE";

export type SosDraft = {
  emergencyType: SosEmergencyType;
  emergencyLabel: string;
  peopleAffected: number;
  medicalHelpRequired: boolean;
  trapped: boolean;
  locationConsent: boolean | null;
  locationText?: string;
  note?: string;
};

export type ReportDraft = {
  rawText: string;
  locationText?: string;
  awaitingConfirm: boolean;
};

export type ConversationSession = {
  flow: "IDLE" | "SOS" | "REPORT" | "RESOURCE";
  sosState: SosFlowState;
  sosDraft: Partial<SosDraft>;
  reportDraft: Partial<ReportDraft>;
  resourceNeed?: string;
  lastSosId?: string;
  preferredLanguage: string;
};

export type QuickOption = {
  id: string;
  label: string;
  /** Sent as the next user message when tapped. */
  value: string;
};

export type ChatCard =
  | {
      kind: "sos_draft";
      draft: SosDraft;
      actions: ("send" | "edit" | "cancel")[];
    }
  | {
      kind: "sos_status";
      sosId: string;
      status: string;
      priority: string;
      position?: number;
    }
  | {
      kind: "shelter_list";
      shelters: { name: string; score: number; dist: string; cap: string; kind: string }[];
    }
  | {
      kind: "source_tag";
      label: string;
      state: string;
      age?: string;
    };

export type ChatTurnResult = {
  intent: ChatIntent;
  reason: string;
  confidence: number;
  thinking: AgentStep[];
  reply: string;
  snapshot: ConsoleSnapshot;
  changed: boolean;
  session: ConversationSession;
  options?: QuickOption[];
  card?: ChatCard;
  /** Standing safety disclaimer for this turn. */
  showDisclaimer?: boolean;
  /** Backend write side-effect (fire-and-forget from UI). */
  pendingWrite?:
    | { type: "sos"; payload: SosDraft & { lat: number; lng: number } }
    | { type: "report"; payload: { rawText: string; locationText?: string } }
    | { type: "live_region"; query: string };
};

export const DISCLAIMER =
  "This is decision support. For life-threatening emergencies, also contact local emergency services directly.";

export const SOS_TYPE_OPTIONS: QuickOption[] = [
  { id: "trapped", label: "Trapped", value: "Trapped" },
  { id: "medical", label: "Medical emergency", value: "Medical emergency" },
  { id: "flooded", label: "Flooded", value: "Flooded" },
  { id: "fire", label: "Fire", value: "Fire" },
  { id: "injured", label: "Injured", value: "Injured" },
  { id: "missing", label: "Missing person", value: "Missing person" },
  { id: "other", label: "Other", value: "Other" },
];

export const YES_NO: QuickOption[] = [
  { id: "yes", label: "Yes", value: "Yes" },
  { id: "no", label: "No", value: "No" },
];

export const PEOPLE_OPTIONS: QuickOption[] = [
  { id: "1", label: "1", value: "1" },
  { id: "2", label: "2", value: "2" },
  { id: "3", label: "3", value: "3" },
  { id: "4", label: "4", value: "4" },
  { id: "5+", label: "5+", value: "5" },
];

export function emptySession(): ConversationSession {
  return {
    flow: "IDLE",
    sosState: "IDLE",
    sosDraft: {},
    reportDraft: {},
    preferredLanguage: "en",
  };
}

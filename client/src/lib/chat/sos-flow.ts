import type {
  ConversationSession,
  QuickOption,
  SosDraft,
  SosEmergencyType,
  SosFlowState,
} from "./types";
import {
  emptySession,
  PEOPLE_OPTIONS,
  SOS_TYPE_OPTIONS,
  YES_NO,
} from "./types";

const TYPE_MAP: { re: RegExp; type: SosEmergencyType; label: string }[] = [
  { re: /\btrap/i, type: "trapped", label: "Trapped" },
  { re: /\bmedical|dialysis|ambulance/i, type: "medical", label: "Medical emergency" },
  { re: /\bflood|water|rising/i, type: "flooded", label: "Flood / rising water" },
  { re: /\bfire|smoke/i, type: "fire", label: "Fire" },
  { re: /\binjur|hurt|bleed/i, type: "injured", label: "Injured" },
  { re: /\bmissing|lost (family|person)/i, type: "missing", label: "Missing person" },
];

export function parseEmergencyType(text: string): { type: SosEmergencyType; label: string } | null {
  const q = text.trim().toLowerCase();
  for (const opt of SOS_TYPE_OPTIONS) {
    if (q === opt.label.toLowerCase() || q === opt.value.toLowerCase() || q === opt.id) {
      const mapped = TYPE_MAP.find((t) => t.type === opt.id) ?? {
        type: "other" as SosEmergencyType,
        label: opt.label,
      };
      return { type: opt.id as SosEmergencyType, label: mapped.label };
    }
  }
  for (const row of TYPE_MAP) {
    if (row.re.test(text)) return { type: row.type, label: row.label };
  }
  if (/^other$/i.test(q)) return { type: "other", label: "Other" };
  return null;
}

export function parsePeopleCount(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\b/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 99) return n;
  }
  if (/\b(five|5\+)\b/i.test(text)) return 5;
  if (/\b(one|just me|alone)\b/i.test(text)) return 1;
  if (/\b(two|couple)\b/i.test(text)) return 2;
  if (/\b(three)\b/i.test(text)) return 3;
  if (/\b(four)\b/i.test(text)) return 4;
  return null;
}

export function parseYesNo(text: string): boolean | null {
  const q = text.trim().toLowerCase();
  if (/^(y|yes|yeah|yep|true|affirmative)\b/.test(q) || /\byes\b/.test(q)) return true;
  if (/^(n|no|nope|false|negative)\b/.test(q) || /\bno\b/.test(q)) return false;
  return null;
}

export function isSosCancel(text: string): boolean {
  return /\b(cancel|never ?mind|stop|abort)\b/i.test(text);
}

export function isSosConfirmSend(text: string): boolean {
  return /\b(send|confirm|yes.?send|submit|go ahead)\b/i.test(text);
}

export function isSosEdit(text: string): boolean {
  return /\b(edit|change|fix|back)\b/i.test(text);
}

export function seedSosFromUtterance(text: string): Partial<SosDraft> {
  const draft: Partial<SosDraft> = { note: text.slice(0, 280) };
  const typed = parseEmergencyType(text);
  if (typed) {
    draft.emergencyType = typed.type;
    draft.emergencyLabel = typed.label;
    draft.trapped = typed.type === "trapped";
  }
  if (/\btrap/i.test(text)) draft.trapped = true;
  const people = parsePeopleCount(text);
  if (people != null) draft.peopleAffected = people;
  if (/\b(wheelchair|mobility|dialysis|injur|medical|pregnant)\b/i.test(text)) {
    draft.medicalHelpRequired = true;
  }
  const loc = text.match(/\b(sector\s*\d+|ward\s*\d+|nadipur|nh-?\d+)\b/i);
  if (loc) draft.locationText = loc[0];
  return draft;
}

export type SosStepResult = {
  session: ConversationSession;
  reply: string;
  options?: QuickOption[];
  readyToConfirm: boolean;
  submitted: boolean;
  cancelled: boolean;
};

function completeDraft(partial: Partial<SosDraft>): SosDraft | null {
  if (
    !partial.emergencyType ||
    !partial.emergencyLabel ||
    partial.peopleAffected == null ||
    partial.medicalHelpRequired == null ||
    partial.locationConsent === undefined
  ) {
    return null;
  }
  return {
    emergencyType: partial.emergencyType,
    emergencyLabel: partial.emergencyLabel,
    peopleAffected: partial.peopleAffected,
    medicalHelpRequired: partial.medicalHelpRequired,
    trapped: partial.trapped ?? partial.emergencyType === "trapped",
    locationConsent: partial.locationConsent,
    locationText: partial.locationText,
    note: partial.note,
  };
}

function promptFor(state: SosFlowState, draft: Partial<SosDraft>): { reply: string; options?: QuickOption[] } {
  switch (state) {
    case "SOS_START":
      return {
        reply:
          "I'll help you send an SOS. First — what's happening? Pick one, or describe briefly.",
        options: SOS_TYPE_OPTIONS,
      };
    case "SOS_PEOPLE_COUNT":
      return {
        reply: "How many people need help?",
        options: PEOPLE_OPTIONS,
      };
    case "SOS_MEDICAL_CHECK":
      return {
        reply: "Does anyone need urgent medical help?",
        options: YES_NO,
      };
    case "SOS_LOCATION_CONSENT":
      return {
        reply:
          "Can I share your live location with responders? Used only while this SOS is active and revocable anytime.",
        options: [
          { id: "share", label: "Share live location", value: "Yes, share location" },
          { id: "manual", label: "I'll type a location", value: "No, manual location" },
        ],
      };
    case "SOS_CONFIRM": {
      const d = completeDraft(draft);
      const body = d
        ? `Type: ${d.emergencyLabel}\nPeople: ${d.peopleAffected}${d.medicalHelpRequired ? " (medical assistance)" : ""}\nLocation: ${d.locationConsent ? "live (shared)" : d.locationText ?? "manual — pending"}\nTrapped: ${d.trapped ? "yes" : "no"}`
        : "Draft incomplete.";
      return {
        reply: `I've prepared an SOS (draft, not sent yet):\n${body}\n\nSend this SOS now?`,
        options: [
          { id: "send", label: "Send SOS", value: "Send" },
          { id: "edit", label: "Edit", value: "Edit" },
          { id: "cancel", label: "Cancel", value: "Cancel" },
        ],
      };
    }
    default:
      return { reply: "SOS flow idle." };
  }
}

function nextMissingState(draft: Partial<SosDraft>): SosFlowState {
  if (!draft.emergencyType) return "SOS_START";
  if (draft.peopleAffected == null) return "SOS_PEOPLE_COUNT";
  if (draft.medicalHelpRequired == null) return "SOS_MEDICAL_CHECK";
  if (draft.locationConsent === undefined) return "SOS_LOCATION_CONSENT";
  return "SOS_CONFIRM";
}

/**
 * Slot-based SOS state machine. Structured fields are never free-written by the LLM.
 */
export function advanceSosFlow(
  session: ConversationSession,
  userText: string,
  startFresh: boolean
): SosStepResult {
  let next: ConversationSession = startFresh
    ? {
        ...emptySession(),
        preferredLanguage: session.preferredLanguage,
        flow: "SOS",
        sosState: "SOS_START",
        sosDraft: seedSosFromUtterance(userText),
      }
    : {
        ...session,
        flow: "SOS",
        sosDraft: { ...session.sosDraft },
      };

  if (isSosCancel(userText) && !startFresh) {
    return {
      session: emptySession(),
      reply: "SOS cancelled. Nothing was sent. Say “I need help” anytime to start again.",
      readyToConfirm: false,
      submitted: false,
      cancelled: true,
    };
  }

  // Seed may already fill slots from a rich first utterance
  if (startFresh) {
    next.sosState = nextMissingState(next.sosDraft);
    if (next.sosState === "SOS_CONFIRM") {
      const prompted = promptFor("SOS_CONFIRM", next.sosDraft);
      return {
        session: { ...next, sosState: "SOS_CONFIRM" },
        reply: prompted.reply,
        options: prompted.options,
        readyToConfirm: true,
        submitted: false,
        cancelled: false,
      };
    }
    // If we got type from utterance, skip START prompt and ask next slot
    if (next.sosDraft.emergencyType && next.sosState !== "SOS_START") {
      const prompted = promptFor(next.sosState, next.sosDraft);
      return {
        session: next,
        reply: `Treating this as an emergency (${next.sosDraft.emergencyLabel}). ${prompted.reply}`,
        options: prompted.options,
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
    const prompted = promptFor("SOS_START", next.sosDraft);
    return {
      session: { ...next, sosState: "SOS_START" },
      reply: prompted.reply,
      options: prompted.options,
      readyToConfirm: false,
      submitted: false,
      cancelled: false,
    };
  }

  const state = next.sosState;

  if (state === "SOS_START") {
    const typed = parseEmergencyType(userText);
    if (!typed) {
      const prompted = promptFor("SOS_START", next.sosDraft);
      return {
        session: next,
        reply: `I need a clear emergency type. ${prompted.reply}`,
        options: prompted.options,
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
    next.sosDraft.emergencyType = typed.type;
    next.sosDraft.emergencyLabel = typed.label;
    next.sosDraft.trapped = typed.type === "trapped";
    next.sosState = "SOS_PEOPLE_COUNT";
  } else if (state === "SOS_PEOPLE_COUNT") {
    const n = parsePeopleCount(userText);
    if (n == null) {
      return {
        session: next,
        reply: "Please give a number of people who need help.",
        options: PEOPLE_OPTIONS,
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
    next.sosDraft.peopleAffected = n;
    next.sosState = "SOS_MEDICAL_CHECK";
  } else if (state === "SOS_MEDICAL_CHECK") {
    const yn = parseYesNo(userText);
    if (yn == null) {
      return {
        session: next,
        reply: "Does anyone need urgent medical help? Yes or No.",
        options: YES_NO,
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
    next.sosDraft.medicalHelpRequired = yn;
    next.sosState = "SOS_LOCATION_CONSENT";
  } else if (state === "SOS_LOCATION_CONSENT") {
    const yn = parseYesNo(userText);
    const manual = /manual|type|text|sector|ward|no/i.test(userText);
    if (yn === true || /share/i.test(userText)) {
      next.sosDraft.locationConsent = true;
      next.sosState = "SOS_CONFIRM";
    } else if (yn === false || manual) {
      next.sosDraft.locationConsent = false;
      const loc = userText.match(/\b(sector\s*\d+|ward\s*\d+|nadipur|[\w\s]{3,40})\b/i);
      if (loc && !/^(no|manual|location)$/i.test(loc[0].trim())) {
        next.sosDraft.locationText = loc[0].trim();
        next.sosState = "SOS_CONFIRM";
      } else if (next.sosDraft.locationText) {
        next.sosState = "SOS_CONFIRM";
      } else {
        return {
          session: next,
          reply: "Please type a location (e.g. “Sector 4” or a landmark).",
          readyToConfirm: false,
          submitted: false,
          cancelled: false,
        };
      }
    } else {
      return {
        session: next,
        reply: "Can I share live location? Or reply with a manual place name.",
        options: [
          { id: "share", label: "Share live location", value: "Yes, share location" },
          { id: "manual", label: "I'll type a location", value: "No, manual location" },
        ],
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
  } else if (state === "SOS_CONFIRM") {
    if (isSosEdit(userText)) {
      next.sosState = "SOS_START";
      next.sosDraft = { note: next.sosDraft.note };
      const prompted = promptFor("SOS_START", next.sosDraft);
      return {
        session: next,
        reply: `Okay — let's edit. ${prompted.reply}`,
        options: prompted.options,
        readyToConfirm: false,
        submitted: false,
        cancelled: false,
      };
    }
    if (isSosConfirmSend(userText)) {
      const draft = completeDraft(next.sosDraft);
      if (!draft) {
        next.sosState = nextMissingState(next.sosDraft);
        const prompted = promptFor(next.sosState, next.sosDraft);
        return {
          session: next,
          reply: `Draft still incomplete. ${prompted.reply}`,
          options: prompted.options,
          readyToConfirm: false,
          submitted: false,
          cancelled: false,
        };
      }
      return {
        session: { ...next, sosState: "SOS_SUBMITTED", sosDraft: draft },
        reply: "Submitting SOS…",
        readyToConfirm: false,
        submitted: true,
        cancelled: false,
      };
    }
    const prompted = promptFor("SOS_CONFIRM", next.sosDraft);
    return {
      session: next,
      reply: prompted.reply,
      options: prompted.options,
      readyToConfirm: true,
      submitted: false,
      cancelled: false,
    };
  }

  // After filling a slot, advance
  next.sosState = nextMissingState(next.sosDraft);
  const prompted = promptFor(next.sosState, next.sosDraft);
  return {
    session: next,
    reply: prompted.reply,
    options: prompted.options,
    readyToConfirm: next.sosState === "SOS_CONFIRM",
    submitted: false,
    cancelled: false,
  };
}

export function getCompletedSosDraft(session: ConversationSession): SosDraft | null {
  return completeDraft(session.sosDraft);
}

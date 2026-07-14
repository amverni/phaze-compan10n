import { builtInPhaseSets } from "../../data/constants/phaseSets";
import { builtInPhases } from "../../data/constants/phases";
import type {
  Meld,
  Phase,
  PhaseId,
  PhaseSetId,
  PhasesCardPhase,
  PhasesCardSharePayloadV1,
  PhasesCardShareTarget,
} from "../../types";
import { arePhaseListsEqual } from "../../utils";

const PAYLOAD_VERSION = 1;
const MAX_JSON_BYTES = 8192;
const MAX_PHASES = 50;
const MAX_REQUIREMENTS = 10;

export type DecodePhasesCardResult =
  | { ok: true; name: string; phases: PhasesCardPhase[] }
  | { ok: false; message: string };

export function buildPhasesCardShareUrl(target: PhasesCardShareTarget): string {
  const builtInId = getBuiltInShareId(target);
  if (builtInId) {
    return buildAbsoluteHashUrl(`/phasescard/${builtInId}`);
  }

  const payload = validateOutboundPayload({
    v: PAYLOAD_VERSION,
    name: target.name.trim(),
    phases: target.phases.map((phase) => ({
      requirements: phase.requirements.map(copyRequirement),
    })),
  });
  const data = encodePhasesCardPayload(payload);

  return buildAbsoluteHashUrl(`/phasescard/custom?data=${encodeURIComponent(data)}`);
}

function getBuiltInShareId(target: PhasesCardShareTarget): PhaseSetId | undefined {
  switch (target.source) {
    case "phase-set":
      return target.phaseSet.type === "built-in" ? target.phaseSet.id : undefined;
    case "game-snapshot":
      return getMatchingBuiltInPhaseSetId(target.phases);
    case "custom":
      return undefined;
  }
}

export function encodePhasesCardPayload(payload: PhasesCardSharePayloadV1): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > MAX_JSON_BYTES) {
    throw new Error("Phases Card link is too large to share.");
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function decodePhasesCardPayload(data: string | undefined): DecodePhasesCardResult {
  if (!data) return { ok: false, message: "This Phases Card link is missing data." };
  try {
    const json = decodeBase64Url(data);
    if (new TextEncoder().encode(json).byteLength > MAX_JSON_BYTES) {
      return { ok: false, message: "This Phases Card link is too large." };
    }
    return validatePayload(JSON.parse(json));
  } catch {
    return { ok: false, message: "This Phases Card link is invalid." };
  }
}

function buildAbsoluteHashUrl(path: string): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return `${baseUrl.toString()}#${path}`;
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function copyRequirement(requirement: Meld): Meld {
  return { ...requirement };
}

function validateOutboundPayload(payload: PhasesCardSharePayloadV1): PhasesCardSharePayloadV1 {
  const result = validatePayload(payload);
  if (!result.ok) throw new Error(result.message);
  return {
    v: PAYLOAD_VERSION,
    name: result.name,
    phases: result.phases.map((phase) => ({
      requirements: phase.requirements.map(copyRequirement),
    })),
  };
}

function validatePayload(value: unknown): DecodePhasesCardResult {
  if (!isRecord(value) || value.v !== PAYLOAD_VERSION) {
    return { ok: false, message: "This Phases Card link uses an unsupported format." };
  }
  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return { ok: false, message: "This Phases Card link is missing a name." };
  }
  if (!Array.isArray(value.phases) || value.phases.length === 0) {
    return { ok: false, message: "This Phases Card link has no phases." };
  }
  if (value.phases.length > MAX_PHASES) {
    return { ok: false, message: "This Phases Card link has too many phases." };
  }

  const phases: PhasesCardPhase[] = [];
  for (const phase of value.phases) {
    if (!isRecord(phase) || !Array.isArray(phase.requirements)) {
      return { ok: false, message: "This Phases Card link has invalid phases." };
    }
    if (phase.requirements.length === 0 || phase.requirements.length > MAX_REQUIREMENTS) {
      return { ok: false, message: "This Phases Card link has invalid phase requirements." };
    }
    const requirements: Meld[] = [];
    for (const requirement of phase.requirements) {
      const parsed = parseRequirement(requirement);
      if (!parsed) {
        return { ok: false, message: "This Phases Card link has invalid phase requirements." };
      }
      requirements.push(parsed);
    }
    phases.push({ requirements: requirements as Phase["requirements"] });
  }

  return { ok: true, name: value.name.trim(), phases };
}

function parseRequirement(value: unknown): Meld | null {
  if (!isRecord(value)) return null;
  const { type, count, quantity, isSameColor } = value;
  if (!isPositiveInteger(count) || !isPositiveInteger(quantity)) return null;
  if (type === "set" || type === "run") {
    if (typeof isSameColor !== "boolean") return null;
    return { type, count, quantity, isSameColor };
  }
  if (type === "colorGroup") {
    if (isSameColor !== true) return null;
    return { type, count, quantity, isSameColor: true };
  }
  return null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMatchingBuiltInPhaseSetId(phases: PhasesCardPhase[]): PhaseSetId | undefined {
  const builtInPhaseById = new Map<PhaseId, Phase>(builtInPhases.map((phase) => [phase.id, phase]));
  return builtInPhaseSets.find((phaseSet) => {
    const builtInPhasesForSet = phaseSet.phases
      .map((phaseId) => builtInPhaseById.get(phaseId))
      .filter((phase): phase is Phase => phase !== undefined);
    return arePhaseListsEqual(phases, builtInPhasesForSet);
  })?.id;
}

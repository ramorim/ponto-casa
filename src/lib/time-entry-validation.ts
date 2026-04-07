export type EventType = "entrada" | "saida_almoco" | "volta_almoco" | "saida";

const FLOW_RULES: Record<EventType | "none", EventType[]> = {
  none: ["entrada"],
  entrada: ["saida_almoco", "saida"],
  saida_almoco: ["volta_almoco"],
  volta_almoco: ["saida"],
  saida: ["entrada"],
};

const EVENT_LABELS: Record<EventType, string> = {
  entrada: "Entrada",
  saida_almoco: "Saída Almoço",
  volta_almoco: "Volta Almoço",
  saida: "Saída",
};

export function getNextAllowedEvents(lastEventType: EventType | null): EventType[] {
  return FLOW_RULES[lastEventType ?? "none"];
}

export function isEventAllowed(lastEventType: EventType | null, nextEvent: EventType): boolean {
  return getNextAllowedEvents(lastEventType).includes(nextEvent);
}

export function getValidationErrorMessage(
  lastEventType: EventType | null,
  attempted: EventType
): string {
  const allowed = getNextAllowedEvents(lastEventType);
  const allowedLabels = allowed.map((e) => EVENT_LABELS[e]).join(" ou ");

  if (!lastEventType) {
    return `Você precisa registrar ${allowedLabels} primeiro.`;
  }

  return `Após ${EVENT_LABELS[lastEventType]}, o próximo registro deve ser: ${allowedLabels}.`;
}

export function getEventLabel(eventType: EventType): string {
  return EVENT_LABELS[eventType];
}

export const ALL_EVENT_TYPES: EventType[] = [
  "entrada",
  "saida_almoco",
  "volta_almoco",
  "saida",
];

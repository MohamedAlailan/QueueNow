import { api } from "./api";
import { employee } from "./authService";
const EVENT = "queuenow:queue-changed";
let state = {
  services: [],
  tickets: [],
  activeTicketId: sessionStorage.getItem("queuenow-active-ticket"),
  currentServing: null,
  doneToday: 0,
  loading: true,
  error: "",
};
export const allowed = {
  WAITING: ["CALLED", "CANCELLED"],
  CALLED: ["SERVING", "SKIPPED"],
  SERVING: ["DONE"],
  DONE: [],
  SKIPPED: [],
  CANCELLED: [],
};
const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
export function normalizeTicket(t) {
  return {
    ...t,
    id: String(t.ticket_id ?? t.id),
    number: String(t.ticket_number).padStart(3, "0"),
    serviceId: String(t.service_id ?? t.service?.id),
    createdAt: Date.parse(t.created_at),
    createdLabel: time(t.created_at),
    calledAt: time(t.called_at),
    startedAt: time(t.started_at),
    completedAt: time(t.finished_at),
    closedAt: time(t.skipped_at || t.cancelled_at),
    waited: t.started_at
      ? Math.max(
          0,
          Math.round(
            (Date.parse(t.started_at) - Date.parse(t.created_at)) / 60000,
          ),
        )
      : null,
  };
}
function emit(patch) {
  state = { ...state, ...patch };
  window.dispatchEvent(new Event(EVENT));
}
export const getState = () => state;
export const getServices = () => state.services;
export const getService = (id) =>
  state.services.find((s) => s.id === String(id));
export const getTicket = (id) => state.tickets.find((t) => t.id === String(id));
let requestNumber = 0;
export async function refreshQueue(ticketId) {
  const version = ++requestNumber;
  try {
    const [{ data }, queue] = await Promise.all([
      api("/services"),
      employee()
        ? api("/employee/queue", { auth: true })
        : Promise.resolve({ tickets: [] }),
    ]);
    const services = data.map((s) => ({
      ...s,
      id: String(s.id),
      open: s.is_open,
      waiting: s.waiting_count,
      duration: s.avg_service_time,
    }));
    const id = ticketId;
    let tickets = queue.tickets.map(normalizeTicket);
    if (id) {
      const ticket = normalizeTicket(
        await api(`/tickets/${encodeURIComponent(id)}`, { ticketId: id }),
      );
      tickets = [...tickets.filter((t) => t.id !== ticket.id), ticket];
    }
    if (version !== requestNumber) return;
    const own = tickets.filter(
      (t) => t.serviceId === String(employee()?.service_id),
    );
    emit({
      services,
      tickets,
      currentServing:
        own.find((t) => ["CALLED", "SERVING"].includes(t.status))?.number ||
        null,
      doneToday: own.filter((t) => t.status === "DONE").length,
      loadedTicketId: id,
      loading: false,
      error: "",
    });
  } catch (error) {
    if (version === requestNumber)
      emit({ loading: false, error: error.message });
    throw error;
  }
}
export async function createTicket(serviceId) {
  const ticket = normalizeTicket(
    await api("/tickets", {
      method: "POST",
      body: { service_id: Number(serviceId) },
    }),
  );
  ++requestNumber; // Do not let a pre-mutation poll overwrite the confirmed response.
  sessionStorage.setItem(`queuenow-ticket-${ticket.id}`, ticket.access_token);
  delete ticket.access_token;
  sessionStorage.setItem("queuenow-active-ticket", ticket.id);
  emit({
    activeTicketId: ticket.id,
    loadedTicketId: ticket.id,
    tickets: [...state.tickets.filter((t) => t.id !== ticket.id), ticket],
  });
  return ticket;
}
export async function transitionTicket(id, status) {
  const action = {
    CANCELLED: "cancel",
    SERVING: "start",
    DONE: "done",
    SKIPPED: "skip",
  }[status];
  if (!action) throw new Error("Invalid transition");
  const data = await api(`/tickets/${id}/${action}`, {
    method: status === "CANCELLED" ? "PATCH" : "POST",
    auth: status !== "CANCELLED",
    ticketId: status === "CANCELLED" ? id : undefined,
  });
  ++requestNumber;
  const ticket = normalizeTicket(data.ticket);
  emit({
    tickets: state.tickets.map((t) => (t.id === ticket.id ? {
      ...t, ...ticket,
      ...(ticket.status !== "WAITING" ? { people_ahead: 0, estimated_waiting_time_minutes: 0, estimate_source: "not_waiting" } : {}),
    } : t)),
  });
  return ticket;
}
export async function callNext() {
  const serviceId = employee()?.service_id;
  if (!serviceId) throw new Error("Sign in first");
  const { ticket } = await api(`/services/${serviceId}/next`, {
    method: "POST",
    auth: true,
  });
  await refreshQueue();
  return normalizeTicket(ticket);
}
export function subscribe(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

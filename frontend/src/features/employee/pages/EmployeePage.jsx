import { employee } from "../../queue/services/authService";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmployeeLayout from "../components/EmployeeLayout";
import QueueTable from "../components/QueueTable";
import MetricCards from "../components/MetricCards";
import StatusPill from "../../queue/components/StatusPill";
import Modal from "../../../shared/components/Modal";
import Button from "../../../shared/components/Button";
import ToastHost from "../../../shared/components/ToastHost";
import { useLanguage } from "../../../shared/hooks/useLanguage";
import {
  getService,
  callNext,
  transitionTicket,
} from "../../queue/services/queueService";
import { useQueueState } from "../../queue/hooks/useQueue";

export default function EmployeePage() {
  const loc = useLocation();
  const mode = loc.pathname.endsWith("/waiting")
    ? "waiting"
    : loc.pathname.endsWith("/current")
      ? "current"
      : "dashboard";
  const { state, refresh } = useQueueState();
  const { t } = useLanguage();
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const ownTickets = state.tickets.filter(
    (x) => x.serviceId === String(employee()?.service_id),
  );
  const waiting = useMemo(
    () =>
      state.tickets
        .filter(
          (x) =>
            x.serviceId === String(employee()?.service_id) &&
            x.status === "WAITING",
        )
        .sort((a, b) => a.createdAt - b.createdAt),
    [state],
  );
  const current =
    ownTickets.find((x) => x.status === "CALLED" || x.status === "SERVING") ||
    null;
  const serviceName = (id) => {
    const s = getService(id);
    return s ? s.name : id;
  };
  const next = async () => {
    setBusy(true);
    try {
      await callNext();
      setToast({ message: t("toast.updated") });
    } catch (e) {
      setToast({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  };
  const trans = async (id, status) => {
    setBusy(true);
    try {
      await transitionTicket(id, status);
      setDialog(null);
      await refresh();
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <EmployeeLayout>
      <main className="min-w-0 p-4 sm:p-6 lg:p-7 xl:p-8">
        {state.error ? (
          <p role="alert">{state.error}</p>
        ) : state.loading ? (
          <p>Loading…</p>
        ) : mode === "dashboard" ? (
          <Dashboard />
        ) : mode === "waiting" ? (
          <Waiting />
        ) : (
          <Current />
        )}
      </main>
      <ToastHost toast={toast} onClose={() => setToast(null)} />
      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={t("employee.skipTitle")}
        body={dialog ? t("employee.skipBody").replace("{number}", dialog.ticket.number) : ""}
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDialog(null)}>
            {t("common.back")}
          </Button>
          <Button disabled={busy} variant="secondary" onClick={() => trans(dialog.ticket.id, "SKIPPED")}>
            {t("employee.skipTicket")}
          </Button>
        </div>
      </Modal>
    </EmployeeLayout>
  );

  function Dashboard() {
    const title = t("employee.title");
    return (
      <>
        <Header
          title={title}
          right={
            <div className="flex gap-2">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                {waiting.length} {t("states.WAITING")}
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                {t("employee.serving")} {state.currentServing || "—"}
              </span>
            </div>
          }
        />
        <div className="grid gap-5 xl:grid-cols-[255px_minmax(0,1fr)]">
          <CurrentPanel />
          <QueueSection />
        </div>
      </>
    );
  }
  function Waiting() {
    return (
      <>
        <Header
          title={t("employee.waitingNav")}
          right={
            <Button
              disabled={busy || !waiting.length || !!current}
              onClick={next}
            >
              {t("employee.next")}
            </Button>
          }
        />
        <MetricCards
          metrics={[
            { value: waiting.length, label: t("employee.metricWaiting") },
            {
              value: state.currentServing || "—",
              label: t("employee.metricServing"),
            },
            { value: state.doneToday, label: t("employee.metricDone") },
            { value: "—", label: t("employee.metricAvg") },
          ]}
        />
        <QueueSection />
        <div className="mt-1 rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-[9px] text-slate-500">
          <span className="me-1 font-mono">NOTE</span>
          {t("employee.dashboardRule")}
        </div>
      </>
    );
  }
  function Current() {
    return (
      <>
        <Header title={t("employee.currentNav")} />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_345px]">
          <section className="min-h-[365px] rounded-xl border-2 border-navy-950 bg-white p-7 text-center shadow-sm">
            <TicketHero ticket={current} />
          </section>
          <div className="grid gap-4">
            <ActionCard />
            <UpNext />
          </div>
        </div>
      </>
    );
  }
  function Header({ title, right }) {
    return (
      <div className="mb-7 flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-extrabold tracking-[-0.04em]">
          {title}
        </h1>
        {right}
      </div>
    );
  }
  function CurrentPanel() {
    return (
      <section>
        <div className="mb-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {t("employee.current")}
        </div>
        <div className="rounded-xl border-2 border-navy-950 bg-white p-5 text-center shadow-sm">
          <TicketHero ticket={current} compact />
        </div>
        <Button
          className="mt-2.5 w-full"
          disabled={busy || !waiting.length || !!current}
          onClick={next}
        >
          {t("employee.next")}
        </Button>
      </section>
    );
  }
  function TicketHero({ ticket, compact = false }) {
    return (
      <>
        {
          <div
            className={`${compact ? "text-4xl" : "text-6xl"} font-mono font-black tracking-[-0.09em] ${ticket?.status === "SERVING" ? "text-teal-600" : "text-brand-600"}`}
          >
            {ticket?.number || "—"}
          </div>
        }
        {ticket && (
          <>
            <div className="mt-2 text-sm text-slate-500">
              {serviceName(ticket.serviceId)}
            </div>
            <div className="mt-2">
              <StatusPill status={ticket.status} t={t} />
            </div>
            {!compact && (
              <div className="mt-7 border-t border-dotted border-slate-300 pt-4 text-start">
                {ticket.calledAt && (
                  <DataLine
                    label={t("employee.calledAt")}
                    value={ticket.calledAt}
                  />
                )}{" "}
                {ticket.startedAt && (
                  <DataLine
                    label={t("employee.startedAt")}
                    value={ticket.startedAt}
                  />
                )}
                <DataLine
                  label={t("employee.waited")}
                  value={`${ticket.waited ?? "—"} min`}
                />
              </div>
            )}
            {compact && <ActionButtons ticket={ticket} />}
          </>
        )}
      </>
    );
  }
  function ActionButtons({ ticket }) {
    if (!ticket) return null;
    if (ticket.status === "CALLED")
      return (
        <div className="mt-3 grid gap-2">
          <Button
            disabled={busy}
            className="w-full"
            onClick={() => trans(ticket.id, "SERVING")}
          >
            {t("common.start")}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => setDialog({ ticket, action: "skip" })}
            >
              {t("common.skip")}
            </Button>
          </div>
        </div>
      );
    if (ticket.status === "SERVING")
      return (
        <Button
          disabled={busy}
          className="mt-3 w-full"
          variant="teal"
          onClick={() => trans(ticket.id, "DONE")}
        >
          {t("common.done")}
        </Button>
      );
    return null;
  }
  function ActionCard() {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400">
          {t("employee.actions")}
        </div>
        {current ? (
          <ActionButtons ticket={current} />
        ) : (
          <div className="text-sm text-slate-500">
            {t("employee.emptyTitle")}
          </div>
        )}
        <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[9px] text-slate-500">
          {current?.status === "SERVING"
            ? t("employee.servingNote")
            : t("employee.calledNote")}
        </div>
      </section>
    );
  }
  function UpNext() {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400">
          {t("employee.upNext")}
        </div>
        <div className="grid gap-2">
          {waiting.slice(0, 2).map((ticket) => (
            <div
              key={ticket.id}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div>
                <strong className="font-mono text-sm">{ticket.number}</strong>
                <div className="text-[9px] text-slate-500">
                  {serviceName(ticket.serviceId)}
                </div>
              </div>
              <StatusPill status="WAITING" t={t} compact />
            </div>
          ))}
        </div>
      </section>
    );
  }
  function QueueSection() {
    return (
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-400">
            {t("employee.waitingTitle")}
          </div>
          <span className="font-mono text-[9px] text-slate-400">
            {waiting.length} {t("employee.tickets")}
          </span>
        </div>
        <QueueTable waiting={waiting} serviceName={serviceName} />
      </section>
    );
  }
  function DataLine({ label, value }) {
    return (
      <div className="flex min-h-8 items-center justify-between border-b border-dotted border-slate-300 text-xs text-slate-500">
        <span>{label}</span>
        <strong className="font-mono text-navy-950">{value}</strong>
      </div>
    );
  }
}

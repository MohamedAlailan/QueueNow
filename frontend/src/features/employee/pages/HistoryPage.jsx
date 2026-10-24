import { employee } from "../../queue/services/authService";
import { useMemo } from "react";
import EmployeeLayout from "../components/EmployeeLayout";
import StatusPill from "../../queue/components/StatusPill";
import { useLanguage } from "../../../shared/hooks/useLanguage";
import { getService } from "../../queue/services/queueService";
import { useQueueState } from "../../queue/hooks/useQueue";
export default function HistoryPage() {
  const { t } = useLanguage();
  const { state } = useQueueState();
  const history = useMemo(
    () =>
      state.tickets
        .filter(
          (t) =>
            t.serviceId === String(employee()?.service_id) &&
            ["DONE", "SKIPPED", "CANCELLED"].includes(t.status),
        )
        .sort(
          (a, b) =>
            Date.parse(b.finished_at || b.skipped_at || b.cancelled_at || b.created_at) -
            Date.parse(a.finished_at || a.skipped_at || a.cancelled_at || a.created_at),
        ),
    [state],
  );
  return (
    <EmployeeLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-7">
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">
            {t("employee.historyTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("employee.historySubtitle")}
          </p>
        </header>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {state.error ? <p role="alert">{state.error}</p> : state.loading ? <p>Loading…</p> : history.length ? (
            history.map((ticket) => (
              <div
                key={ticket.id}
                className="grid gap-2 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[110px_1fr_140px_110px]"
              >
                <strong className="font-mono text-sm">{ticket.number}</strong>
                <span className="text-sm text-slate-600">
                  {getService(ticket.serviceId)
                    ? getService(ticket.serviceId).name
                    : ""}
                </span>
                <span>
                  <StatusPill status={ticket.status} t={t} />
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {ticket.completedAt || ticket.closedAt || ticket.createdLabel}
                </span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-slate-500">
              {t("employee.noHistory")}
            </div>
          )}
        </div>
      </main>
    </EmployeeLayout>
  );
}

import { Link } from "react-router-dom";
import { Check, Clock3, Users, X } from "lucide-react"; // Tooth,
import Button from "../../../shared/components/Button";
import { useLanguage } from "../../../shared/hooks/useLanguage";
export default function ServiceCard({ service }) {
  const { t } = useLanguage();
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
            {/* <Tooth className="size-5" /> */}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-navy-950">
              {t(`serviceNames.${service.nameKey}`)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t(`serviceDescriptions.${service.descriptionKey}`)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${service.open ? "border-success-300 bg-success-50 text-success-700" : "border-slate-300 bg-slate-50 text-slate-500"}`}
        >
          {service.open ? (
            <Check className="size-3" />
          ) : (
            <X className="size-3" />
          )}
          {service.open ? t("common.open") : t("common.closed")}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          {service.waiting} {t("services.peopleWaiting")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />~{service.duration}m
        </span>
      </div>
      <Link
        to={service.open ? `/services/${service.id}` : "/services"}
        className="mt-5 block"
      >
        <Button
          className="w-full"
          variant={service.open ? "primary" : "secondary"}
          disabled={!service.open}
        >
          {t("common.select")}
        </Button>
      </Link>
    </article>
  );
}

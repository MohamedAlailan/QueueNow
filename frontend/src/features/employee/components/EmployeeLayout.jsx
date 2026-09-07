import { useLocation } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import { useLanguage } from "../../../shared/hooks/useLanguage";
import LanguageToggle from "../../../shared/components/LanguageToggle";
export default function EmployeeLayout({ children }) {
  const { t } = useLanguage();
  const loc = useLocation();
  const state = loc.pathname.split("/").pop();
  return (
    <div className="min-h-screen bg-slate-50 text-navy-950 lg:flex">
      <EmployeeSidebar />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <span className="text-sm font-extrabold">
            {state === "waiting"
              ? t("employee.waitingNav")
              : state === "current"
                ? t("employee.currentNav")
                : state === "history"
                  ? t("employee.historyNav")
                  : t("employee.title")}
          </span>
          <LanguageToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "../features/patient/pages/HomePage";
import ServicesPage from "../features/patient/pages/ServicesPage";
import ConfirmServicePage from "../features/patient/pages/ConfirmServicePage";
import TicketSuccessPage from "../features/patient/pages/TicketSuccessPage";
import MyQueuePage from "../features/patient/pages/MyQueuePage";
import EmployeePage from "../features/employee/pages/EmployeePage";
import HistoryPage from "../features/employee/pages/HistoryPage";
import LoginPage from "../features/employee/pages/LoginPage";
import { isEmployeeSignedIn } from "../features/queue/services/authService";
function Guard({ children }) {
  return isEmployeeSignedIn() ? children : <Navigate to="/login" replace />;
}
function QueueRedirect() {
  const loc = useLocation();
  let id = null;
  try {
    id = JSON.parse(localStorage.getItem("queuenow-state-v4"))?.activeTicketId;
  } catch { /* empty */ }
  return id ? (
    <Navigate to={`/queue/${id}`} replace />
  ) : (
    <Navigate to="/services" state={{ from: loc.pathname }} replace />
  );
}
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:serviceId" element={<ConfirmServicePage />} />
      <Route path="/ticket-success/:ticketId" element={<TicketSuccessPage />} />
      <Route path="/queue" element={<QueueRedirect />} />
      <Route path="/queue/:ticketId" element={<MyQueuePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/employee"
        element={
          <Guard>
            <EmployeePage />
          </Guard>
        }
      />
      <Route
        path="/employee/waiting"
        element={
          <Guard>
            <EmployeePage />
          </Guard>
        }
      />
      <Route
        path="/employee/current"
        element={
          <Guard>
            <EmployeePage />
          </Guard>
        }
      />
      <Route
        path="/employee/history"
        element={
          <Guard>
            <HistoryPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

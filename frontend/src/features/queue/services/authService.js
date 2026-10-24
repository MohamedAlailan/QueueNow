import { api } from "./api";
export function isEmployeeSignedIn() {
  return Boolean(sessionStorage.getItem("queuenow-token"));
}
export function employee() {
  try {
    return JSON.parse(sessionStorage.getItem("queuenow-employee"));
  } catch {
    return null;
  }
}
export function employeeName() {
  return employee()?.name || "";
}
export async function loginEmployee(email, password) {
  const data = await api("/employee/login", {
    method: "POST",
    body: { email, password },
  });
  sessionStorage.setItem("queuenow-token", data.token);
  sessionStorage.setItem("queuenow-employee", JSON.stringify(data.employee));
}
export async function logoutEmployee() {
  try {
    await api("/employee/logout", { method: "POST", auth: true });
  } finally {
    sessionStorage.removeItem("queuenow-token");
    sessionStorage.removeItem("queuenow-employee");
  }
}

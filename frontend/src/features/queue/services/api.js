const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
export async function api(
  path,
  { method = "GET", body, auth = false, ticketId } = {},
) {
  const token = sessionStorage.getItem("queuenow-token");
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(ticketId
        ? {
            "X-Ticket-Token":
              sessionStorage.getItem(`queuenow-ticket-${ticketId}`) || "",
          }
        : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (auth && response.status === 401) {
      sessionStorage.removeItem("queuenow-token");
      sessionStorage.removeItem("queuenow-employee");
      window.location.assign("/login");
    }
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`,
    );
  }
  return data;
}

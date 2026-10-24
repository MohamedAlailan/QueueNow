import { useEffect, useState } from "react";
import { getState, refreshQueue, subscribe } from "../services/queueService";
export function useQueueState(ticketId) {
  const [state, setState] = useState(getState);
  useEffect(() => {
    const unsubscribe = subscribe(() => setState(getState()));
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try { await refreshQueue(ticketId); } catch { /* Error is published in queue state. */ }
      finally { inFlight = false; }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [ticketId]);
  return {
    state:
      ticketId && state.loadedTicketId !== ticketId && !state.error
        ? { ...state, loading: true }
        : state,
    refresh: () => refreshQueue(ticketId),
  };
}

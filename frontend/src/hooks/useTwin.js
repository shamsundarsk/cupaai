import { useEffect, useState } from "react";
import { connect, subscribe, disconnect } from "../store/useTwinStore";

/**
 * React hook that returns the latest twin snapshot.
 * Connects on mount, disconnects on unmount.
 */
export function useTwin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    connect();
    const unsub = subscribe(setData);
    return () => {
      unsub();
    };
  }, []);

  return data;
}

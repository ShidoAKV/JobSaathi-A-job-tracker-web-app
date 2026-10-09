import { useEffect, useState } from "react";
import { getAnalytics } from "../services/analyticsService";

/** Shared analytics loader so dashboard widgets don't each refetch. */
export default function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    getAnalytics()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

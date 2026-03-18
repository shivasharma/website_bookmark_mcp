import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState(null); // null=loading, false=none, object=user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const json = await res.json();
        if (!ignore) {
          setSession(json.success ? json.user : false);
        }
      } catch {
        if (!ignore) setSession(false);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  return { session, loading };
}

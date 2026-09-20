import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconLoader2 } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuth return handler. The Lovable broker can hand back either an implicit-flow
 * hash (#access_token=…&refresh_token=…) or a PKCE `?code=…`. Establish the
 * session from whichever strand is present, then land inside the app.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = url.searchParams.get("code");
        const errDesc = url.searchParams.get("error_description") ?? hash.get("error_description");

        if (errDesc) {
          setError(errDesc);
          setTimeout(() => navigate("/sign-in", { replace: true }), 1200);
          return;
        }

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(url.href);
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/overview", { replace: true });
        } else {
          navigate("/sign-in", { replace: true });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed.");
        setTimeout(() => navigate("/sign-in", { replace: true }), 1200);
      }
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <IconLoader2 className="size-6 animate-spin" />
        <p>{error ? `Sign-in failed: ${error}` : "Finishing sign-in…"}</p>
      </div>
    </div>
  );
}

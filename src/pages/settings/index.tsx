import { Navigate, useLocation } from "react-router-dom";

/**
 * Settings used to be its own screen. It is now a place inside the app, opened
 * from the account menu and named in the address as `?settings=<section>`.
 *
 * This route stays so old links and the sign-up hand-off still land somewhere
 * sensible: it forwards to Overview with the Money section already open.
 */
export default function SettingsPage() {
  const { pathname } = useLocation();
  const base = pathname.startsWith("/demo") ? "/demo" : "";
  return <Navigate to={`${base}/overview?settings=money`} replace />;
}

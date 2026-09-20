import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { AppearanceProvider } from "@/lib/appearance";
import { ProtectedRoute } from "@/components/protected-route";
import { SeedDataProvider, SupabaseDataProvider } from "@/lib/data-provider";
import { FilterProvider } from "@/lib/filter-context";
import { profile as demoProfile } from "@/data/seed";

import ApplicationLayout from "@/layouts/application-layout";
import Landing from "@/pages/landing";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import Overview from "@/pages/overview";
import Expenses from "@/pages/expenses";
import Income from "@/pages/income";
import ItemDetail from "@/pages/items-:id";
import Settings from "@/pages/settings";
import AuthCallback from "@/pages/auth-callback";
import NotFound from "@/pages/not-found";

// Demo routes: public, seed data, period anchored to today.
//
// It used to be anchored to a date written into the seed, which froze the demo
// on the month that seed was authored — by August 2026 it opened on "Jun 25 –
// Sep 24, 2025". The seed now works its dates out from today instead, so the
// demo can use the same clock the paying app does.
function DemoProviders() {
  return (
    <SeedDataProvider>
      <FilterProvider
        payFrequency={demoProfile.pay_frequency}
        anchorDay={demoProfile.anchor_day}
      >
        <Outlet />
      </FilterProvider>
    </SeedDataProvider>
  );
}

// App routes: protected, real Supabase data, period anchored to today.
function AppProviders() {
  return (
    <ProtectedRoute>
      <SupabaseDataProvider>
        <FilterProvider>
          <Outlet />
        </FilterProvider>
      </SupabaseDataProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppearanceProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — marketing + auth */}
          <Route element={<ApplicationLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Route>

          {/* Public demo — seed data, no auth */}
          <Route path="/demo" element={<DemoProviders />}>
            <Route path="overview" element={<Overview />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="income" element={<Income />} />
            <Route path="items/:id" element={<ItemDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Protected app — real Supabase data */}
          <Route element={<AppProviders />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/income" element={<Income />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
    </AppearanceProvider>
  </QueryClientProvider>
);

export default App;

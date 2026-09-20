import { QueryClient } from "@tanstack/react-query";

// Single shared React Query client. Exported as a module singleton so both the
// QueryClientProvider (App.tsx) and the AuthProvider (which clears the cache on
// sign-out) reference the same instance.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

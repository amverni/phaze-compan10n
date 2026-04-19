import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data is never stale, client app (only manipulator) controls when to invalidate
      gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 1 day
      retry: false, // IndexedDB rarely fails, no need to retry
      refetchOnWindowFocus: false, // Typically not needed for IndexedDB
      refetchOnReconnect: false, // No network involved
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Include devtools in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap fresh selama 30 detik — tidak ada re-fetch selama window ini
            staleTime: 30_000,
            // Cache disimpan di memori selama 5 menit setelah komponen unmount
            gcTime: 5 * 60_000,
            // Jangan re-fetch saat user kembali ke tab/window
            refetchOnWindowFocus: false,
            // Jangan re-fetch saat reconnect (sudah ada cache)
            refetchOnReconnect: false,
            // Retry sekali jika gagal
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
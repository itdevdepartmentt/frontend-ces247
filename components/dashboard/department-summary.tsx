"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentSummary {
  department: "FCR" | "NON FCR" | "UNRESOLVED";
  total: number;
  open: number;
  closed: number;
  breakdown: { name: string; total: number }[];
}

export function DepartmentSummary({
  dateRange,
  categories,
  subCategories,
  detailCategories,
}: {
  dateRange?: { from?: string; to?: string };
  categories: string[];
  subCategories: string[];
  detailCategories: string[];
}) {
  const params = {
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    categories: categories.join(",") || undefined,
    subCategories: subCategories.join(",") || undefined,
    detailCategories: detailCategories.join(",") || undefined,
  };
  const query = useQuery({
    queryKey: ["dashboard", "departments", params],
    enabled: Boolean(dateRange?.from && dateRange?.to),
    queryFn: async () =>
      (await api.get<DepartmentSummary[]>("/dashboard/departments", { params }))
        .data,
  });
  return (
    <section
      className="mb-6 border-t border-slate-200 pt-6 dark:border-slate-800"
      aria-label="Ringkasan departemen CES"
      aria-busy={query.isFetching}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Tiket per departemen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jumlah tiket unik per departemen pada periode terpilih.
        </p>
      </div>
      {query.isError ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border p-4 text-sm"
        >
          Ringkasan departemen gagal dimuat.
          <Button variant="outline" onClick={() => void query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {query.isLoading || !query.data
            ? [0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-72 w-full" />
              ))
            : query.data.map((item) => (
                <article
                  key={item.department}
                  className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <header className="flex min-h-44 flex-col border-b border-slate-200 px-5 py-5 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                          Departemen
                        </p>
                        <h3 className="text-base font-semibold">
                          {item.department === "UNRESOLVED"
                            ? "Tiket Unresolved"
                            : item.department}
                        </h3>
                      </div>
                      <p className="text-right text-3xl font-semibold tracking-tight tabular-nums">
                        {item.total.toLocaleString("id-ID")}
                        <span className="mt-1 block text-xs font-normal tracking-normal text-slate-500 dark:text-slate-400">
                          tiket
                        </span>
                      </p>
                    </div>
                    {item.department !== "UNRESOLVED" && (
                      <dl className="mt-auto grid grid-cols-2 divide-x divide-slate-200 pt-5 text-sm dark:divide-slate-700">
                        <div className="flex items-center justify-between gap-2 pr-4">
                          <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span
                              className="size-1.5 rounded-full bg-amber-500"
                              aria-hidden="true"
                            />
                            Open
                          </dt>
                          <dd className="font-semibold tabular-nums">
                            {item.open.toLocaleString("id-ID")}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-4">
                          <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span
                              className="size-1.5 rounded-full bg-emerald-600"
                              aria-hidden="true"
                            />
                            Closed
                          </dt>
                          <dd className="font-semibold tabular-nums">
                            {item.closed.toLocaleString("id-ID")}
                          </dd>
                        </div>
                      </dl>
                    )}
                    {item.department === "UNRESOLVED" && (
                      <p className="mt-auto pt-5 text-sm text-slate-500 dark:text-slate-400">
                        Rincian tiket menurut status penanganan.
                      </p>
                    )}
                  </header>
                  <div className="h-72 overflow-auto">
                    <table
                      className="w-full table-fixed text-sm"
                      aria-label={`Rincian ${item.department}`}
                    >
                      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <tr>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-xs font-medium"
                          >
                            {item.department === "UNRESOLVED"
                              ? "Status"
                              : "Agent"}
                          </th>
                          <th
                            scope="col"
                            className="w-24 px-5 py-3 text-right text-xs font-medium"
                          >
                            Tiket
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.breakdown.length ? (
                          item.breakdown.map((row) => (
                            <tr
                              key={row.name}
                              className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                            >
                              <th
                                scope="row"
                                className="break-words px-5 py-3 text-left font-normal leading-relaxed"
                              >
                                {row.name}
                              </th>
                              <td className="px-5 py-3 text-right font-medium tabular-nums">
                                {row.total.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="h-56 px-5 text-center text-sm text-slate-500 dark:text-slate-400"
                            >
                              Tidak ada tiket pada periode ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <footer className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {item.breakdown.length.toLocaleString("id-ID")}{" "}
                    {item.department === "UNRESOLVED" ? "status" : "assignee"}{" "}
                    tercatat
                  </footer>
                </article>
              ))}
        </div>
      )}
    </section>
  );
}

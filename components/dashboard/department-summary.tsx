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
    <section className="mb-6" aria-label="Ringkasan departemen CES">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Departemen CES</h2>
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
                  className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground"
                >
                  <header className="border-b px-5 py-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {item.department === "UNRESOLVED"
                        ? "Departemen Tiket Unresolved"
                        : `Departemen ${item.department}`}
                    </h3>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                      {item.total.toLocaleString("id-ID")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        tiket
                      </span>
                    </p>
                    {item.department !== "UNRESOLVED" && (
                      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Open</dt>
                          <dd className="mt-1 font-semibold tabular-nums">
                            {item.open.toLocaleString("id-ID")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Closed</dt>
                          <dd className="mt-1 font-semibold tabular-nums">
                            {item.closed.toLocaleString("id-ID")}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </header>
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left font-medium"
                          >
                            {item.department === "UNRESOLVED"
                              ? "Status"
                              : "Agent"}
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-medium"
                          >
                            Tiket
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.breakdown.length ? (
                          item.breakdown.map((row) => (
                            <tr key={row.name} className="border-t">
                              <td className="break-words px-5 py-3">
                                {row.name}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums">
                                {row.total.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-5 py-8 text-center text-muted-foreground"
                            >
                              Tidak ada tiket pada periode ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
        </div>
      )}
    </section>
  );
}

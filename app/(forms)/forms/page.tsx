"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormList } from "@/hooks/use-forms";
import { useAuth } from "@/hooks/use-auth";
import { formDescription } from "@/lib/form-description";

export default function FormListPage() {
  const { data, isLoading, isError } = useFormList();
  const formOrder: Record<string, number> = { "ebo-psb": 0, "ebo-aktivasi": 1 };
  const forms = data
    ?.filter((form) => form.key !== "mass-ticket")
    .sort((a, b) => (formOrder[a.key] ?? 2) - (formOrder[b.key] ?? 2));
  const { user } = useAuth();

  return (
    <div className="operations-page operations-detail">
      <header className="operations-heading">
        <div>
          <h1>Formulir</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih formulir untuk membuat pengajuan.
          </p>
        </div>
        {forms && (
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/forms/rekap">
                <ClipboardList className="size-4" aria-hidden="true" /> Rekap
                Submission
              </Link>
            </Button>
          </div>
        )}
      </header>
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4" aria-hidden="true" />
          Daftar formulir gagal dimuat. Coba muat ulang halaman.
        </p>
      )}
      {forms?.length === 0 && (
        <p className="py-8 text-sm text-muted-foreground">
          Belum ada formulir.
        </p>
      )}
      {forms && forms.length > 0 && (
        <ul className="operations-form-list">
          {forms.map((form) => (
            <li key={form.id} className="operations-form-row">
              <div className="min-w-0">
                {(form.key === "ebo-psb" || form.key === "ebo-aktivasi") && (
                  <p className="operations-form-kind">
                    {form.key === "ebo-psb" ? "PSB" : "Aktivasi"}
                  </p>
                )}
                <h2 className="text-base font-semibold">
                  <Link
                    className="operations-form-title underline-offset-4 hover:underline"
                    href={`/forms/${form.key}`}
                  >
                    {form.key === "ebo-psb"
                      ? "Pasang baru kartu korporat"
                      : form.key === "ebo-aktivasi"
                        ? "Aktivasi kartu baru"
                        : form.name}
                  </Link>
                </h2>
                {formDescription(form.description) && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {formDescription(form.description)}
                  </p>
                )}
                {!form.isActive && (
                  <p className="mt-2 text-xs text-muted-foreground">Nonaktif</p>
                )}
              </div>
              <Link
                className="operations-form-number"
                href={`/forms/${form.key}?tab=rekap`}
                aria-label={`Riwayat ${form.name}, ${form._count?.records ?? 0} pengajuan`}
              >
                <strong>
                  {(form._count?.records ?? 0).toLocaleString("id-ID")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    pengajuan
                  </span>
                </strong>
                <small>Lihat riwayat</small>
              </Link>
              <div className="operations-form-actions">
                {user?.role === "ADMIN" && (
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="size-11"
                  >
                    <Link
                      href={`/forms/${form.key}?tab=fields`}
                      aria-label={`Pengaturan ${form.name}`}
                    >
                      <Settings2 className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm">
                  <Link
                    href={`/forms/${form.key}`}
                    aria-label={`Buka ${form.name}`}
                  >
                    Isi formulir{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

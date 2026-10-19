"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FieldEditor } from "@/components/forms/field-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "@/hooks/use-forms";

export default function MassProcessSettingsPage() {
  const { user } = useAuth(true);
  const { data: form, isLoading, isError } = useForm("mass-ticket", true);

  return (
    <div className="operations-page operations-detail">
      <Link
        href="/mass-process"
        className="inline-flex items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Mass Process
      </Link>
      <header className="operations-heading">
        <div>
          <h1>Pengaturan field Mass Process</h1>
          <p className="text-sm text-muted-foreground">
            Kelola atribut tambahan pada tiket.
          </p>
        </div>
      </header>
      {!user || isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : user.role !== "ADMIN" ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Pengaturan ini hanya tersedia untuk admin.
        </p>
      ) : isError || !form ? (
        <p role="alert" className="text-sm text-destructive">
          Pengaturan gagal dimuat. Coba muat ulang halaman.
        </p>
      ) : (
        <FieldEditor form={form} />
      )}
    </div>
  );
}

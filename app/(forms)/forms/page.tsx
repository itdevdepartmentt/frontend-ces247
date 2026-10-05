"use client";

import Link from "next/link";
import { FileText, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormList } from "@/hooks/use-forms";

export default function FormListPage() {
  const { data: forms, isLoading, isError } = useFormList();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Formulir</h1>
        <p className="text-sm text-muted-foreground">
          Formulir dengan field yang bisa diatur sendiri — menambah atau mengubah
          field tidak perlu menunggu rilis aplikasi.
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Gagal memuat daftar formulir. Coba muat ulang halaman.
        </p>
      )}

      {forms && forms.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada formulir.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {forms?.map((form) => (
          <Card key={form.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span>{form.name}</span>
                {!form.isActive && <Badge variant="secondary">nonaktif</Badge>}
              </CardTitle>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="mt-auto space-y-3">
              <p className="text-xs text-muted-foreground">
                {form._count?.fields ?? 0} field · {form._count?.records ?? 0} data
                tersimpan
              </p>
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/forms/${form.key}`}>
                    <FileText className="mr-2 size-4" />
                    Buka
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/forms/${form.key}?tab=fields`}>
                    <Settings2 className="size-4" />
                    <span className="sr-only">Atur field</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

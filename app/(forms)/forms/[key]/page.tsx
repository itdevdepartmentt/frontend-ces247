"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, ClipboardList, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionRecap } from "@/components/forms/submission-recap";
import { DynamicForm } from "@/components/forms/dynamic-form";
import {
  CorporateSelect,
  CorporateSelectPreview,
  SUMBER_KORPORAT,
} from "@/components/forms/corporate-select";
import { FieldEditor } from "@/components/forms/field-editor";
import { useForm, useSubmitRecord } from "@/hooks/use-forms";
import { useAuth } from "@/hooks/use-auth";
import type { FormValues } from "@/types/forms";
import { formDescription } from "@/lib/form-description";

export default function FormDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const router = useRouter();
  useEffect(() => {
    if (key === "mass-ticket") router.replace("/mass-process/settings");
  }, [key, router]);
  const searchParams = useSearchParams();
  const { user } = useAuth(true);

  const [tab, setTab] = useState(searchParams.get("tab") ?? "isi");
  const isAdmin = user?.role === "ADMIN";

  // Layar pengaturan perlu melihat field nonaktif; form pengisian tidak.
  const { data: form, isLoading } = useForm(key, tab === "fields");
  const submit = useSubmitRecord(key);

  const handleSubmit = (values: FormValues) => {
    submit.mutate(values, {
      onSuccess: () => {
        toast.success("Data tersimpan");
        setTab("rekap");
      },
      onError: (error) => toast.error(describeError(error)),
    });
  };

  if (key === "mass-ticket") return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Formulir tidak ditemukan.
        </p>
      </div>
    );
  }

  return (
    <div className="operations-page operations-detail">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/forms">
            <ArrowLeft className="mr-2 size-4" />
            Semua formulir
          </Link>
        </Button>
        <div className="operations-heading">
          <div>
            <h1>{form.name}</h1>
            {formDescription(form.description) && (
              <p className="text-sm text-muted-foreground">
                {formDescription(form.description)}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {form.fields.length} field tersedia
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="isi">
            <FileText className="size-4" aria-hidden="true" /> Isi Formulir
          </TabsTrigger>
          <TabsTrigger value="rekap">
            <ClipboardList className="size-4" aria-hidden="true" /> Rekap
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="fields">
              <Settings2 className="size-4" aria-hidden="true" /> Pengaturan
              Field
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="isi" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Lengkapi informasi di bawah. Field bertanda{" "}
            <span className="font-semibold text-destructive">*</span> wajib
            diisi.
          </p>
          <DynamicForm
            key={`${form.id}-${form.fields.length}`}
            form={form}
            submitting={submit.isPending}
            submitLabel="Kirim"
            onSubmit={handleSubmit}
            // Kedua form memakai pemilih yang sama: nama tetap bisa diketik
            // bebas, tapi memilih pengajuan PSB yang sudah ada akan mengisi
            // field yang sama. Yang berbeda hanya pesan saat tidak ada
            // kecocokan — di PSB itu hal wajar karena korporatnya memang baru.
            overrideField={({ field, value, setValue, patchValues }) =>
              field.key === "corporateName" ? (
                <CorporateSelect
                  field={field}
                  value={value}
                  targetFields={form.fields}
                  pesanKosong={
                    key === SUMBER_KORPORAT
                      ? "Belum pernah terdaftar. Lanjutkan mengisi untuk mendaftarkannya."
                      : "Tidak ada korporat dengan nama itu di data PSB. Daftarkan dulu lewat Form PSB."
                  }
                  onChange={setValue}
                  onPatch={patchValues}
                />
              ) : null
            }
          />
        </TabsContent>

        <TabsContent value="rekap" className="mt-4 space-y-4">
          <SubmissionRecap formKey={key} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="fields" className="mt-4">
            <FieldEditor
              form={form}
              // Pratinjaunya memakai rangka yang sama dengan kontrol asli,
              // tanpa pencarian — layar pengaturan tidak perlu bisa mencari.
              previewField={(field) =>
                field.key === "corporateName" ? (
                  <CorporateSelectPreview field={field} />
                ) : null
              }
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function describeError(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return "Gagal menyimpan data.";
}

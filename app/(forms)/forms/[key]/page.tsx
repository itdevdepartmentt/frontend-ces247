"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicForm } from "@/components/forms/dynamic-form";
import {
  CorporateHistory,
  SUMBER_KORPORAT,
} from "@/components/forms/corporate-history";
import { CorporateSelect } from "@/components/forms/corporate-select";
import { FieldManager } from "@/components/forms/field-manager";
import {
  downloadRecordXlsx,
  useCorporateHistory,
  useForm,
  useRecordList,
  useSubmitRecord,
} from "@/hooks/use-forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import type { FormValues } from "@/types/forms";

/**
 * Tidak ikut disalin dari PSB: tiap pengajuan aktivasi punya nomor tiket
 * interaksinya sendiri, dan menyalinnya akan menimpa nomor yang benar.
 */
const SKIP_SALIN = ["ticketId"];

export default function FormDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/forms">
            <ArrowLeft className="mr-2 size-4" />
            Semua formulir
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="isi">Isi Formulir</TabsTrigger>
          <TabsTrigger value="rekap">Rekap</TabsTrigger>
          {isAdmin && <TabsTrigger value="fields">Pengaturan Field</TabsTrigger>}
        </TabsList>

        <TabsContent value="isi" className="mt-4">
          <DynamicForm
            key={`${form.id}-${form.fields.length}`}
            form={form}
            submitting={submit.isPending}
            submitLabel="Kirim"
            onSubmit={handleSubmit}
            // Di form Aktivasi korporat dipilih dari PSB, bukan diketik.
            // Di PSB sendiri korporat justru sedang didaftarkan, jadi tetap
            // bebas diketik dan hanya diberi riwayat agar tidak terdaftar ganda.
            overrideField={({ field, value, setValue, patchValues }) =>
              field.key === "corporateName" && key !== SUMBER_KORPORAT ? (
                <CorporateSelect
                  field={field}
                  value={value}
                  targetFields={form.fields}
                  skipKeys={SKIP_SALIN}
                  onChange={setValue}
                  onPatch={patchValues}
                />
              ) : null
            }
            renderAfterField={(field, value) =>
              field.key === "corporateName" && key === SUMBER_KORPORAT ? (
                <CorporateHistory formKey={key} name={value} />
              ) : null
            }
          />
        </TabsContent>

        <TabsContent value="rekap" className="mt-4 space-y-4">
          <CorporateLookup formKey={key} />
          <RecordTable formKey={key} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="fields" className="mt-4">
            <FieldManager form={form} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/** Cek apakah sebuah perusahaan sudah pernah mengajukan sebelumnya. */
function CorporateLookup({ formKey }: { formKey: string }) {
  const [name, setName] = useState("");
  const { data, isFetching } = useCorporateHistory(
    formKey,
    name,
    SUMBER_KORPORAT,
  );
  const cukup = name.trim().length >= 3;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="space-y-1.5">
          <Label htmlFor="cari-korporat">Cari riwayat PSB per nama perusahaan</Label>
          <Input
            id="cari-korporat"
            placeholder="Ketik minimal 3 huruf, mis. Maju"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {cukup && isFetching && (
          <p className="text-sm text-muted-foreground">Mencari…</p>
        )}

        {cukup && !isFetching && data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada pengajuan untuk nama itu.
          </p>
        )}

        {data && data.length > 0 && (
          <ul className="divide-y rounded-md border text-sm">
            {data.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                <span className="font-medium">{m.corporateName}</span>
                <span className="text-muted-foreground">
                  {m.refNumber ?? "—"}
                  {m.projectId && ` · ${m.projectId}`} ·{" "}
                  {new Date(m.createdAt).toLocaleDateString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecordTable({ formKey }: { formKey: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useRecordList(formKey, { page, limit: 20 });
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string, refNumber: string | null) => {
    setDownloading(id);
    try {
      await downloadRecordXlsx(id, refNumber ?? "form");
    } catch {
      toast.error("Gagal mengunduh berkas.");
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Belum ada data yang dikirim.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Rujukan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dikirim oleh</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Berkas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {record.refNumber ?? "—"}
                </TableCell>
                <TableCell>{record.status}</TableCell>
                <TableCell className="text-muted-foreground">
                  {record.createdBy ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(record.createdAt).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={downloading === record.id}
                    onClick={() => void handleDownload(record.id, record.refNumber)}
                  >
                    <Download className="mr-2 size-4" />
                    {downloading === record.id ? "Menyiapkan…" : "XLSX"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Halaman {data.meta.page} dari {data.meta.lastPage} · {data.meta.total} data
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= data.meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

function describeError(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return "Gagal menyimpan data.";
}

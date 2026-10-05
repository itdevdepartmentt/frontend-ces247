"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProcessSteps, useSaveRecap } from "@/hooks/use-mass-process";
import {
  CONFIRMATIONS,
  type ConfirmationValue,
  type MassTicketDetail,
  type ProcessStepValue,
  type SaveRecapPayload,
} from "@/types/mass-process";

const EMPTY = "__empty";

interface Props {
  ticket: MassTicketDetail;
}

export function WorkflowEditor({ ticket }: Props) {
  const save = useSaveRecap(ticket.ticketNumber);
  const { data: masterSteps } = useProcessSteps();

  const [draft, setDraft] = useState<SaveRecapPayload>(() => ({
    validationPicStatus: ticket.validationPicStatus ?? "",
    validationPicNotes: ticket.validationPicNotes ?? "",
    validationPksStatus: ticket.validationPksStatus ?? "",
    validationPksNotes: ticket.validationPksNotes ?? "",
    validationNodinStatus: ticket.validationNodinStatus ?? "",
    validationNodinNotes: ticket.validationNodinNotes ?? "",
    profilingStatus: ticket.profilingStatus ?? "",
    profilingOrderId: ticket.profilingOrderId ?? "",
    profilingNotes: ticket.profilingNotes ?? "",
    processSteps: ticket.processSteps ?? [],
    confirmations: ticket.confirmations ?? {},
    notes: "",
  }));

  const set = <K extends keyof SaveRecapPayload>(
    key: K,
    value: SaveRecapPayload[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  const setConfirmation = (key: string, patch: Partial<ConfirmationValue>) =>
    setDraft((prev) => ({
      ...prev,
      confirmations: {
        ...(prev.confirmations ?? {}),
        [key]: { ...(prev.confirmations?.[key] ?? {}), ...patch },
      },
    }));

  const steps = draft.processSteps ?? [];
  const setSteps = (next: ProcessStepValue[]) => set("processSteps", next);

  const addStep = (name: string) => {
    if (steps.some((s) => s.name === name)) {
      toast.info(`Langkah "${name}" sudah ada.`);
      return;
    }
    setSteps([...steps, { name, status: "" }]);
  };

  const handleSave = () => {
    save.mutate(draft, {
      onSuccess: (updated) =>
        toast.success(
          `Tersimpan — ${updated.currentProcess} (${updated.processProgress}%)`,
        ),
      onError: (error) => toast.error(describeError(error)),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tahap 1 — Validasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            PIC dan PKS wajib OK. NODIN opsional — dibiarkan kosong tetap dianggap
            lolos.
          </p>
          {(
            [
              ["PIC", "validationPicStatus", "validationPicNotes"],
              ["PKS", "validationPksStatus", "validationPksNotes"],
              ["NODIN", "validationNodinStatus", "validationNodinNotes"],
            ] as const
          ).map(([label, statusKey, notesKey]) => (
            <div key={label} className="grid gap-2 sm:grid-cols-[120px_160px_1fr]">
              <Label className="pt-2">{label}</Label>
              <StatusSelect
                value={draft[statusKey] ?? ""}
                options={["OK", "NOK"]}
                onChange={(v) => set(statusKey, v)}
              />
              <Input
                placeholder="Catatan"
                value={draft[notesKey] ?? ""}
                onChange={(e) => set(notesKey, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tahap 2 — Profiling Preparation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <StatusSelect
              value={draft.profilingStatus ?? ""}
              options={["In Progress", "Done"]}
              onChange={(v) => set("profilingStatus", v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Order ID</Label>
            <Input
              value={draft.profilingOrderId ?? ""}
              onChange={(e) => set("profilingOrderId", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Input
              value={draft.profilingNotes ?? ""}
              onChange={(e) => set("profilingNotes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Konfirmasi &amp; Koordinasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Konfirmasi yang berstatus <strong>In Progress</strong> menjadi bottleneck
            tiket. Yang paling atas dalam daftar ini menang bila ada lebih dari satu.
          </p>
          {CONFIRMATIONS.map((conf) => (
            <div
              key={conf.key}
              className="grid gap-2 sm:grid-cols-[1fr_160px_1fr] sm:items-center"
            >
              <Label className="font-normal">
                {conf.label}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({conf.stage})
                </span>
              </Label>
              <StatusSelect
                value={draft.confirmations?.[conf.key]?.status ?? ""}
                options={["In Progress", "Done"]}
                onChange={(v) => setConfirmation(conf.key, { status: v })}
              />
              <Input
                placeholder="Catatan"
                value={draft.confirmations?.[conf.key]?.notes ?? ""}
                onChange={(e) => setConfirmation(conf.key, { notes: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tahap 3 — Langkah Proses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada langkah. Tambahkan dari daftar di bawah — tiket tidak bisa
              selesai sebelum ada langkah yang ditentukan.
            </p>
          )}

          {steps.map((step, index) => (
            <div
              key={step.name}
              className="grid gap-2 sm:grid-cols-[1fr_160px_1fr_auto] sm:items-center"
            >
              <span className="text-sm">{step.name}</span>
              <StatusSelect
                value={step.status ?? ""}
                options={["In Progress", "Done"]}
                onChange={(v) =>
                  setSteps(
                    steps.map((s, i) => (i === index ? { ...s, status: v } : s)),
                  )
                }
              />
              <Input
                placeholder="Catatan"
                value={step.notes ?? ""}
                onChange={(e) =>
                  setSteps(
                    steps.map((s, i) =>
                      i === index ? { ...s, notes: e.target.value } : s,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label={`Hapus langkah ${step.name}`}
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 border-t pt-3">
            {masterSteps?.map((master) => (
              <Button
                key={master.id}
                type="button"
                size="sm"
                variant="outline"
                disabled={steps.some((s) => s.name === master.name)}
                onClick={() => addStep(master.name)}
              >
                <Plus className="mr-1 size-3.5" />
                {master.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="recap-notes">Catatan perubahan</Label>
            <Textarea
              id="recap-notes"
              placeholder="Dicatat di riwayat tiket bersama perubahan status."
              value={draft.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan perubahan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Radix Select tidak menerima string kosong sebagai nilai item, jadi "belum
 * diisi" dipetakan ke sentinel dan dikembalikan lagi saat dikirim.
 */
function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value === "" ? EMPTY : value}
      onValueChange={(next) => onChange(next === EMPTY ? "" : next)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY}>— belum diisi —</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function describeError(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;
  return "Gagal menyimpan perubahan.";
}

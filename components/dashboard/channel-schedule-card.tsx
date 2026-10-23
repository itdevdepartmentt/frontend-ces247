"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JADWAL_CHANNEL } from "@/lib/channel-schedule";

/**
 * Rekap jadwal pembaruan seluruh channel, untuk kolom kiri dashboard.
 *
 * Isinya dibaca dari JADWAL_CHANNEL — daftar yang sama dengan yang dipakai
 * label di tiap kolom channel. Dengan begitu kartu ini tidak bisa menyimpang
 * dari apa yang tertulis di kartu channel: kalau jadwalnya berubah, keduanya
 * ikut berubah sekaligus.
 */
export function ChannelScheduleCard() {
  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs font-bold tracking-wide text-slate-600 dark:text-slate-300">
          Update Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3 pb-3">
        {JADWAL_CHANNEL.map((jadwal) => (
          <div key={jadwal.nama} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold leading-none text-slate-700 dark:text-slate-200">
              {jadwal.nama}
            </span>
            <span className="text-[10px] font-bold leading-snug text-slate-500 dark:text-slate-400">
              {jadwal.aturan}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

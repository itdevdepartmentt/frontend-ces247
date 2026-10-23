/**
 * Jadwal pembaruan data tiap channel, untuk ditampilkan di kolom dashboard.
 *
 * Labelnya punya dua bagian yang sengaja dipisah:
 *
 * - `target` — kesepakatan operasional, ditulis manual di sini. Untuk channel
 *   yang datanya diunggah manual, hanya ini yang bisa ditampilkan.
 * - waktu sync terakhir — dibaca dari `/schedule/last-sync`, hanya untuk
 *   channel yang memang ditarik otomatis dari API OCA.
 *
 * Pemisahan ini penting. Cron OCA berjalan tiap 15 menit, tapi `get-list`
 * sedang mengembalikan 503 dari gateway Telkom, sehingga data hanya masuk
 * lewat jalur fallback CSV yang dibatasi sejam sekali. Target dan kenyataan
 * bisa berbeda jauh, dan dashboard harus menunjukkan keduanya daripada
 * menjanjikan angka yang tidak ditepati.
 */
export type SumberChannel = "api" | "unggah";

export interface JadwalChannel {
  /** Potongan nama channel, dicocokkan tanpa peduli huruf besar-kecil. */
  cocok: string[];
  /** Kesepakatan operasional, bukan hasil pembacaan penjadwal. */
  target: string;
  /**
   * "api" berarti ditarik cron dari OCA, sehingga waktu sync terakhir
   * bermakna untuk channel ini. "unggah" berarti datanya masuk lewat berkas,
   * jadi waktu sync tidak ada hubungannya dan tidak ditampilkan.
   */
  sumber: SumberChannel;
}

/**
 * Urutannya mengikuti getChannelIcon di halaman dashboard: yang spesifik
 * lebih dulu, supaya "Call Center 188" tidak keburu tertangkap pola "chat".
 */
export const JADWAL_CHANNEL: JadwalChannel[] = [
  { cocok: ["email"], target: "Target 15 menit", sumber: "api" },
  { cocok: ["whatsapp"], target: "Di-update per 1 jam", sumber: "unggah" },
  {
    cocok: ["social", "socmed", "instagram"],
    target: "Di-update per 1 jam",
    sumber: "unggah",
  },
  {
    cocok: ["call", "188"],
    target: "Target tiket 15 menit · Call H+1",
    sumber: "api",
  },
  { cocok: ["chat"], target: "Target 15 menit", sumber: "api" },
];

export function jadwalUntukChannel(nama: string): JadwalChannel | null {
  const normal = nama.toLowerCase();
  return (
    JADWAL_CHANNEL.find((jadwal) =>
      jadwal.cocok.some((kunci) => normal.includes(kunci)),
    ) ?? null
  );
}

/**
 * Mengambil jam dari format yang dikirim backend ("YYYY-MM-DD HH:mm:ss",
 * sudah dalam WIB). Mengembalikan null bila bentuknya tidak seperti yang
 * diharapkan, supaya kolomnya diam saja daripada menampilkan potongan teks
 * yang membingungkan.
 */
export function jamSync(lastSyncWib: string | undefined): string | null {
  if (!lastSyncWib) return null;
  const cocok = /\b(\d{2}:\d{2})(?::\d{2})?\b/.exec(lastSyncWib);
  return cocok?.[1] ?? null;
}

/**
 * Baris keterangan di bawah nama channel. Waktu sync hanya ditempelkan pada
 * channel yang memang ditarik dari API — menempelkannya pada channel hasil
 * unggahan akan menyiratkan kesegaran yang tidak ada dasarnya.
 */
export function keteranganJadwal(
  nama: string,
  lastSyncWib?: string,
): string | null {
  const jadwal = jadwalUntukChannel(nama);
  if (!jadwal) return null;

  if (jadwal.sumber !== "api") return jadwal.target;

  const jam = jamSync(lastSyncWib);
  return jam ? `${jadwal.target} · data per ${jam}` : jadwal.target;
}

/**
 * Jadwal pembaruan data tiap channel, untuk ditampilkan di kolom dashboard.
 *
 * Keterangannya punya dua bagian yang sengaja dipisah:
 *
 * - `aturan` — kesepakatan operasional, ditulis manual di sini dan ditampilkan
 *   tebal. Untuk channel yang datanya diunggah manual, hanya ini yang ada.
 * - waktu sync terakhir — dibaca dari `/schedule/last-sync`, hanya untuk
 *   channel yang memang ditarik otomatis dari API OCA, dan ditampilkan dengan
 *   ketebalan biasa supaya jelas bahwa itu keadaan saat ini, bukan aturannya.
 *
 * Pemisahan ini penting. Cron OCA berjalan tiap 15 menit, tapi `get-list`
 * sedang mengembalikan 503 dari gateway Telkom, sehingga data hanya masuk
 * lewat jalur fallback CSV yang dibatasi sejam sekali. Aturan dan kenyataan
 * bisa berbeda jauh, dan dashboard harus menunjukkan keduanya daripada
 * menjanjikan angka yang tidak ditepati.
 */
export type SumberChannel = "api" | "unggah";

export interface JadwalChannel {
  /** Potongan nama channel, dicocokkan tanpa peduli huruf besar-kecil. */
  cocok: string[];
  /** Kesepakatan operasional, bukan hasil pembacaan penjadwal. */
  aturan: string;
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
  { cocok: ["email"], aturan: "Auto sync 15 Minute", sumber: "api" },
  { cocok: ["whatsapp"], aturan: "Manual Update hourly", sumber: "unggah" },
  {
    cocok: ["social", "socmed", "instagram"],
    aturan: "Manual Update hourly",
    sumber: "unggah",
  },
  {
    cocok: ["call", "188"],
    aturan:
      "Auto sync 15 Minute (Tickets) / Manual Update Daily (Call Traffic)",
    sumber: "api",
  },
  { cocok: ["chat"], aturan: "Auto sync 15 Minute", sumber: "api" },
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

export interface KeteranganJadwal {
  /** Ditampilkan tebal. */
  aturan: string;
  /** Ditampilkan biasa; null bila channel ini tidak ditarik dari API. */
  waktu: string | null;
}

/**
 * Keterangan di bawah nama channel. Waktu sync hanya ditempelkan pada channel
 * yang memang ditarik dari API — menempelkannya pada channel hasil unggahan
 * akan menyiratkan kesegaran yang tidak ada dasarnya.
 */
export function keteranganJadwal(
  nama: string,
  lastSyncWib?: string,
): KeteranganJadwal | null {
  const jadwal = jadwalUntukChannel(nama);
  if (!jadwal) return null;

  if (jadwal.sumber !== "api") return { aturan: jadwal.aturan, waktu: null };

  const jam = jamSync(lastSyncWib);
  return { aturan: jadwal.aturan, waktu: jam ? `data per ${jam}` : null };
}

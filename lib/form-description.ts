/** Omit migration/storage notes from the description shown to form users. */
export function formDescription(description: string | null | undefined) {
  return description
    ?.replace("Dipindahkan dari Apps Script EBO Project.", "")
    .replace("Nilainya tersimpan di MassTicket.customValues.", "")
    .trim();
}

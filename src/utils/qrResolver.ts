export function resolveQrKey(rawQr: string): string {
  if (!rawQr) return "";
  
  // Format QR: B002U|9A2F -> Bagian pertama adalah DEVICE_ID (B002U)
  return rawQr.split("|")[0];
}

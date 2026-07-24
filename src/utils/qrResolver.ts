export function resolveQrKey(rawQr: string): string {
  if (!rawQr) return "";
  return rawQr.split("|")[0];
}

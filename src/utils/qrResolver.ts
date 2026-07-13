/**
 * Utility function to simulate decoding a qr_key into a device index.
 * e.g., gKwJQ -> index 1
 */
export function resolveQrKeyToIndex(qrKey: string): number | null {
  if (qrKey === "gKwJQ") return 1;
  return null;
}

/**
 * Utility function to simulate decoding a qr_key into a device index.
 * e.g., gKwJQ -> index 1
 */
export function resolveQrKeyToIndex(qrKey: string): number | null {
  if (qrKey === "gKwJQ") return 1;
  // Simulate decoding other keys by generating a hash-based index
  let hash = 0;
  for (let i = 0; i < qrKey.length; i++) {
    hash = qrKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 1000) + 1;
}

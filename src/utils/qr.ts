export function decodeQrKey(qrKey: string): string | null {
  try {
    // Assuming the QR key is a base64 encoded string of the device index for simplicity.
    // In a real-world scenario, this might be a JWT or a specific custom format.
    const decoded = Buffer.from(qrKey, "base64").toString("utf-8");
    if (!decoded || decoded.trim() === "") {
      return null;
    }
    
    // We can handle if it's a JSON string
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.deviceIndex) {
        return String(parsed.deviceIndex);
      }
    } catch {
      // Not JSON, just return the decoded string
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

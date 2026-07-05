export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOtpDocId(email: string): Promise<string> {
  return (await hashValue(email.toLowerCase())).slice(0, 20);
}

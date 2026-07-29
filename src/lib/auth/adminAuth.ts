import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "truth-or-dare-vietnam-super-secret-jwt-key-2026"
);

export async function signAdminToken(username: string): Promise<string> {
  return new SignJWT({ username, role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload.role === "ADMIN";
  } catch (err) {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

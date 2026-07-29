import { NextResponse } from "next/server";
import { signAdminToken } from "@/lib/auth/adminAuth";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." } },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const defaultUser = process.env.ADMIN_DEFAULT_USER || "admin";
    const defaultPass = process.env.ADMIN_DEFAULT_PASS || "admin123456";

    if (username !== defaultUser || password !== defaultPass) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Tài khoản hoặc mật khẩu quản trị không chính xác." } },
        { status: 401 }
      );
    }

    const token = await signAdminToken(username);
    const response = NextResponse.json({ success: true, message: "Đăng nhập admin thành công." });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể đăng nhập admin." } },
      { status: 500 }
    );
  }
}

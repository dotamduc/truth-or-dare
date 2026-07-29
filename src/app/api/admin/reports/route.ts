import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const reports = await prisma.promptReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        prompt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { reports },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách báo cáo." } }, { status: 500 });
  }
}

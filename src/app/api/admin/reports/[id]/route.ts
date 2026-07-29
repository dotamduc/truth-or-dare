import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status, archivePrompt } = body;

    const report = await prisma.promptReport.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : undefined,
      },
      include: { prompt: true },
    });

    if (archivePrompt && report.promptId) {
      await prisma.prompt.update({
        where: { id: report.promptId },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, data: { report } });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Lỗi cập nhật báo cáo." } }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ReportSchema = z.object({
  sessionId: z.string().optional(),
  reason: z.enum([
    "INAPPROPRIATE",
    "DANGEROUS",
    "OFFENSIVE",
    "AGE_MISMATCH",
    "DUPLICATE",
    "UNCLEAR",
    "TYPO",
    "OTHER",
  ]),
  comment: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    const { promptId } = params;
    const body = await request.json();
    const parsed = ReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Thông tin báo cáo không hợp lệ." } },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Câu hỏi không tồn tại." } },
        { status: 404 }
      );
    }

    const report = await prisma.promptReport.create({
      data: {
        promptId,
        sessionId: parsed.data.sessionId || null,
        reason: parsed.data.reason,
        comment: parsed.data.comment || null,
      },
    });

    // Increment reported count on prompt
    await prisma.prompt.update({
      where: { id: promptId },
      data: { timesReported: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error("Error reporting prompt:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể gửi báo cáo. Vui lòng thử lại." } },
      { status: 500 }
    );
  }
}

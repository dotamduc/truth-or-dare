import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";
import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";

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

    const dataToUpdate: any = {};

    if (body.text) {
      dataToUpdate.text = body.text;
      dataToUpdate.normalizedText = normalizeVietnamesePrompt(body.text);
    }

    if (body.status) dataToUpdate.status = body.status;
    if (body.difficulty) dataToUpdate.difficulty = body.difficulty;
    if (body.minimumAge) dataToUpdate.minimumAge = body.minimumAge;
    if (typeof body.requiresProps === "boolean") dataToUpdate.requiresProps = body.requiresProps;
    if (typeof body.requiresPhysicalContact === "boolean") dataToUpdate.requiresPhysicalContact = body.requiresPhysicalContact;
    if (typeof body.requiresPhone === "boolean") dataToUpdate.requiresPhone = body.requiresPhone;
    if (typeof body.qualityScore === "number") dataToUpdate.qualityScore = body.qualityScore;

    const prompt = await prisma.prompt.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: { prompt } });
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Không thể cập nhật câu hỏi." } }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const { id } = params;

    // Soft archive
    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { prompt } });
  } catch (error) {
    console.error("Error archiving prompt:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Không thể lưu trữ (xóa mềm) câu hỏi." } }, { status: 500 });
  }
}

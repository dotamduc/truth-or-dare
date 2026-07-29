import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";
import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const itemsToCommit = Array.isArray(body.items) ? body.items : [];

    if (itemsToCommit.length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Danh sách xác nhận commit rỗng." } },
        { status: 400 }
      );
    }

    let insertedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of itemsToCommit) {
        const normalized = normalizeVietnamesePrompt(item.text);

        await tx.prompt.upsert({
          where: {
            language_normalizedText: {
              language: item.language || "vi",
              normalizedText: normalized,
            },
          },
          update: {
            text: item.text,
            type: item.type,
            difficulty: item.difficulty || "EASY",
            minimumAge: item.minimumAge || "AGE_13_PLUS",
            status: item.status || "PUBLISHED",
            requiresProps: !!item.requiresProps,
            requiresPhone: !!item.requiresPhone,
            requiresPhysicalContact: !!item.requiresPhysicalContact,
          },
          create: {
            type: item.type,
            text: item.text,
            normalizedText: normalized,
            language: item.language || "vi",
            difficulty: item.difficulty || "EASY",
            minimumAge: item.minimumAge || "AGE_13_PLUS",
            status: item.status || "PUBLISHED",
            requiresProps: !!item.requiresProps,
            requiresPhone: !!item.requiresPhone,
            requiresPhysicalContact: !!item.requiresPhysicalContact,
            qualityScore: item.qualityScore || 1.0,
          },
        });
        insertedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        insertedCount,
      },
    });
  } catch (error) {
    console.error("Error committing import:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Không thể lưu dữ liệu import vào database." } }, { status: 500 });
  }
}

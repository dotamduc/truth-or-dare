import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";
import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";
import { checkDuplicatePrompt } from "@/features/prompts/services/deduplicate";
import { PromptInputSchema } from "@/features/prompts/schemas/promptSchema";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Danh sách import rỗng." } },
        { status: 400 }
      );
    }

    // Fetch existing prompts text from DB
    const existingDbPrompts = await prisma.prompt.findMany({
      select: { text: true, normalizedText: true },
    });
    const existingTexts = existingDbPrompts.map((p) => p.text);

    let validCount = 0;
    let exactDuplicatesCount = 0;
    let nearDuplicatesCount = 0;
    let invalidCount = 0;

    const processedItems = rawItems.map((rawItem: any, index: number) => {
      const parsed = PromptInputSchema.safeParse(rawItem);

      if (!parsed.success) {
        invalidCount++;
        return {
          index,
          rawItem,
          status: "INVALID",
          errors: parsed.error.format(),
        };
      }

      const item = parsed.data;
      const normalized = normalizeVietnamesePrompt(item.text);

      const dupeResult = checkDuplicatePrompt(item.text, existingTexts, 0.75);

      let status = "VALID";
      if (dupeResult.isExactDuplicate) {
        status = "EXACT_DUPLICATE";
        exactDuplicatesCount++;
      } else if (dupeResult.isNearDuplicate) {
        status = "NEAR_DUPLICATE";
        nearDuplicatesCount++;
      } else {
        validCount++;
      }

      return {
        index,
        item: {
          ...item,
          normalizedText: normalized,
        },
        status,
        similarityScore: dupeResult.similarityScore,
        matchedText: dupeResult.matchedPromptText,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInput: rawItems.length,
          validCount,
          exactDuplicatesCount,
          nearDuplicatesCount,
          invalidCount,
        },
        items: processedItems,
      },
    });
  } catch (error) {
    console.error("Error previewing import:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Không thể xem trước file import." } }, { status: 500 });
  }
}

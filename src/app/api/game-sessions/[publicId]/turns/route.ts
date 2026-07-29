import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  selectPromptWithFallback,
  SessionFilterOptions,
  PromptItem,
} from "@/features/game/domain/promptSelector";
import { z } from "zod";

const RequestTurnSchema = z.object({
  type: z.enum(["TRUTH", "DARE"]),
});

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;
    const body = await request.json();
    const parsed = RequestTurnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Vui lòng chọn Thật hoặc Thách." } },
        { status: 400 }
      );
    }

    const session = await prisma.gameSession.findUnique({
      where: { publicId },
      include: {
        players: { orderBy: { position: "asc" } },
        turns: { select: { promptId: true } },
      },
    });

    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: { code: "SESSION_INACTIVE", message: "Phiên chơi đã kết thúc hoặc không tồn tại." } },
        { status: 400 }
      );
    }

    const currentPlayer = session.players[session.currentPlayerIndex];
    if (!currentPlayer) {
      return NextResponse.json(
        { error: { code: "NO_PLAYER", message: "Không tìm thấy người chơi hiện tại." } },
        { status: 400 }
      );
    }

    // Parse filters stored in session
    const allowedDifficulties = JSON.parse(session.allowedDifficulties || "[]");
    const settings = JSON.parse(session.settings || "{}");

    const filterOptions: SessionFilterOptions = {
      minimumAge: session.minimumAge as any,
      allowedDifficulties,
      audiences: settings.audiences,
      categories: settings.categories,
      allowProps: settings.allowProps,
      allowPhone: settings.allowPhone,
      allowPhysicalContact: settings.allowPhysicalContact,
    };

    // Get used prompt IDs in this session
    const usedPromptIds = new Set(
      session.turns.map((t) => t.promptId).filter((id): id is string => id !== null)
    );

    // Fetch published prompts from DB
    const dbPrompts = await prisma.prompt.findMany({
      where: {
        status: "PUBLISHED",
        language: "vi",
        type: parsed.data.type,
      },
      include: {
        categories: { include: { category: true } },
        audiences: { include: { audience: true } },
      },
    });

    const mappedPrompts: PromptItem[] = dbPrompts.map((p) => ({
      id: p.id,
      type: p.type as any,
      text: p.text,
      difficulty: p.difficulty as any,
      minimumAge: p.minimumAge as any,
      requiresProps: p.requiresProps,
      requiresPhone: p.requiresPhone,
      requiresInternet: p.requiresInternet,
      requiresMovement: p.requiresMovement,
      requiresPhysicalContact: p.requiresPhysicalContact,
      requiresAnotherPlayer: p.requiresAnotherPlayer,
      isPrivate: p.isPrivate,
      isSensitive: p.isSensitive,
      qualityScore: p.qualityScore,
      timesServed: p.timesServed,
      categories: p.categories,
      audiences: p.audiences,
    }));

    const { prompt: selectedPrompt, poolExhausted } = selectPromptWithFallback(
      mappedPrompts,
      filterOptions,
      usedPromptIds,
      parsed.data.type
    );

    if (!selectedPrompt) {
      return NextResponse.json(
        {
          error: {
            code: "NO_PROMPTS_AVAILABLE",
            message: "Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại. Vui lòng mở rộng bộ lọc.",
          },
        },
        { status: 404 }
      );
    }

    // Increment timesServed on selected prompt
    await prisma.prompt.update({
      where: { id: selectedPrompt.id },
      data: { timesServed: { increment: 1 } },
    });

    // Create turn
    const turn = await prisma.gameTurn.create({
      data: {
        sessionId: session.id,
        playerId: currentPlayer.id,
        promptId: selectedPrompt.id,
        requestedType: parsed.data.type,
        outcome: "PRESENTED",
      },
      include: {
        player: true,
        prompt: {
          include: {
            categories: { include: { category: true } },
            audiences: { include: { audience: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        turn,
        poolExhausted,
      },
    });
  } catch (error) {
    console.error("Error requesting turn:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể tạo lượt chơi mới." } },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { selectPromptWithFallback, SessionFilterOptions, PromptItem } from "@/features/game/domain/promptSelector";

export async function POST(
  request: Request,
  { params }: { params: { publicId: string; turnId: string } }
) {
  try {
    const { publicId, turnId } = params;

    const currentTurn = await prisma.gameTurn.findUnique({
      where: { id: turnId },
      include: {
        session: {
          include: {
            players: { orderBy: { position: "asc" } },
            turns: { select: { promptId: true } },
          },
        },
      },
    });

    if (!currentTurn || currentTurn.session.publicId !== publicId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Lượt chơi không tồn tại." } },
        { status: 404 }
      );
    }

    if (currentTurn.outcome !== "PRESENTED") {
      return NextResponse.json(
        { error: { code: "INVALID_STATE", message: "Không thể đổi câu cho lượt chơi đã kết thúc." } },
        { status: 400 }
      );
    }

    // Mark current turn as REPLACED
    await prisma.gameTurn.update({
      where: { id: turnId },
      data: { outcome: "REPLACED" },
    });

    const session = currentTurn.session;
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

    const usedPromptIds = new Set(
      session.turns.map((t) => t.promptId).filter((id): id is string => id !== null)
    );

    const dbPrompts = await prisma.prompt.findMany({
      where: {
        status: "PUBLISHED",
        language: "vi",
        type: currentTurn.requestedType,
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

    const { prompt: newPrompt, poolExhausted } = selectPromptWithFallback(
      mappedPrompts,
      filterOptions,
      usedPromptIds,
      currentTurn.requestedType as any
    );

    if (!newPrompt) {
      return NextResponse.json(
        { error: { code: "NO_PROMPTS_AVAILABLE", message: "Không còn câu hỏi khác để đổi." } },
        { status: 404 }
      );
    }

    await prisma.prompt.update({
      where: { id: newPrompt.id },
      data: { timesServed: { increment: 1 } },
    });

    const newTurn = await prisma.gameTurn.create({
      data: {
        sessionId: session.id,
        playerId: currentTurn.playerId,
        promptId: newPrompt.id,
        requestedType: currentTurn.requestedType,
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
        turn: newTurn,
        poolExhausted,
      },
    });
  } catch (error) {
    console.error("Error replacing prompt:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể đổi sang câu hỏi khác." } },
      { status: 500 }
    );
  }
}

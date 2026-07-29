import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateTurnPoints, getNextPlayerIndex, TurnOutcome } from "@/features/game/domain/gameEngine";
import { z } from "zod";

const UpdateTurnSchema = z.object({
  outcome: z.enum(["COMPLETED", "SKIPPED", "REFUSED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: { publicId: string; turnId: string } }
) {
  try {
    const { publicId, turnId } = params;
    const body = await request.json();
    const parsed = UpdateTurnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Kết quả lượt không hợp lệ." } },
        { status: 400 }
      );
    }

    const outcome = parsed.data.outcome as TurnOutcome;

    const turn = await prisma.gameTurn.findUnique({
      where: { id: turnId },
      include: {
        session: {
          include: {
            players: { orderBy: { position: "asc" } },
          },
        },
        player: true,
      },
    });

    if (!turn || turn.session.publicId !== publicId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Lượt chơi không tồn tại." } },
        { status: 404 }
      );
    }

    if (turn.outcome !== "PRESENTED") {
      return NextResponse.json(
        { error: { code: "ALREADY_COMPLETED", message: "Lượt chơi này đã hoàn thành trước đó." } },
        { status: 400 }
      );
    }

    const points = calculateTurnPoints(outcome, turn.requestedType as any);

    // Update turn
    await prisma.gameTurn.update({
      where: { id: turnId },
      data: {
        outcome,
        points,
        completedAt: new Date(),
      },
    });

    // Update prompt statistics if skipped
    if (outcome === "SKIPPED" && turn.promptId) {
      await prisma.prompt.update({
        where: { id: turn.promptId },
        data: { timesSkipped: { increment: 1 } },
      });
    }

    // Update player stats
    const isTruth = turn.requestedType === "TRUTH";
    await prisma.player.update({
      where: { id: turn.playerId },
      data: {
        score: { increment: points },
        totalTurns: { increment: 1 },
        completedTruths: isTruth && outcome === "COMPLETED" ? { increment: 1 } : undefined,
        completedDares: !isTruth && outcome === "COMPLETED" ? { increment: 1 } : undefined,
        skipped: outcome === "SKIPPED" || outcome === "REFUSED" ? { increment: 1 } : undefined,
      },
    });

    // Calculate next player & round
    const session = turn.session;
    const totalPlayers = session.players.length;
    const playerTurnCounts = session.players.map((p) =>
      p.id === turn.playerId ? p.totalTurns + 1 : p.totalTurns
    );

    const nextIndex = getNextPlayerIndex(
      session.currentPlayerIndex,
      totalPlayers,
      session.selectionMode as any,
      playerTurnCounts
    );

    let nextRound = session.currentRound;
    if (nextIndex === 0 && session.selectionMode === "ROUND_ROBIN") {
      nextRound += 1;
    }

    let nextStatus = session.status;
    if (session.targetRounds && nextRound > session.targetRounds) {
      nextStatus = "COMPLETED";
    }

    const updatedSession = await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        currentPlayerIndex: nextIndex,
        currentRound: nextRound,
        status: nextStatus,
        endedAt: nextStatus === "COMPLETED" ? new Date() : undefined,
      },
      include: {
        players: { orderBy: { position: "asc" } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        pointsAwarded: points,
        nextPlayer: updatedSession.players[updatedSession.currentPlayerIndex],
      },
    });
  } catch (error) {
    console.error("Error updating turn:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Lỗi cập nhật kết quả lượt chơi." } },
      { status: 500 }
    );
  }
}

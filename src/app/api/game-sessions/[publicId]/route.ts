import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;

    const session = await prisma.gameSession.findUnique({
      where: { publicId },
      include: {
        players: {
          orderBy: { position: "asc" },
        },
        turns: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            player: true,
            prompt: {
              include: {
                categories: { include: { category: true } },
                audiences: { include: { audience: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Phiên chơi không tồn tại hoặc đã kết thúc." } },
        { status: 404 }
      );
    }

    const currentTurn = session.turns.find((t) => t.outcome === "PRESENTED");

    return NextResponse.json({
      success: true,
      data: {
        session,
        currentTurn: currentTurn || null,
        currentPlayer: session.players[session.currentPlayerIndex] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Lỗi tải trạng thái trò chơi." } },
      { status: 500 }
    );
  }
}

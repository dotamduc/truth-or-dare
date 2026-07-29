import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;

    const session = await prisma.gameSession.update({
      where: { publicId },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
      },
      include: {
        players: { orderBy: { score: "desc" } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể kết thúc trò chơi." } },
      { status: 500 }
    );
  }
}

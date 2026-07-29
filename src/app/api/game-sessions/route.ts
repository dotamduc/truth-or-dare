import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validatePlayerNames, shuffleArray } from "@/features/game/domain/gameEngine";
import { z } from "zod";

const CreateSessionSchema = z.object({
  players: z.array(z.string()),
  shuffle: z.boolean().optional().default(false),
  selectionMode: z.enum(["ROUND_ROBIN", "BALANCED_RANDOM"]).default("ROUND_ROBIN"),
  targetRounds: z.number().min(1).max(50).nullable().optional(),
  scoringEnabled: z.boolean().default(true),
  minimumAge: z.enum(["AGE_13_PLUS", "AGE_16_PLUS", "AGE_18_PLUS"]).default("AGE_13_PLUS"),
  allowedDifficulties: z.array(z.enum(["EASY", "MEDIUM", "BOLD", "HARD"])).default(["EASY", "MEDIUM"]),
  audiences: z.array(z.string()).optional().default(["FRIENDS"]),
  categories: z.array(z.string()).optional().default([]),
  allowProps: z.boolean().default(true),
  allowPhone: z.boolean().default(true),
  allowPhysicalContact: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Dữ liệu cấu hình không hợp lệ", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const validation = validatePlayerNames(data.players);

    if (!validation.valid) {
      return NextResponse.json(
        { error: { code: "INVALID_PLAYERS", message: validation.error } },
        { status: 400 }
      );
    }

    let finalPlayers = validation.normalizedNames;
    if (data.shuffle) {
      finalPlayers = shuffleArray(finalPlayers);
    }

    const publicId = "game-" + Math.random().toString(36).substring(2, 10);
    const sessionToken = "tok-" + Math.random().toString(36).substring(2, 14);

    const session = await prisma.gameSession.create({
      data: {
        publicId,
        sessionToken,
        status: "ACTIVE",
        selectionMode: data.selectionMode,
        scoringEnabled: data.scoringEnabled,
        targetRounds: data.targetRounds || null,
        minimumAge: data.minimumAge,
        allowedDifficulties: JSON.stringify(data.allowedDifficulties),
        settings: JSON.stringify({
          audiences: data.audiences,
          categories: data.categories,
          allowProps: data.allowProps,
          allowPhone: data.allowPhone,
          allowPhysicalContact: data.allowPhysicalContact,
        }),
        currentPlayerIndex: 0,
        currentRound: 1,
        startedAt: new Date(),
        players: {
          create: finalPlayers.map((name, index) => ({
            displayName: name,
            normalizedName: name.toLowerCase(),
            position: index,
          })),
        },
      },
      include: {
        players: {
          orderBy: { position: "asc" },
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        publicId: session.publicId,
        sessionToken: session.sessionToken,
        session,
      },
    });

    response.cookies.set(`session_owner_${session.publicId}`, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Error creating game session:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Không thể tạo phiên chơi. Vui lòng thử lại." } },
      { status: 500 }
    );
  }
}

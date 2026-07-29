import { prisma } from "../src/lib/db/prisma";

async function testSession() {
  const publicId = "test-public-" + Date.now();
  const session = await prisma.gameSession.create({
    data: {
      publicId,
      sessionToken: "token-123",
      status: "ACTIVE",
      selectionMode: "ROUND_ROBIN",
      scoringEnabled: true,
      minimumAge: "AGE_13_PLUS",
      allowedDifficulties: JSON.stringify(["EASY", "MEDIUM"]),
      settings: JSON.stringify({ allowProps: true }),
      currentPlayerIndex: 0,
      currentRound: 1,
      players: {
        create: [
          { displayName: "An", normalizedName: "an", position: 0 },
          { displayName: "Bình", normalizedName: "bình", position: 1 },
        ],
      },
    },
    include: { players: true },
  });

  console.log("✅ TEST SESSION CREATED SUCCESSFULLY:", session.publicId, "Players:", session.players.length);
}

testSession()
  .catch((e) => console.error("❌ TEST FAILED:", e))
  .finally(() => prisma.$disconnect());

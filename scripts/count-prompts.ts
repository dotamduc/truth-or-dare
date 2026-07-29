import { prisma } from "../src/lib/db/prisma";

async function countPrompts() {
  const truthCount = await prisma.prompt.count({ where: { type: "TRUTH" } });
  const dareCount = await prisma.prompt.count({ where: { type: "DARE" } });
  const totalCount = await prisma.prompt.count();

  const categories = await prisma.category.count();
  const audiences = await prisma.audience.count();

  console.log("PROMPT_COUNTS:", JSON.stringify({
    truth: truthCount,
    dare: dareCount,
    total: totalCount,
    categories,
    audiences,
  }));
}

countPrompts().finally(() => prisma.$disconnect());

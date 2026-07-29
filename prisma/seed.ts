import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { normalizeVietnamesePrompt } from "../src/features/prompts/services/normalize";
import { PromptInputSchema } from "../src/features/prompts/schemas/promptSchema";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seed for Truth or Dare Vietnam...");

  // 1. Seed Categories
  const categoriesPath = path.join(__dirname, "../data/seeds/categories.json");
  if (fs.existsSync(categoriesPath)) {
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
    console.log(`📦 Seeding ${categoriesData.length} Categories...`);
    for (const cat of categoriesData) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: { slug: cat.slug, name: cat.name },
      });
    }
  }

  // 2. Seed Audiences
  const audiencesPath = path.join(__dirname, "../data/seeds/audiences.json");
  if (fs.existsSync(audiencesPath)) {
    const audiencesData = JSON.parse(fs.readFileSync(audiencesPath, "utf-8"));
    console.log(`👥 Seeding ${audiencesData.length} Audiences...`);
    for (const aud of audiencesData) {
      await prisma.audience.upsert({
        where: { slug: aud.slug },
        update: { name: aud.name },
        create: { slug: aud.slug, name: aud.name },
      });
    }
  }

  // Helper to process prompt files
  async function seedPromptsFile(filePath: string, defaultType: string) {
    if (!fs.existsSync(filePath)) return;
    const rawPrompts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`❓ Processing ${rawPrompts.length} prompts from ${path.basename(filePath)}...`);

    const allCategories = await prisma.category.findMany();
    const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

    const allAudiences = await prisma.audience.findMany();
    const audMap = new Map(allAudiences.map((a) => [a.slug, a.id]));

    let count = 0;
    for (const item of rawPrompts) {
      const parsed = PromptInputSchema.safeParse({ ...item, type: item.type || defaultType });
      if (!parsed.success) {
        console.warn("⚠️ Invalid prompt item skipped:", item, parsed.error.format());
        continue;
      }

      const p = parsed.data;
      const normalized = normalizeVietnamesePrompt(p.text);

      const createdPrompt = await prisma.prompt.upsert({
        where: {
          language_normalizedText: {
            language: p.language || "vi",
            normalizedText: normalized,
          },
        },
        update: {
          text: p.text,
          difficulty: p.difficulty,
          minimumAge: p.minimumAge,
          status: "PUBLISHED",
          requiresProps: p.requiresProps,
          requiresPhone: p.requiresPhone,
          requiresInternet: p.requiresInternet,
          requiresMovement: p.requiresMovement,
          requiresPhysicalContact: p.requiresPhysicalContact,
          requiresAnotherPlayer: p.requiresAnotherPlayer,
          isPrivate: p.isPrivate,
          isSensitive: p.isSensitive,
          isTimeBound: p.isTimeBound,
          estimatedSeconds: p.estimatedSeconds || null,
        },
        create: {
          type: p.type,
          text: p.text,
          normalizedText: normalized,
          language: p.language || "vi",
          difficulty: p.difficulty,
          minimumAge: p.minimumAge,
          status: "PUBLISHED",
          requiresProps: p.requiresProps,
          requiresPhone: p.requiresPhone,
          requiresInternet: p.requiresInternet,
          requiresMovement: p.requiresMovement,
          requiresPhysicalContact: p.requiresPhysicalContact,
          requiresAnotherPlayer: p.requiresAnotherPlayer,
          isPrivate: p.isPrivate,
          isSensitive: p.isSensitive,
          isTimeBound: p.isTimeBound,
          estimatedSeconds: p.estimatedSeconds || null,
          qualityScore: p.qualityScore || 1.0,
        },
      });

      // Link categories
      if (p.categories && p.categories.length > 0) {
        for (const catSlug of p.categories) {
          const categoryId = catMap.get(catSlug);
          if (categoryId) {
            await prisma.promptCategory.upsert({
              where: {
                promptId_categoryId: {
                  promptId: createdPrompt.id,
                  categoryId: categoryId,
                },
              },
              update: {},
              create: {
                promptId: createdPrompt.id,
                categoryId: categoryId,
              },
            });
          }
        }
      }

      // Link audiences
      if (p.audiences && p.audiences.length > 0) {
        for (const audSlug of p.audiences) {
          const audienceId = audMap.get(audSlug);
          if (audienceId) {
            await prisma.promptAudience.upsert({
              where: {
                promptId_audienceId: {
                  promptId: createdPrompt.id,
                  audienceId: audienceId,
                },
              },
              update: {},
              create: {
                promptId: createdPrompt.id,
                audienceId: audienceId,
              },
            });
          }
        }
      }

      count++;
    }
    console.log(`✅ Seeded ${count} prompts successfully.`);
  }

  await seedPromptsFile(path.join(__dirname, "../data/seeds/prompts.truth.vi.json"), "TRUTH");
  await seedPromptsFile(path.join(__dirname, "../data/seeds/prompts.dare.vi.json"), "DARE");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/adminAuth";
import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";
import { PromptInputSchema } from "@/features/prompts/schemas/promptSchema";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const query = searchParams.get("query") || "";

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (query) {
      where.text = { contains: query, mode: "insensitive" };
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          categories: { include: { category: true } },
          audiences: { include: { audience: true } },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin prompts:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách câu hỏi." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Truy cập bị từ chối." } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = PromptInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Dữ liệu không hợp lệ.", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalized = normalizeVietnamesePrompt(data.text);

    // Exact duplicate check
    const existing = await prisma.prompt.findUnique({
      where: {
        language_normalizedText: {
          language: data.language || "vi",
          normalizedText: normalized,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: "DUPLICATE_PROMPT", message: "Câu hỏi này đã tồn tại trong hệ thống." } },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        type: data.type as any,
        text: data.text,
        normalizedText: normalized,
        language: data.language || "vi",
        difficulty: data.difficulty as any,
        minimumAge: data.minimumAge as any,
        status: data.status as any,
        requiresProps: data.requiresProps,
        requiresPhone: data.requiresPhone,
        requiresInternet: data.requiresInternet,
        requiresMovement: data.requiresMovement,
        requiresPhysicalContact: data.requiresPhysicalContact,
        requiresAnotherPlayer: data.requiresAnotherPlayer,
        isPrivate: data.isPrivate,
        isSensitive: data.isSensitive,
        qualityScore: data.qualityScore || 1.0,
      },
    });

    return NextResponse.json({ success: true, data: { prompt } });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Không thể tạo câu hỏi mới." } }, { status: 500 });
  }
}

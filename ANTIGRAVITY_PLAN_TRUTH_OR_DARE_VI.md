# KẾ HOẠCH TRIỂN KHAI CHI TIẾT
## Website game **TRUTH OR DARE – Thật Hay Thách** bằng tiếng Việt

> Tài liệu đầu vào dành cho Google Antigravity hoặc một AI coding agent tương đương.
>
> Mục tiêu: agent có thể đọc tài liệu này, tự phân tích repository, lập kế hoạch thực thi, triển khai, chạy kiểm thử, mở trình duyệt xác minh và báo cáo kết quả theo từng giai đoạn.

---

# 0. MASTER PROMPT CHO ANTIGRAVITY

Sao chép toàn bộ prompt dưới đây vào Antigravity sau khi tạo một repository trống hoặc mở repository cần triển khai.

```text
Bạn là Lead Full-stack Engineer, Product Designer, Database Architect và QA Engineer phụ trách xây dựng một website game “TRUTH OR DARE – THẬT HAY THÁCH” bằng tiếng Việt.

Hãy đọc toàn bộ file ANTIGRAVITY_PLAN_TRUTH_OR_DARE_VI.md trong repository và triển khai dự án theo đúng yêu cầu.

NGUYÊN TẮC LÀM VIỆC:
1. Trước khi sửa code, hãy kiểm tra repository, môi trường, package manager và các file hiện có.
2. Tạo Implementation Plan theo từng phase và checklist nhỏ; không triển khai tất cả trong một thay đổi khổng lồ.
3. Ưu tiên hoàn thiện MVP chơi được end-to-end trước, sau đó mới mở rộng.
4. Mỗi phase phải có tiêu chí nghiệm thu, test và bằng chứng xác minh.
5. Không hard-code dữ liệu câu hỏi trực tiếp trong component giao diện.
6. Nội dung phải hoàn toàn hỗ trợ Unicode tiếng Việt.
7. Không tạo nội dung tình dục, bạo lực nguy hiểm, làm nhục, kỳ thị, bất hợp pháp hoặc khuyến khích tự gây hại trong chế độ mặc định.
8. Bảo vệ dữ liệu người dùng, không thu thập thông tin không cần thiết.
9. Không tự ý thay đổi stack công nghệ cốt lõi nếu không có lý do kỹ thuật rõ ràng.
10. Sau mỗi phase:
   - chạy lint;
   - chạy type-check;
   - chạy unit/integration tests;
   - build production;
   - chạy ứng dụng;
   - dùng browser kiểm tra các luồng chính;
   - ghi lại kết quả và lỗi còn tồn tại.
11. Khi gặp yêu cầu chưa hoàn toàn rõ, hãy chọn phương án an toàn, đơn giản, dễ bảo trì và ghi quyết định vào docs/DECISIONS.md.
12. Không tuyên bố hoàn thành nếu chưa xác minh các acceptance criteria.

STACK MẶC ĐỊNH:
- Next.js App Router + TypeScript ở phiên bản stable phù hợp tại thời điểm triển khai.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM hoặc ORM TypeScript ổn định tương đương.
- Zod cho validation.
- Vitest cho unit/integration test.
- Playwright cho end-to-end test.
- ESLint + Prettier.
- Docker Compose cho môi trường database local.
- Có thể dùng pnpm làm package manager.

PHẠM VI MVP BẮT BUỘC:
- Website tiếng Việt, responsive, chơi tốt trên điện thoại.
- 2–10 người chơi trên cùng một thiết bị.
- Nhập tên người chơi, sắp xếp hoặc xáo trộn thứ tự.
- Lần lượt chọn người chơi.
- Người chơi chọn “Thật” hoặc “Thách”.
- Hệ thống lấy ngẫu nhiên câu phù hợp và hạn chế lặp.
- Có bộ lọc chủ đề, mức độ và nhóm tuổi.
- Có nút đổi câu, bỏ lượt, hoàn thành thử thách.
- Có điểm số/tóm tắt phiên chơi ở mức đơn giản.
- Có database câu hỏi thật và thử thách thách.
- Có seed data tiếng Việt chất lượng.
- Có trang hướng dẫn, quy tắc an toàn và chính sách nội dung.
- Có trang quản trị tối thiểu để CRUD, tìm kiếm, lọc, duyệt và import/export câu hỏi.
- Có test tự động cho logic game, API và luồng chính.

Hãy bắt đầu bằng cách:
A. Đọc file kế hoạch.
B. Tạo docs/IMPLEMENTATION_PLAN.md với các phase, task, dependency, rủi ro và acceptance criteria.
C. Tạo docs/DECISIONS.md.
D. Scaffold dự án và triển khai Phase 1.
E. Chỉ chuyển phase sau khi phase hiện tại đã được kiểm thử.
```

---

# 1. TỔNG QUAN SẢN PHẨM

## 1.1. Tên dự án đề xuất

- Tên hiển thị: **Thật Hay Thách**
- Tên tiếng Anh phụ: **Truth or Dare Vietnam**
- Tên repository gợi ý: `truth-or-dare-vietnam`
- Slug/domain gợi ý: `thathaythach.vn`, `truthordare.vn` hoặc tên thương hiệu riêng.

## 1.2. Tuyên bố sản phẩm

Xây dựng một trang web chơi **Thật Hay Thách** bằng tiếng Việt, tối ưu cho nhóm từ **2 đến 10 người**, có trải nghiệm nhanh, vui, an toàn, dễ sử dụng trên điện thoại và sở hữu kho câu hỏi lớn có cấu trúc, có thể mở rộng và kiểm duyệt.

## 1.3. Vấn đề cần giải quyết

Các nhóm bạn thường gặp các vấn đề sau khi chơi Truth or Dare:

- Không nghĩ ra câu hỏi hay.
- Câu hỏi bị lặp nhanh.
- Nội dung không phù hợp độ tuổi hoặc bối cảnh.
- Luật chơi thiếu rõ ràng.
- Luân phiên người chơi dễ nhầm.
- Các website hiện có dùng tiếng Việt chưa tự nhiên, nhiều quảng cáo hoặc nội dung không an toàn.
- Khó tùy chỉnh theo mức độ thân thiết, chủ đề và độ “khó”.

## 1.4. Giá trị cốt lõi

1. **Bắt đầu nhanh:** vào web, nhập tên và chơi trong dưới 60 giây.
2. **Nội dung phong phú:** kho câu hỏi lớn, phân loại tốt, hạn chế lặp.
3. **Phù hợp ngữ cảnh Việt Nam:** cách diễn đạt tự nhiên, dễ hiểu.
4. **An toàn theo mặc định:** lọc nội dung theo tuổi, độ khó và giới hạn.
5. **Chơi tốt trên mobile:** thao tác bằng một tay, nút lớn, chữ rõ.
6. **Không ép đăng nhập:** chế độ chơi cơ bản không yêu cầu tài khoản.
7. **Có khả năng mở rộng:** hỗ trợ thêm phòng online, tài khoản, gói câu hỏi cộng đồng về sau.

---

# 2. PHẠM VI VÀ ƯU TIÊN

## 2.1. MVP bắt buộc

### Gameplay

- Hỗ trợ 2–10 người chơi.
- Nhập, sửa, xóa tên người chơi trước khi bắt đầu.
- Kiểm tra tên rỗng, tên trùng và giới hạn độ dài.
- Có nút xáo trộn thứ tự.
- Chọn người chơi hiện tại theo vòng hoặc ngẫu nhiên có kiểm soát.
- Người chơi chọn:
  - **THẬT**: nhận một câu hỏi cần trả lời thành thật.
  - **THÁCH**: nhận một thử thách cần thực hiện.
- Có thể:
  - đổi sang câu khác;
  - bỏ lượt;
  - đánh dấu hoàn thành;
  - đánh dấu từ chối;
  - kết thúc game.
- Hạn chế lặp câu hỏi trong cùng phiên.
- Hiển thị tiến độ lượt và lịch sử gần nhất.
- Tóm tắt phiên chơi khi kết thúc.

### Tùy chỉnh phiên chơi

- Chủ đề.
- Mức độ: Nhẹ nhàng, Vui nhộn, Táo bạo, Khó.
- Nhóm tuổi: 13+, 16+, 18+.
- Loại nhóm: Bạn bè, Gia đình, Đồng nghiệp, Cặp đôi.
- Cho phép bật/tắt câu hỏi có tương tác thể chất nhẹ.
- Cho phép bật/tắt câu yêu cầu đạo cụ.
- Mặc định phải ở cấu hình an toàn.

### Nội dung

- Database có cấu trúc.
- Seed tối thiểu đề xuất cho MVP:
  - 500 câu Truth.
  - 500 câu Dare.
- Mục tiêu bản public đầu tiên:
  - 1.000–2.000 câu Truth.
  - 1.000–2.000 câu Dare.
- Mỗi câu có metadata để lọc, kiểm duyệt và theo dõi chất lượng.
- Có quy trình phát hiện trùng lặp.

### Website

- Landing page.
- Trang thiết lập game.
- Trang chơi.
- Trang kết quả.
- Trang hướng dẫn.
- Trang quy tắc an toàn.
- Trang chính sách quyền riêng tư cơ bản.
- Trang báo lỗi/đề xuất nội dung.
- Admin dashboard tối thiểu.

## 2.2. Không bắt buộc trong MVP

Đưa vào backlog, không để làm chậm bản chơi được đầu tiên:

- Multiplayer online realtime.
- Đăng nhập bằng Google/Facebook.
- Hồ sơ và thành tích dài hạn.
- Bảng xếp hạng toàn hệ thống.
- Thanh toán/gói premium.
- Chat trong phòng.
- Voice/video call.
- AI tạo câu hỏi trực tiếp trong khi chơi.
- Ứng dụng native iOS/Android.
- User-generated content public không kiểm duyệt.

## 2.3. Phase mở rộng sau MVP

- Phòng online bằng mã mời.
- Đồng bộ trạng thái realtime.
- Host kiểm soát lượt.
- Bộ câu hỏi riêng của người dùng.
- Gói chủ đề theo dịp: Tết, sinh nhật, du lịch, team building.
- PWA cài lên màn hình chính.
- Chế độ offline với bộ câu hỏi cache.
- Gamification, huy hiệu, streak phiên chơi.
- Đa ngôn ngữ.

---

# 3. ĐỐI TƯỢNG NGƯỜI DÙNG

## 3.1. Persona chính

### Nhóm bạn 16–25 tuổi

- Chơi tại buổi gặp mặt, sinh nhật, du lịch.
- Muốn nội dung vui, hơi táo bạo nhưng không phản cảm.
- Chủ yếu dùng điện thoại.

### Gia đình

- Muốn câu hỏi nhẹ nhàng, gắn kết.
- Không muốn nội dung nhạy cảm.
- Có nhiều độ tuổi.

### Đồng nghiệp/team building

- Muốn nội dung lịch sự, phá băng.
- Không làm ảnh hưởng quan hệ công việc.
- Cần giới hạn các chủ đề riêng tư.

### Cặp đôi

- Muốn hiểu nhau hơn.
- Có thể chọn mức thân mật cao hơn.
- Chỉ hiển thị nội dung 18+ sau khi xác nhận rõ ràng.

## 3.2. Jobs To Be Done

- “Khi tụ tập với bạn bè, tôi muốn bắt đầu một trò chơi nhanh mà không cần chuẩn bị.”
- “Tôi muốn câu hỏi phù hợp nhóm để tránh tình huống khó xử.”
- “Tôi muốn nội dung không bị lặp dù chơi lâu.”
- “Tôi muốn bỏ qua thử thách nguy hiểm hoặc không thoải mái mà không bị phạt nặng.”

---

# 4. QUY TẮC GAME VÀ GAME LOOP

## 4.1. Luồng chuẩn

1. Người dùng mở landing page.
2. Nhấn **Chơi ngay**.
3. Nhập 2–10 người chơi.
4. Chọn cấu hình nội dung.
5. Hệ thống tạo game session.
6. Xác định người chơi đầu tiên.
7. Người chơi chọn Truth hoặc Dare.
8. Hệ thống chọn nội dung phù hợp.
9. Người chơi thực hiện hoặc từ chối/đổi câu.
10. Ghi nhận kết quả lượt.
11. Chuyển người tiếp theo.
12. Lặp cho đến khi host kết thúc hoặc đạt số vòng cấu hình.
13. Hiển thị kết quả/tóm tắt.

## 4.2. Cách chọn người chơi

MVP hỗ trợ hai chế độ:

- **Theo vòng:** lần lượt theo danh sách; công bằng và dễ hiểu.
- **Ngẫu nhiên cân bằng:** random nhưng tránh chọn một người nhiều lần liên tiếp và cố gắng cân bằng tổng lượt.

Mặc định: **Theo vòng**.

## 4.3. Số vòng

- Không giới hạn, host tự kết thúc.
- Hoặc chọn nhanh:
  - 3 vòng/người.
  - 5 vòng/người.
  - 10 vòng/người.

## 4.4. Điểm số đề xuất

MVP dùng điểm số nhẹ, không tạo áp lực:

- Hoàn thành Truth: +1.
- Hoàn thành Dare: +2.
- Đổi câu: 0, tối đa số lần tùy cấu hình.
- Bỏ lượt/từ chối: 0.
- Không có điểm âm mặc định.

Cho phép tắt điểm số.

## 4.5. Quy tắc an toàn hiển thị trong game

- Mọi người có quyền từ chối bất kỳ câu hỏi/thử thách nào.
- Không ép buộc tiết lộ bí mật nghiêm trọng.
- Không thực hiện hành động nguy hiểm, bất hợp pháp hoặc làm tổn thương người khác.
- Không quay/chụp/chia sẻ nội dung khi chưa được đồng ý.
- Không sử dụng rượu bia, chất kích thích hoặc hành vi tình dục làm điều kiện bắt buộc.
- Với nhóm có người dưới 18 tuổi, không hiển thị nội dung người lớn.

## 4.6. Logic hạn chế lặp

Trong một session:

- Không trả lại cùng `prompt_id` đã xuất hiện.
- Ưu tiên câu ít xuất hiện hơn.
- Không hiển thị hai câu quá giống nhau liên tiếp.
- Có thể reset danh sách đã dùng khi hết pool, nhưng phải thông báo.
- Nếu bộ lọc quá hẹp và không đủ câu, đưa ra gợi ý nới bộ lọc thay vì lỗi trắng.

---

# 5. HỆ THỐNG NỘI DUNG VÀ DATABASE CÂU HỎI

## 5.1. Loại nội dung

- `TRUTH`: câu hỏi cần trả lời.
- `DARE`: thử thách cần thực hiện.

## 5.2. Taxonomy chủ đề

Mỗi câu có thể thuộc một hoặc nhiều chủ đề:

- `icebreaker` – Làm quen.
- `funny` – Hài hước.
- `friendship` – Tình bạn.
- `memories` – Kỷ niệm.
- `personality` – Tính cách.
- `dreams` – Ước mơ.
- `school` – Trường học.
- `work` – Công việc.
- `family` – Gia đình.
- `relationship` – Tình cảm.
- `couple` – Cặp đôi.
- `creative` – Sáng tạo.
- `performance` – Diễn xuất/biểu diễn.
- `physical_light` – Vận động nhẹ.
- `social` – Tương tác nhóm.
- `challenge` – Thử thách kỹ năng.
- `party` – Tiệc tùng an toàn.
- `deep` – Câu hỏi sâu sắc.

Không dùng taxonomy quá vụn trong MVP. Thiết kế schema cho phép mở rộng.

## 5.3. Mức độ

- `EASY`: nhẹ nhàng, ít riêng tư, dễ thực hiện.
- `MEDIUM`: cần suy nghĩ hoặc hơi ngại.
- `BOLD`: táo bạo nhưng vẫn an toàn.
- `HARD`: khó, cần kỹ năng/can đảm; không đồng nghĩa nguy hiểm.

## 5.4. Nhóm tuổi

- `AGE_13_PLUS`.
- `AGE_16_PLUS`.
- `AGE_18_PLUS`.

Quy tắc:

- 18+ phải bị khóa mặc định.
- Bật 18+ cần bước xác nhận tuổi và cảnh báo.
- Dù 18+, hệ thống vẫn cấm nội dung cưỡng ép, nguy hiểm, bất hợp pháp hoặc tình dục tường minh.

## 5.5. Loại nhóm phù hợp

- `FRIENDS`.
- `FAMILY`.
- `COWORKERS`.
- `COUPLE`.
- `ANY`.

## 5.6. Cờ nội dung

Mỗi prompt cần các cờ boolean hoặc enum:

- `requiresProps` – cần đạo cụ.
- `requiresPhone` – cần điện thoại.
- `requiresInternet` – cần mạng.
- `requiresMovement` – cần vận động.
- `requiresPhysicalContact` – có tiếp xúc cơ thể nhẹ.
- `requiresAnotherPlayer` – cần người khác tham gia.
- `isPrivate` – có khả năng yêu cầu tiết lộ riêng tư.
- `isSensitive` – có chủ đề nhạy cảm.
- `isTimeBound` – có giới hạn thời gian.
- `estimatedSeconds` – thời lượng ước tính.

## 5.7. Các trường dữ liệu đề xuất

### Bảng `prompts`

```prisma
model Prompt {
  id                      String        @id @default(cuid())
  type                    PromptType
  text                    String
  normalizedText          String
  language                String        @default("vi")
  difficulty              Difficulty
  minimumAge              MinimumAge
  status                  PromptStatus  @default(DRAFT)

  requiresProps           Boolean       @default(false)
  requiresPhone           Boolean       @default(false)
  requiresInternet        Boolean       @default(false)
  requiresMovement        Boolean       @default(false)
  requiresPhysicalContact Boolean       @default(false)
  requiresAnotherPlayer   Boolean       @default(false)
  isPrivate               Boolean       @default(false)
  isSensitive             Boolean       @default(false)
  isTimeBound             Boolean       @default(false)
  estimatedSeconds        Int?

  source                   String?
  sourceReference          String?
  notes                    String?

  qualityScore             Float         @default(0)
  timesServed              Int           @default(0)
  timesSkipped             Int           @default(0)
  timesReported            Int           @default(0)

  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
  publishedAt              DateTime?
  archivedAt               DateTime?

  categories               PromptCategory[]
  audiences                PromptAudience[]
  reports                  PromptReport[]
  sessionEvents            GameTurn[]

  @@index([type, status, language])
  @@index([minimumAge, difficulty])
  @@index([qualityScore])
  @@unique([language, normalizedText])
}

enum PromptType {
  TRUTH
  DARE
}

enum Difficulty {
  EASY
  MEDIUM
  BOLD
  HARD
}

enum MinimumAge {
  AGE_13_PLUS
  AGE_16_PLUS
  AGE_18_PLUS
}

enum PromptStatus {
  DRAFT
  IN_REVIEW
  PUBLISHED
  REJECTED
  ARCHIVED
}
```

### Bảng category/audience

```prisma
model Category {
  id        String           @id @default(cuid())
  slug      String           @unique
  name      String
  createdAt DateTime         @default(now())
  prompts   PromptCategory[]
}

model PromptCategory {
  promptId   String
  categoryId String
  prompt     Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([promptId, categoryId])
}

model Audience {
  id        String           @id @default(cuid())
  slug      String           @unique
  name      String
  prompts   PromptAudience[]
}

model PromptAudience {
  promptId   String
  audienceId String
  prompt     Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  audience   Audience @relation(fields: [audienceId], references: [id], onDelete: Cascade)

  @@id([promptId, audienceId])
}
```

### Game session

```prisma
model GameSession {
  id                   String        @id @default(cuid())
  publicId             String        @unique
  status               SessionStatus @default(SETUP)
  selectionMode        SelectionMode @default(ROUND_ROBIN)
  scoringEnabled       Boolean       @default(true)
  maxPlayers           Int           @default(10)
  targetRounds         Int?
  minimumAge           MinimumAge    @default(AGE_13_PLUS)
  allowedDifficulties  Json
  settings             Json
  currentPlayerIndex   Int           @default(0)
  currentRound         Int           @default(1)
  createdAt            DateTime      @default(now())
  startedAt            DateTime?
  endedAt              DateTime?

  players              Player[]
  turns                GameTurn[]

  @@index([status, createdAt])
}

enum SessionStatus {
  SETUP
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

enum SelectionMode {
  ROUND_ROBIN
  BALANCED_RANDOM
}

model Player {
  id            String      @id @default(cuid())
  sessionId     String
  displayName   String
  normalizedName String
  position      Int
  score         Int         @default(0)
  totalTurns    Int         @default(0)
  completedTruths Int       @default(0)
  completedDares  Int       @default(0)
  skipped       Int         @default(0)
  session       GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  turns         GameTurn[]

  @@unique([sessionId, normalizedName])
  @@unique([sessionId, position])
}

model GameTurn {
  id          String      @id @default(cuid())
  sessionId   String
  playerId    String
  promptId    String?
  requestedType PromptType
  outcome     TurnOutcome @default(PRESENTED)
  points      Int         @default(0)
  createdAt   DateTime    @default(now())
  completedAt DateTime?

  session     GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  player      Player      @relation(fields: [playerId], references: [id], onDelete: Cascade)
  prompt      Prompt?     @relation(fields: [promptId], references: [id], onDelete: SetNull)

  @@index([sessionId, createdAt])
  @@index([promptId])
}

enum TurnOutcome {
  PRESENTED
  COMPLETED
  SKIPPED
  REPLACED
  REFUSED
  EXPIRED
}
```

### Báo cáo nội dung

```prisma
model PromptReport {
  id         String       @id @default(cuid())
  promptId   String
  sessionId  String?
  reason     ReportReason
  comment    String?
  status     ReportStatus @default(OPEN)
  createdAt  DateTime     @default(now())
  resolvedAt DateTime?
  prompt     Prompt       @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
  @@index([promptId])
}

enum ReportReason {
  INAPPROPRIATE
  DANGEROUS
  OFFENSIVE
  AGE_MISMATCH
  DUPLICATE
  UNCLEAR
  TYPO
  OTHER
}

enum ReportStatus {
  OPEN
  REVIEWING
  RESOLVED
  DISMISSED
}
```

## 5.8. Chuẩn hóa văn bản

Tạo hàm `normalizeVietnamesePrompt(text)`:

- Trim đầu/cuối.
- Thay nhiều khoảng trắng thành một.
- Chuẩn hóa dấu câu.
- Lowercase cho trường so sánh.
- Loại ký tự trang trí không cần thiết.
- Giữ nguyên dấu tiếng Việt.
- Có thêm fingerprint không dấu để tìm near-duplicate, nhưng không dùng fingerprint không dấu làm dữ liệu hiển thị.

## 5.9. Phát hiện trùng lặp

Ba tầng:

1. **Exact duplicate:** `normalizedText` giống nhau.
2. **Near duplicate:** similarity n-gram/Jaccard hoặc Levenshtein vượt ngưỡng.
3. **Semantic duplicate:** batch review bằng embedding hoặc AI trong pipeline biên tập, không cần chạy realtime trong MVP.

Khi import:

- Không tự publish bản nghi trùng.
- Gắn cờ `POSSIBLE_DUPLICATE` trong báo cáo import.
- Hiển thị câu gần giống để admin quyết định.

## 5.10. Quy chuẩn biên tập nội dung

Mỗi câu phải:

- Tự nhiên với người Việt.
- Ngắn gọn, lý tưởng dưới 160 ký tự; ngoại lệ tối đa 300.
- Không phụ thuộc mơ hồ vào “người đó” nếu không có ngữ cảnh.
- Không yêu cầu người chơi làm điều có nguy cơ gây thương tích.
- Không yêu cầu tiết lộ mật khẩu, dữ liệu ngân hàng, địa chỉ chính xác hoặc thông tin định danh nhạy cảm.
- Không khuyến khích quấy rối, xúc phạm hoặc kỳ thị.
- Không ép tiếp xúc cơ thể.
- Không ép người chơi đăng nội dung lên mạng xã hội.
- Không ép gọi/nhắn người ngoài cuộc.
- Không yêu cầu phá hoại tài sản.
- Không yêu cầu ăn/uống chất lạ, rượu bia hoặc thuốc.
- Có thể hoàn thành trong bối cảnh nhóm thông thường.

## 5.11. Ví dụ nội dung hợp lệ

### Truth – Easy

- “Bài hát nào gần đây bạn nghe lặp lại nhiều nhất?”
- “Thói quen nhỏ nào khiến bạn cảm thấy vui hơn mỗi ngày?”
- “Món ăn nào bạn có thể ăn nhiều ngày liên tiếp?”

### Truth – Medium

- “Lần gần nhất bạn xin lỗi ai đó là khi nào?”
- “Điều gì bạn từng hiểu lầm về một người trong nhóm?”
- “Một quyết định nào gần đây khiến bạn tự hào?”

### Dare – Easy

- “Nói một lời khen chân thành với người ngồi bên trái bạn.”
- “Diễn tả một con vật bằng hành động để cả nhóm đoán.”
- “Kể một câu chuyện trong 30 giây mà không dùng từ ‘và’.”

### Dare – Medium

- “Hát điệp khúc của một bài hát do cả nhóm chọn.”
- “Dùng ba đồ vật gần bạn để tạo một bức tượng trong 60 giây.”
- “Nói như người dẫn chương trình trong hai lượt tiếp theo.”

## 5.12. Nội dung bị cấm hoặc cần loại bỏ

- Tự gây hại hoặc khuyến khích tự gây hại.
- Bạo lực hoặc hành vi có nguy cơ gây thương tích.
- Tình dục tường minh.
- Bất kỳ nội dung nào liên quan người chưa thành niên theo hướng tình dục.
- Cưỡng ép hôn, chạm, cởi đồ hoặc chia sẻ nội dung riêng tư.
- Dùng thuốc, chất kích thích, uống rượu quá mức.
- Ăn/uống chất không an toàn.
- Hành vi bất hợp pháp.
- Lái xe hoặc dùng máy móc trong lúc thực hiện thử thách.
- Quấy rối người lạ.
- Công khai số điện thoại, địa chỉ, mật khẩu hoặc dữ liệu cá nhân.
- Kỳ thị về chủng tộc, tôn giáo, giới, khuyết tật hoặc đặc điểm cá nhân.
- Làm nhục ngoại hình hoặc hoàn cảnh kinh tế.

---

# 6. CHIẾN LƯỢC XÂY DỰNG “DATABASE KHỔNG LỒ”

## 6.1. Không chỉ tạo một file JSON lớn

Database lớn cần:

- Schema rõ ràng.
- Metadata nhất quán.
- Deduplication.
- Versioning.
- Workflow duyệt.
- Import/export.
- Theo dõi chất lượng.
- Cơ chế report.
- Chia pool để truy vấn hiệu quả.

## 6.2. Nguồn nội dung

Ưu tiên nội dung nguyên bản hoặc được biên tập lại hợp pháp.

- Biên soạn thủ công theo ma trận taxonomy.
- Tạo batch bằng AI rồi bắt buộc qua validation và review.
- Đề xuất từ người dùng đưa vào hàng chờ, không publish tự động.
- Không copy hàng loạt nội dung có bản quyền từ website khác.

## 6.3. Ma trận sản xuất nội dung

Mỗi batch phải phân bổ theo:

- Type: Truth/Dare.
- Difficulty.
- Minimum age.
- Audience.
- Category.
- Cờ yêu cầu đạo cụ/vận động/tương tác.

Ví dụ target 2.000 câu:

| Nhóm | Truth | Dare | Tổng |
|---|---:|---:|---:|
| Family 13+ | 250 | 250 | 500 |
| Friends 13+/16+ | 400 | 400 | 800 |
| Coworkers 16+ | 150 | 150 | 300 |
| Couple 16+/18+ | 200 | 200 | 400 |
| **Tổng** | **1.000** | **1.000** | **2.000** |

## 6.4. Pipeline tạo và duyệt

1. Tạo batch draft ở CSV/JSON.
2. Validate schema.
3. Normalize.
4. Exact dedupe.
5. Near-duplicate scan.
6. Keyword safety scan.
7. AI/classifier safety review nếu có.
8. Human editorial review.
9. Chấm quality score.
10. Publish.
11. Theo dõi skip/report rate.
12. Tự động đưa câu chất lượng thấp về review.

## 6.5. Quality score gợi ý

Khởi tạo `qualityScore` theo review, sau đó điều chỉnh:

```text
qualityScore = editorialScore
             + completionRateWeight
             - skipRatePenalty
             - reportRatePenalty
             - repetitionPenalty
```

Không dùng điểm số người dùng trực tiếp để tự động publish nội dung nhạy cảm.

## 6.6. Import format

CSV tối thiểu:

```csv
external_id,type,text,difficulty,minimum_age,audiences,categories,requires_props,requires_phone,requires_internet,requires_movement,requires_physical_contact,requires_another_player,is_private,is_sensitive,estimated_seconds,status
```

- `audiences` và `categories` phân cách bằng `|`.
- Import phải có dry-run.
- Dry-run trả về tổng số hợp lệ, lỗi, trùng chính xác, nghi trùng và cảnh báo.
- Chỉ commit import khi admin xác nhận.

## 6.7. Seed scripts

Tạo:

- `prisma/seed.ts`.
- `data/seeds/categories.json`.
- `data/seeds/audiences.json`.
- `data/seeds/prompts.truth.vi.json`.
- `data/seeds/prompts.dare.vi.json`.

Seed phải idempotent:

- Chạy nhiều lần không tạo trùng.
- Upsert theo `language + normalizedText` hoặc `externalId`.

---

# 7. KIẾN TRÚC HỆ THỐNG

## 7.1. Kiến trúc đề xuất

Monolith modular trong giai đoạn đầu:

```text
Browser / Mobile Web
        |
        v
Next.js Application
  - Server Components
  - Client Components cho game state tương tác
  - Route Handlers / Server Actions
  - Admin UI
        |
        v
Domain Services
  - Game Engine
  - Prompt Selection
  - Content Moderation
  - Import/Export
        |
        v
Prisma ORM
        |
        v
PostgreSQL
```

Lý do:

- Đơn giản hóa deploy và phát triển.
- Không cần microservices ở quy mô ban đầu.
- Dễ tách service sau khi có nhu cầu thực tế.

## 7.2. Nguyên tắc module

```text
src/
  app/
    (marketing)/
    play/
    game/[sessionId]/
    result/[sessionId]/
    guide/
    safety/
    privacy/
    admin/
    api/
  components/
    ui/
    game/
    admin/
    layout/
  features/
    game/
      domain/
      services/
      repositories/
      schemas/
    prompts/
    players/
    reporting/
    admin/
  lib/
    db/
    auth/
    validation/
    analytics/
    security/
  styles/
  types/
prisma/
  schema.prisma
  seed.ts
data/
  seeds/
tests/
  unit/
  integration/
  e2e/
docs/
```

Không để toàn bộ business logic trong page/component.

## 7.3. State management

- Setup form: React Hook Form hoặc state local + Zod.
- Game runtime:
  - Server là nguồn sự thật khi session được lưu DB.
  - Client giữ UI state tạm thời.
  - Sau mỗi action quan trọng, cập nhật server.
- Có thể dùng reducer/state machine cho game UI.
- Không cần Redux nếu chưa có nhu cầu.

## 7.4. Session không đăng nhập

MVP có thể dùng:

- `publicId` khó đoán cho URL.
- Cookie HTTP-only chứa token phiên hoặc session ownership token.
- Không hiển thị dữ liệu session cho người không có token phù hợp.
- Tự động xóa/ẩn danh session cũ theo retention policy.

## 7.5. Cache

- Cache danh mục công khai.
- Có thể cache pool prompt đã publish theo filter trong memory/Redis ở giai đoạn sau.
- MVP ưu tiên truy vấn đúng trước tối ưu sớm.
- Không cache dữ liệu admin nhạy cảm.

---

# 8. API VÀ SERVER ACTIONS

Có thể dùng Route Handlers hoặc Server Actions. Dù dùng cách nào, phải có schema validation và phân tách service.

## 8.1. Public/game endpoints đề xuất

### Tạo session

`POST /api/game-sessions`

Request:

```json
{
  "players": ["An", "Bình", "Chi"],
  "selectionMode": "ROUND_ROBIN",
  "targetRounds": 5,
  "scoringEnabled": true,
  "filters": {
    "minimumAge": "AGE_16_PLUS",
    "difficulties": ["EASY", "MEDIUM"],
    "audiences": ["FRIENDS"],
    "categories": ["funny", "friendship"],
    "allowPhysicalContact": false,
    "allowProps": true
  }
}
```

### Bắt đầu session

`POST /api/game-sessions/:id/start`

### Lấy trạng thái

`GET /api/game-sessions/:id`

### Chọn Truth/Dare và lấy prompt

`POST /api/game-sessions/:id/turns`

```json
{
  "type": "TRUTH"
}
```

### Cập nhật kết quả lượt

`PATCH /api/game-sessions/:id/turns/:turnId`

```json
{
  "outcome": "COMPLETED"
}
```

### Đổi câu

`POST /api/game-sessions/:id/turns/:turnId/replace`

### Kết thúc

`POST /api/game-sessions/:id/end`

### Report câu hỏi

`POST /api/prompts/:promptId/reports`

## 8.2. Admin endpoints

- `GET /api/admin/prompts`.
- `POST /api/admin/prompts`.
- `GET /api/admin/prompts/:id`.
- `PATCH /api/admin/prompts/:id`.
- `DELETE /api/admin/prompts/:id` hoặc archive mềm.
- `POST /api/admin/prompts/bulk-status`.
- `POST /api/admin/prompts/import/preview`.
- `POST /api/admin/prompts/import/commit`.
- `GET /api/admin/prompts/export`.
- `GET /api/admin/reports`.
- `PATCH /api/admin/reports/:id`.

## 8.3. Validation rules

- Tên người chơi: 1–24 ký tự.
- 2–10 tên duy nhất sau normalize.
- Không chấp nhận HTML/script.
- Prompt text: 5–300 ký tự.
- Category/audience phải tồn tại.
- Filter list có giới hạn độ dài.
- API body có giới hạn kích thước.
- Import có giới hạn file size và số dòng mỗi batch.

## 8.4. Error format

```json
{
  "error": {
    "code": "INSUFFICIENT_PROMPT_POOL",
    "message": "Không có đủ câu hỏi phù hợp với bộ lọc hiện tại.",
    "details": {
      "suggestedRelaxations": ["Bật mức EASY", "Thêm chủ đề funny"]
    },
    "requestId": "..."
  }
}
```

Không trả stack trace ra client production.

---

# 9. THUẬT TOÁN CHỌN PROMPT

## 9.1. Input

- `sessionId`.
- `type` Truth/Dare.
- Session filters.
- Prompt IDs đã dùng.
- Prompt gần nhất.
- Tần suất toàn hệ thống.

## 9.2. Filtering cứng

Chỉ lấy prompt:

- `status = PUBLISHED`.
- `language = vi`.
- `type` đúng.
- `minimumAge <= session minimumAge` theo logic policy.
- `difficulty` nằm trong danh sách cho phép.
- audience/category phù hợp.
- cờ physical contact/props/internet phù hợp settings.
- chưa xuất hiện trong session.

## 9.3. Ranking mềm

Cho điểm:

- Quality score cao hơn.
- Times served thấp hơn.
- Category diversity.
- Không giống prompt gần nhất.
- Không chọn liên tục cùng một category nếu pool đủ lớn.

Sau đó random có trọng số trong top N, không luôn lấy item đầu tiên.

## 9.4. Fallback

Thứ tự nới điều kiện, chỉ khi an toàn:

1. Bỏ ưu tiên diversity.
2. Mở rộng category nhưng giữ age/difficulty/safety.
3. Cho phép prompt đã dùng lâu nhất nếu pool cạn.
4. Trả lỗi có gợi ý nới filter.

Không bao giờ tự động nới giới hạn tuổi hoặc safety flags.

## 9.5. Pseudocode

```ts
async function selectPrompt(input: SelectPromptInput): Promise<Prompt> {
  const usedIds = await getUsedPromptIds(input.sessionId);
  const candidates = await promptRepository.findEligible({
    type: input.type,
    filters: input.filters,
    excludeIds: usedIds,
  });

  if (candidates.length === 0) {
    return selectSafeFallback(input, usedIds);
  }

  const ranked = candidates.map((prompt) => ({
    prompt,
    weight: calculateWeight(prompt, input),
  }));

  return weightedRandom(topN(ranked, 50));
}
```

---

# 10. UI/UX

## 10.1. Định hướng hình ảnh

- Trẻ trung, vui nhộn, không quá trẻ con.
- Hai màu nhận diện khác nhau cho Truth và Dare.
- Không lạm dụng animation gây khó đọc.
- Card lớn ở trung tâm.
- Tối ưu portrait mobile.

## 10.2. Design tokens

Xây dựng token thay vì hard-code rải rác:

- Background.
- Surface.
- Text primary/secondary.
- Truth accent.
- Dare accent.
- Success/warning/error.
- Radius.
- Shadow.
- Spacing.
- Typography scale.

Đảm bảo contrast đạt WCAG AA cho text chính.

## 10.3. Trang Landing

Các section:

1. Hero:
   - Heading rõ ràng.
   - Mô tả ngắn.
   - CTA “Chơi ngay”.
2. Cách chơi 3 bước.
3. Tính năng chính.
4. Chế độ/chủ đề.
5. An toàn và quyền từ chối.
6. FAQ.
7. Footer.

Không dùng pop-up quảng cáo che CTA trong MVP.

## 10.4. Trang Setup

### Thành phần

- Danh sách người chơi.
- Input thêm người.
- Counter `x/10`.
- Drag-and-drop hoặc nút lên/xuống là optional.
- Nút xáo trộn.
- Bộ lọc dạng card/chip.
- Tóm tắt cấu hình.
- CTA “Bắt đầu”.

### UX rules

- Enter để thêm tên.
- Hiển thị lỗi ngay tại field.
- Không mất danh sách khi refresh ngoài ý muốn; có thể lưu draft trong localStorage.
- Xác nhận trước khi rời trang nếu đã nhập dữ liệu.

## 10.5. Trang Game

### Header

- Vòng hiện tại.
- Người chơi hiện tại.
- Nút cài đặt/âm thanh.
- Nút kết thúc.

### Trạng thái chọn loại

- Hai nút lớn:
  - THẬT.
  - THÁCH.
- Có microcopy ngắn.

### Trạng thái hiển thị prompt

- Tên người chơi.
- Badge loại, mức độ, chủ đề.
- Nội dung prompt lớn, dễ đọc.
- Timer nếu có.
- Nút:
  - Hoàn thành.
  - Đổi câu.
  - Bỏ qua.
  - Báo cáo.

### Chuyển lượt

- Animation ngắn.
- Hiển thị người tiếp theo.
- Có nút tiếp tục rõ ràng.

## 10.6. Trang Kết quả

- Tổng số lượt.
- Tổng Truth/Dare hoàn thành.
- Điểm từng người nếu bật điểm.
- Danh hiệu vui dựa trên dữ liệu thật, ví dụ:
  - “Dũng cảm nhất” – nhiều Dare hoàn thành nhất.
  - “Thành thật nhất” – nhiều Truth hoàn thành nhất.
- Không dùng danh hiệu tiêu cực/làm nhục.
- Nút chơi lại với cùng nhóm.
- Nút thay đổi cài đặt.

## 10.7. Admin UI

- Dashboard metrics:
  - số prompt theo trạng thái/type;
  - số report mở;
  - skip rate;
  - prompt chất lượng thấp.
- Prompt table có:
  - search;
  - filter;
  - sort;
  - pagination;
  - bulk select.
- Editor form có preview mobile.
- Import wizard có dry-run.
- Report queue có hành động resolve/archive/edit.

## 10.8. Responsive breakpoints

- Mobile: ưu tiên chính, 320px trở lên.
- Tablet.
- Desktop.
- Không yêu cầu layout 3 cột phức tạp.
- Bảo đảm thao tác chơi bằng cảm ứng.

## 10.9. Accessibility

- Semantic HTML.
- Keyboard navigation đầy đủ.
- Focus ring rõ.
- `aria-live` cho chuyển lượt và lỗi.
- Không truyền tải trạng thái chỉ bằng màu.
- Tôn trọng `prefers-reduced-motion`.
- Nút có vùng chạm tối thiểu khoảng 44x44 CSS px.
- Form label đầy đủ.

---

# 11. ÂM THANH, ANIMATION VÀ HAPTIC

MVP có thể có:

- Âm thanh nhẹ khi chọn Truth/Dare.
- Âm thanh hoàn thành.
- Toggle tắt âm, mặc định tôn trọng trạng thái trước đó.
- Animation flip card ngắn.
- Confetti tiết chế khi kết thúc game.

Không tự phát âm thanh lớn khi tải trang.

---

# 12. AUTH VÀ QUẢN TRỊ

## 12.1. Người chơi

- Không bắt buộc đăng nhập trong MVP.
- Chỉ lưu tên hiển thị trong session.
- Không yêu cầu email/số điện thoại.

## 12.2. Admin

Bắt buộc bảo vệ admin:

- Auth provider an toàn hoặc credentials dành cho môi trường nội bộ.
- Password phải hash nếu tự quản lý.
- Cookie `HttpOnly`, `Secure`, `SameSite` phù hợp.
- Role `ADMIN`/`EDITOR` nếu có nhiều tài khoản.
- Rate limit login.
- Audit log cho publish/archive/import.

Không để `/admin` chỉ được bảo vệ bằng URL bí mật.

---

# 13. BẢO MẬT VÀ QUYỀN RIÊNG TƯ

## 13.1. Threat model cơ bản

- XSS qua tên người chơi hoặc prompt import.
- SQL injection.
- CSRF với admin actions.
- Brute-force admin login.
- Spam report endpoint.
- Import file độc hại.
- Lộ session bằng ID dễ đoán.
- DoS qua tạo session hàng loạt.
- Nội dung không phù hợp lọt vào public pool.

## 13.2. Biện pháp

- Validate bằng Zod ở boundary.
- Escape output, không render HTML từ prompt.
- ORM parameterized queries.
- CSRF protection hoặc same-site architecture phù hợp.
- Rate limit theo IP/token cho create session, report, admin login.
- CUID/UUID và ownership token.
- File import chỉ CSV/JSON, giới hạn kích thước, parse an toàn.
- Không cho upload executable.
- Security headers:
  - Content-Security-Policy.
  - X-Content-Type-Options.
  - Referrer-Policy.
  - Permissions-Policy.
  - HSTS production.
- Secret chỉ ở environment variables.
- `.env.example` không chứa secret thật.
- Dependency audit trong CI.

## 13.3. Retention

Đề xuất:

- Session guest tự xóa hoặc anonymize sau 30 ngày.
- Report giữ lâu hơn phục vụ moderation.
- Không lưu IP thô lâu dài nếu không cần; cân nhắc hash/rút gọn.
- Analytics ưu tiên cookieless/privacy-friendly.

## 13.4. Nội dung và trẻ vị thành niên

- Default 13+ an toàn.
- Không có nội dung tình dục cho minor.
- Không suy đoán tuổi từ dữ liệu cá nhân.
- Cảnh báo rõ ràng nhưng không coi checkbox là biện pháp an toàn duy nhất; hệ thống nội dung vẫn phải được kiểm duyệt.

---

# 14. SEO VÀ CHIA SẺ

## 14.1. SEO pages

- `/`.
- `/cach-choi-truth-or-dare`.
- `/cau-hoi-truth-hay`.
- `/thu-thach-dare-vui`.
- `/truth-or-dare-cho-ban-be`.
- `/truth-or-dare-cho-gia-dinh`.

Không index session URL hoặc admin URL.

## 14.2. Metadata

- Title và description tiếng Việt.
- Open Graph image riêng.
- Canonical.
- Sitemap.
- Robots.txt.
- Structured data phù hợp cho FAQ và WebApplication nếu đúng nội dung.

## 14.3. Nội dung SEO không làm lộ toàn bộ database

- Có thể tạo bài hướng dẫn và sample câu hỏi đã chọn lọc.
- Không render hàng nghìn câu trong một trang.
- Không tạo hàng loạt trang mỏng/spam.

---

# 15. ANALYTICS VÀ PRODUCT METRICS

## 15.1. Sự kiện tối thiểu

- `landing_play_clicked`.
- `setup_started`.
- `player_added` – không gửi tên.
- `game_started`.
- `truth_selected`.
- `dare_selected`.
- `prompt_replaced`.
- `prompt_skipped`.
- `prompt_completed`.
- `prompt_reported`.
- `game_ended`.
- `play_again_clicked`.

## 15.2. Không gửi dữ liệu nhạy cảm

- Không gửi tên người chơi.
- Không gửi nguyên văn câu trả lời Truth.
- Không lưu audio/video.
- Không gửi nội dung tự nhập vào analytics.

## 15.3. KPI

- Tỷ lệ click “Chơi ngay”.
- Tỷ lệ setup hoàn tất.
- Thời gian từ landing đến game start.
- Số lượt trung vị mỗi session.
- Tỷ lệ đổi/bỏ theo prompt.
- Tỷ lệ report.
- Tỷ lệ chơi lại.
- Crash/error-free session rate.

---

# 16. TEST STRATEGY

## 16.1. Unit tests

Bắt buộc cho:

- Normalize tên người chơi.
- Validate 2–10 người.
- Chống tên trùng.
- Tính người tiếp theo theo vòng.
- Balanced random.
- Tính điểm.
- Kiểm tra kết thúc theo target rounds.
- Prompt eligibility.
- Prompt weighting.
- Safe fallback.
- Normalize prompt.
- Exact/near duplicate detection.

## 16.2. Integration tests

- Tạo session lưu đúng DB.
- Không tạo session với 1 hoặc 11 người.
- Start session.
- Tạo turn trả prompt phù hợp filter.
- Không lặp prompt trong session khi pool còn.
- Replace prompt ghi outcome đúng.
- Complete turn cập nhật điểm và player stats.
- End session tạo summary.
- Report prompt.
- Admin CRUD.
- Import preview không commit DB.
- Import commit idempotent.

## 16.3. E2E Playwright

### Luồng 1: Chơi cơ bản

1. Mở landing.
2. Chọn Chơi ngay.
3. Thêm 3 người.
4. Chọn Friends + Easy/Medium.
5. Bắt đầu.
6. Chọn Truth.
7. Hoàn thành.
8. Xác nhận chuyển người.
9. Chọn Dare.
10. Đổi câu.
11. Hoàn thành.
12. Kết thúc.
13. Kiểm tra result.

### Luồng 2: Validation

- Không bắt đầu với một người.
- Không thêm tên trùng khác hoa/thường.
- Không thêm quá 10.

### Luồng 3: Safety filter

- Session 13+ không nhận prompt 16+/18+.
- Tắt contact không nhận prompt contact.

### Luồng 4: Admin

- User chưa auth không vào admin.
- Admin tạo draft, review, publish.
- Prompt published xuất hiện trong game.

## 16.4. Browser compatibility

- Chrome desktop/mobile.
- Safari iOS.
- Firefox.
- Edge.

## 16.5. Performance test

- API chọn prompt p95 mục tiêu dưới 500ms trong môi trường production thông thường.
- Landing đạt Core Web Vitals tốt.
- Seed hàng chục nghìn prompt vẫn truy vấn được bằng index phù hợp.
- Kiểm tra N+1 query.

## 16.6. Accessibility test

- Axe scan cho các trang chính.
- Tab toàn bộ setup/game.
- Screen reader label.
- Reduced motion.
- Contrast.

---

# 17. CI/CD VÀ DEPLOYMENT

## 17.1. Environments

- Local.
- Preview cho pull request.
- Staging.
- Production.

## 17.2. CI pipeline

Mỗi PR:

1. Install dependencies bằng lockfile.
2. Lint.
3. Type-check.
4. Unit tests.
5. Integration tests với PostgreSQL service.
6. Build production.
7. E2E smoke test.
8. Dependency/security audit.

## 17.3. Database migration

- Migration được version control.
- Không dùng `db push` trực tiếp ở production.
- Backup trước migration rủi ro.
- Có rollback/forward-fix plan.
- Seed production chỉ publish nội dung đã duyệt.

## 17.4. Deployment target

Có thể dùng:

- Vercel + managed PostgreSQL.
- Hoặc Docker trên cloud/VPS.

Agent phải tạo:

- `Dockerfile` production nếu chọn container.
- `docker-compose.yml` cho local database.
- `.env.example`.
- `README.md` hướng dẫn local/dev/test/build/deploy.

## 17.5. Monitoring

- Error tracking.
- Structured logs có request ID.
- Health endpoint.
- Uptime monitor.
- Database metrics.
- Alert khi error rate tăng hoặc pool prompt bị cạn.

---

# 18. CẤU TRÚC REPOSITORY DỰ KIẾN

```text
truth-or-dare-vietnam/
├─ .github/
│  └─ workflows/
│     └─ ci.yml
├─ data/
│  └─ seeds/
│     ├─ audiences.json
│     ├─ categories.json
│     ├─ prompts.truth.vi.json
│     └─ prompts.dare.vi.json
├─ docs/
│  ├─ IMPLEMENTATION_PLAN.md
│  ├─ DECISIONS.md
│  ├─ CONTENT_GUIDELINES.md
│  ├─ DATABASE.md
│  ├─ API.md
│  ├─ TESTING.md
│  └─ DEPLOYMENT.md
├─ prisma/
│  ├─ migrations/
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/
│  ├─ icons/
│  ├─ images/
│  └─ sounds/
├─ scripts/
│  ├─ import-prompts.ts
│  ├─ validate-prompts.ts
│  ├─ detect-duplicates.ts
│  └─ export-prompts.ts
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  ├─ styles/
│  └─ types/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
├─ Dockerfile
├─ eslint.config.*
├─ next.config.*
├─ package.json
├─ playwright.config.*
├─ postcss.config.*
├─ prettier.config.*
├─ README.md
├─ tailwind.config.*
├─ tsconfig.json
└─ vitest.config.*
```

---

# 19. ROADMAP TRIỂN KHAI CHO ANTIGRAVITY

## Phase 0 – Khảo sát và lập kế hoạch

### Nhiệm vụ

- Kiểm tra repository và toolchain.
- Xác nhận runtime/package manager.
- Tạo `docs/IMPLEMENTATION_PLAN.md`.
- Tạo `docs/DECISIONS.md`.
- Liệt kê assumptions.
- Định nghĩa Definition of Done.

### Acceptance criteria

- Có plan chia phase và task cụ thể.
- Mỗi task có output và test.
- Không bắt đầu code trước khi biết cấu trúc repository.

---

## Phase 1 – Scaffold và nền tảng kỹ thuật

### Nhiệm vụ

- Khởi tạo Next.js + TypeScript.
- Tailwind.
- ESLint/Prettier.
- Vitest/Playwright.
- Docker Compose PostgreSQL.
- Prisma schema nền tảng.
- Environment validation.
- CI workflow.
- Base layout và design tokens.

### Acceptance criteria

- `pnpm dev` chạy được.
- DB local khởi động được.
- Migration chạy được.
- `lint`, `typecheck`, `test`, `build` pass.
- Landing skeleton hiển thị trên mobile/desktop.

---

## Phase 2 – Database prompt và seed pipeline

### Nhiệm vụ

- Tạo models Prompt/Category/Audience.
- Tạo normalize/dedupe utilities.
- Tạo validation schema cho seed.
- Tạo seed category/audience.
- Tạo seed tối thiểu 100 Truth + 100 Dare ban đầu để test.
- Viết script validate/import/export.
- Unit test pipeline.

### Acceptance criteria

- Seed idempotent.
- Exact duplicate bị chặn.
- Prompt truy vấn theo type/age/difficulty/audience/category.
- Dữ liệu tiếng Việt hiển thị đúng.

---

## Phase 3 – Game engine domain

### Nhiệm vụ

- Models GameSession/Player/GameTurn.
- Validation người chơi.
- Round-robin.
- Balanced random.
- Prompt selection.
- Turn state transitions.
- Scoring.
- Session summary.
- Unit tests đầy đủ.

### Acceptance criteria

- Engine chạy độc lập khỏi UI.
- Không lặp prompt khi pool đủ.
- Không vi phạm age/safety filters.
- State transition không hợp lệ bị từ chối.

---

## Phase 4 – Setup và gameplay UI

### Nhiệm vụ

- Landing hoàn chỉnh.
- Setup form.
- Session creation API/action.
- Game page.
- Truth/Dare selection.
- Prompt card.
- Complete/replace/skip/report.
- Turn transition.
- Result page.
- Responsive + accessibility.

### Acceptance criteria

- Có thể chơi end-to-end 2–10 người.
- Refresh không làm hỏng session đang lưu server.
- Mobile 320px không tràn ngang.
- Keyboard sử dụng được.
- E2E luồng chính pass.

---

## Phase 5 – Admin và moderation

### Nhiệm vụ

- Admin auth.
- Prompt list/search/filter.
- Create/edit/review/publish/archive.
- Bulk action.
- Import preview/commit.
- Export.
- Report queue.
- Audit logging cơ bản.

### Acceptance criteria

- Guest không truy cập admin.
- Draft không xuất hiện trong game.
- Publish xong prompt có thể được chọn.
- Import lỗi không tạo partial data ngoài transaction policy.
- Report có thể resolve.

---

## Phase 6 – Nội dung quy mô lớn

### Nhiệm vụ

- Mở rộng lên tối thiểu 500 Truth + 500 Dare đạt chuẩn.
- Chạy exact/near dedupe.
- Kiểm tra phân bố taxonomy.
- Review safety.
- Tạo coverage report.

### Acceptance criteria

- Không có duplicate chính xác.
- Các segment chính có số lượng tối thiểu.
- 100% prompt published đã qua validation.
- Sample review thủ công không phát hiện nội dung cấm.

---

## Phase 7 – Hardening

### Nhiệm vụ

- Security headers.
- Rate limiting.
- CSRF/auth hardening.
- Error boundaries.
- Logging/monitoring.
- Performance profiling.
- SEO metadata/sitemap/robots.
- Privacy/safety pages.

### Acceptance criteria

- Không lộ stack trace/secrets.
- Lighthouse/performance đạt mức hợp lý.
- Accessibility scan không có lỗi critical.
- Admin protected.
- Rate limit hoạt động.

---

## Phase 8 – Release candidate

### Nhiệm vụ

- Chạy full test suite.
- Cross-browser smoke test.
- Kiểm tra migration staging.
- Backup/restore rehearsal cơ bản.
- Kiểm tra analytics không chứa PII.
- Hoàn thiện README/deployment docs.
- Tạo release checklist.

### Acceptance criteria

- CI xanh.
- Production build thành công.
- E2E các luồng critical xanh.
- Không có bug blocker/critical.
- Có rollback plan.

---

# 20. BACKLOG USER STORIES

## Epic A – Thiết lập người chơi

### US-A1

Là host, tôi muốn thêm từ 2 đến 10 tên để game biết ai đang chơi.

**Acceptance criteria:**

- Không cho tên rỗng.
- Không cho trùng sau normalize.
- Không quá 10 người.
- Có thể xóa/sửa trước khi bắt đầu.

### US-A2

Là host, tôi muốn xáo trộn thứ tự để tăng tính ngẫu nhiên.

### US-A3

Là host, tôi muốn chọn mức độ và nhóm đối tượng để nội dung phù hợp.

---

## Epic B – Gameplay

### US-B1

Là người chơi, tôi muốn thấy rõ đến lượt ai.

### US-B2

Là người chơi, tôi muốn chọn Truth hoặc Dare.

### US-B3

Là người chơi, tôi muốn đổi câu khi không phù hợp.

### US-B4

Là người chơi, tôi muốn từ chối mà không bị làm nhục.

### US-B5

Là host, tôi muốn kết thúc game bất kỳ lúc nào.

---

## Epic C – Nội dung

### US-C1

Là người chơi, tôi không muốn gặp lại cùng một câu trong một phiên.

### US-C2

Là người chơi, tôi muốn báo cáo câu nguy hiểm hoặc không phù hợp.

### US-C3

Là editor, tôi muốn thêm metadata để câu được phân phối đúng nhóm.

### US-C4

Là admin, tôi muốn import hàng loạt và xem lỗi trước khi commit.

---

## Epic D – Kết quả

### US-D1

Là người chơi, tôi muốn xem tóm tắt sau game.

### US-D2

Là host, tôi muốn chơi lại với cùng danh sách người.

---

# 21. DEFINITION OF DONE

Một task chỉ được coi là Done khi:

- Code đã triển khai hoàn chỉnh theo scope.
- Không còn TODO giả hoặc mock che giấu luồng chính.
- Type-check pass.
- Lint pass.
- Test liên quan pass.
- Production build pass.
- Đã kiểm tra browser nếu task có UI.
- Có xử lý loading/empty/error state.
- Có validation server-side.
- Không làm lộ secret/PII.
- Docs cập nhật nếu API/schema/flow thay đổi.
- Acceptance criteria đã được đối chiếu từng mục.

---

# 22. RELEASE CHECKLIST

## Product

- [ ] 2–10 người hoạt động chính xác.
- [ ] Truth/Dare hoạt động.
- [ ] Không lặp prompt khi pool đủ.
- [ ] Filters hoạt động.
- [ ] Skip/replace/complete hoạt động.
- [ ] Kết quả phiên đúng.
- [ ] Chơi lại hoạt động.

## Content

- [ ] Seed đủ mục tiêu.
- [ ] Không duplicate exact.
- [ ] Nội dung tiếng Việt tự nhiên.
- [ ] Age labels đúng.
- [ ] Safety review hoàn tất.
- [ ] Report flow hoạt động.

## UX

- [ ] Mobile responsive.
- [ ] Loading states.
- [ ] Empty states.
- [ ] Error messages tiếng Việt.
- [ ] Keyboard navigation.
- [ ] Reduced motion.
- [ ] Contrast đạt yêu cầu.

## Engineering

- [ ] CI pass.
- [ ] Build pass.
- [ ] Migration pass staging.
- [ ] Backup plan.
- [ ] Logs/monitoring.
- [ ] Rate limiting.
- [ ] Security headers.
- [ ] `.env.example` đầy đủ.

## Legal/privacy

- [ ] Privacy page.
- [ ] Safety rules.
- [ ] Content reporting.
- [ ] Không thu thập dữ liệu không cần thiết.
- [ ] Analytics không chứa tên/câu trả lời.

---

# 23. RỦI RO VÀ GIẢM THIỂU

| Rủi ro | Mức độ | Biện pháp |
|---|---|---|
| Nội dung lặp hoặc chất lượng thấp | Cao | Taxonomy, dedupe, quality metrics, review |
| Nội dung không an toàn | Cao | Safety policy, flags, age gate, report queue, human review |
| Scope phình to vì multiplayer online | Cao | Giữ online room ngoài MVP |
| Game state lỗi khi refresh | Trung bình | Persist session server-side, idempotent actions |
| Prompt pool cạn do filter hẹp | Trung bình | Safe fallback + UX gợi ý nới filter |
| Admin bị truy cập trái phép | Cao | Auth, role, rate limit, secure cookies |
| Import tạo dữ liệu rác | Cao | Dry-run, transaction, validation, dedupe |
| Mobile UX khó thao tác | Cao | Mobile-first, E2E viewport, tap targets |
| Chi phí DB tăng khi pool lớn | Trung bình | Index, pagination, query profiling, cache khi cần |
| AI agent tạo quá nhiều code một lượt | Trung bình | Phase gates, tests, artifact review |

---

# 24. CÁC QUYẾT ĐỊNH KỸ THUẬT MẶC ĐỊNH

Ghi vào `docs/DECISIONS.md` nếu không có yêu cầu khác:

1. Dùng monolith modular, không microservices.
2. Dùng PostgreSQL vì dữ liệu có quan hệ và cần filter/report/admin.
3. Không yêu cầu tài khoản cho người chơi MVP.
4. Persist session ở server để hỗ trợ refresh và thống kê.
5. Không lưu câu trả lời Truth.
6. Không bật 18+ mặc định.
7. Không tự publish nội dung do người dùng/AI gửi.
8. Admin archive mềm thay vì hard delete prompt đã từng được dùng.
9. Prompt selection dùng weighted random sau hard filter.
10. Multiplayer realtime để phase sau.

---

# 25. TIÊU CHÍ BÀN GIAO CUỐI CÙNG

Antigravity phải bàn giao:

- Source code hoàn chỉnh.
- Database schema + migrations.
- Seed data.
- Import/export scripts.
- Test suite.
- CI configuration.
- Docker/local setup.
- README.
- Docs kiến trúc, API, database, content guideline, testing và deployment.
- Báo cáo coverage prompt theo taxonomy.
- Danh sách known issues.
- Evidence:
  - output lint/typecheck/test/build;
  - ảnh hoặc browser verification các trang chính;
  - xác nhận luồng E2E.

---

# 26. LỆNH KIỂM TRA GỢI Ý

Điều chỉnh theo package scripts thực tế:

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm start
```

Tạo script thống nhất trong `package.json`; không yêu cầu người dùng nhớ lệnh riêng lẻ khó đoán.

---

# 27. KẾT QUẢ MVP ĐƯỢC KỲ VỌNG

Sau khi hoàn thành MVP, một người dùng phải có thể:

1. Truy cập website bằng điện thoại.
2. Hiểu game trong vài giây.
3. Thêm từ 2 đến 10 người.
4. Chọn bộ lọc phù hợp.
5. Bắt đầu game.
6. Luân phiên chọn Truth hoặc Dare.
7. Nhận câu hỏi tiếng Việt không bị lặp nhanh.
8. Đổi, bỏ hoặc báo cáo câu không phù hợp.
9. Kết thúc và xem kết quả.
10. Chơi lại mà không phải nhập lại toàn bộ danh sách.

Admin phải có thể:

1. Đăng nhập an toàn.
2. Tạo/sửa/duyệt/publish/archive prompt.
3. Import hàng loạt có preview.
4. Phát hiện trùng.
5. Xử lý report.
6. Theo dõi chất lượng nội dung.

---

# 28. GHI CHÚ CHO AGENT

- Ưu tiên một bản chạy tốt hơn nhiều tính năng dang dở.
- Không thay thế PostgreSQL bằng local JSON cho production.
- Có thể dùng dữ liệu seed nhỏ khi xây dựng, nhưng phải có pipeline mở rộng rõ ràng.
- Khi tạo hàng nghìn prompt, chia batch nhỏ, validate và review; không nhồi tất cả vào một commit không kiểm chứng.
- Không coi “18+” là lý do để cho phép nội dung nguy hiểm hoặc cưỡng ép.
- Mọi hành động admin thay đổi trạng thái nội dung nên có audit trail.
- Mọi endpoint thay đổi game state cần chống double-submit/idempotency ở mức phù hợp.
- Khi có xung đột giữa sự vui nhộn và an toàn, ưu tiên an toàn.

---

**HẾT TÀI LIỆU TRIỂN KHAI**

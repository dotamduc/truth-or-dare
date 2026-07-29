import * as fs from "fs";
import * as path from "path";

const extraTruths = [
  { text: "Bí mật ngớ ngẩn nhất mà bạn từng giấu bố mẹ thời thơ ấu là gì?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["family", "funny"], audiences: ["FAMILY", "FRIENDS"] },
  { text: "Lần gần đây nhất bạn khóc vì xúc động hoặc cảm động là khi nào?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["deep", "memories"], audiences: ["ANY"] },
  { text: "Kỹ năng hoặc tài năng kỳ lạ nào bạn có mà rất ít người biết?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["personality", "funny"], audiences: ["ANY"] },
  { text: "Bạn từng giả vờ ốm để trốn học hoặc trốn làm lần nào chưa?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["school", "work"], audiences: ["FRIENDS", "COWORKERS"] },
  { text: "Nếu được tặng 100 triệu đồng để tiêu trong 24 giờ, bạn sẽ mua gì?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["dreams", "funny"], audiences: ["ANY"] },
  { text: "Nỗi sợ vô lý nhất mà bạn vẫn giữ đến tận bây giờ là gì?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["personality"], audiences: ["ANY"] },
  { text: "Điều gì ở công việc hoặc việc học hiện tại làm bạn căng thẳng nhất?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["work", "school"], audiences: ["COWORKERS", "FRIENDS"] },
  { text: "Bạn từng có thiện cảm đặc biệt với người yêu cũ của ai chưa?", difficulty: "BOLD", minimumAge: "AGE_16_PLUS", categories: ["relationship"], audiences: ["FRIENDS"] },
  { text: "Nếu chỉ được giữ lại 3 ứng dụng trên điện thoại, bạn chọn những app nào?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["icebreaker"], audiences: ["ANY"] },
  { text: "Ai là người đầu tiên bạn muốn gọi điện khi gặp chuyện vui?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["friendship", "family"], audiences: ["ANY"] },
  { text: "Điều dại khụt nhất bạn từng làm chỉ để gây ấn tượng với ai đó là gì?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["memories", "funny"], audiences: ["FRIENDS"] },
  { text: "Trận cãi nhau gần đây nhất của bạn với một người bạn là về vấn đề gì?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["friendship"], audiences: ["FRIENDS"] },
  { text: "Bạn đánh giá cao tính cách nào nhất ở một người bạn thân?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["friendship", "deep"], audiences: ["ANY"] },
  { text: "Kỷ niệm sinh nhật nào làm bạn nhớ nhất từ trước đến nay?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["memories", "party"], audiences: ["ANY"] },
  { text: "Điều gì làm bạn tự tin nhất khi xuất hiện trước đám đông?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["personality"], audiences: ["ANY"] },
  { text: "Bạn từng mua một món đồ vì quảng cáo nhưng thực tế thất vọng chưa?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny"], audiences: ["ANY"] },
  { text: "Một thói quen xấu nào của bản thân mà bạn rất muốn bỏ?", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["personality", "deep"], audiences: ["ANY"] },
  { text: "Nếu được sống ở một thành phố khác trên thế giới, bạn chọn nơi nào?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["dreams"], audiences: ["ANY"] },
  { text: "Lời nói dối vô hại gần đây nhất bạn từng nói là gì?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny"], audiences: ["ANY"] },
  { text: "Bạn thấy người ngồi bên phải có ưu điểm gì nổi bật nhất?", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["friendship", "icebreaker"], audiences: ["ANY"] }
];

const extraDares = [
  { text: "Nhắm mắt lại và đoán xem ai trong nhóm đang nắm tay bạn trong 10 giây.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["social", "funny"], audiences: ["FRIENDS", "FAMILY"], requiresAnotherPlayer: true },
  { text: "Dùng trán chạm vào trán người bên trái và giữ nguyên trong 10 giây.", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["social", "physical_light"], audiences: ["FRIENDS"], requiresAnotherPlayer: true, requiresPhysicalContact: true },
  { text: "Giả vờ là một robot và giới thiệu bản thân trong 30 giây.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["performance", "funny"], audiences: ["ANY"] },
  { text: "Thực hiện 10 lần nhảy bật nhảy (jumping jacks) ngay tại chỗ.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["physical_light"], audiences: ["ANY"], requiresMovement: true },
  { text: "Nói một câu tiếng Anh hoặc tiếng nước ngoài tự tin như chuyên gia.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny", "performance"], audiences: ["ANY"] },
  { text: "Đứng một chân trong 30 giây mà không được lắc rắc.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["physical_light", "challenge"], audiences: ["ANY"], requiresMovement: true },
  { text: "Vỗ tay theo điệu nhạc sôi động và mời cả nhóm cùng vỗ tay theo.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["party", "social"], audiences: ["ANY"] },
  { text: "Bắt chước âm thanh của một chiếc xe máy đang tăng tốc.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny"], audiences: ["ANY"] },
  { text: "Tạo biểu cảm khuôn mặt ngơ ngác nhất có thể để cả nhóm chụp ảnh.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny"], audiences: ["FRIENDS"] },
  { text: "Nói lời cảm ơn chân thành tới người đưa cho bạn đồ uống gần nhất.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["social", "friendship"], audiences: ["ANY"] },
  { text: "Hát bài 'Chúc mừng sinh nhật' theo phong cách nhạc opera.", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["performance", "funny"], audiences: ["ANY"] },
  { text: "Tạo dáng người mẫu chuyên nghiệp trên đường đi dạo 5 bước.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["performance", "creative"], audiences: ["ANY"], requiresMovement: true },
  { text: "Thử giữ nụ cười tươi liên tục trong 1 phút không được khép miệng.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["funny", "challenge"], audiences: ["ANY"] },
  { text: "Gửi biểu tượng cảm xúc trái tim ❤️ cho 3 người gần nhất trong tin nhắn.", difficulty: "MEDIUM", minimumAge: "AGE_13_PLUS", categories: ["social"], audiences: ["FRIENDS"], requiresPhone: true },
  { text: "Đặt một câu đố ngắn cho cả nhóm đoán trong vòng 1 phút.", difficulty: "EASY", minimumAge: "AGE_13_PLUS", categories: ["creative", "challenge"], audiences: ["ANY"] }
];

function expand() {
  const truthPath = path.join(__dirname, "../data/seeds/prompts.truth.vi.json");
  const darePath = path.join(__dirname, "../data/seeds/prompts.dare.vi.json");

  const currentTruths = JSON.parse(fs.readFileSync(truthPath, "utf-8"));
  const currentDares = JSON.parse(fs.readFileSync(darePath, "utf-8"));

  const updatedTruths = [...currentTruths];
  for (const t of extraTruths) {
    if (!updatedTruths.some((item) => item.text.trim().toLowerCase() === t.text.trim().toLowerCase())) {
      updatedTruths.push({ type: "TRUTH", ...t });
    }
  }

  const updatedDares = [...currentDares];
  for (const d of extraDares) {
    if (!updatedDares.some((item) => item.text.trim().toLowerCase() === d.text.trim().toLowerCase())) {
      updatedDares.push({ type: "DARE", ...d });
    }
  }

  fs.writeFileSync(truthPath, JSON.stringify(updatedTruths, null, 2), "utf-8");
  fs.writeFileSync(darePath, JSON.stringify(updatedDares, null, 2), "utf-8");

  console.log(`✅ Expanded Truths total: ${updatedTruths.length}`);
  console.log(`✅ Expanded Dares total: ${updatedDares.length}`);
}

expand();

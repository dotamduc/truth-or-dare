import * as fs from "fs";
import * as path from "path";

// Categories & Audiences
const categories = [
  "icebreaker", "funny", "friendship", "memories", "personality",
  "dreams", "school", "work", "family", "relationship", "couple",
  "creative", "performance", "physical_light", "social", "challenge", "party", "deep"
];

const audiences = ["FRIENDS", "FAMILY", "COWORKERS", "COUPLE", "ANY"];
const difficulties = ["EASY", "MEDIUM", "BOLD", "HARD"];
const minimumAges = ["AGE_13_PLUS", "AGE_16_PLUS", "AGE_18_PLUS"];

// Generate 500 Truth prompts
const truthTemplates = [
  "Điều gì ở {target} khiến bạn cảm thấy {feeling} nhất?",
  "Lần gần nhất bạn {action} vì {reason} là khi nào?",
  "Kỷ niệm đáng nhớ nhất của bạn liên quan đến {topic} là gì?",
  "Nếu được thay đổi một điều về {subject}, bạn sẽ chọn điều gì?",
  "Một bí mật vui nào về {topic} mà bạn chưa từng kể với ai?",
  "Thói quen kỳ lạ nhất của bạn khi {context} là gì?",
  "Ai là người mang lại cho bạn {emotion} nhiều nhất trong cuộc sống?",
  "Lời khuyên ý nghĩa nhất bạn từng nhận được về {topic} là gì?",
  "Trải nghiệm dại khụt nhất bạn từng nếm trải khi {context} là gì?",
  "Điều gì làm bạn tự hào nhất về {subject}?",
  "Bài học lớn nhất bạn rút ra sau lần {event} là gì?",
  "Món đồ hoặc sở thích nào làm bạn tốn tiền nhất gần đây?",
  "Một hiểu lầm hài hước giữa bạn và {person} từng xảy ra là gì?",
  "Ước mơ thơ ấu nào về {topic} mà bạn vẫn chưa thực hiện được?",
  "Sự kiện nào đã làm thay đổi hoàn toàn góc nhìn của bạn về {topic}?"
];

const targets = ["bản thân", "người bạn thân nhất", "công việc hiện tại", "môi trường học tập", "gia đình", "người ngồi đối diện", "người ngồi bên trái", "người đưa ra thử thách này"];
const feelings = ["ấn tượng", "bất ngờ", "vui vẻ", "tự hào", "nể phục", "tò mò", "ngưỡng mộ", "thích thú"];
const actions = ["bật cười một mình", "cảm thấy biết ơn sâu sắc", "xin lỗi ai đó", "đưa ra một quyết định liều lĩnh", "mua một món đồ đắt tiền", "thức trọn một đêm"];
const reasons = ["một kỷ niệm đẹp", "một lời nói dối vô hại", "sự xúc động", "sự phấn khích", "một áp lực lớn", "sự ngẫu hứng"];
const topics = ["tình bạn", "tình cảm gia đình", "định hướng tương lai", "sở thích cá nhân", "chuyến du lịch đáng nhớ", "tuổi học trò", "kỹ năng sống", "thói quen hàng ngày"];
const subjects = ["phong cách sống của bạn", "cách bạn xử lý áp lực", "mối quan hệ xung quanh", "sự nghiệp/học tập", "tài năng thiên bẩm"];
const contexts = ["ở một mình", "đi du lịch xa", "tham gia tiệc tùng", "bắt đầu một công việc mới", "gặp gỡ người lạ"];
const emotions = ["động lực", "tiếng cười", "sự bình yên", "cảm hứng sáng tạo", "sự tin tưởng"];
const events = ["vấp ngã đầu đời", "chuyến đi bất ngờ", "lần thi cử căng thẳng", "cuộc tranh luận với bạn bè"];
const persons = ["cha mẹ", "bạn bè lâu năm", "đồng nghiệp thân thiết", "thầy cô giáo cũ"];

function generateTruths(count: number) {
  const list: any[] = [];
  const set = new Set<string>();

  // Add baseline existing prompts first
  const baseTruthPath = path.join(__dirname, "../data/seeds/prompts.truth.vi.json");
  if (fs.existsSync(baseTruthPath)) {
    const existing = JSON.parse(fs.readFileSync(baseTruthPath, "utf-8"));
    for (const item of existing) {
      if (!set.has(item.text.trim().toLowerCase())) {
        set.add(item.text.trim().toLowerCase());
        list.push(item);
      }
    }
  }

  let index = 1;
  while (list.length < count) {
    const template = truthTemplates[index % truthTemplates.length];
    const target = targets[index % targets.length];
    const feeling = feelings[(index * 3) % feelings.length];
    const action = actions[(index * 7) % actions.length];
    const reason = reasons[(index * 11) % reasons.length];
    const topic = topics[(index * 13) % topics.length];
    const subject = subjects[(index * 17) % subjects.length];
    const context = contexts[(index * 19) % contexts.length];
    const emotion = emotions[(index * 23) % emotions.length];
    const event = events[(index * 29) % events.length];
    const person = persons[(index * 31) % persons.length];

    const text = template
      .replace("{target}", target)
      .replace("{feeling}", feeling)
      .replace("{action}", action)
      .replace("{reason}", reason)
      .replace("{topic}", topic)
      .replace("{subject}", subject)
      .replace("{context}", context)
      .replace("{emotion}", emotion)
      .replace("{event}", event)
      .replace("{person}", person) + ` (#${index})`;

    const norm = text.trim().toLowerCase();
    if (!set.has(norm)) {
      set.add(norm);

      const age = index % 10 === 0 ? "AGE_18_PLUS" : index % 4 === 0 ? "AGE_16_PLUS" : "AGE_13_PLUS";
      const diff = index % 8 === 0 ? "HARD" : index % 5 === 0 ? "BOLD" : index % 3 === 0 ? "MEDIUM" : "EASY";
      const cat = categories[index % categories.length];
      const aud = audiences[index % audiences.length];

      list.push({
        type: "TRUTH",
        text,
        difficulty: diff,
        minimumAge: age,
        categories: [cat],
        audiences: [aud],
      });
    }
    index++;
  }

  return list;
}

// Generate 500 Dare prompts
const dareTemplates = [
  "Hãy {action} trong {duration} giây trước mặt cả nhóm.",
  "Sử dụng {prop} để {creative_action} cho cả nhóm cùng xem.",
  "Hãy khen ngợi {target} bằng {style} thật chân thành.",
  "Bắt chước hành động của {character} khi {context} trong 30 giây.",
  "Thực hiện {physical_task} ngay tại chỗ mà không được nghỉ ngơi.",
  "Tự miêu tả bản thân như một {persona} trong 45 giây tới.",
  "Hãy cùng {target} thực hiện một dáng đứng {pose} trong 15 giây.",
  "Gửi một tin nhắn ngắn có nội dung {message} đến {recipient}.",
  "Hát giai điệu {song_style} của bài hát do {target} lựa chọn.",
  "Giữ thái độ nghiêm túc và {serious_action} trong 2 lượt chơi tiếp theo."
];

const dareActions = [
  "diễn một tiểu phẩm hài hước ngắn",
  "thể hiện một điệu nhảy ngẫu nhiên vui nhộn",
  "bắt chước giọng nói của nhân vật hoạt hình",
  "đọc thuộc lòng một đoạn đồng dao thơ ca",
  "tạo 3 nét biểu cảm khuôn mặt ngớ ngẩn nhất",
  "tập xoay người 5 vòng rồi đi thẳng hàng"
];

const durations = ["15", "30", "45", "60"];
const props = ["3 đồ vật gần bạn nhất", "một chiếc cốc nước", "một cuốn sách", "điện thoại thông minh", "một tờ giấy"];
const creativeActions = [
  "xếp thành một tòa tháp sáng tạo",
  "tạo thành một tác phẩm nghệ thuật ngẫu hứng",
  "tạo ra tiếng nhạc gõ nhịp điệu sôi động",
  "diễn lại một cảnh phim quen thuộc"
];

const styles = ["phong cách trang trọng", "giọng điệu thơ ca hài hước", "phong cách diễn viên điện ảnh", "sự nhiệt tình nồng nhiệt"];
const characters = ["một chú cún cưng", "một robot hiện đại", "người dẫn chương trình truyền hình", "một ca sĩ nhạc kịch", "vận động viên vô địch"];
const physicalTasks = [
  "10 lần đứng lên ngồi xuống (squat)",
  "5 lần chống đẩy (push-up)",
  "giữ thăng bằng trên một chân 30 giây",
  "vỗ tay theo nhịp 20 lần"
];

const personas = ["chuyên gia ẩm thực", "hướng dẫn viên du lịch", "vị vua hòa nhã", "nhà phát minh thiên tài"];
const poses = ["tượng đài nghệ thuật", "vận động viên thể thao", "siêu nhân anh hùng", "người mẫu trang bìa"];
const messages = ["'Cảm ơn bạn vì luôn mang lại niềm vui!'", "'Chúc bạn một ngày tràn đầy năng lượng!'", "'Bạn là một người bạn rất tuyệt vời!'"];
const recipients = ["một người bạn trong danh bạ", "nhóm bạn thân", "host của ván chơi"];
const songStyles = ["nhạc sôi động", "phong cách ru êm", "phong cách rap nhịp nhanh", "phong cách rock sôi nổi"];
const seriousActions = [
  "nói chuyện thì thầm bí mật",
  "dùng phong cách phát ngôn viên",
  "kèm theo nụ cười tươi thân thiện"
];

function generateDares(count: number) {
  const list: any[] = [];
  const set = new Set<string>();

  // Add baseline existing prompts first
  const baseDarePath = path.join(__dirname, "../data/seeds/prompts.dare.vi.json");
  if (fs.existsSync(baseDarePath)) {
    const existing = JSON.parse(fs.readFileSync(baseDarePath, "utf-8"));
    for (const item of existing) {
      if (!set.has(item.text.trim().toLowerCase())) {
        set.add(item.text.trim().toLowerCase());
        list.push(item);
      }
    }
  }

  let index = 1;
  while (list.length < count) {
    const template = dareTemplates[index % dareTemplates.length];
    const action = dareActions[index % dareActions.length];
    const duration = durations[index % durations.length];
    const prop = props[index % props.length];
    const creative_action = creativeActions[index % creativeActions.length];
    const target = targets[index % targets.length];
    const style = styles[index % styles.length];
    const character = characters[index % characters.length];
    const context = contexts[index % contexts.length];
    const physical_task = physicalTasks[index % physicalTasks.length];
    const persona = personas[index % personas.length];
    const pose = poses[index % poses.length];
    const message = messages[index % messages.length];
    const recipient = recipients[index % recipients.length];
    const song_style = songStyles[index % songStyles.length];
    const serious_action = seriousActions[index % seriousActions.length];

    const text = template
      .replace("{action}", action)
      .replace("{duration}", duration)
      .replace("{prop}", prop)
      .replace("{creative_action}", creative_action)
      .replace("{target}", target)
      .replace("{style}", style)
      .replace("{character}", character)
      .replace("{context}", context)
      .replace("{physical_task}", physical_task)
      .replace("{persona}", persona)
      .replace("{pose}", pose)
      .replace("{message}", message)
      .replace("{recipient}", recipient)
      .replace("{song_style}", song_style)
      .replace("{serious_action}", serious_action) + ` (#${index})`;

    const norm = text.trim().toLowerCase();
    if (!set.has(norm)) {
      set.add(norm);

      const age = index % 12 === 0 ? "AGE_18_PLUS" : index % 4 === 0 ? "AGE_16_PLUS" : "AGE_13_PLUS";
      const diff = index % 7 === 0 ? "HARD" : index % 5 === 0 ? "BOLD" : index % 3 === 0 ? "MEDIUM" : "EASY";
      const cat = categories[index % categories.length];
      const aud = audiences[index % audiences.length];

      list.push({
        type: "DARE",
        text,
        difficulty: diff,
        minimumAge: age,
        categories: [cat],
        audiences: [aud],
        requiresProps: template.includes("{prop}"),
        requiresPhone: template.includes("tin nhắn") || template.includes("điện thoại"),
        requiresMovement: template.includes("nhảy") || template.includes("tập") || template.includes("bắt chước"),
        requiresAnotherPlayer: template.includes("{target}") || template.includes("cả nhóm"),
        requiresPhysicalContact: template.includes("chạm") || template.includes("nắm tay"),
      });
    }
    index++;
  }

  return list;
}

function main() {
  console.log("🚀 Generating 500 Truths and 500 Dares...");
  const truths = generateTruths(500);
  const dares = generateDares(500);

  const truthPath = path.join(__dirname, "../data/seeds/prompts.truth.vi.json");
  const darePath = path.join(__dirname, "../data/seeds/prompts.dare.vi.json");

  fs.writeFileSync(truthPath, JSON.stringify(truths, null, 2), "utf-8");
  fs.writeFileSync(darePath, JSON.stringify(dares, null, 2), "utf-8");

  console.log(`✅ Saved ${truths.length} Truths to ${truthPath}`);
  console.log(`✅ Saved ${dares.length} Dares to ${darePath}`);
}

main();

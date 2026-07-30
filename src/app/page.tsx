import Link from "next/link";
import { prompts } from "@/data/prompts";
import { LandingResume } from "@/features/game/components/LandingResume";

const features = [
  { emoji: "🧊", title: "Phá băng cực nhanh", description: "Một câu hỏi đúng lúc có thể khiến cả nhóm bắt chuyện và cười cùng nhau." },
  { emoji: "🤫", title: "Chọn Thật", description: "Trả lời thành thật một câu hỏi và để mọi người hiểu bạn thêm một chút." },
  { emoji: "😈", title: "Chọn Thách", description: "Thực hiện một thử thách vui nhộn và biến lượt chơi thành khoảnh khắc đáng nhớ." },
  { emoji: "💛", title: "Tôn trọng giới hạn", description: "Ai cũng có quyền bỏ qua câu hỏi hoặc thử thách khiến mình không thoải mái." },
];

const steps = [
  { title: "Tập hợp nhóm bạn", description: "Chơi cùng bạn bè, gia đình hoặc bất kỳ nhóm nào muốn có thêm tiếng cười." },
  { title: "Chọn người chơi", description: "Trò chơi lần lượt gọi tên từng người để không ai bị bỏ quên." },
  { title: "Thật hay Thách?", description: "Trả lời thành thật hoặc nhận một thử thách bất ngờ." },
  { title: "Cười và chơi tiếp", description: "Hoàn thành lượt chơi, ghi điểm và chuyển sang người tiếp theo." },
];

export default function HomePage() {
  const truthPreview = prompts.find((prompt) => prompt.type === "TRUTH" && prompt.minimumAge === 13 && !prompt.isPrivate && !prompt.isSensitive);
  const darePreview = prompts.find((prompt) => prompt.type === "DARE" && prompt.minimumAge === 13 && !prompt.isPrivate && !prompt.isSensitive);

  return (
    <>
      <section className="hero-section">
        <div className="shell hero-grid">
          <span className="floating-emoji emoji-confetti" aria-hidden="true">🎉</span>
          <span className="floating-emoji emoji-sparkles" aria-hidden="true">✨</span>
          <span className="floating-emoji emoji-dice" aria-hidden="true">🎲</span>
          <span className="floating-emoji emoji-fire" aria-hidden="true">🔥</span>

          <div className="hero-copy">
            <p className="eyebrow">TRUTH OR DARE — BẮT NHỊP CUỘC VUI</p>
            <h1>Một thiết bị. Cả nhóm cùng chơi.</h1>
            <p className="hero-lede">Chọn Thật để chia sẻ một điều bất ngờ, hoặc chọn Thách để khuấy động cả căn phòng. Một trò chơi đơn giản để mọi người gần nhau hơn.</p>
            <div className="hero-actions">
              <Link href="/play" prefetch={false} className="button button-primary button-party">Bắt đầu chơi <span aria-hidden="true">🎉</span></Link>
              <Link href="/guide" prefetch={false} className="button button-secondary">Xem luật chơi</Link>
            </div>
            <LandingResume />
            <div className="hero-stickers" aria-hidden="true">
              <span className="sticker sticker-yellow">KHÔNG PHÁN XÉT</span>
              <span className="sticker sticker-pink">CHƠI LÀ VUI</span>
            </div>
          </div>

          <div className="prompt-preview" aria-label="Xem trước câu hỏi trong trò chơi">
            <article className="preview-card preview-truth">
              <span className="preview-type">THẬT <span aria-hidden="true">🤫</span></span>
              <p>{truthPreview?.text}</p>
              <span className="preview-sticker" aria-hidden="true">YOUR TURN!</span>
            </article>
            <article className="preview-card preview-dare">
              <span className="preview-type">THÁCH <span aria-hidden="true">😈</span></span>
              <p>{darePreview?.text}</p>
              <span className="preview-sticker" aria-hidden="true">DÁM THỬ KHÔNG?</span>
            </article>
          </div>
        </div>
      </section>

      <section className="shell feature-section" aria-labelledby="feature-heading">
        <div className="section-heading">
          <p className="section-kicker">VÌ SAO CUỘC VUI BẮT ĐẦU Ở ĐÂY?</p>
          <h2 id="feature-heading">Một lựa chọn nhỏ, cả nhóm có chuyện để nhớ.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className={`feature-card feature-card-${index + 1}`} key={feature.title}>
              <span className="feature-emoji" aria-hidden="true">{feature.emoji}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-to-section" aria-labelledby="how-to-heading">
        <span className="how-to-decoration how-to-chat" aria-hidden="true">💬</span>
        <span className="how-to-decoration how-to-sparkle" aria-hidden="true">✨</span>
        <div className="shell how-to-inner">
          <div className="how-to-copy">
            <span className="sticker sticker-purple" aria-hidden="true">YOUR TURN!</span>
            <h2 id="how-to-heading">Truth or Dare chơi như thế nào?</h2>
            <p>Luật chơi rất đơn giản. Mỗi lượt, một người chọn Thật hoặc Thách, sau đó trả lời câu hỏi hoặc hoàn thành thử thách được đưa ra.</p>
          </div>
          <ol className="step-grid">
            {steps.map((step, index) => (
              <li className={`step-card step-card-${index + 1}`} key={step.title}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

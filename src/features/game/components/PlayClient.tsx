"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { audienceLabels, categoryLabels } from "@/data/prompts";
import { choosePrompt, chooseSpecificPrompt, createGameState, endGame, finishTurn, preparePromptPool, replayGame, replaceCurrentPrompt, shufflePlayerOrder, validatePlayerNames } from "@/features/game/domain/gameEngine";
import type { Audience, Category, Difficulty, GameFilters, GameState, PromptType, SelectionMode, StaticPrompt } from "@/features/game/domain/types";
import { clearGameState, clearHiddenPromptIds, loadGameState, loadHiddenPromptIds, saveGameState, saveHiddenPromptIds } from "@/features/game/persistence/localGameStorage";
import { WheelModal, type WheelItem } from "./WheelModal";

const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: "EASY", label: "Nhẹ nhàng" },
  { value: "MEDIUM", label: "Vừa sức" },
  { value: "BOLD", label: "Táo bạo" },
  { value: "HARD", label: "Khó" },
];
const PROMPT_TYPE_LABELS: Record<PromptType, string> = { TRUTH: "THẬT", DARE: "THÁCH" };
const AUDIENCES = Object.keys(audienceLabels) as Audience[];
const CATEGORIES = Object.keys(categoryLabels) as Category[];
type SafetyKey = "allowProps" | "allowPhone" | "allowInternet" | "allowMovement" | "allowPhysicalContact" | "allowPrivate" | "allowSensitive";
const SAFETY_OPTIONS: Array<{ key: SafetyKey; label: string; help: string }> = [
  { key: "allowProps", label: "Đạo cụ", help: "Giấy, bút, sách hoặc đồ vật an toàn." },
  { key: "allowPhone", label: "Điện thoại", help: "Cho phép câu cần dùng điện thoại." },
  { key: "allowInternet", label: "Internet", help: "Cho phép câu cần kết nối mạng." },
  { key: "allowMovement", label: "Vận động nhẹ", help: "Động tác tại chỗ, luôn có quyền dừng." },
  { key: "allowPhysicalContact", label: "Tiếp xúc cơ thể", help: "Chỉ khi từng người liên quan đồng ý." },
  { key: "allowPrivate", label: "Nội dung riêng tư", help: "Câu hỏi cá nhân nhưng không yêu cầu dữ liệu nhạy cảm." },
  { key: "allowSensitive", label: "Chủ đề nhạy cảm", help: "Câu hỏi cần cân nhắc cảm xúc của người chơi." },
];
const DEFAULT_FILTERS: GameFilters = {
  minimumAge: 13,
  allowedDifficulties: ["EASY", "MEDIUM"],
  audiences: ["friends", "family", "coworkers", "couples"],
  categories: [],
  allowProps: false,
  allowPhone: false,
  allowInternet: false,
  allowMovement: false,
  allowPhysicalContact: false,
  allowPrivate: false,
  allowSensitive: false,
};
const TYPE_WHEEL_ITEMS: WheelItem[] = [
  { id: "TRUTH", label: "THẬT", tone: "truth" },
  { id: "DARE", label: "THÁCH", tone: "dare" },
];

function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTIES.find((item) => item.value === difficulty)?.label ?? difficulty;
}

function getPromptFlagLabels(prompt: StaticPrompt): string[] {
  return [
    prompt.requiresProps && "Cần đạo cụ",
    prompt.requiresPhone && "Cần điện thoại",
    prompt.requiresInternet && "Cần Internet",
    prompt.requiresMovement && "Có vận động",
    prompt.requiresPhysicalContact && "Cần đồng thuận tiếp xúc",
    prompt.requiresAnotherPlayer && "Cần người cùng chơi",
    prompt.isPrivate && "Riêng tư",
    prompt.isSensitive && "Nhạy cảm",
  ].filter((label): label is string => Boolean(label));
}

function PromptFlags({ prompt }: { prompt: StaticPrompt }) {
  const labels = getPromptFlagLabels(prompt);
  return <p className="prompt-flags">{labels.length > 0 ? labels.join(" / ") : "Không cần đạo cụ hoặc quyền bổ sung"}</p>;
}

function PromptResultDetails({ prompt }: { prompt: StaticPrompt }) {
  const labels = getPromptFlagLabels(prompt);
  return (
    <div className="wheel-result-prompt">
      <p className={`wheel-result-badge ${prompt.type === "TRUTH" ? "truth" : "dare"}`}>{PROMPT_TYPE_LABELS[prompt.type]}</p>
      <p className="wheel-result-text">{prompt.text}</p>
      <dl className="wheel-result-meta">
        <div><dt>Mức độ</dt><dd>{difficultyLabel(prompt.difficulty)}</dd></div>
        <div><dt>Tuổi tối thiểu</dt><dd>{prompt.minimumAge}+</dd></div>
      </dl>
      <p className="prompt-flags">{labels.length > 0 ? labels.join(" / ") : "Không cần đạo cụ hoặc quyền bổ sung"}</p>
    </div>
  );
}

export function PlayClient() {
  const [hydrated, setHydrated] = useState(false);
  const [savedGame, setSavedGame] = useState<GameState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [hiddenPromptIds, setHiddenPromptIds] = useState<Set<string>>(new Set());
  const [players, setPlayers] = useState(["", ""]);
  const [totalRounds, setTotalRounds] = useState(3);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("ROUND_ROBIN");
  const [filters, setFilters] = useState<GameFilters>(DEFAULT_FILTERS);
  const [pendingPromptType, setPendingPromptType] = useState<PromptType | null>(null);
  const [typeWheelOpen, setTypeWheelOpen] = useState(false);
  const [questionWheelOpen, setQuestionWheelOpen] = useState(false);
  const [questionWheelType, setQuestionWheelType] = useState<PromptType | null>(null);
  const [questionWheelPool, setQuestionWheelPool] = useState<StaticPrompt[]>([]);
  const [questionWheelPoolReset, setQuestionWheelPoolReset] = useState(false);
  const [questionWheelExcludedIds, setQuestionWheelExcludedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canShufflePlayers = validatePlayerNames(players).valid;

  const questionWheelItems = useMemo<WheelItem[]>(() => questionWheelPool.map((prompt, index) => ({
    id: prompt.id,
    label: questionWheelPool.length <= 24 ? `${PROMPT_TYPE_LABELS[prompt.type]} ${index + 1}` : String(index + 1),
    tone: prompt.type === "TRUTH" ? "truth" : "dare",
  })), [questionWheelPool]);

  useEffect(() => {
    setSavedGame(loadGameState());
    setHiddenPromptIds(loadHiddenPromptIds());
    setHydrated(true);
  }, []);

  const commitGame = (next: GameState) => {
    setGame(next);
    setSavedGame(next);
    saveGameState(next);
  };

  const closeQuestionWheel = () => {
    setQuestionWheelOpen(false);
    setQuestionWheelType(null);
    setQuestionWheelPool([]);
    setQuestionWheelPoolReset(false);
    setQuestionWheelExcludedIds([]);
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    setFilters((current) => {
      const selected = current.allowedDifficulties.includes(difficulty);
      if (selected && current.allowedDifficulties.length === 1) {
        setError("Phải giữ lại ít nhất một mức độ.");
        return current;
      }
      setError(null);
      return { ...current, allowedDifficulties: selected ? current.allowedDifficulties.filter((item) => item !== difficulty) : [...current.allowedDifficulties, difficulty] };
    });
  };

  const toggleAudience = (audience: Audience) => {
    setFilters((current) => {
      const selected = current.audiences.includes(audience);
      if (selected && current.audiences.length === 1) {
        setError("Phải giữ lại ít nhất một nhóm người chơi.");
        return current;
      }
      setError(null);
      return { ...current, audiences: selected ? current.audiences.filter((item) => item !== audience) : [...current.audiences, audience] };
    });
  };

  const toggleCategory = (category: Category) => setFilters((current) => ({
    ...current,
    categories: current.categories.includes(category) ? current.categories.filter((item) => item !== category) : [...current.categories, category],
  }));

  const startGame = () => {
    const validation = validatePlayerNames(players);
    if (!validation.valid) {
      setError(validation.error ?? "Danh sách người chơi không hợp lệ.");
      return;
    }
    try {
      const next = createGameState(validation.normalizedNames, totalRounds, selectionMode, filters);
      setError(null);
      setNotice(null);
      setPendingPromptType(null);
      commitGame(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể bắt đầu ván chơi.");
    }
  };

  const shuffleSetupPlayers = () => {
    setPlayers((current) => shufflePlayerOrder(current));
    setError(null);
    setNotice("Đã xáo trộn thứ tự người chơi.");
  };

  const selectType = (type: PromptType) => {
    setPendingPromptType(type);
    setError(null);
    setNotice(null);
  };

  const drawPromptNow = () => {
    if (!game || !pendingPromptType) return;
    const result = choosePrompt(game, pendingPromptType, hiddenPromptIds);
    setNotice(result.message ?? null);
    if (result.prompt) {
      setPendingPromptType(null);
      commitGame(result.state);
    } else {
      setError(result.message ?? "Không còn câu phù hợp.");
    }
  };

  const openQuestionWheel = (type: PromptType, excludedPromptIds: ReadonlySet<string> = new Set()) => {
    if (!game) return;
    const prepared = preparePromptPool(game, type, hiddenPromptIds, excludedPromptIds);
    if (prepared.prompts.length === 0) {
      setError(prepared.message ?? "Không còn câu phù hợp với bộ lọc hiện tại. Hãy điều chỉnh bộ lọc hoặc khôi phục câu đã ẩn.");
      setNotice(null);
      return;
    }
    setError(null);
    setNotice(prepared.message ?? null);
    setQuestionWheelType(type);
    setQuestionWheelPool(prepared.prompts);
    setQuestionWheelPoolReset(prepared.poolReset);
    setQuestionWheelExcludedIds([...excludedPromptIds]);
    setQuestionWheelOpen(true);
  };

  const confirmWheelPrompt = (promptId: string) => {
    if (!game || !questionWheelType) return;
    const result = chooseSpecificPrompt(game, questionWheelType, promptId, hiddenPromptIds, questionWheelPoolReset, new Set(questionWheelExcludedIds));
    setNotice(result.message ?? null);
    if (result.prompt) {
      setPendingPromptType(null);
      closeQuestionWheel();
      commitGame(result.state);
    } else {
      setError(result.message ?? "Không thể chọn câu này.");
    }
  };

  const replacePrompt = () => {
    if (!game) return;
    const result = replaceCurrentPrompt(game, hiddenPromptIds);
    setNotice(result.message ?? null);
    if (result.prompt) commitGame(result.state);
    else setError(result.message ?? "Không còn câu khác phù hợp.");
  };

  const completeTurn = (outcome: "COMPLETED" | "SKIPPED") => {
    if (!game || typeWheelOpen || questionWheelOpen) return;
    if (outcome === "COMPLETED" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void confetti({ particleCount: 45, spread: 60, origin: { y: 0.72 }, disableForReducedMotion: true });
    }
    setError(null);
    setNotice(null);
    setPendingPromptType(null);
    closeQuestionWheel();
    commitGame(finishTurn(game, outcome));
  };

  const hideCurrentPrompt = () => {
    if (!game?.currentPrompt) return;
    const nextHidden = new Set(hiddenPromptIds).add(game.currentPrompt.id);
    setHiddenPromptIds(nextHidden);
    saveHiddenPromptIds(nextHidden);
    const result = replaceCurrentPrompt(game, nextHidden);
    if (result.prompt) {
      commitGame(result.state);
      setNotice("Câu vừa rồi đã được ẩn trên trình duyệt này.");
    } else {
      const withoutPrompt = { ...game, currentPrompt: null, updatedAt: new Date().toISOString() };
      commitGame(withoutPrompt);
      setNotice("Câu đã được ẩn. Không còn câu thay thế phù hợp với bộ lọc hiện tại.");
    }
  };

  const resetHidden = () => {
    clearHiddenPromptIds();
    setHiddenPromptIds(new Set());
    setNotice("Đã khôi phục toàn bộ câu từng ẩn trên thiết bị này.");
  };

  const finishGame = () => {
    if (!game || typeWheelOpen || questionWheelOpen) return;
    if (window.confirm("Kết thúc ván chơi và xem kết quả hiện tại?")) commitGame(endGame(game));
  };

  const deleteSavedGame = () => {
    clearGameState();
    setSavedGame(null);
    setGame(null);
    setPendingPromptType(null);
    setTypeWheelOpen(false);
    closeQuestionWheel();
    setNotice("Đã xóa ván chơi lưu trên thiết bị.");
  };

  const renderQuestionResult = (item: WheelItem) => {
    const prompt = questionWheelPool.find((candidate) => candidate.id === item.id);
    return prompt ? <PromptResultDetails prompt={prompt} /> : <p>Không tìm thấy câu đã chọn.</p>;
  };

  if (!hydrated) {
    return <div className="page-shell"><div className="panel" aria-live="polite">Đang đọc dữ liệu trên thiết bị...</div></div>;
  }

  if (!game) {
    return (
      <div className="page-shell">
        <h1 className="page-title">Thiết lập ván chơi</h1>
        <p className="page-lede">Nhập 2-10 người, chọn số vòng và giữ các quyền bổ sung ở trạng thái tắt nếu nhóm chưa đồng ý.</p>
        <div className="stack">
          {savedGame && (
            <section className="panel stack" aria-label="Ván chơi đã lưu">
              <div><h2 className="section-title">Có một ván chơi trên thiết bị này</h2><p className="muted">{savedGame.players.length} người, vòng {savedGame.currentRound}/{savedGame.totalRounds}.</p></div>
              <div className="setup-actions">
                <button type="button" className="button button-primary" onClick={() => setGame(savedGame)}>Tiếp tục ván chơi</button>
                <button type="button" className="button button-danger" onClick={deleteSavedGame}>Xóa ván đã lưu</button>
              </div>
            </section>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          {notice && <p className="notice" aria-live="polite">{notice}</p>}
          <section className="panel stack">
            <div>
              <h2 className="section-title">Người chơi</h2>
              <p className="fine-print">Tên dài tối đa 24 ký tự và không trùng sau khi bỏ khoảng trắng, không phân biệt hoa thường.</p>
            </div>
            <div className="players-list">
              {players.map((name, index) => (
                <div className="player-row" key={index}>
                  <span className="player-number" aria-hidden="true">{index + 1}</span>
                  <div className="field">
                    <label htmlFor={`player-${index}`}>Tên người chơi {index + 1}</label>
                    <input id={`player-${index}`} type="text" maxLength={24} autoComplete="off" value={name} onChange={(event) => setPlayers((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
                  </div>
                  <button type="button" className="icon-button" aria-label={`Xóa người chơi ${index + 1}`} disabled={players.length <= 2} onClick={() => setPlayers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Xóa</button>
                </div>
              ))}
            </div>
            <div className="player-list-actions">
              <button type="button" className="button button-secondary button-small" disabled={players.length >= 10} onClick={() => setPlayers((current) => [...current, ""])}>Thêm người chơi</button>
              <button type="button" className="button button-secondary button-small" disabled={!canShufflePlayers} aria-describedby="shuffle-player-help" onClick={shuffleSetupPlayers}>Xáo trộn thứ tự</button>
            </div>
            <p className="fine-print" id="shuffle-player-help">Nhập đủ tên hợp lệ để đổi ngẫu nhiên thứ tự lượt đầu tiên.</p>
          </section>

          <section className="panel stack">
            <h2 className="section-title">Nhịp chơi</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rounds">Số vòng mỗi người</label>
                <select id="rounds" value={totalRounds} onChange={(event) => setTotalRounds(Number(event.target.value))}>
                  {[1, 3, 5, 10, 20].map((rounds) => <option key={rounds} value={rounds}>{rounds} vòng</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="selection-mode">Cách chọn lượt</label>
                <select id="selection-mode" value={selectionMode} onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}>
                  <option value="ROUND_ROBIN">Lần lượt theo vòng</option>
                  <option value="BALANCED_RANDOM">Ngẫu nhiên cân bằng</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="minimum-age">Độ tuổi nhỏ nhất</label>
                <select id="minimum-age" value={filters.minimumAge} onChange={(event) => setFilters((current) => ({ ...current, minimumAge: Number(event.target.value) as 13 | 16 | 18 }))}>
                  <option value={13}>13+</option><option value={16}>16+</option><option value={18}>18+</option>
                </select>
              </div>
            </div>
            <fieldset className="field">
              <legend>Mức độ</legend>
              <div className="choice-grid">
                {DIFFICULTIES.map((difficulty) => <label className="check-choice" key={difficulty.value}><input type="checkbox" checked={filters.allowedDifficulties.includes(difficulty.value)} onChange={() => toggleDifficulty(difficulty.value)} /><span>{difficulty.label}</span></label>)}
              </div>
            </fieldset>

            <details className="filter-details">
              <summary>Bộ lọc nội dung và an toàn</summary>
              <div className="filter-content">
                <fieldset className="field">
                  <legend>Nhóm người chơi</legend>
                  <div className="choice-grid">{AUDIENCES.map((audience) => <label className="check-choice" key={audience}><input type="checkbox" checked={filters.audiences.includes(audience)} onChange={() => toggleAudience(audience)} /><span>{audienceLabels[audience]}</span></label>)}</div>
                </fieldset>
                <fieldset className="field">
                  <legend>Chủ đề, để trống nghĩa là chọn tất cả</legend>
                  <div className="choice-grid">{CATEGORIES.map((category) => <label className="check-choice" key={category}><input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggleCategory(category)} /><span>{categoryLabels[category]}</span></label>)}</div>
                </fieldset>
                <fieldset className="field">
                  <legend>Quyền bổ sung, mặc định tắt</legend>
                  <div className="choice-grid">{SAFETY_OPTIONS.map((option) => <label className="check-choice" key={option.key}><input type="checkbox" checked={filters[option.key]} onChange={(event) => setFilters((current) => ({ ...current, [option.key]: event.target.checked }))} /><span><strong>{option.label}</strong><small className="field-help">{option.help}</small></span></label>)}</div>
                </fieldset>
              </div>
            </details>
            <div className="setup-actions">
              <button type="button" className="button button-primary" onClick={startGame}>Bắt đầu chơi</button>
              {hiddenPromptIds.size > 0 && <button type="button" className="button button-secondary" onClick={resetHidden}>Khôi phục {hiddenPromptIds.size} câu đã ẩn</button>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (game.gameStatus === "COMPLETED") {
    const ranked = [...game.players].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "vi"));
    return (
      <div className="page-shell">
        <section className="panel">
          <header className="result-header"><p className="eyebrow">Kết quả</p><h1>Ván chơi đã khép lại.</h1><p className="muted">{game.completedTurns} lượt đã được ghi nhận trên thiết bị này.</p></header>
          <ol className="leaderboard">{ranked.map((player, index) => <li key={player.id}><span className="rank">{index + 1}</span><div><strong>{player.name}</strong><div className="fine-print">{player.completedTruths} Thật / {player.completedDares} Thách / {player.skipped} bỏ lượt</div></div><span className="score">{player.score} điểm</span></li>)}</ol>
          <div className="result-actions">
            <button type="button" className="button button-primary" onClick={() => commitGame(replayGame(game))}>Chơi lại cùng nhóm</button>
            <button type="button" className="button button-secondary" onClick={deleteSavedGame}>Tạo ván mới</button>
          </div>
        </section>
      </div>
    );
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  return (
    <div className="game-shell">
      <header className="game-header">
        <span className="round-label">Vòng {game.currentRound}/{game.totalRounds}</span>
        <button type="button" className="button button-danger button-small" onClick={finishGame} disabled={typeWheelOpen || questionWheelOpen}>Kết thúc</button>
      </header>
      <div className="current-player"><p>Lượt của</p><h1>{currentPlayer?.name}</h1></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="notice" aria-live="polite">{notice}</p>}

      {!game.currentPrompt && !pendingPromptType && (
        <div className="type-stage">
          <div className="type-grid">
            <button type="button" className="type-button type-truth" onClick={() => selectType("TRUTH")}><strong>THẬT</strong><span>Trả lời thành thật, hoàn thành được 1 điểm</span></button>
            <button type="button" className="type-button type-dare" onClick={() => selectType("DARE")}><strong>THÁCH</strong><span>Thực hiện thử thách, hoàn thành được 2 điểm</span></button>
          </div>
          <button type="button" className="button button-secondary wheel-open-button" onClick={() => setTypeWheelOpen(true)}>XOAY CHỌN THẬT / THÁCH 🎲</button>
        </div>
      )}

      {!game.currentPrompt && pendingPromptType && (
        <section className={`selected-type-stage ${pendingPromptType === "TRUTH" ? "truth" : "dare"}`} aria-label="Chọn cách rút câu">
          <p className="eyebrow">Bạn đã chọn</p>
          <h2>{PROMPT_TYPE_LABELS[pendingPromptType]}</h2>
          <p>{pendingPromptType === "TRUTH" ? "Sẵn sàng trả lời thật lòng chưa?" : "Đến lúc khuấy động căn phòng rồi đó!"}</p>
          <div className="selected-type-actions">
            <button type="button" className="button button-primary" onClick={drawPromptNow}>RÚT CÂU NGAY</button>
            <button type="button" className="button button-secondary" onClick={() => openQuestionWheel(pendingPromptType)}>XOAY ĐỂ THÊM THÚ VỊ 🔥</button>
            <button type="button" className="button button-secondary" onClick={() => setPendingPromptType(null)}>Chọn lại</button>
          </div>
        </section>
      )}

      {game.currentPrompt && (
        <div className="prompt-stage">
          <article className={`prompt-card ${game.currentPrompt.type === "TRUTH" ? "truth" : "dare"}`}>
            <div className="prompt-meta"><span>{PROMPT_TYPE_LABELS[game.currentPrompt.type]}</span><span>{difficultyLabel(game.currentPrompt.difficulty)}</span><span>{game.currentPrompt.minimumAge}+</span></div>
            <p className="prompt-text">{game.currentPrompt.text}</p>
            <PromptFlags prompt={game.currentPrompt} />
          </article>
          <div className="prompt-actions">
            <button type="button" className="button button-primary complete" onClick={() => completeTurn("COMPLETED")}>Đã hoàn thành +{game.currentPrompt.type === "TRUTH" ? 1 : 2} điểm</button>
            <button type="button" className="button button-secondary" onClick={replacePrompt}>Đổi câu khác</button>
            <button type="button" className="button button-secondary" onClick={() => openQuestionWheel(game.currentPrompt!.type, new Set([game.currentPrompt!.id]))}>XOAY LẠI 🔥</button>
            <button type="button" className="button button-secondary" onClick={() => completeTurn("SKIPPED")}>Bỏ lượt</button>
          </div>
          <div className="local-hide">
            <button type="button" onClick={hideCurrentPrompt}>Ẩn câu này trên thiết bị</button>
            <span className="fine-print">Câu hỏi sẽ chỉ được ẩn trên trình duyệt này.</span>
          </div>
        </div>
      )}

      <WheelModal
        isOpen={typeWheelOpen}
        title="Vòng quay chọn THẬT / THÁCH"
        description="Vòng quay gồm hai lựa chọn: THẬT và THÁCH."
        countLabel="Có 2 lựa chọn đang tham gia vòng quay."
        items={TYPE_WHEEL_ITEMS}
        onClose={() => setTypeWheelOpen(false)}
        onResult={(id) => { setPendingPromptType(id === "DARE" ? "DARE" : "TRUTH"); setTypeWheelOpen(false); }}
        autoResolveResult
      />

      <WheelModal
        isOpen={questionWheelOpen}
        title={questionWheelType ? `Vòng quay câu ${PROMPT_TYPE_LABELS[questionWheelType]}` : "Vòng quay câu hỏi"}
        description={`Vòng quay gồm ${questionWheelPool.length} câu ${questionWheelType ? PROMPT_TYPE_LABELS[questionWheelType] : "hợp lệ"}.`}
        countLabel={`Có ${questionWheelPool.length} câu đang tham gia vòng quay.`}
        items={questionWheelItems}
        onClose={closeQuestionWheel}
        onConfirmResult={confirmWheelPrompt}
        renderResult={renderQuestionResult}
        confirmLabel="CHƠI CÂU NÀY"
      />
    </div>
  );
}

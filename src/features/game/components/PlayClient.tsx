"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPromptText } from "@/data/prompts";
import { choosePrompt, chooseSpecificPrompt, createGameState, endGame, finishTurn, preparePromptPool, replayGame, replaceCurrentPrompt, shufflePlayerOrder, validatePlayerNames } from "@/features/game/domain/gameEngine";
import type { Audience, Category, Difficulty, GameFilters, GameState, PromptType, SelectionMode, StaticPrompt } from "@/features/game/domain/types";
import { clearGameState, clearHiddenPromptIds, loadGameState, loadHiddenPromptIds, saveGameState, saveHiddenPromptIds } from "@/features/game/persistence/localGameStorage";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizeGameMessage } from "@/features/i18n/translations";
import { WheelModal, type WheelItem } from "./WheelModal";

type SafetyKey = "allowProps" | "allowPhone" | "allowInternet" | "allowMovement" | "allowPhysicalContact" | "allowPrivate" | "allowSensitive";
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
const PRESET_ROUND_OPTIONS = [1, 3, 5, 10, 20] as const;
type RoundOption = `${(typeof PRESET_ROUND_OPTIONS)[number]}` | "INFINITE" | "CUSTOM";

function getPromptFlagLabels(prompt: StaticPrompt, flags: ReturnType<typeof useI18n>["copy"]["game"]["flags"]): string[] {
  return [
    prompt.requiresProps && flags.props,
    prompt.requiresPhone && flags.phone,
    prompt.requiresInternet && flags.internet,
    prompt.requiresMovement && flags.movement,
    prompt.requiresPhysicalContact && flags.contact,
    prompt.requiresAnotherPlayer && flags.another,
    prompt.isPrivate && flags.private,
    prompt.isSensitive && flags.sensitive,
  ].filter((label): label is string => Boolean(label));
}

function PromptFlags({ prompt }: { prompt: StaticPrompt }) {
  const { copy } = useI18n();
  const labels = getPromptFlagLabels(prompt, copy.game.flags);
  return <p className="prompt-flags">{labels.length > 0 ? labels.join(" / ") : copy.game.flags.none}</p>;
}

function PromptResultDetails({ prompt }: { prompt: StaticPrompt }) {
  const { language, copy } = useI18n();
  const labels = getPromptFlagLabels(prompt, copy.game.flags);
  return (
    <div className="wheel-result-prompt">
      <p className={`wheel-result-badge ${prompt.type === "TRUTH" ? "truth" : "dare"}`}>{copy.game.promptTypes[prompt.type]}</p>
      <p className="wheel-result-text">{getPromptText(prompt, language)}</p>
      <dl className="wheel-result-meta">
        <div><dt>{copy.game.metaDifficulty}</dt><dd>{copy.game.difficulties[prompt.difficulty]}</dd></div>
        <div><dt>{copy.game.metaAge}</dt><dd>{prompt.minimumAge}+</dd></div>
      </dl>
      <p className="prompt-flags">{labels.length > 0 ? labels.join(" / ") : copy.game.flags.none}</p>
    </div>
  );
}

export function PlayClient() {
  const { language, copy } = useI18n();
  const gameCopy = copy.game;
  const difficulties = Object.entries(gameCopy.difficulties).map(([value, label]) => ({ value: value as Difficulty, label }));
  const audiences = Object.keys(gameCopy.audiences) as Audience[];
  const categories = Object.keys(gameCopy.categories) as Category[];
  const safetyOptions = gameCopy.safetyOptions as Array<{ key: SafetyKey; label: string; help: string }>;
  const typeWheelItems: WheelItem[] = [
    { id: "TRUTH", label: gameCopy.promptTypes.TRUTH, tone: "truth" },
    { id: "DARE", label: gameCopy.promptTypes.DARE, tone: "dare" },
  ];
  const [hydrated, setHydrated] = useState(false);
  const [savedGame, setSavedGame] = useState<GameState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [hiddenPromptIds, setHiddenPromptIds] = useState<Set<string>>(new Set());
  const [players, setPlayers] = useState(["", ""]);
  const [roundOption, setRoundOption] = useState<RoundOption>("3");
  const [customRounds, setCustomRounds] = useState(25);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("ROUND_ROBIN");
  const [filters, setFilters] = useState<GameFilters>(DEFAULT_FILTERS);
  const [pendingPromptType, setPendingPromptType] = useState<PromptType | null>(null);
  const [typeWheelOpen, setTypeWheelOpen] = useState(false);
  const [questionWheelOpen, setQuestionWheelOpen] = useState(false);
  const [questionWheelType, setQuestionWheelType] = useState<PromptType | null>(null);
  const [questionWheelPool, setQuestionWheelPool] = useState<StaticPrompt[]>([]);
  const [questionWheelPoolReset, setQuestionWheelPoolReset] = useState(false);
  const [questionWheelExcludedIds, setQuestionWheelExcludedIds] = useState<string[]>([]);
  const [isReplacingPrompt, setIsReplacingPrompt] = useState(false);
  const [shuffledPrompt, setShuffledPrompt] = useState<StaticPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const promptCardRef = useRef<HTMLElement>(null);
  const replaceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const replaceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canShufflePlayers = validatePlayerNames(players).valid;

  const questionWheelItems = useMemo<WheelItem[]>(() => questionWheelPool.map((prompt, index) => ({
    id: prompt.id,
    label: questionWheelPool.length <= 24 ? `${gameCopy.promptTypes[prompt.type]} ${index + 1}` : String(index + 1),
    tone: prompt.type === "TRUTH" ? "truth" : "dare",
  })), [gameCopy.promptTypes, questionWheelPool]);

  useEffect(() => {
    setSavedGame(loadGameState());
    setHiddenPromptIds(loadHiddenPromptIds());
    setHydrated(true);
  }, []);

  useEffect(() => () => {
    if (replaceIntervalRef.current) clearInterval(replaceIntervalRef.current);
    if (replaceTimeoutRef.current) clearTimeout(replaceTimeoutRef.current);
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
      const totalRounds = roundOption === "INFINITE" ? null : roundOption === "CUSTOM" ? customRounds : Number(roundOption);
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

  const firePromptConfetti = () => {
    const card = promptCardRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = card.getBoundingClientRect();
    const y = Math.min(0.9, Math.max(0.1, (bounds.top + bounds.height * 0.55) / window.innerHeight));
    const leftX = Math.min(0.95, Math.max(0.05, bounds.left / window.innerWidth));
    const rightX = Math.min(0.95, Math.max(0.05, bounds.right / window.innerWidth));
    const common = { particleCount: 75, spread: 58, startVelocity: 48, gravity: 0.9, scalar: 1.05, disableForReducedMotion: true } as const;
    void confetti({ ...common, angle: 58, origin: { x: leftX, y } });
    void confetti({ ...common, angle: 122, origin: { x: rightX, y } });
  };

  const replacePrompt = () => {
    if (!game?.currentPrompt || isReplacingPrompt) return;
    const result = replaceCurrentPrompt(game, hiddenPromptIds);
    setNotice(result.message ?? null);
    if (!result.prompt) {
      setError(result.message ?? "Không còn câu khác phù hợp.");
      return;
    }

    setError(null);
    const prepared = preparePromptPool(game, game.currentPrompt.type, hiddenPromptIds, new Set([game.currentPrompt.id]));
    const shufflePool = prepared.prompts.length > 0 ? prepared.prompts : [result.prompt];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 0 : 3000 + Math.floor(Math.random() * 1001);
    let cursor = Math.floor(Math.random() * shufflePool.length);

    setIsReplacingPrompt(true);
    setShuffledPrompt(shufflePool[cursor] ?? result.prompt);

    const finishReplacement = () => {
      if (replaceIntervalRef.current) clearInterval(replaceIntervalRef.current);
      replaceIntervalRef.current = null;
      replaceTimeoutRef.current = null;
      commitGame(result.state);
      setShuffledPrompt(null);
      setIsReplacingPrompt(false);
      requestAnimationFrame(firePromptConfetti);
    };

    if (duration === 0) {
      finishReplacement();
      return;
    }

    replaceIntervalRef.current = setInterval(() => {
      cursor = (cursor + 1 + Math.floor(Math.random() * Math.max(1, shufflePool.length - 1))) % shufflePool.length;
      setShuffledPrompt(shufflePool[cursor] ?? result.prompt);
    }, 110);
    replaceTimeoutRef.current = setTimeout(finishReplacement, duration);
  };

  const completeTurn = (outcome: "COMPLETED" | "SKIPPED") => {
    if (!game || typeWheelOpen || questionWheelOpen || isReplacingPrompt) return;
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
    if (!game?.currentPrompt || isReplacingPrompt) return;
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
    if (!game || typeWheelOpen || questionWheelOpen || isReplacingPrompt) return;
    if (window.confirm(gameCopy.finishConfirm)) commitGame(endGame(game));
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
    return prompt ? <PromptResultDetails prompt={prompt} /> : <p>{gameCopy.missingQuestion}</p>;
  };

  if (!hydrated) {
    return <div className="page-shell"><div className="panel" aria-live="polite">{gameCopy.loading}</div></div>;
  }

  if (!game) {
    return (
      <div className="page-shell">
        <h1 className="page-title">{gameCopy.setupTitle}</h1>
        <p className="page-lede">{gameCopy.setupLede}</p>
        <div className="stack">
          {savedGame && (
            <section className="panel stack" aria-label={gameCopy.savedAria}>
              <div><h2 className="section-title">{gameCopy.savedTitle}</h2><p className="muted">{savedGame.players.length} {gameCopy.people}, {gameCopy.roundLower} {savedGame.currentRound}{savedGame.totalRounds === null ? ` (${gameCopy.infiniteLower})` : `/${savedGame.totalRounds}`}.</p></div>
              <div className="setup-actions">
                <button type="button" className="button button-primary" onClick={() => setGame(savedGame)}>{gameCopy.continueGame}</button>
                <button type="button" className="button button-danger" onClick={deleteSavedGame}>{gameCopy.deleteSaved}</button>
              </div>
            </section>
          )}
          {error && <p className="error-message" role="alert">{localizeGameMessage(error, language)}</p>}
          {notice && <p className="notice" aria-live="polite">{localizeGameMessage(notice, language)}</p>}
          <section className="panel stack">
            <div>
              <h2 className="section-title">{gameCopy.playersTitle}</h2>
              <p className="fine-print">{gameCopy.playerHelp}</p>
            </div>
            <div className="players-list">
              {players.map((name, index) => (
                <div className="player-row" key={index}>
                  <span className="player-number" aria-hidden="true">{index + 1}</span>
                  <div className="field">
                    <label htmlFor={`player-${index}`}>{gameCopy.playerName} {index + 1}</label>
                    <input id={`player-${index}`} type="text" maxLength={24} autoComplete="off" value={name} onChange={(event) => setPlayers((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
                  </div>
                  <button type="button" className="icon-button" aria-label={`${gameCopy.removePlayer} ${index + 1}`} disabled={players.length <= 2} onClick={() => setPlayers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{gameCopy.remove}</button>
                </div>
              ))}
            </div>
            <div className="player-list-actions">
              <button type="button" className="button button-secondary button-small" disabled={players.length >= 10} onClick={() => setPlayers((current) => [...current, ""])}>{gameCopy.addPlayer}</button>
              <button type="button" className="button button-secondary button-small" disabled={!canShufflePlayers} aria-describedby="shuffle-player-help" onClick={shuffleSetupPlayers}>{gameCopy.shufflePlayers}</button>
            </div>
            <p className="fine-print" id="shuffle-player-help">{gameCopy.shuffleHelp}</p>
          </section>

          <section className="panel stack">
            <h2 className="section-title">{gameCopy.paceTitle}</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rounds">{gameCopy.roundsPerPlayer}</label>
                <select id="rounds" value={roundOption} onChange={(event) => setRoundOption(event.target.value as RoundOption)}>
                  {PRESET_ROUND_OPTIONS.map((rounds) => <option key={rounds} value={rounds}>{rounds} {gameCopy.roundsUnit}</option>)}
                  <option value="INFINITE">{gameCopy.infiniteRounds}</option>
                  <option value="CUSTOM">{gameCopy.customRounds}</option>
                </select>
              </div>
              {roundOption === "CUSTOM" && (
                <div className="field custom-rounds-field">
                  <label htmlFor="custom-rounds">{gameCopy.customRoundsLabel}</label>
                  <input
                    id="custom-rounds"
                    type="number"
                    min={1}
                    max={999}
                    inputMode="numeric"
                    value={customRounds}
                    onChange={(event) => setCustomRounds(Number(event.target.value))}
                    aria-describedby="custom-rounds-help"
                  />
                  <small className="field-help" id="custom-rounds-help">{gameCopy.customRoundsHelp}</small>
                </div>
              )}
              <div className="field">
                <label htmlFor="selection-mode">{gameCopy.selectionMode}</label>
                <select id="selection-mode" value={selectionMode} onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}>
                  <option value="ROUND_ROBIN">{gameCopy.roundRobin}</option>
                  <option value="BALANCED_RANDOM">{gameCopy.balancedRandom}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="minimum-age">{gameCopy.minimumAge}</label>
                <select id="minimum-age" value={filters.minimumAge} onChange={(event) => setFilters((current) => ({ ...current, minimumAge: Number(event.target.value) as 13 | 16 | 18 }))}>
                  <option value={13}>13+</option><option value={16}>16+</option><option value={18}>18+</option>
                </select>
              </div>
            </div>
            <fieldset className="field">
              <legend>{gameCopy.difficulty}</legend>
              <div className="choice-grid">
                {difficulties.map((difficulty) => <label className="check-choice" key={difficulty.value}><input type="checkbox" checked={filters.allowedDifficulties.includes(difficulty.value)} onChange={() => toggleDifficulty(difficulty.value)} /><span>{difficulty.label}</span></label>)}
              </div>
            </fieldset>

            <details className="filter-details">
              <summary>{gameCopy.filtersSummary}</summary>
              <div className="filter-content">
                <fieldset className="field">
                  <legend>{gameCopy.audienceLegend}</legend>
                  <div className="choice-grid">{audiences.map((audience) => <label className="check-choice" key={audience}><input type="checkbox" checked={filters.audiences.includes(audience)} onChange={() => toggleAudience(audience)} /><span>{gameCopy.audiences[audience]}</span></label>)}</div>
                </fieldset>
                <fieldset className="field">
                  <legend>{gameCopy.categoryLegend}</legend>
                  <div className="choice-grid">{categories.map((category) => <label className="check-choice" key={category}><input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggleCategory(category)} /><span>{gameCopy.categories[category]}</span></label>)}</div>
                </fieldset>
                <fieldset className="field">
                  <legend>{gameCopy.permissionsLegend}</legend>
                  <div className="choice-grid">{safetyOptions.map((option) => <label className="check-choice" key={option.key}><input type="checkbox" checked={filters[option.key]} onChange={(event) => setFilters((current) => ({ ...current, [option.key]: event.target.checked }))} /><span><strong>{option.label}</strong><small className="field-help">{option.help}</small></span></label>)}</div>
                </fieldset>
              </div>
            </details>
            <div className="setup-actions">
              <button type="button" className="button button-primary" onClick={startGame}>{gameCopy.startGame}</button>
              {hiddenPromptIds.size > 0 && <button type="button" className="button button-secondary" onClick={resetHidden}>{gameCopy.restoreHidden} {hiddenPromptIds.size} {gameCopy.hiddenQuestions}</button>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (game.gameStatus === "COMPLETED") {
    const ranked = [...game.players].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, language));
    return (
      <div className="page-shell">
        <section className="panel">
          <header className="result-header"><p className="eyebrow">{gameCopy.results}</p><h1>{gameCopy.gameClosed}</h1><p className="muted">{game.completedTurns} {gameCopy.turnsRecorded}</p></header>
          <ol className="leaderboard">{ranked.map((player, index) => <li key={player.id}><span className="rank">{index + 1}</span><div><strong>{player.name}</strong><div className="fine-print">{player.completedTruths} {gameCopy.truthShort} / {player.completedDares} {gameCopy.dareShort} / {player.skipped} {gameCopy.skippedShort}</div></div><span className="score">{player.score} {gameCopy.points}</span></li>)}</ol>
          <div className="result-actions">
            <button type="button" className="button button-primary" onClick={() => commitGame(replayGame(game))}>{gameCopy.replay}</button>
            <button type="button" className="button button-secondary" onClick={deleteSavedGame}>{gameCopy.newGame}</button>
          </div>
        </section>
      </div>
    );
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  return (
    <div className="game-shell">
      <header className="game-header">
        <span className="round-label">{gameCopy.round} {game.currentRound}{game.totalRounds === null ? ` · ${gameCopy.infinite}` : `/${game.totalRounds}`}</span>
        <button type="button" className="button button-danger button-small" onClick={finishGame} disabled={typeWheelOpen || questionWheelOpen || isReplacingPrompt}>{gameCopy.finish}</button>
      </header>
      <div className="current-player"><p>{gameCopy.playersTurn}</p><h1>{currentPlayer?.name}</h1></div>
      {error && <p className="error-message" role="alert">{localizeGameMessage(error, language)}</p>}
      {notice && <p className="notice" aria-live="polite">{localizeGameMessage(notice, language)}</p>}

      {!game.currentPrompt && !pendingPromptType && (
        <div className="type-stage">
          <div className="type-grid">
            <button type="button" className="type-button type-truth" onClick={() => selectType("TRUTH")}><strong>{gameCopy.promptTypes.TRUTH}</strong><span>{gameCopy.truthDescription}</span></button>
            <button type="button" className="type-button type-dare" onClick={() => selectType("DARE")}><strong>{gameCopy.promptTypes.DARE}</strong><span>{gameCopy.dareDescription}</span></button>
          </div>
          <button type="button" className="button button-secondary wheel-open-button" onClick={() => setTypeWheelOpen(true)}>{gameCopy.spinType}</button>
        </div>
      )}

      {!game.currentPrompt && pendingPromptType && (
        <section className={`selected-type-stage ${pendingPromptType === "TRUTH" ? "truth" : "dare"}`} aria-label={gameCopy.drawChoiceAria}>
          <p className="eyebrow">{gameCopy.chosen}</p>
          <h2>{gameCopy.promptTypes[pendingPromptType]}</h2>
          <p>{pendingPromptType === "TRUTH" ? gameCopy.truthReady : gameCopy.dareReady}</p>
          <div className="selected-type-actions">
            <button type="button" className="button button-primary" onClick={drawPromptNow}>{gameCopy.drawNow}</button>
            <button type="button" className="button button-secondary" onClick={() => openQuestionWheel(pendingPromptType)}>{gameCopy.spinForFun}</button>
            <button type="button" className="button button-secondary" onClick={() => setPendingPromptType(null)}>{gameCopy.chooseAgain}</button>
          </div>
        </section>
      )}

      {game.currentPrompt && (
        <div className="prompt-stage">
          <article
            ref={promptCardRef}
            className={`prompt-card ${(shuffledPrompt ?? game.currentPrompt).type === "TRUTH" ? "truth" : "dare"}${isReplacingPrompt ? " is-shuffling" : ""}`}
            aria-busy={isReplacingPrompt}
          >
            {isReplacingPrompt && <span className="shuffle-status" aria-live="polite">{gameCopy.shuffling}</span>}
            <div className="prompt-meta"><span>{gameCopy.promptTypes[(shuffledPrompt ?? game.currentPrompt).type]}</span><span>{gameCopy.difficulties[(shuffledPrompt ?? game.currentPrompt).difficulty]}</span><span>{(shuffledPrompt ?? game.currentPrompt).minimumAge}+</span></div>
            <p className="prompt-text">{getPromptText(shuffledPrompt ?? game.currentPrompt, language)}</p>
            <PromptFlags prompt={shuffledPrompt ?? game.currentPrompt} />
          </article>
          <div className="prompt-actions">
            <button type="button" className="button button-primary complete" disabled={isReplacingPrompt} onClick={() => completeTurn("COMPLETED")}>{gameCopy.completed} +{game.currentPrompt.type === "TRUTH" ? 1 : 2} {gameCopy.points}</button>
            <button type="button" className="button button-secondary" disabled={isReplacingPrompt} onClick={replacePrompt}>{isReplacingPrompt ? gameCopy.changing : gameCopy.changeQuestion}</button>
            <button type="button" className="button button-secondary" disabled={isReplacingPrompt} onClick={() => completeTurn("SKIPPED")}>{gameCopy.skip}</button>
          </div>
          <div className="local-hide">
            <button type="button" disabled={isReplacingPrompt} onClick={hideCurrentPrompt}>{gameCopy.hideQuestion}</button>
            <span className="fine-print">{gameCopy.hideHelp}</span>
          </div>
        </div>
      )}

      <WheelModal
        isOpen={typeWheelOpen}
        title={gameCopy.typeWheelTitle}
        description={gameCopy.typeWheelDescription}
        countLabel={gameCopy.typeWheelCount}
        items={typeWheelItems}
        onClose={() => setTypeWheelOpen(false)}
        onResult={(id) => { setPendingPromptType(id === "DARE" ? "DARE" : "TRUTH"); setTypeWheelOpen(false); }}
        autoResolveResult
      />

      <WheelModal
        isOpen={questionWheelOpen}
        title={questionWheelType ? `${gameCopy.questionWheelPrefix} ${gameCopy.promptTypes[questionWheelType]}` : gameCopy.questionWheel}
        description={language === "vi"
          ? `Vòng quay gồm ${questionWheelPool.length} câu ${questionWheelType ? gameCopy.promptTypes[questionWheelType] : "hợp lệ"}.`
          : `The wheel includes ${questionWheelPool.length} eligible ${questionWheelType ? gameCopy.promptTypes[questionWheelType] : ""} prompts.`}
        countLabel={language === "vi" ? `Có ${questionWheelPool.length} câu đang tham gia vòng quay.` : `${questionWheelPool.length} prompts are on the wheel.`}
        items={questionWheelItems}
        onClose={closeQuestionWheel}
        onConfirmResult={confirmWheelPrompt}
        renderResult={renderQuestionResult}
        confirmLabel={gameCopy.playThis}
      />
    </div>
  );
}

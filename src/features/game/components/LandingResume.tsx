"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGameState } from "@/features/game/persistence/localGameStorage";
import { useI18n } from "@/features/i18n/I18nProvider";

export function LandingResume() {
  const { copy } = useI18n();
  const [hasSavedGame, setHasSavedGame] = useState(false);
  useEffect(() => setHasSavedGame(loadGameState() !== null), []);
  if (!hasSavedGame) return null;
  return <Link href="/play" prefetch={false} className="resume-link">{copy.home.resume}</Link>;
}

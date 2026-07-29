"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGameState } from "@/features/game/persistence/localGameStorage";

export function LandingResume() {
  const [hasSavedGame, setHasSavedGame] = useState(false);
  useEffect(() => setHasSavedGame(loadGameState() !== null), []);
  if (!hasSavedGame) return null;
  return <Link href="/play" prefetch={false} className="resume-link">Tiếp tục ván đã lưu</Link>;
}

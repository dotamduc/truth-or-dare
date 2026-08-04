import type { Metadata } from "next";
import { PlayClient } from "@/features/game/components/PlayClient";

export const metadata: Metadata = {
  title: "Play / Chơi",
  description: "Set up and play Truth or Dare in English or Vietnamese on one device.",
};

export default function PlayPage() {
  return <PlayClient />;
}

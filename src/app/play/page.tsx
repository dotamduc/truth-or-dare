import type { Metadata } from "next";
import { PlayClient } from "@/features/game/components/PlayClient";

export const metadata: Metadata = {
  title: "Chơi",
  description: "Thiết lập và chơi Thật Hay Thách ngay trên một thiết bị.",
};

export default function PlayPage() {
  return <PlayClient />;
}

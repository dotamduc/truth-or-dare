import { describe, expect, it } from "vitest";
import { getPromptText, prompts } from "@/data/prompts";
import { translations } from "@/features/i18n/translations";

describe("bilingual content", () => {
  it("provides a distinct English translation for every prompt", () => {
    expect(prompts).toHaveLength(595);
    for (const prompt of prompts) {
      const englishText = getPromptText(prompt, "en");
      expect(englishText.length).toBeGreaterThan(4);
      expect(englishText).not.toBe(prompt.text);
      expect(getPromptText(prompt, "vi")).toBe(prompt.text);
    }
  });

  it("keeps the main translation groups aligned", () => {
    expect(Object.keys(translations.en.game.categories)).toEqual(Object.keys(translations.vi.game.categories));
    expect(Object.keys(translations.en.game.audiences)).toEqual(Object.keys(translations.vi.game.audiences));
    expect(translations.en.home.features).toHaveLength(translations.vi.home.features.length);
    expect(translations.en.home.steps).toHaveLength(translations.vi.home.steps.length);
  });
});

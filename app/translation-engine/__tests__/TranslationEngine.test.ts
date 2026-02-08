import { translationEngine } from "../TranslationEngine";

describe("TranslationEngine", () => {
  beforeEach(() => {
    // Reset to English and clear localStorage before each test
    localStorage.clear();
    translationEngine.changeLanguage("en");
  });

  describe("initialization", () => {
    it("should initialize with English as default language", () => {
      expect(translationEngine.getActiveLanguage()).toBe("en");
    });

    it("should load saved language preference from localStorage on page load", () => {
      localStorage.setItem("game_library_language_preference", "es");
      expect(localStorage.getItem("game_library_language_preference")).toBe(
        "es",
      );
    });
  });

  describe("changeLanguage", () => {
    it("should change language to Spanish", () => {
      translationEngine.changeLanguage("es");
      expect(translationEngine.getActiveLanguage()).toBe("es");
    });

    it("should change language to Korean", () => {
      translationEngine.changeLanguage("ko");
      expect(translationEngine.getActiveLanguage()).toBe("ko");
    });

    it("should save language preference to localStorage", () => {
      translationEngine.changeLanguage("ko");
      expect(localStorage.getItem("game_library_language_preference")).toBe(
        "ko",
      );
    });

    it("should notify listeners when language changes", () => {
      const mockListener = jest.fn();
      translationEngine.attachListener(mockListener);

      translationEngine.changeLanguage("es");

      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it("should not notify listeners if language does not change", () => {
      translationEngine.changeLanguage("en"); // Already English
      const mockListener = jest.fn();
      translationEngine.attachListener(mockListener);

      translationEngine.changeLanguage("en");

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe("getTranslations", () => {
    it("should return English translations by default", () => {
      const translations = translationEngine.getTranslations();
      expect(translations.mainHeading).toBe("🎮 Game Library");
      expect(translations.welcomeMessage).toContain("Enjoy a collection");
    });

    it("should return Spanish translations when language is Spanish", () => {
      translationEngine.changeLanguage("es");
      const translations = translationEngine.getTranslations();
      expect(translations.mainHeading).toBe("🎮 Biblioteca de Juegos");
      expect(translations.welcomeMessage).toContain(
        "Disfruta de una colección",
      );
    });

    it("should return Korean translations when language is Korean", () => {
      translationEngine.changeLanguage("ko");
      const translations = translationEngine.getTranslations();
      expect(translations.mainHeading).toBe("🎮 게임 라이브러리");
      expect(translations.welcomeMessage).toContain("재미있는 미니게임");
    });

    it("should have all required translation keys for all languages", () => {
      const requiredKeys = [
        "mainHeading",
        "welcomeMessage",
        "inputPlaceholder",
        "visitCountLabel",
        "footerContent",
        "upDownGameTitle",
        "rpsGameTitle",
        "treasureGameTitle",
        "game47Title",
        "languagePickerLabel",
        "englishOption",
        "spanishOption",
        "koreanOption",
        "searchLabel",
        "clearSearchLabel",
        "searchingForLabel",
        "noResultsMessage",
        "noResultsSuggestion",
        "scoreboardBadgeLabel",
        "scoreboardEmptyTitle",
        "scoreboardEmptySubtitle",
        "visitCountTemplateSingular",
        "visitCountTemplatePlural",
        "loadingVisitsLabel",
        "upDownConfigTitle",
        "upDownConfigSubtitle",
        "upDownMinLabel",
        "upDownMaxLabel",
        "upDownAttemptsLabel",
        "upDownStartGame",
        "upDownRemainingAttempts",
        "upDownRangeLabel",
        "upDownGuessLabel",
        "upDownMakeGuess",
        "upDownLastGuess",
        "upDownWinTitle",
        "upDownWinMessage",
        "upDownLoseTitle",
        "upDownLoseMessage",
        "upDownHigherHint",
        "upDownLowerHint",
        "upDownFirstGuess",
        "upDownLongDescription",
        "rpsPageDescription",
        "rpsConsecutiveWinsLabel",
        "rpsYouLabel",
        "rpsComputerLabel",
        "rpsChooseNext",
        "rpsChooseFirst",
        "rpsWinMessage",
        "rpsLoseMessage",
        "rpsFinalScore",
        "rpsDrawMessage",
        "rpsVsLabel",
        "rpsChoiceRock",
        "rpsChoicePaper",
        "rpsChoiceScissors",
        "treasureConfigTitle",
        "treasureGridSizeLabel",
        "treasureGridInfo",
        "treasurePlayerCountLabel",
        "treasurePlayerCountError",
        "treasurePlayerNamesLabel",
        "treasurePlayerPlaceholder",
        "treasureStartGame",
        "treasureRulesTitle",
        "treasureRuleTurns",
        "treasureRuleHidden",
        "treasureRuleWin",
        "treasureRuleCovered",
        "treasureDescriptionConfig",
        "treasureDescriptionPlay",
        "treasureWinnerMessage",
        "treasureTurnMessage",
        "treasureTurnHint",
        "treasureNewGame",
        "treasureGridLabel",
        "treasurePlayersLabel",
        "treasureInvalidConfig",
        "game47PageDescription",
        "game47SelectDifficultyTitle",
        "game47SelectDifficultySubtitle",
        "game47ReadyTitle",
        "game47DifficultyLabel",
        "game47TargetLabel",
        "game47StopAtExact",
        "game47FadeOutHint",
        "game47StartTimer",
        "game47TimerRunning",
        "game47StopTimer",
        "game47PerfectTitle",
        "game47PerfectMessage",
        "game47ResultTitle",
        "game47StoppedAtMessage",
        "game47DifferenceLabel",
        "game47StoppedLate",
        "game47StoppedEarly",
        "game47DifficultyEasy",
        "game47DifficultyMedium",
        "game47DifficultyHard",
      ];

      ["en", "es", "ko"].forEach((lang) => {
        translationEngine.changeLanguage(lang as "en" | "es" | "ko");
        const translations = translationEngine.getTranslations();
        requiredKeys.forEach((key) => {
          expect(translations).toHaveProperty(key);
          expect(translations[key as keyof typeof translations]).toBeTruthy();
        });
      });
    });
  });

  describe("listener management", () => {
    it("should attach and detach listeners correctly", () => {
      const mockListener = jest.fn();
      const detach = translationEngine.attachListener(mockListener);

      translationEngine.changeLanguage("es");
      expect(mockListener).toHaveBeenCalledTimes(1);

      detach();
      translationEngine.changeLanguage("ko");
      expect(mockListener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it("should support multiple listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      translationEngine.attachListener(listener1);
      translationEngine.attachListener(listener2);

      translationEngine.changeLanguage("es");

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe("game translations", () => {
    it("should translate game titles correctly for all languages", () => {
      const games = [
        {
          key: "upDownGameTitle" as const,
          en: "Up And Down",
          es: "Arriba y Abajo",
          ko: "업 앤 다운",
        },
        {
          key: "rpsGameTitle" as const,
          en: "Rock-Paper-Scissors",
          es: "Piedra-Papel-Tijeras",
          ko: "가위바위보",
        },
        {
          key: "treasureGameTitle" as const,
          en: "Treasure Hunt",
          es: "Búsqueda del Tesoro",
          ko: "보물 찾기",
        },
        { key: "game47Title" as const, en: "47", es: "47", ko: "47" },
      ];

      games.forEach((game) => {
        translationEngine.changeLanguage("en");
        expect(translationEngine.getTranslations()[game.key]).toBe(game.en);

        translationEngine.changeLanguage("es");
        expect(translationEngine.getTranslations()[game.key]).toBe(game.es);

        translationEngine.changeLanguage("ko");
        expect(translationEngine.getTranslations()[game.key]).toBe(game.ko);
      });
    });
  });
});

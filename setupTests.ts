import "@testing-library/jest-dom";
import { translationEngine } from "@/app/translation-engine";

beforeEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  translationEngine.changeLanguage("en");
});

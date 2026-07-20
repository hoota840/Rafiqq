import { Language } from "./strings";

/** Arabic renders right-to-left; English left-to-right. Central place so screens
 * don't hardcode the language check. */
export function isRTL(language: Language): boolean {
  return language === "ar";
}

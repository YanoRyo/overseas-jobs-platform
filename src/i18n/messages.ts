import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import type { Locale } from "./config";

const messagesByLocale = {
  en,
  ja,
} as const;

export function getMessages(locale: Locale) {
  return messagesByLocale[locale];
}

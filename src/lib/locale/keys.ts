import { enDictionary } from "./en";

export { enDictionary };

/**
 * The canonical translation key set, derived from the English dictionary.
 * Every other dictionary must satisfy `Record<TranslationKey, string>` so a
 * missing key is a compile error.
 */
export type TranslationKey = keyof typeof enDictionary;

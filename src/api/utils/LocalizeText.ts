import { GetLocalizationManager } from '@nitrots/nitro-renderer';

export function LocalizeText(key: string, parameters: string[] = null, replacements: string[] = null): string {
    return GetLocalizationManager().getValueWithParameters(key, parameters, replacements);
}

/**
 * Localize `key`, but fall back to `fallback` when the key is missing from the
 * loaded external texts (i.e. `LocalizeText` returns the key unchanged). Lets a
 * view adopt the official localization key without regressing to a raw key on
 * servers whose externaltexts don't define it yet.
 */
export function localizeWithFallback(
    key: string,
    fallback: string,
    parameters: string[] = null,
    replacements: string[] = null,
): string {
    const text = LocalizeText(key, parameters, replacements);
    return text && text !== key ? text : fallback;
}

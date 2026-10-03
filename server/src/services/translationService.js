import logger, { serializeError } from '../utils/logger.js';

export const TRANSLATION_TIMEOUT_MS = 1500;

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('translation timeout')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function supportedLanguage(code) {
  if (typeof code !== 'string') return null;
  const base = code.toLowerCase().split('-')[0];
  return base === 'en' || base === 'fr' ? base : null;
}

/** Accepts only English or French, and only when detection itself is confident. */
export function languageFromDetection(detection) {
  if (!detection) return null;
  if (typeof detection === 'string') return supportedLanguage(detection);
  const language = supportedLanguage(detection.language);
  if (!language) return null;
  if (typeof detection.confidence === 'number' && detection.confidence < 0.5) return null;
  return language;
}

/**
 * One detection-and-translation pass (SDD 6.2). `translate(text, target)` resolves
 * `{ text, detectedSourceLanguage }`. The first call always targets English.
 */
export async function translateDetected(translate, text) {
  const english = await translate(text, 'en');
  const source = supportedLanguage(english.detectedSourceLanguage);
  if (source === 'fr') {
    return { sourceLang: 'fr', translatedLang: 'en', translatedText: english.text };
  }
  if (source === 'en') {
    const french = await translate(text, 'fr');
    return { sourceLang: 'en', translatedLang: 'fr', translatedText: french.text };
  }
  return { sourceLang: english.detectedSourceLanguage ?? null, translatedText: null, translatedLang: null };
}

function googleTranslator(apiKey) {
  let clientPromise;
  const client = () => {
    clientPromise ??= import('@google-cloud/translate').then(
      ({ v2 }) => new v2.Translate({ key: apiKey }),
    );
    return clientPromise;
  };

  return {
    async translate(text, target) {
      const api = await client();
      const [translation, response] = await api.translate(text, { to: target, format: 'text' });
      return {
        text: translation,
        detectedSourceLanguage: response?.data?.translations?.[0]?.detectedSourceLanguage ?? null,
      };
    },
    async detect(text) {
      const api = await client();
      const [detection] = await api.detect(text);
      const found = Array.isArray(detection) ? detection[0] : detection;
      return {
        language: found?.language ?? null,
        confidence: typeof found?.confidence === 'number' ? found.confidence : null,
      };
    },
  };
}

/**
 * Sending a message only detects its language. Translation runs later, when a
 * viewer asks for it. A missing key, timeout, or provider error never blocks
 * the original message.
 */
export function createTranslationService({
  apiKey = '',
  translate = null,
  detect = null,
  timeoutMs = TRANSLATION_TIMEOUT_MS,
} = {}) {
  const google = !translate && !detect && apiKey ? googleTranslator(apiKey) : null;
  const call = translate ?? google?.translate ?? null;
  const detectCall = detect ?? google?.detect ?? null;
  let warned = false;

  function warnOnce() {
    if (warned) return;
    warned = true;
    logger.warn('translation.not_configured', {
      detail: 'GOOGLE_TRANSLATE_API_KEY is not set: chat messages stay in their original language.',
    });
  }

  return {
    isConfigured: Boolean(call || detectCall),
    async detectSource(text) {
      if (!detectCall && !call) {
        warnOnce();
        return null;
      }
      try {
        if (detectCall) {
          return languageFromDetection(await withTimeout(detectCall(text), timeoutMs));
        }
        const probe = await withTimeout(call(text, 'en'), timeoutMs);
        return supportedLanguage(probe?.detectedSourceLanguage);
      } catch (error) {
        logger.warn('translation.detect_failed', { error: serializeError(error) });
        return null;
      }
    },
    async translateTo(text, targetLanguage) {
      if (!call) {
        warnOnce();
        return null;
      }
      try {
        const result = await withTimeout(call(text, targetLanguage), timeoutMs);
        const translatedText = typeof result?.text === 'string' ? result.text : '';
        if (!translatedText.trim()) return null;
        return {
          translatedText,
          sourceLang: supportedLanguage(result.detectedSourceLanguage),
        };
      } catch (error) {
        logger.warn('translation.failed', { error: serializeError(error) });
        return null;
      }
    },
  };
}

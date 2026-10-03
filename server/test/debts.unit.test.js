import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computePairDebts, splitEqually } from '../src/modules/expenses/debtMath.js';
import { translateDetected } from '../src/services/translationService.js';

describe('equal split (FR-EXP-03)', () => {
  it('gives the remaining cents to the first participants in identifier order', () => {
    const shares = splitEqually(1000, ['c', 'a', 'b']);
    assert.deepEqual(shares, [
      { userId: 'a', amountCents: 334 },
      { userId: 'b', amountCents: 333 },
      { userId: 'c', amountCents: 333 },
    ]);
    assert.equal(
      shares.reduce((sum, share) => sum + share.amountCents, 0),
      1000,
    );
  });

  it('splits an even amount without a remainder', () => {
    const shares = splitEqually(100, ['b', 'a']);
    assert.deepEqual(shares, [
      { userId: 'a', amountCents: 50 },
      { userId: 'b', amountCents: 50 },
    ]);
  });

  it('rejects an empty participant list or a non-positive amount', () => {
    assert.throws(() => splitEqually(100, []), TypeError);
    assert.throws(() => splitEqually(0, ['a']), TypeError);
    assert.throws(() => splitEqually(10.5, ['a']), TypeError);
  });
});

describe('pairwise debts (FR-EXP-04 to FR-EXP-06)', () => {
  it('makes every participant except the payer owe their share', () => {
    const shares = splitEqually(1000, ['a', 'b', 'c']);
    const { debts, balanceById } = computePairDebts(
      [{ payerId: 'a', shares }],
      [],
    );
    assert.deepEqual(debts, [
      { fromUserId: 'b', toUserId: 'a', amountCents: 333 },
      { fromUserId: 'c', toUserId: 'a', amountCents: 333 },
    ]);
    assert.equal(balanceById.get('a'), 666);
    assert.equal(balanceById.get('b'), -333);
    assert.equal(balanceById.get('c'), -333);
  });

  it('clears a debt when the full amount is settled', () => {
    const shares = splitEqually(900, ['a', 'b']);
    const { debts, balanceById } = computePairDebts(
      [{ payerId: 'a', shares }],
      [{ fromUserId: 'b', toUserId: 'a', amountCents: 450 }],
    );
    assert.deepEqual(debts, []);
    assert.equal(balanceById.get('a') ?? 0, 0);
    assert.equal(balanceById.get('b') ?? 0, 0);
  });
});

describe('chat translation (FR-CHT-03 to FR-CHT-05)', () => {
  function translator(detected) {
    return async (text, target) => ({ text: `${target}:${text}`, detectedSourceLanguage: detected });
  }

  it('translates French into English on the first call', async () => {
    const result = await translateDetected(translator('fr'), 'Bonjour');
    assert.deepEqual(result, {
      sourceLang: 'fr',
      translatedLang: 'en',
      translatedText: 'en:Bonjour',
    });
  });

  it('translates English into French with a second call', async () => {
    const calls = [];
    const result = await translateDetected(async (text, target) => {
      calls.push(target);
      return { text: `${target}:${text}`, detectedSourceLanguage: 'en' };
    }, 'Hello');
    assert.deepEqual(calls, ['en', 'fr']);
    assert.equal(result.translatedLang, 'fr');
    assert.equal(result.translatedText, 'fr:Hello');
  });

  it('keeps another language untranslated', async () => {
    const result = await translateDetected(translator('es'), 'Hola');
    assert.equal(result.translatedText, null);
    assert.equal(result.sourceLang, 'es');
  });
});

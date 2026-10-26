/**
 * (으)로. A batchim other than ㄹ takes 으로. No batchim, or ㄹ, takes 로.
 * Trailing digits use the Korean reading of that number (3으로, 4로, 10으로).
 */
export function withEuro(word: string): string {
  return `${word}${euroParticle(word)}`;
}

export function euroParticle(word: string): '으로' | '로' {
  return endsWithBatchimExceptRieul(word) ? '으로' : '로';
}

function endsWithBatchimExceptRieul(word: string): boolean {
  const trimmed = word.trim();
  const digits = trimmed.match(/(\d+)$/);
  if (digits) {
    return numberEndsWithBatchimExceptRieul(Number(digits[1]));
  }
  const code = lastHangulSyllable(trimmed);
  if (code === null) {
    return false;
  }
  const jong = (code - 0xac00) % 28;
  return jong !== 0 && jong !== 8;
}

function lastHangulSyllable(word: string): number | null {
  for (let index = word.length - 1; index >= 0; index -= 1) {
    const code = word.charCodeAt(index);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return code;
    }
  }
  return null;
}

function numberEndsWithBatchimExceptRieul(value: number): boolean {
  const n = Math.abs(Math.trunc(value));
  const last = n % 10;
  if (last === 0) {
    return true;
  }
  return last === 3 || last === 6;
}

import { audioManager } from './AudioManager';
import { SFX_ID, type SfxId } from './audio-types';

const SWING_RATES = [0.9, 1.04, 0.96, 1.12] as const;
/** Sword clicks sit below the short UI tick so a fight click is a heavier swing. */
const SWORD_SWING_RATES = [0.76, 0.84, 0.8, 0.88] as const;

export type SwingTone = 'flat' | 'blade';

export function swingPlaybackRate(attackId: number): number {
  const index = Math.abs(attackId) % SWING_RATES.length;
  return SWING_RATES[index] ?? 1;
}

export function playerSwingVoice(classId: string, attackId: number): { id: SfxId; rate: number; tone: SwingTone } {
  const id = sfxForPlayerAttack(classId);
  if (id === SFX_ID.PLAYER_ATTACK) {
    const index = Math.abs(attackId) % SWORD_SWING_RATES.length;
    return { id, rate: SWORD_SWING_RATES[index] ?? 0.8, tone: 'blade' };
  }
  return { id, rate: swingPlaybackRate(attackId), tone: 'flat' };
}

export function playPlayerSwing(classId: string, attackId: number): void {
  const voice = playerSwingVoice(classId, attackId);
  audioManager.playSfx(voice.id, voice.rate, voice.tone);
}

export function sfxForPlayerAttack(classId: string): SfxId {
  if (classId === 'mage') {
    return SFX_ID.MAGE_MAGIC_BOLT;
  }
  if (classId === 'rogue') {
    return SFX_ID.ROGUE_ATTACK;
  }
  return SFX_ID.PLAYER_ATTACK;
}

export function sfxForDash(style: string): SfxId {
  return style === 'blink' ? SFX_ID.MAGE_BLINK : SFX_ID.PLAYER_DASH;
}

export function sfxForSkill(skillId: string): SfxId | null {
  switch (skillId) {
    case 'warrior_charge_slash':
      return SFX_ID.WARRIOR_CHARGE_SLASH;
    case 'warrior_guard':
      return SFX_ID.WARRIOR_GUARD;
    case 'mage_fireball':
      return SFX_ID.MAGE_FIREBALL;
    case 'mage_frost_nova':
      return SFX_ID.MAGE_FROST_NOVA;
    case 'rogue_shadow_dash':
      return SFX_ID.ROGUE_SHADOW_DASH;
    case 'rogue_backstab':
      return SFX_ID.ROGUE_BACKSTAB;
    default:
      return null;
  }
}

export function sfxForEnemyAttack(typeId: string): SfxId {
  if (typeId === 'archer') {
    return SFX_ID.ARCHER_SHOT;
  }
  if (typeId === 'brute') {
    return SFX_ID.BRUTE_ATTACK;
  }
  return SFX_ID.GOBLIN_ATTACK;
}

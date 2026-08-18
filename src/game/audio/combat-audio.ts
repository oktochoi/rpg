import { SFX_ID, type SfxId } from './audio-types';

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

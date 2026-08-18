import type { NpcDialogueIntent } from '../types';

export function detectIntent(playerInput: string): NpcDialogueIntent {
  const text = playerInput.trim().toLowerCase();
  if (!text) {
    return 'GENERAL';
  }

  if (/고블린|goblin|쓰러|죽인|처치|잡았/.test(text)) {
    return 'ASK_GOBLIN';
  }
  if (/기억|도와준|구해준|구한 거|협박했던/.test(text)) {
    return 'ASK_MEMORY';
  }
  if (/폐허|고대|ruins|석문/.test(text)) {
    return 'ASK_RUINS';
  }
  if (/누구|당신|소개|정체|직업/.test(text)) {
    return 'ASK_IDENTITY';
  }
  if (/최근|이상한|사건|무슨 일/.test(text)) {
    return 'ASK_RECENT_EVENT';
  }
  if (/믿|관계|친구|신뢰/.test(text)) {
    return 'ASK_RELATIONSHIP';
  }
  return 'GENERAL';
}

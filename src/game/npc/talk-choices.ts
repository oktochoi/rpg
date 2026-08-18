export const CHOICE_ASK_RUINS = 'ask_ruins';
export const CHOICE_ASK_EVENT = 'ask_recent_event';
export const CHOICE_ASK_IDENTITY = 'ask_identity';
export const CHOICE_ASK_GOBLIN = 'ask_goblin';
export const CHOICE_TALK_RUINS_PROGRESS = 'talk_ruins_progress';
export const CHOICE_TALK_SERIA = 'talk_seria_here';
export const CHOICE_TALK_MARTA = 'talk_marta_here';
export const CHOICE_TALK_DORAN = 'talk_doran_here';
export const CHOICE_TALK_LEON = 'talk_leon_here';

export const TALK_CHOICE_PROMPTS: Readonly<Record<string, string>> = {
  [CHOICE_ASK_RUINS]: '폐허에 대해 알고 있는 게 있어?',
  [CHOICE_ASK_EVENT]: '최근 이상한 일은 없었어?',
  [CHOICE_ASK_IDENTITY]: '당신은 누구야?',
  [CHOICE_ASK_GOBLIN]: '고블린 일 기억해?',
  [CHOICE_TALK_RUINS_PROGRESS]: '조사는 어떻게 되고 있어?',
  [CHOICE_TALK_SERIA]: '잠깐 이야기할 수 있을까?',
  [CHOICE_TALK_MARTA]: '여관의 소문이 있어?',
  [CHOICE_TALK_LEON]: '이 문은 언제 열리나?',
  [CHOICE_TALK_DORAN]: '신입 모험가가 여기서 뭘 하면 되지?',
  talk_elin_here: '물건 값을 알려 줄 수 있어?',
  talk_seria_saved_memory: '그때 폐허에서 날 구했던 일은 기억해?',
  talk_seria_personal_secret: '너만 알고 있는 이야기가 있어?',
};

export function getTalkPrompt(choiceId: string): string | null {
  return TALK_CHOICE_PROMPTS[choiceId] ?? null;
}

export function npcIdFromTalkKey(choiceId: string, promptId?: string): string | undefined {
  const key = `${choiceId}_${promptId ?? ''}`.toLowerCase();
  if (key.includes('leon')) {
    return 'leon';
  }
  if (key.includes('marta') || key.includes('innkeeper')) {
    return 'innkeeper';
  }
  if (key.includes('doran') || key.includes('guild')) {
    return 'guildmaster_doran';
  }
  if (key.includes('elin') || key.includes('shop')) {
    return 'shopkeeper_elin';
  }
  if (key.includes('seria') || key.includes('saved') || key.includes('secret') || key.includes('ruins')) {
    return 'seria';
  }
  return undefined;
}

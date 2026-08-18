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
  ask_seria_research: '무엇을 연구하고 있습니까?',
  ask_seria_ruins_history: '폐허는 원래 어떤 곳입니까?',
  ask_seria_danger: '마력 이상이 위험한 겁니까?',
  ask_seria_why_not_go: '왜 직접 가지 않습니까?',
  ask_seria_reward: '보상과 의뢰 조건은 어떻게 됩니까?',
  talk_leon_goblin_rumor: '숲길 고블린이 늘었다는 이야기를 들었습니다.',
  ask_quest_goblin_count: '고블린이 몇 마리나 있습니까?',
  ask_quest_goblin_danger: '위험한 싸움입니까?',
  ask_path_warrior: '검사는 어떤 길입니까?',
  ask_path_mage: '마법사는 어떤 길입니까?',
  ask_path_rogue: '도적은 어떤 길입니까?',
  seria_follow_who: '나보다 먼저 온 자가 있는 것 같습니다.',
  seria_follow_danger: '봉인은 아직 불안정합니다.',
  talk_elin_stock: '이번에 조금 나은 물건이 들어왔어.',
  talk_leon_honest: '본 그대로 말하겠다.',
  talk_seria_feel_danger: '위험하다고 느꼈다.',
  talk_seria_feel_curious: '흥미로웠다.',
  talk_seria_feel_royal: '왕실과 관련 있을 것 같았다.',
  marta_worry_ruins: '폐허에 가기 전에 들렀다.',
  marta_time: '오늘 하루는 어때요?',
  marta_forest_plan: '오늘도 숲으로 나갈 생각이야?',
  marta_shop_new: '상점 주인이 새 물건을 들여놨다더라.',
  marta_leon_watch: '레온이 요즘 북문 쪽을 자주 살핀다.',
  marta_forest_quiet: '숲길이 조금 조용해졌다던데.',
  marta_after_return: '다친 데는 없지? 여관은 열려 있어.',
  leon_duty: '문은 아직이다. 숲부터 정리해라.',
  leon_camp: '야영지는 치웠지. 폐허 방향은 따로다.',
  leon_seria_view: '세리아의 연구가 유용한 건 인정한다. 다만 규정은 규정이다.',
  leon_gate: '북문 초소 쪽은 아직 소문뿐이다.',
  leon_royal: '왕실 문양은 함부로 말할 일이 아니다.',
  seria_research_aside: '기록이 조금 어긋나. 지금은 이 정도만.',
  seria_leon_view: '레온은 뭐든 왕실 규정부터 생각하지. 틀린 말은 아니지만.',
  seria_camp_ask: '그 고블린들이 폐허 쪽으로 향했다는 거지?',
  seria_ready: '준비가 되면 폐허로 가자.',
  seria_after_report: '조금 더 기록을 살펴봐야겠어.',
  seria_secret_marker: '그 표지석… 왕실 문양과 닮았어. 네가 본 거 맞지?',
  doran_board: '칠판을 봐. 없는 의뢰를 붙들고 있진 말고.',
  doran_east_road: '들리는 이야기로는 동쪽 상단이 늦는대. 확실한 건 아냐.',
  elin_welcome: '필요한 것만 골라. 빚은 안 받아.',
  elin_new_stock: '이번에 조금 나은 물건이 들어왔어.',
  elin_ruins_prep: '폐허 간다면 물약은 남겨 둬. 검만 믿지 말고.',
};

export function getTalkPrompt(choiceId: string): string | null {
  return TALK_CHOICE_PROMPTS[choiceId] ?? null;
}

export function isTalkChoice(choiceId: string): boolean {
  return getTalkPrompt(choiceId) !== null;
}

export function npcIdFromTalkKey(choiceId: string, promptId?: string): string | undefined {
  const key = `${choiceId}_${promptId ?? ''}`.toLowerCase();
  if (key.includes('leon')) {
    return 'leon';
  }
  if (key.includes('marta') || key.includes('innkeeper')) {
    return 'innkeeper';
  }
  if (
    key.includes('doran') ||
    key.includes('guild') ||
    key.includes('path_warrior') ||
    key.includes('path_mage') ||
    key.includes('path_rogue') ||
    key.includes('quest_goblin')
  ) {
    return 'guildmaster_doran';
  }
  if (key.includes('elin') || key.includes('shop')) {
    return 'shopkeeper_elin';
  }
  if (
    key.includes('seria') ||
    key.includes('saved') ||
    key.includes('secret') ||
    key.includes('ruins') ||
    key.includes('follow_who') ||
    key.includes('follow_danger')
  ) {
    return 'seria';
  }
  return undefined;
}

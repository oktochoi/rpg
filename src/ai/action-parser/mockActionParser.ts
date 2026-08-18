import type { ActionParserContext } from '../../game/actions/parser-context';
import type { ActionType, ParsedAction } from '../../game/actions/action-types';
import { resolveTargetFromInput } from '../../game/actions/entity-resolver';
import { looksLikeMoveIntent, resolveLocationAlias } from '../../game/world/locations/location-alias';
import type { ActionParser } from './types';

const IMPOSSIBLE = /폭파|날아|순간이동|하늘을|달을|왕궁으로 순간/;

export function createMockActionParser(): ActionParser {
  return {
    async parse(input: string, context: ActionParserContext): Promise<ParsedAction> {
      return parseMockAction(input, context);
    },
  };
}

function parseMockAction(input: string, context: ActionParserContext): ParsedAction {
  const rawInput = input.trim();
  const text = rawInput;
  const presentIds = context.currentNpcIds;
  const addressed = resolveTargetFromInput(text, presentIds, 'address');
  const object = resolveTargetFromInput(text, presentIds, 'object');
  const addressedId = addressed?.id;
  const objectId = object?.id;
  const amount = parseAmount(text);
  const stealTarget = objectId ?? addressedId;
  const itemId = parseItemId(text, stealTarget);
  const skillId = parseSkillId(text);

  if (!rawInput || IMPOSSIBLE.test(text) || /이상한 짓|뭔가 좀/.test(text)) {
    return {
      actionType: 'UNKNOWN',
      rawInput,
      confidence: rawInput && IMPOSSIBLE.test(text) ? 0.25 : 0.3,
      speech: rawInput,
    };
  }

  if (/공격|때린|검을 뽑|휘두|베어/.test(text)) {
    const targetId = objectId ?? addressedId;
    return complete('ATTACK', rawInput, targetId, { confidence: targetId ? 0.95 : 0.72 });
  }

  if (/훔|몰래 가져|슬쩍/.test(text)) {
    return complete('STEAL', rawInput, stealTarget, { itemId, confidence: stealTarget ? 0.9 : 0.72 });
  }

  if (/뇌물|열어달/.test(text)) {
    return complete('BRIBE', rawInput, addressedId ?? objectId, { amount: amount ?? 50, confidence: 0.88 });
  }

  if (/돈을 준|골드를 준|금화를 준|골드\s*\d+|금화\s*\d+|\d+\s*골드/.test(text)) {
    return complete('GIVE', rawInput, addressedId ?? objectId, { amount: amount ?? 10, confidence: 0.9 });
  }

  if (/준다|건넨다/.test(text) && (amount !== undefined || itemId)) {
    return complete('GIVE', rawInput, addressedId ?? objectId, { amount, itemId, confidence: 0.82 });
  }

  if (/위협|협박|겁을/.test(text)) {
    const targetId = addressedId ?? objectId;
    return complete('THREATEN', rawInput, targetId, { confidence: targetId ? 0.9 : 0.7 });
  }

  if (/목숨|구출|구해|구한다|살린다/.test(text)) {
    return complete('RESCUE', rawInput, objectId ?? addressedId ?? context.currentNpcIds[0], { confidence: 0.9 });
  }

  if (/돕|도와준다|도움을/.test(text)) {
    return complete('HELP', rawInput, objectId ?? addressedId ?? context.currentNpcIds[0], { confidence: 0.9 });
  }

  if (/투명화|마법으로|스킬을 써|주문을/.test(text)) {
    return complete('USE_SKILL', rawInput, addressedId ?? objectId, {
      skillId: skillId ?? 'invisibility',
      confidence: 0.8,
    });
  }

  if (/아이템을 사용|포션을|마신다/.test(text)) {
    return complete('USE_ITEM', rawInput, addressedId, { itemId: itemId ?? 'healing_potion', confidence: 0.8 });
  }

  if (/조사|살펴|주변을 보|자세히/.test(text)) {
    return complete('INVESTIGATE', rawInput, undefined, { confidence: 0.88 });
  }

  if (looksLikeMoveIntent(text)) {
    const locationId = resolveLocationAlias(text);
    return complete('MOVE', rawInput, locationId ?? undefined, { confidence: locationId ? 0.92 : 0.8 });
  }

  if (/떠난다|자리를 뜬|나간다/.test(text)) {
    return complete('LEAVE', rawInput, resolveLocationAlias(text) ?? undefined, { confidence: 0.8 });
  }

  if (/이동한다|걸어간다|그곳으로/.test(text)) {
    return complete('MOVE', rawInput, resolveLocationAlias(text) ?? undefined, { confidence: 0.75 });
  }

  if (/하루를 쉬|쉬어간다|잠을 잔|여관에서 쉰|휴식/.test(text)) {
    return complete('REST', rawInput, undefined, { confidence: 0.9 });
  }

  if (/기다린|대기한다|잠시 쉰다/.test(text)) {
    return complete('WAIT', rawInput, undefined, { confidence: 0.85 });
  }

  if (/묻|질문|알고 있/.test(text)) {
    return complete('ASK', rawInput, addressedId ?? context.currentNpcIds[0], {
      speech: rawInput,
      confidence: 0.92,
    });
  }

  if (/말한다|이야기한다|대화/.test(text)) {
    return complete('TALK', rawInput, addressedId ?? context.currentNpcIds[0], {
      speech: rawInput,
      confidence: 0.85,
    });
  }

  if (addressedId) {
    return complete('TALK', rawInput, addressedId, { speech: rawInput, confidence: 0.55 });
  }

  return {
    actionType: 'UNKNOWN',
    rawInput,
    speech: rawInput,
    confidence: 0.3,
  };
}

function complete(
  actionType: ActionType,
  rawInput: string,
  targetId: string | undefined,
  extra: Partial<ParsedAction>
): ParsedAction {
  return {
    actionType,
    targetId,
    rawInput,
    confidence: extra.confidence ?? 0.7,
    amount: extra.amount,
    itemId: extra.itemId,
    skillId: extra.skillId,
    speech: extra.speech ?? rawInput,
    method: extra.method,
    secondaryTargetId: extra.secondaryTargetId,
  };
}

function parseAmount(text: string): number | undefined {
  const matched = text.match(/(\d+)\s*(?:골드|금화|gold|개)|(?:골드|금화|gold)\s*(\d+)/i);
  if (!matched) {
    return undefined;
  }
  const value = Number(matched[1] || matched[2]);
  return Number.isFinite(value) ? value : undefined;
}

function parseItemId(text: string, targetId?: string): string | undefined {
  if (/열쇠|key/.test(text)) {
    return targetId === 'guard_01' || /경비/.test(text) ? 'guard_key' : 'strange_key';
  }
  if (/포션|potion/.test(text)) {
    return 'healing_potion';
  }
  return undefined;
}

function parseSkillId(text: string): string | undefined {
  if (/투명화/.test(text)) {
    return 'invisibility';
  }
  return undefined;
}

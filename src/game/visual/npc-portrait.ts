import { getNpcAsset } from '../combat/visual/asset-registry';
import { getNpcProfile } from '../npc/npc-profiles';

export type NpcPortraitEmotion = 'neutral' | 'curiosity' | 'angry' | string;

export interface NpcPortraitView {
  npcId: string;
  emotion: string;
  letter: string;
  name: string;
  role: string | null;
  assetId: string;
  path: string;
  fallbackKey: string;
}

export function resolveNpcPortrait(npcId: string, emotion?: string | null): NpcPortraitView {
  const resolvedId = npcId === 'marta' ? 'innkeeper' : npcId;
  const asset = getNpcAsset(resolvedId);
  const profile = getNpcProfile(resolvedId);
  const emotionKey = emotion && emotion.length > 0 ? emotion : 'neutral';
  const fileBase = resolvedId === 'innkeeper' ? 'marta' : resolvedId;
  return {
    npcId: resolvedId,
    emotion: emotionKey,
    letter: (profile?.name ?? '?').slice(0, 1),
    name: profile?.name ?? 'NPC',
    role: profile?.role ?? null,
    assetId: `${fileBase}_${emotionKey}`,
    path: asset.path,
    fallbackKey: asset.fallbackKey,
  };
}

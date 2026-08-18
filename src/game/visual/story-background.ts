import { getStoryBackground } from '../combat/visual/asset-registry';

export type StoryBackgroundTheme = 'village' | 'inn' | 'guild' | 'forest' | 'ruins' | 'gate';

export interface StoryBackgroundView {
  locationId: string;
  theme: StoryBackgroundTheme;
  path: string;
  label: string;
}

const THEME_LABEL: Record<StoryBackgroundTheme, string> = {
  village: 'Luen Village',
  inn: 'Blue Moon Inn',
  guild: "Adventurers' Guild",
  forest: 'Forest Road',
  ruins: 'Ancient Ruins',
  gate: 'Northern Gate',
};

export function resolveStoryBackground(locationId: string): StoryBackgroundView {
  const asset = getStoryBackground(locationId);
  const theme = asset.theme as StoryBackgroundTheme;
  return {
    locationId: asset.id,
    theme,
    path: asset.path,
    label: THEME_LABEL[theme] ?? asset.id,
  };
}

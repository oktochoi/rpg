import { useEffect, useState } from 'react';
import { resolveStoryBackground, type StoryBackgroundView } from '@/game/visual/story-background';
import styles from './StoryBackground.module.css';

interface StoryBackgroundProps {
  locationId: string;
}

export function StoryBackground({ locationId }: StoryBackgroundProps) {
  const background = resolveStoryBackground(locationId);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [background.path]);

  return (
    <div
      className={`${styles.slot} ${themeClass(background.theme)}`}
      data-asset={background.path}
      data-location={background.locationId}
    >
      {failed ? null : (
        <img
          className={styles.image}
          src={background.path}
          alt=""
          onLoad={(event) => {
            const image = event.currentTarget;
            image.style.maxWidth = `${image.naturalWidth}px`;
            image.style.maxHeight = `${image.naturalHeight}px`;
          }}
          onError={() => setFailed(true)}
        />
      )}
      <span className={styles.label}>{background.label}</span>
    </div>
  );
}

function themeClass(theme: StoryBackgroundView['theme']): string {
  if (theme === 'inn') {
    return styles.inn;
  }
  if (theme === 'guild') {
    return styles.guild;
  }
  if (theme === 'forest') {
    return styles.forest;
  }
  if (theme === 'ruins') {
    return styles.ruins;
  }
  if (theme === 'gate') {
    return styles.gate;
  }
  return styles.village;
}

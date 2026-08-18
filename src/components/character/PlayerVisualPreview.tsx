import { useEffect, useState } from 'react';
import { resolvePlayerVisual } from '@/game/combat/visual';
import { getClassAppearance } from '@/game/combat/player/class-appearance';
import { resolvePlayerClassId } from '@/game/player/classes';
import styles from './PlayerVisualPreview.module.css';

interface PlayerVisualPreviewProps {
  jobId: string;
  rankId?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerVisualPreview({ jobId, rankId, alt = '', size = 'md' }: PlayerVisualPreviewProps) {
  const visual = resolvePlayerVisual(jobId, rankId);
  const [failed, setFailed] = useState(false);
  const appearance = getClassAppearance(resolvePlayerClassId(jobId));
  const src = visual.portraitPath ?? visual.path;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        className={`${styles.fallback} ${styles[size]} ${appearance.shape === 'circle' ? styles.circle : styles.rect}`}
        style={{ background: `#${appearance.color.toString(16).padStart(6, '0')}` }}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  return <img className={`${styles.image} ${styles[size]}`} src={src} alt={alt} onError={() => setFailed(true)} />;
}

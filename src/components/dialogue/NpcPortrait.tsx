import { useEffect, useState } from 'react';
import { resolveNpcPortrait } from '@/game/visual/npc-portrait';
import styles from './dialogue.module.css';

interface NpcPortraitProps {
  npcName: string;
  npcId?: string | null;
  emotion?: string | null;
  role?: string | null;
}

export function NpcPortrait({ npcName, npcId, emotion = 'neutral', role = null }: NpcPortraitProps) {
  const portrait = resolveNpcPortrait(npcId ?? inferNpcId(npcName), emotion);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [portrait.path]);

  return (
    <div className={styles.portrait} data-asset={portrait.path} data-emotion={portrait.emotion} data-npc={portrait.npcId}>
      <div className={`${styles.frame} ${npcFrameClass(portrait.npcId)}`} aria-hidden="true">
        {failed ? (
          <>
            <span className={styles.placeholder}>{portrait.letter}</span>
            <div className={styles.silhouette} />
          </>
        ) : (
          <img className={styles.image} src={portrait.path} alt="" onError={() => setFailed(true)} />
        )}
      </div>
      <p className={styles.name}>{npcName}</p>
      {role ?? portrait.role ? <p className={styles.role}>{role ?? portrait.role}</p> : null}
    </div>
  );
}

function inferNpcId(npcName: string): string {
  if (npcName.includes('레온') || npcName.toLowerCase().includes('leon')) {
    return 'leon';
  }
  if (npcName.includes('마르타') || npcName.toLowerCase().includes('marta')) {
    return 'innkeeper';
  }
  if (npcName.includes('엘린') || npcName.toLowerCase().includes('elin')) {
    return 'shopkeeper_elin';
  }
  return 'seria';
}

function npcFrameClass(npcId: string): string {
  if (npcId === 'leon') {
    return styles.npcLeon;
  }
  if (npcId === 'innkeeper') {
    return styles.npcMarta;
  }
  return styles.npcSeria;
}

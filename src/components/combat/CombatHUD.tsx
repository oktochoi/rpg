import { useEffect, useState } from 'react';
import { subscribeCombatHud } from '@/game/combat/hud/combat-hud-bridge';
import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import { BossHUD } from './BossHUD';
import { PlayerStatusHUD } from './PlayerStatusHUD';
import { SkillBar } from './SkillBar';
import styles from './CombatHUD.module.css';

export function CombatHUD() {
  const [snapshot, setSnapshot] = useState<CombatHudState | null>(null);

  useEffect(() => subscribeCombatHud(setSnapshot), []);

  if (!snapshot) {
    return null;
  }

  return (
    <div className={styles.hud}>
      <PlayerStatusHUD player={snapshot.player} />
      {snapshot.boss ? <BossHUD boss={snapshot.boss} /> : null}
      <SkillBar player={snapshot.player} />
      <p className={styles.hint}>WASD 이동 · 마우스 조준</p>
    </div>
  );
}

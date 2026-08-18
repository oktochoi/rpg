import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import {
  canChooseFirstAdvancement,
  displayClassName,
  getClassRank,
  nextAdvancementsFor,
  resolvePlayerClassId,
} from '@/game/player/classes';
import { getSkill, getSkillForSlot } from '@/game/combat/skills/skill-definitions';
import { expRequiredForLevel } from '@/game/player/progression/level-config';
import { PlayerVisualPreview } from './PlayerVisualPreview';
import { derivedPlayerStats } from '@/game/inventory/derived-stats';
import { equippedName } from '@/game/inventory/item-selectors';
import { getItemDefinition } from '@/game/inventory/item-definitions';
import { STAT_DESCRIPTION, STAT_IDS, STAT_LABEL } from '@/game/player/stats';
import styles from './CharacterPanel.module.css';

interface CharacterPanelProps {
  state: GameState;
  dispatch: CommandDispatcher;
  onClose: () => void;
}

export function CharacterPanel({ state, dispatch, onClose }: CharacterPanelProps) {
  const player = state.player;
  const classId = resolvePlayerClassId(player.classId);
  const level = player.level ?? 1;
  const expToNext = expRequiredForLevel(level);
  const next = nextAdvancementsFor(classId, player.classRankId);
  const q = getSkillForSlot(classId, 'Q');
  const e = getSkillForSlot(classId, 'E');
  const skills = [q, e].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const canAdvance = canChooseFirstAdvancement(state);
  const derived = derivedPlayerStats(player);
  const weaponName = equippedName(player.equipment, 'weapon', player.equipmentEnhancements);
  const armorName = equippedName(player.equipment, 'armor', player.equipmentEnhancements);
  const accessoryName = equippedName(player.equipment, 'accessory', player.equipmentEnhancements);
  const weaponDef = player.equipment?.weapon ? getItemDefinition(player.equipment.weapon) : null;
  const unspent = player.unspentStatPoints ?? 0;
  const allocated = player.allocatedStats ?? { vit: 0, str: 0, int: 0, agi: 0 };

  return (
    <div className={styles.overlay}>
      <section className={styles.panel} aria-label="캐릭터">
        <header className={styles.header}>
          <h2>CHARACTER</h2>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className={styles.top}>
          <div className={styles.portrait} aria-hidden="true">
            <PlayerVisualPreview jobId={player.classId} rankId={player.classRankId} size="md" />
          </div>
          <div>
            <p className={styles.name}>{player.name}</p>
            <p>Lv. {level}</p>
            <p>직업: {displayClassName(player.classId, player.classRankId)}</p>
            <p>Gold {player.gold} G</p>
            <p>
              EXP {player.exp ?? 0} / {expToNext || '—'}
            </p>
            <div className={styles.bar}>
              <div
                className={styles.fill}
                style={{ width: `${expToNext > 0 ? Math.min(100, ((player.exp ?? 0) / expToNext) * 100) : 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          <section>
            <h3>능력치</h3>
            <p>HP {player.currentHp} / {derived.maxHp}</p>
            <p>MP {player.currentMp} / {derived.maxMp}</p>
            <p>Attack {derived.attackPower}</p>
            <p className={styles.points}>남은 능력치 포인트: {unspent}</p>
            <ul className={styles.statList}>
              {STAT_IDS.map((statId) => (
                <li key={statId} className={styles.statRow}>
                  <span title={STAT_DESCRIPTION[statId]}>
                    {STAT_LABEL[statId]} {allocated[statId]}
                  </span>
                  <button
                    type="button"
                    className={styles.plus}
                    disabled={unspent <= 0}
                    title={STAT_DESCRIPTION[statId]}
                    onClick={() => dispatch({ type: 'ALLOCATE_STAT_POINT', statId })}
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>장비</h3>
            <p>[무기] {weaponName}{weaponDef?.statBonuses?.attack ? ` · Attack +${weaponDef.statBonuses.attack}` : ''}</p>
            <p>[방어구] {armorName}</p>
            <p>[장신구] {accessoryName}</p>
          </section>
          <section>
            <h3>성장</h3>
            {canAdvance ? (
              <p>다음 전직: 검사 / 마법사 / 도적 (지금 선택 가능)</p>
            ) : next.length > 1 ? (
              <p>
                다음 전직: {next.map((item) => getClassRank(item.toRank)?.name ?? item.toRank).join(' / ')}
                <br />
                조건: Lv.{next[0].levelRequirement} + 제1장 완료
              </p>
            ) : next[0] ? (
              <p>
                다음 전직: {getClassRank(next[0].toRank)?.name ?? displayClassName(next[0].familyId, next[0].toRank)}
                <br />
                조건: Lv.{next[0].levelRequirement} · 전직 퀘스트
              </p>
            ) : (
              <p>최종 길에 도달했습니다.</p>
            )}
          </section>
        </div>
        <section>
          <h3>Skills</h3>
          <p>Basic Attack</p>
          <p>Dodge</p>
          {skills.map((skill) => (
            <p key={skill.name}>
              {skill.slot}: {skill.name}
            </p>
          ))}
          {skills.length === 0 ? <p>{getSkill('adventurer_quick_strike')?.name}</p> : null}
          {next.length === 1
            ? next[0].unlockSkillIds.map((id) => {
                const locked = getSkill(id);
                return locked ? <p key={locked.name}>잠김: {locked.name}</p> : null;
              })
            : null}
        </section>
        {canAdvance ? (
          <p className={styles.hint}>길드에서 검사 / 마법사 / 도적의 길을 선택할 수 있습니다.</p>
        ) : null}
        <button type="button" className={styles.close} onClick={() => dispatch({ type: 'CLOSE_MENU' })}>
          닫기
        </button>
      </section>
    </div>
  );
}

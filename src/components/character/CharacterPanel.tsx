import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import {
  canChooseFirstAdvancement,
  displayClassName,
  getClassRank,
  nextAdvancementsFor,
  resolvePlayerClassId,
  isAdventurer,
  PLAYER_CLASS_ID,
} from '@/game/player/classes';
import { getSkill, getSkillForSlot } from '@/game/combat/skills/skill-definitions';
import { expRequiredForLevel } from '@/game/player/progression/level-config';
import { PlayerVisualPreview } from './PlayerVisualPreview';
import { derivedPlayerStats } from '@/game/inventory/derived-stats';
import { equippedName } from '@/game/inventory/item-selectors';
import { getItemDefinition } from '@/game/inventory/item-definitions';
import { STAT_DESCRIPTION, STAT_IDS, STAT_LABEL } from '@/game/player/stats';
import { GameModal } from '@/components/ui/GameModal';
import { KitBar } from '@/components/ui/KitBar';
import styles from './CharacterPanel.module.css';

const KIT = '/assets/ui/dark-fantasy';
const HERO_PORTRAIT = '/assets/characters/hero_swordsman/hero_fullbody.png';

function paintedHeroPortrait(classId: string): string | undefined {
  const resolved = resolvePlayerClassId(classId);
  if (resolved === PLAYER_CLASS_ID.ADVENTURER || resolved === PLAYER_CLASS_ID.WARRIOR) {
    return HERO_PORTRAIT;
  }
  return undefined;
}

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
    <GameModal title="캐릭터" kicker="상태" size="xl" fitContent onClose={onClose}>
      <div className={styles.layout}>
        <div className={styles.identity}>
          <div className={styles.portrait} aria-hidden="true">
            <PlayerVisualPreview
              jobId={player.classId}
              rankId={player.classRankId}
              size="sheet"
              src={paintedHeroPortrait(player.classId)}
            />
          </div>
          <div>
            <p className={styles.name}>{player.name}</p>
            <p className={styles.metaRow}>
              <span>Lv. {level}</span>
              <span>{displayClassName(player.classId, player.classRankId)}</span>
            </p>
            <p className={styles.gold}>
              <img className={styles.goldIcon} src={`${KIT}/gold_icon.png`} alt="" />
              {player.gold} G
            </p>
            <p className={styles.metaRow}>
              경험치 {player.exp ?? 0} / {expToNext || '—'}
            </p>
            <KitBar
              kind="exp"
              ratio={expToNext > 0 ? Math.min(1, (player.exp ?? 0) / expToNext) : 1}
              label="경험치"
            />
          </div>
        </div>

        <div className={styles.sheets}>
        <section className={styles.section}>
          <h3>능력치</h3>
          <div className={styles.resources}>
            <div>
              <p>
                HP {player.currentHp} / {derived.maxHp}
              </p>
              <KitBar
                kind="hp"
                ratio={derived.maxHp > 0 ? player.currentHp / derived.maxHp : 0}
                label="HP"
              />
            </div>
            <div>
              <p>
                MP {player.currentMp} / {derived.maxMp}
              </p>
              <KitBar
                kind="mp"
                ratio={derived.maxMp > 0 ? player.currentMp / derived.maxMp : 0}
                label="MP"
              />
            </div>
          </div>
          <p>공격 {derived.attackPower}</p>
          {player.permanentMods?.attackPercent ||
          player.permanentMods?.rangePercent ||
          player.permanentMods?.maxHpFlat ? (
            <p>
              영구 강화
              {player.permanentMods?.attackPercent ? ` · 공격 +${player.permanentMods.attackPercent}%` : ''}
              {player.permanentMods?.rangePercent ? ` · 사거리 +${player.permanentMods.rangePercent}%` : ''}
              {player.permanentMods?.maxHpFlat ? ` · HP +${player.permanentMods.maxHpFlat}` : ''}
            </p>
          ) : null}
          <p className={styles.points}>남은 포인트: {unspent}</p>
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

        <section className={styles.section}>
          <h3>장비</h3>
          <p>
            [무기] {weaponName}
            {weaponDef?.statBonuses?.attack ? ` · 공격 +${weaponDef.statBonuses.attack}` : ''}
          </p>
          <p>[방어구] {armorName}</p>
          <p>[장신구] {accessoryName}</p>
          <h3>성장</h3>
          {canAdvance ? (
            <p>다음 전직: 검사 / 마법사 / 도적 — 길드에서 선택하세요.</p>
          ) : isAdventurer(player.classId) ? (
            <p>전직은 제1장을 마친 뒤 길드에서 열립니다.</p>
          ) : next.length > 1 ? (
            <p>
              다음: {next.map((item) => getClassRank(item.toRank)?.name ?? item.toRank).join(' / ')}
              <br />
              조건: Lv.{next[0].levelRequirement} + 제1장 완료
            </p>
          ) : next[0] ? (
            <p>
              다음: {getClassRank(next[0].toRank)?.name ?? displayClassName(next[0].familyId, next[0].toRank)}
              <br />
              조건: Lv.{next[0].levelRequirement} · 전직 퀘스트
            </p>
          ) : (
            <p>최종 길에 도달했습니다.</p>
          )}
        </section>

        <section className={styles.section}>
          <h3>스킬</h3>
          <p>기본 공격</p>
          <p>회피</p>
          {skills.map((skill) => (
            <p key={skill.name}>
              <span className={styles.keyGlyph}>{skill.slot}</span>
              {`: ${skill.name}`}
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
        </div>

        {canAdvance ? (
          <p className={styles.hint}>길드에서 검사 / 마법사 / 도적의 길을 선택할 수 있습니다.</p>
        ) : null}
      </div>
    </GameModal>
  );
}

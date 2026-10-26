import { useState } from 'react';
import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import { EQUIPMENT_SLOT, getItemDefinition, ITEM_TYPE } from '@/game/inventory/item-definitions';
import { itemIconPath } from '@/game/inventory/item-icons';
import { compareEquipmentStats, filterInventory, isEquipped, itemDisplayName, type InventoryCategory } from '@/game/inventory/item-selectors';
import { equippedItemId } from '@/game/inventory/equipment-types';
import { canEnhanceHere, enhanceBlockedReason, enhancementLevelOf } from '@/game/inventory/enhancement-rules';
import { enhancementCostFor, isEnhanceableSlot, MAX_ENHANCEMENT_LEVEL } from '@/game/inventory/enhancement-config';
import { audioManager, SFX_ID } from '@/game/audio';
import { GameModal } from '@/components/ui/GameModal';
import styles from './InventoryPanel.module.css';

interface InventoryPanelProps {
  state: GameState;
  dispatch: CommandDispatcher;
  onClose: () => void;
}

const CATEGORIES: readonly { id: InventoryCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'equipment', label: '장비' },
  { id: 'consumable', label: '소모품' },
  { id: 'other', label: '기타' },
];

export function InventoryPanel({ state, dispatch, onClose }: InventoryPanelProps) {
  const [category, setCategory] = useState<InventoryCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const equippedIds = [state.player.equipment?.weapon, state.player.equipment?.armor, state.player.equipment?.accessory].filter(
    (itemId): itemId is string => Boolean(itemId)
  );
  const mergedInventory = [
    ...state.player.inventory,
    ...equippedIds
      .filter((itemId) => !state.player.inventory.some((item) => item.itemId === itemId && item.quantity > 0))
      .map((itemId) => ({ itemId, quantity: 1 })),
  ];
  const items = filterInventory(mergedInventory, category);
  const selected = items.find((item) => item.itemId === selectedId) ?? items[0] ?? null;
  const definition = selected ? getItemDefinition(selected.itemId) : null;
  const equipped = selected ? isEquipped(state.player.equipment, selected.itemId) : false;
  const enhanceLevel = selected ? enhancementLevelOf(state, selected.itemId) : 0;
  const canEnhance = selected && isEnhanceableSlot(definition?.slot) && canEnhanceHere(state);
  const enhanceBlocked = selected && canEnhance ? enhanceBlockedReason(state, selected.itemId) : null;
  const compare =
    definition?.slot && selected
      ? compareEquipmentStats(equippedItemId(state.player.equipment, definition.slot), definition)
      : [];

  return (
    <GameModal title="가방" kicker="소지품" meta={`${state.player.gold} G`} size="xl" onClose={onClose}>
        <div className={styles.tabs}>
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={category === item.id ? styles.tabActive : styles.tab}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.body}>
          <ul className={styles.list}>
            {items.length === 0 ? <li>해당 분류의 아이템이 없습니다.</li> : null}
            {items.map((item) => {
              const info = getItemDefinition(item.itemId);
              const icon = itemIconPath(item.itemId);
              return (
                <li key={item.itemId}>
                  <button
                    type="button"
                    className={selected?.itemId === item.itemId ? styles.itemActive : styles.item}
                    onClick={() => setSelectedId(item.itemId)}
                  >
                    <span
                      className={icon ? styles.itemIcon : styles.icon}
                      style={icon ? { backgroundImage: `url(${icon})` } : undefined}
                      aria-hidden="true"
                    />
                    <span>
                      {itemDisplayName(item.itemId, enhancementLevelOf(state, item.itemId))}
                      {isEquipped(state.player.equipment, item.itemId) ? ' · 장착 중' : ''}
                    </span>
                    <span>×{item.quantity}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.detail}>
            {definition && selected ? (
              <>
                <h3>{itemDisplayName(definition.id, enhanceLevel)}</h3>
                <p>{definition.description}</p>
                {definition.statBonuses?.attack ? <p>공격 +{definition.statBonuses.attack}</p> : null}
                {definition.statBonuses?.hp ? <p>HP +{definition.statBonuses.hp}</p> : null}
                {definition.statBonuses?.mp ? <p>MP +{definition.statBonuses.mp}</p> : null}
                {compare.map((row) => (
                  <p key={row.label}>
                    {row.label} {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </p>
                ))}
                {definition.type === ITEM_TYPE.CONSUMABLE ? (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      audioManager.playSfx(SFX_ID.UI_CONFIRM);
                      dispatch({ type: 'USE_ITEM', itemId: selected.itemId });
                    }}
                  >
                    사용
                  </button>
                ) : null}
                {definition.slot && !equipped ? (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      audioManager.playSfx(SFX_ID.UI_CONFIRM);
                      dispatch({ type: 'EQUIP_ITEM', itemId: selected.itemId });
                    }}
                  >
                    장착
                  </button>
                ) : null}
                {definition.slot && equipped ? (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      audioManager.playSfx(SFX_ID.UI_CONFIRM);
                      dispatch({ type: 'UNEQUIP_ITEM', slot: definition.slot ?? EQUIPMENT_SLOT.WEAPON });
                    }}
                  >
                    해제
                  </button>
                ) : null}
                {canEnhance ? (
                  <>
                    <p>
                      강화 {enhanceLevel} / {MAX_ENHANCEMENT_LEVEL} · {enhancementCostFor(enhanceLevel)}G
                    </p>
                    {enhanceBlocked ? <p>{enhanceBlocked}</p> : null}
                    <button
                      type="button"
                      className={styles.action}
                      disabled={Boolean(enhanceBlocked)}
                      onClick={() => {
                        audioManager.playSfx(SFX_ID.UI_CONFIRM);
                        dispatch({ type: 'ENHANCE_EQUIPMENT', itemId: selected.itemId });
                      }}
                    >
                      강화
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              <p>아이템을 선택하세요.</p>
            )}
          </div>
        </div>
    </GameModal>
  );
}

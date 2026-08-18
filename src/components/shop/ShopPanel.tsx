import { useState } from 'react';
import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import { getItemDefinition } from '@/game/inventory/item-definitions';
import { compareEquipmentStats, isEquipped, itemDisplayName } from '@/game/inventory/item-selectors';
import { equippedItemId } from '@/game/inventory/equipment-types';
import { shopAtLocation } from '@/game/economy/shop-definitions';
import { shopItemIdsFor } from '@/game/economy/shop-stock';
import { buyBlockedReason } from '@/game/economy/shop-rules';
import { canEnhanceHere, enhancementLevelOf, enhanceBlockedReason } from '@/game/inventory/enhancement-rules';
import { enhancementCostFor, isEnhanceableSlot, MAX_ENHANCEMENT_LEVEL } from '@/game/inventory/enhancement-config';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './ShopPanel.module.css';

interface ShopPanelProps {
  state: GameState;
  dispatch: CommandDispatcher;
  onClose: () => void;
}

type ShopTab = 'buy' | 'sell' | 'enhance';

export function ShopPanel({ state, dispatch, onClose }: ShopPanelProps) {
  const shop = shopAtLocation(state.world.currentLocationId);
  const enhanceReady = canEnhanceHere(state);
  const [tab, setTab] = useState<ShopTab>('buy');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const buyItems = shop ? shopItemIdsFor(state, shop.id) : [];
  const sellItems = state.player.inventory.filter((item) => item.quantity > 0);
  const enhanceItems = enhanceableItemIds(state);
  const selectedBuy = selectedId && buyItems.includes(selectedId) ? selectedId : buyItems[0];
  const selectedSell = selectedId && sellItems.some((item) => item.itemId === selectedId) ? selectedId : sellItems[0]?.itemId;
  const selectedEnhance = selectedId && enhanceItems.includes(selectedId) ? selectedId : enhanceItems[0];
  const activeId = tab === 'buy' ? selectedBuy : tab === 'sell' ? selectedSell : selectedEnhance;
  const definition = activeId ? getItemDefinition(activeId) : null;
  const compare =
    definition?.slot && activeId
      ? compareEquipmentStats(equippedItemId(state.player.equipment, definition.slot), definition)
      : [];
  const enhanceLevel = activeId ? enhancementLevelOf(state, activeId) : 0;
  const enhanceCost = enhancementCostFor(enhanceLevel);
  const enhanceBlocked = activeId && tab === 'enhance' ? enhanceBlockedReason(state, activeId) : null;

  return (
    <div className={styles.overlay}>
      <section className={styles.panel} aria-label="상점">
        <header className={styles.header}>
          <div>
            <h2>{shop?.name ?? '상점'}</h2>
            <p>Gold {state.player.gold} G</p>
          </div>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className={styles.tabs}>
          <button type="button" className={tab === 'buy' ? styles.tabActive : styles.tab} onClick={() => setTab('buy')}>
            구매
          </button>
          <button type="button" className={tab === 'sell' ? styles.tabActive : styles.tab} onClick={() => setTab('sell')}>
            판매
          </button>
          {enhanceReady ? (
            <button type="button" className={tab === 'enhance' ? styles.tabActive : styles.tab} onClick={() => setTab('enhance')}>
              장비 강화
            </button>
          ) : null}
        </div>
        <div className={styles.body}>
          <ul className={styles.list}>
            {tab === 'buy'
              ? buyItems.map((itemId) => {
                  const info = getItemDefinition(itemId);
                  return (
                    <li key={itemId}>
                      <button type="button" className={activeId === itemId ? styles.itemActive : styles.item} onClick={() => setSelectedId(itemId)}>
                    {info?.name ?? itemId} · {info?.buyPrice ?? 0}G
                    {state.player.gold < (info?.buyPrice ?? 0) ? ' · 부족' : ''}
                      </button>
                    </li>
                  );
                })
              : tab === 'sell'
                ? sellItems.map((item) => {
                    const info = getItemDefinition(item.itemId);
                    return (
                      <li key={item.itemId}>
                        <button
                          type="button"
                          className={activeId === item.itemId ? styles.itemActive : styles.item}
                          onClick={() => setSelectedId(item.itemId)}
                        >
                          {info?.name ?? item.itemId} ×{item.quantity} · {info?.sellPrice ?? 0}G
                        </button>
                      </li>
                    );
                  })
                : enhanceItems.map((itemId) => {
                    const level = enhancementLevelOf(state, itemId);
                    return (
                      <li key={itemId}>
                        <button
                          type="button"
                          className={activeId === itemId ? styles.itemActive : styles.item}
                          onClick={() => setSelectedId(itemId)}
                        >
                          {itemDisplayName(itemId, level)}
                        </button>
                      </li>
                    );
                  })}
          </ul>
          <div className={styles.detail}>
            {definition ? (
              <>
                <h3>{tab === 'enhance' ? itemDisplayName(definition.id, enhanceLevel) : definition.name}</h3>
                <p>{definition.description}</p>
                {tab !== 'enhance' ? <p>구매 {definition.buyPrice}G · 판매 {definition.sellPrice}G</p> : null}
                {definition.statBonuses?.attack ? <p>Attack +{definition.statBonuses.attack}</p> : null}
                {definition.statBonuses?.hp ? <p>HP +{definition.statBonuses.hp}</p> : null}
                {compare.map((row) => (
                  <p key={row.label}>
                    {row.label} {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </p>
                ))}
                {tab === 'buy' ? (
                  <>
                    {buyBlockedReason(state, definition.id) ? <p>{buyBlockedReason(state, definition.id)}</p> : null}
                    <button
                      type="button"
                      disabled={Boolean(buyBlockedReason(state, definition.id))}
                      onClick={() => {
                        audioManager.playSfx(SFX_ID.UI_CONFIRM);
                        dispatch({ type: 'BUY_ITEM', itemId: definition.id });
                      }}
                    >
                      {state.player.gold < definition.buyPrice ? `${definition.buyPrice - state.player.gold}G 더 모으면` : '구매'}
                    </button>
                  </>
                ) : tab === 'sell' ? (
                  <button
                    type="button"
                    disabled={isEquipped(state.player.equipment, definition.id) || definition.type === 'KEY_ITEM'}
                    onClick={() => {
                      audioManager.playSfx(SFX_ID.UI_CONFIRM);
                      dispatch({ type: 'SELL_ITEM', itemId: definition.id, quantity: 1 });
                    }}
                  >
                    판매
                  </button>
                ) : (
                  <>
                    <p>
                      강화 {enhanceLevel} / {MAX_ENHANCEMENT_LEVEL} · 비용 {enhanceCost}G
                    </p>
                    {enhanceBlocked ? <p>{enhanceBlocked}</p> : null}
                    <button
                      type="button"
                      disabled={Boolean(enhanceBlocked)}
                      onClick={() => {
                        audioManager.playSfx(SFX_ID.UI_CONFIRM);
                        dispatch({ type: 'ENHANCE_EQUIPMENT', itemId: definition.id });
                      }}
                    >
                      강화
                    </button>
                  </>
                )}
              </>
            ) : (
              <p>물건을 선택하세요.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function enhanceableItemIds(state: GameState): string[] {
  const ids = new Set<string>();
  for (const item of state.player.inventory) {
    const definition = getItemDefinition(item.itemId);
    if (definition && isEnhanceableSlot(definition.slot)) {
      ids.add(item.itemId);
    }
  }
  for (const itemId of [state.player.equipment?.weapon, state.player.equipment?.armor]) {
    if (itemId) {
      const definition = getItemDefinition(itemId);
      if (definition && isEnhanceableSlot(definition.slot)) {
        ids.add(itemId);
      }
    }
  }
  return [...ids];
}

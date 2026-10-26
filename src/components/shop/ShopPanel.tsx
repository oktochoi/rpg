import { useState } from 'react';
import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import { getItemDefinition } from '@/game/inventory/item-definitions';
import { itemIconPath } from '@/game/inventory/item-icons';
import { compareEquipmentStats, isEquipped, itemDisplayName } from '@/game/inventory/item-selectors';
import { equippedItemId } from '@/game/inventory/equipment-types';
import { shopAtLocation } from '@/game/economy/shop-definitions';
import { getCombatUpgrade, isCombatUpgradeId } from '@/game/economy/combat-upgrades';
import { shopItemIdsFor } from '@/game/economy/shop-stock';
import { buyBlockedReason } from '@/game/economy/shop-rules';
import { canEnhanceHere, enhancementLevelOf, enhanceBlockedReason } from '@/game/inventory/enhancement-rules';
import { enhancementCostFor, isEnhanceableSlot, MAX_ENHANCEMENT_LEVEL } from '@/game/inventory/enhancement-config';
import { audioManager, SFX_ID } from '@/game/audio';
import { GameModal } from '@/components/ui/GameModal';
import styles from './ShopPanel.module.css';

interface ShopPanelProps {
  state: GameState;
  dispatch: CommandDispatcher;
  onClose: () => void;
}

type ShopTab = 'buy' | 'sell' | 'enhance';

interface ShopListing {
  id: string;
  name: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  kind: 'item' | 'upgrade';
  attackBonus?: number;
  hpBonus?: number;
  upgradeLabel?: string;
}

function listingFor(id: string): ShopListing | null {
  if (isCombatUpgradeId(id)) {
    const upgrade = getCombatUpgrade(id);
    if (!upgrade) {
      return null;
    }
    const parts = [
      upgrade.mods.attackPercent ? `공격력 +${upgrade.mods.attackPercent}%` : null,
      upgrade.mods.rangePercent ? `사거리 +${upgrade.mods.rangePercent}%` : null,
      upgrade.mods.maxHpFlat ? `최대 HP +${upgrade.mods.maxHpFlat}` : null,
    ].filter(Boolean);
    return {
      id,
      name: upgrade.name,
      description: upgrade.description,
      buyPrice: upgrade.buyPrice,
      sellPrice: 0,
      kind: 'upgrade',
      upgradeLabel: parts.join(' · '),
    };
  }
  const definition = getItemDefinition(id);
  if (!definition) {
    return null;
  }
  return {
    id,
    name: definition.name,
    description: definition.description,
    buyPrice: definition.buyPrice,
    sellPrice: definition.sellPrice,
    kind: 'item',
    attackBonus: definition.statBonuses?.attack,
    hpBonus: definition.statBonuses?.hp,
  };
}

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
  const listing = activeId ? listingFor(activeId) : null;
  const itemDefinition = activeId && !isCombatUpgradeId(activeId) ? getItemDefinition(activeId) : null;
  const compare =
    itemDefinition?.slot && activeId
      ? compareEquipmentStats(equippedItemId(state.player.equipment, itemDefinition.slot), itemDefinition)
      : [];
  const enhanceLevel = activeId ? enhancementLevelOf(state, activeId) : 0;
  const enhanceCost = enhancementCostFor(enhanceLevel);
  const enhanceBlocked = activeId && tab === 'enhance' ? enhanceBlockedReason(state, activeId) : null;

  return (
    <GameModal
      title={shop?.name ?? '상점'}
      kicker="거래"
      meta={`${state.player.gold} G`}
      size="xl"
      onClose={onClose}
    >
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
                  const info = listingFor(itemId);
                  return (
                    <li key={itemId}>
                      <button type="button" className={activeId === itemId ? styles.itemActive : styles.item} onClick={() => setSelectedId(itemId)}>
                        <ItemGlyph itemId={itemId} />
                        {info?.kind === 'upgrade' ? '[강화] ' : ''}
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
                          <ItemGlyph itemId={item.itemId} />
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
                          <ItemGlyph itemId={itemId} />
                          {itemDisplayName(itemId, level)}
                        </button>
                      </li>
                    );
                  })}
          </ul>
          <div className={styles.detail}>
            {listing ? (
              <>
                <h3>{tab === 'enhance' && itemDefinition ? itemDisplayName(itemDefinition.id, enhanceLevel) : listing.name}</h3>
                <p>{listing.description}</p>
                {tab !== 'enhance' ? (
                  <p>
                    구매 {listing.buyPrice}G
                    {listing.kind === 'item' ? ` · 판매 ${listing.sellPrice}G` : ' · 1회 영구 강화'}
                  </p>
                ) : null}
                {listing.upgradeLabel ? <p>{listing.upgradeLabel}</p> : null}
                {listing.attackBonus ? <p>공격 +{listing.attackBonus}</p> : null}
                {listing.hpBonus ? <p>HP +{listing.hpBonus}</p> : null}
                {compare.map((row) => (
                  <p key={row.label}>
                    {row.label} {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </p>
                ))}
                {tab === 'buy' ? (
                  <>
                    {buyBlockedReason(state, listing.id) ? <p>{buyBlockedReason(state, listing.id)}</p> : null}
                    <button
                      type="button"
                      className={styles.action}
                      disabled={Boolean(buyBlockedReason(state, listing.id))}
                      onClick={() => {
                        audioManager.playSfx(SFX_ID.UI_CONFIRM);
                        dispatch({ type: 'BUY_ITEM', itemId: listing.id });
                      }}
                    >
                      {state.player.gold < listing.buyPrice ? `${listing.buyPrice - state.player.gold}G 더 모으면` : '구매'}
                    </button>
                  </>
                ) : tab === 'sell' && itemDefinition ? (
                  <button
                    type="button"
                    className={styles.action}
                    disabled={isEquipped(state.player.equipment, itemDefinition.id) || itemDefinition.type === 'KEY_ITEM'}
                    onClick={() => {
                      audioManager.playSfx(SFX_ID.UI_CONFIRM);
                      dispatch({ type: 'SELL_ITEM', itemId: itemDefinition.id, quantity: 1 });
                    }}
                  >
                    판매
                  </button>
                ) : tab === 'enhance' && itemDefinition ? (
                  <>
                    <p>
                      강화 {enhanceLevel} / {MAX_ENHANCEMENT_LEVEL} · 비용 {enhanceCost}G
                    </p>
                    {enhanceBlocked ? <p>{enhanceBlocked}</p> : null}
                    <button
                      type="button"
                      className={styles.action}
                      disabled={Boolean(enhanceBlocked)}
                      onClick={() => {
                        audioManager.playSfx(SFX_ID.UI_CONFIRM);
                        dispatch({ type: 'ENHANCE_EQUIPMENT', itemId: itemDefinition.id });
                      }}
                    >
                      강화
                    </button>
                  </>
                ) : (
                  <p>물건을 선택하세요.</p>
                )}
              </>
            ) : (
              <p>물건을 선택하세요.</p>
            )}
          </div>
        </div>
    </GameModal>
  );
}

function ItemGlyph({ itemId }: { itemId: string }) {
  const icon = itemIconPath(itemId);
  if (!icon) {
    return null;
  }
  return <span className={styles.itemIcon} style={{ backgroundImage: `url(${icon})` }} aria-hidden="true" />;
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

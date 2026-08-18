export const COMBAT_FEEL = {
  enemyHitFlashMs: 90,
  playerHitFlashMs: 100,
  enemyHitColor: 0xfff3ee,
  playerHitColor: 0xfff8ee,

  normalHitStopMs: 32,
  skillHitStopMs: 50,
  receivedHitStopMs: 32,
  receivedHeavyHitStopMs: 60,

  playerHitShakeDurationMs: 45,
  playerHitShakeIntensity: 0.0022,
  skillShakeDurationMs: 55,
  skillShakeIntensity: 0.0046,
  receivedHitShakeDurationMs: 70,
  receivedHitShakeIntensity: 0.0058,
  receivedHeavyShakeDurationMs: 90,
  receivedHeavyShakeIntensity: 0.0084,

  dashAfterImageIntervalMs: 40,
  dashAfterImageLifetimeMs: 140,
  dashAfterImageAlpha: 0.32,

  slashLifetimeMs: 120,
  slashOffset: 26,
  slashLength: 44,
  slashThickness: 6,
  slashColor: 0xfff2d4,

  damageNumberLifetimeMs: 550,
  damageNumberRisePx: 28,

  enemyDeathFadeMs: 280,
  enemyDeathEndScale: 0.5,

  playerDeathFadeMs: 220,
  playerDeathAlpha: 0.42,
  playerDeathColor: 0x6b5a48,

  bossChipShakeScale: 0.28,
  bossDeathHitStopMs: 70,
  bossDeathShakeDurationMs: 130,
  bossDeathShakeIntensity: 0.01,
} as const;

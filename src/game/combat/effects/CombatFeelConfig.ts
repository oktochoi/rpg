export const COMBAT_FEEL = {
  enemyHitFlashMs: 220,
  playerHitFlashMs: 220,
  enemyHitColor: 0xff2a2a,
  playerHitColor: 0xfff8ee,

  normalHitStopMs: 55,
  skillHitStopMs: 70,
  receivedHitStopMs: 55,
  receivedHeavyHitStopMs: 60,

  playerHitShakeDurationMs: 70,
  playerHitShakeIntensity: 0.0055,
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

  damageNumberLifetimeMs: 780,
  damageNumberRisePx: 28,

  enemyDeathFadeMs: 280,
  enemyDeathEndScale: 0.5,

  playerDeathFadeMs: 220,
  playerDeathAlpha: 0.42,
  playerDeathColor: 0x6b5a48,

  bossChipShakeScale: 0.28,
  bossDeathHitStopMs: 140,
  bossDeathShakeDurationMs: 180,
  bossDeathShakeIntensity: 0.01,
} as const;

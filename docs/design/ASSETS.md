# Combat Sprite Assets

PNG files are optional. Missing combat frames use placeholder textures and animation-state fallbacks (bob, flash, fade). Do not treat reference sheets as runtime spritesheets.

Source pack: `rpg_full_sprite_pack_v2` (`public/assets/`). Runtime copies live under `public/game-assets/`. Large sheets live in `docs/art-reference/` and are not combat-preloaded.

## Status

| ENTITY | REFERENCE SHEET | INDIVIDUAL FRAMES | SKILL EFFECT | COMBAT STATUS |
| --- | --- | --- | --- | --- |
| Adventurer | PRESENT (`adventurer_latest_reference_panel.png`, `adventurer_full_reference_sheet.png`) | PRESENT (combat + UI use isolated `adventurer_portrait.png`; panel animation grid is too tight in-source) | MISSING dedicated sheet; uses swordsman slash_basic | sprite |
| Swordsman | PRESENT (`swordsman_latest_reference_panel.png`, `swordsman_full_panel.png`, `swordsman_action_sheet.png`) | PRESENT (combat frames from action sheet RIGHT column; UI `swordsman_portrait.png`) | PRESENT (`slash_basic`, `slash_charge` cropped from `swordsman_skill_effects.png`) | sprite |
| Mage | PRESENT (`mage_latest_reference_panel.png`, `mage_full_panel.png`, `mage_action_sheet.png`) | PRESENT (combat frames from action sheet RIGHT column; UI `mage_portrait.png`) | PRESENT (`frost_nova`, `magic_bolt`/`fireball` cropped from `mage_skill_effects.png`) | sprite |
| Rogue | PRESENT (`rogue_latest_reference_panel.png`, `rogue_full_panel.png`, `rogue_action_sheet.png`) | PRESENT (combat frames from action sheet RIGHT column; UI `rogue_portrait.png`) | PRESENT (`shadow_dash`, `backstab` cropped from `rogue_skill_effects.png`) | sprite |
| Goblin | REFERENCE in `docs/art-reference/` | PRESENT (8 action PNGs) | — | sprite |
| Goblin Archer | REFERENCE in `docs/art-reference/` | PRESENT (8 action PNGs) | — | sprite |
| Brute | REFERENCE in `docs/art-reference/` | PRESENT (8 action PNGs, including charge) | — | sprite |
| Ruins Guardian | REFERENCE in `docs/art-reference/` | PRESENT (idle/walk/slam/cast/hit/death) | charge MISSING / phase2 MISSING | sprite + charge/phase2 effect fallback |

Guardian charge animation: MISSING / FALLBACK (idle or walk + telegraph / motion fade). Charge pattern is unchanged.

Guardian Phase2 dedicated sprite: MISSING / EFFECT FALLBACK (tint, aura, scale pulse).

Projectiles: `magic_bolt` / `fireball` PRESENT (cropped mage orb; fireball is tinted). `enemy_arrow` / `boss_arcane_bolt` MISSING (placeholder). Combat effects `slash_basic`, `slash_charge`, `frost_nova`, `shadow_dash`, `backstab` PRESENT. `guard_shield` / `boss_slam` / `boss_charge` / `boss_phase` MISSING and keep Graphics fallback. Do not load class `*_skill_effects.png` sheets as combat spritesheets.

NPC portraits and story backgrounds use `public/assets/story/` copies under `public/game-assets/`. Emotion variants (`seria_curiosity.png` 등) are MISSING; dialogue uses the neutral portrait. Northern Gate has no pack image and keeps the CSS theme fallback.

## Job → Visual

| Job / Rank | Combat family (unchanged) | Visual id |
| --- | --- | --- |
| ADVENTURER / wanderer | adventurer | adventurer |
| WARRIOR / SWORDSMAN / HIGH_SWORDSMAN / SWORDMASTER | warrior | swordsman |
| MAGE / HIGH_MAGE / ARCHMAGE | mage | mage |
| ROGUE / SHADOW_ROGUE / ASSASSIN_MASTER | rogue | rogue |

Resolver: `resolvePlayerVisual(jobId, rankId?)`. Old WARRIOR saves map to swordsman visual. New Game is Adventurer.

## Paths (runtime)

```
public/game-assets/characters/adventurer/adventurer_idle.png
public/game-assets/characters/adventurer/adventurer_walk_1.png
public/game-assets/characters/adventurer/adventurer_walk_2.png
public/game-assets/characters/adventurer/adventurer_attack_windup.png
public/game-assets/characters/adventurer/adventurer_attack.png
public/game-assets/characters/adventurer/adventurer_dash.png
public/game-assets/characters/adventurer/adventurer_hit.png
public/game-assets/characters/adventurer/adventurer_death.png
public/game-assets/characters/adventurer/adventurer_portrait.png
public/game-assets/characters/adventurer/adventurer_latest_reference_panel.png

public/game-assets/characters/swordsman/swordsman_idle.png
public/game-assets/characters/swordsman/swordsman_walk_1.png
public/game-assets/characters/swordsman/swordsman_walk_2.png
public/game-assets/characters/swordsman/swordsman_attack_windup.png
public/game-assets/characters/swordsman/swordsman_attack.png
public/game-assets/characters/swordsman/swordsman_dash.png
public/game-assets/characters/swordsman/swordsman_hit.png
public/game-assets/characters/swordsman/swordsman_death.png
public/game-assets/characters/swordsman/swordsman_portrait.png
public/game-assets/characters/swordsman/swordsman_latest_reference_panel.png

public/game-assets/characters/mage/mage_idle.png
public/game-assets/characters/mage/mage_walk_1.png
public/game-assets/characters/mage/mage_walk_2.png
public/game-assets/characters/mage/mage_attack_windup.png
public/game-assets/characters/mage/mage_attack.png
public/game-assets/characters/mage/mage_dash.png
public/game-assets/characters/mage/mage_hit.png
public/game-assets/characters/mage/mage_death.png
public/game-assets/characters/mage/mage_portrait.png
public/game-assets/characters/mage/mage_latest_reference_panel.png

public/game-assets/characters/rogue/rogue_idle.png
public/game-assets/characters/rogue/rogue_walk_1.png
public/game-assets/characters/rogue/rogue_walk_2.png
public/game-assets/characters/rogue/rogue_attack_windup.png
public/game-assets/characters/rogue/rogue_attack.png
public/game-assets/characters/rogue/rogue_dash.png
public/game-assets/characters/rogue/rogue_hit.png
public/game-assets/characters/rogue/rogue_death.png
public/game-assets/characters/rogue/rogue_portrait.png
public/game-assets/characters/rogue/rogue_latest_reference_panel.png

public/game-assets/enemies/goblin/goblin_idle.png
public/game-assets/enemies/goblin/goblin_walk_1.png
public/game-assets/enemies/goblin/goblin_walk_2.png
public/game-assets/enemies/goblin/goblin_attack_windup.png
public/game-assets/enemies/goblin/goblin_attack.png
public/game-assets/enemies/goblin/goblin_dash.png
public/game-assets/enemies/goblin/goblin_hit.png
public/game-assets/enemies/goblin/goblin_death.png

public/game-assets/enemies/goblin-archer/goblin_archer_idle.png
public/game-assets/enemies/goblin-archer/goblin_archer_walk_1.png
public/game-assets/enemies/goblin-archer/goblin_archer_walk_2.png
public/game-assets/enemies/goblin-archer/goblin_archer_attack_windup.png
public/game-assets/enemies/goblin-archer/goblin_archer_attack_shot.png
public/game-assets/enemies/goblin-archer/goblin_archer_dash.png
public/game-assets/enemies/goblin-archer/goblin_archer_hit.png
public/game-assets/enemies/goblin-archer/goblin_archer_death.png

public/game-assets/enemies/brute/brute_idle.png
public/game-assets/enemies/brute/brute_walk_1.png
public/game-assets/enemies/brute/brute_walk_2.png
public/game-assets/enemies/brute/brute_attack_windup.png
public/game-assets/enemies/brute/brute_attack_swing.png
public/game-assets/enemies/brute/brute_charge.png
public/game-assets/enemies/brute/brute_hit.png
public/game-assets/enemies/brute/brute_death.png

public/game-assets/bosses/ruins-guardian/ruins_guardian_idle.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_walk_1.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_walk_2.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_slam_windup.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_slam_attack.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_projectile_cast.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_hit.png
public/game-assets/bosses/ruins-guardian/ruins_guardian_death.png

public/game-assets/backgrounds/luen-village/luen_village.png
public/game-assets/backgrounds/blue-moon-inn/blue_moon_inn.png
public/game-assets/backgrounds/adventurers-guild/adventurers_guild.png
public/game-assets/backgrounds/forest-road/forest_road.png
public/game-assets/backgrounds/ancient-ruins/ancient_ruins.png

public/game-assets/npcs/seria/seria_neutral.png
public/game-assets/npcs/leon/leon_neutral.png
public/game-assets/npcs/marta/marta_neutral.png

public/game-assets/effects/slash_basic.png
public/game-assets/effects/slash_charge.png
public/game-assets/effects/frost_nova.png
public/game-assets/effects/shadow_dash.png
public/game-assets/effects/backstab.png
public/game-assets/effects/magic_bolt.png
public/game-assets/effects/fireball.png
```

Player combat uses cropped individual frames (`*_idle.png` and state files). Do not load `*_action_sheet.png` / `*_full_panel.png` / `*_latest_reference_panel.png` as a combat sprite. UI portraits still use `*_latest_reference_panel.png`.

## Visual scale (display only)

Physics body sizes are unchanged.

| Entity | visualSize | origin | notes |
| --- | --- | --- | --- |
| Adventurer / Swordsman / Mage | 108 | 0.5 / 0.88 | similar on-screen height |
| Rogue | 102, scale 0.95 | 0.5 / 0.88 | slightly slim |
| Goblin | 64 | 0.5 / 0.88 | small |
| Goblin Archer | 72 | 0.5 / 0.88 | small |
| Brute | 148 | 0.5 / 0.90 | large |
| Ruins Guardian | 232 | 0.5 / 0.92 | very large |

## Animation keys

```
player_adventurer_idle
player_swordsman_idle
player_mage_idle
player_rogue_idle
enemy_goblin_idle
enemy_goblin_walk
enemy_archer_idle
enemy_archer_walk
enemy_archer_attack_windup
enemy_archer_attack
enemy_archer_dash
enemy_brute_idle
enemy_brute_walk
enemy_brute_attack_windup
enemy_brute_attack
enemy_brute_charge
boss_ruins_guardian_idle
boss_ruins_guardian_walk
boss_ruins_guardian_attack_windup
boss_ruins_guardian_slam
boss_ruins_guardian_burst
boss_ruins_guardian_hit
boss_ruins_guardian_death
```

Archer combat type id stays `archer`. Files live in `enemies/goblin-archer/` with `goblin_archer_*` names.

## Debug

Add `?hitbox=1` in development to show Arcade physics bodies. Production keeps debug off.

## Audio

Audio files are optional. Missing files are a no-op in `AudioManager`. Do not record PRESENT unless the file exists in `public/game-assets/audio`.

| TYPE | ID | FILE | STATUS |
| --- | --- | --- | --- |
| BGM | story_safe | /game-assets/audio/bgm/story_safe.mp3 | MISSING |
| BGM | story_mystery | /game-assets/audio/bgm/story_mystery.mp3 | MISSING |
| BGM | combat_normal | /game-assets/audio/bgm/combat_normal.mp3 | MISSING |
| BGM | combat_boss | /game-assets/audio/bgm/combat_boss.mp3 | MISSING |
| BGM | victory | /game-assets/audio/bgm/victory.mp3 | MISSING |
| BGM | defeat | /game-assets/audio/bgm/defeat.mp3 | MISSING |
| SFX | ui_click | /game-assets/audio/sfx/ui_click.mp3 | MISSING |
| SFX | ui_confirm | /game-assets/audio/sfx/ui_confirm.mp3 | MISSING |
| SFX | ui_cancel | /game-assets/audio/sfx/ui_cancel.mp3 | MISSING |
| SFX | ui_error | /game-assets/audio/sfx/ui_error.mp3 | MISSING |
| SFX | player_attack | /game-assets/audio/sfx/player_attack.mp3 | MISSING |
| SFX | player_dash | /game-assets/audio/sfx/player_dash.mp3 | MISSING |
| SFX | player_hit | /game-assets/audio/sfx/player_hit.mp3 | MISSING |
| SFX | player_death | /game-assets/audio/sfx/player_death.mp3 | MISSING |
| SFX | warrior_charge_slash | /game-assets/audio/sfx/warrior_charge_slash.mp3 | MISSING |
| SFX | warrior_guard | /game-assets/audio/sfx/warrior_guard.mp3 | MISSING |
| SFX | mage_magic_bolt | /game-assets/audio/sfx/mage_magic_bolt.mp3 | MISSING |
| SFX | mage_fireball | /game-assets/audio/sfx/mage_fireball.mp3 | MISSING |
| SFX | mage_frost_nova | /game-assets/audio/sfx/mage_frost_nova.mp3 | MISSING |
| SFX | mage_blink | /game-assets/audio/sfx/mage_blink.mp3 | MISSING |
| SFX | rogue_attack | /game-assets/audio/sfx/rogue_attack.mp3 | MISSING |
| SFX | rogue_shadow_dash | /game-assets/audio/sfx/rogue_shadow_dash.mp3 | MISSING |
| SFX | rogue_backstab | /game-assets/audio/sfx/rogue_backstab.mp3 | MISSING |
| SFX | goblin_attack | /game-assets/audio/sfx/goblin_attack.mp3 | MISSING |
| SFX | archer_shot | /game-assets/audio/sfx/archer_shot.mp3 | MISSING |
| SFX | brute_attack | /game-assets/audio/sfx/brute_attack.mp3 | MISSING |
| SFX | enemy_hit | /game-assets/audio/sfx/enemy_hit.mp3 | MISSING |
| SFX | enemy_death | /game-assets/audio/sfx/enemy_death.mp3 | MISSING |
| SFX | guardian_slam | /game-assets/audio/sfx/guardian_slam.mp3 | MISSING |
| SFX | guardian_projectile | /game-assets/audio/sfx/guardian_projectile.mp3 | MISSING |
| SFX | guardian_charge | /game-assets/audio/sfx/guardian_charge.mp3 | MISSING |
| SFX | guardian_phase2 | /game-assets/audio/sfx/guardian_phase2.mp3 | MISSING |
| SFX | guardian_death | /game-assets/audio/sfx/guardian_death.mp3 | MISSING |
| SFX | combat_start | /game-assets/audio/sfx/combat_start.mp3 | MISSING |
| SFX | victory | /game-assets/audio/sfx/victory.mp3 | MISSING |
| SFX | defeat | /game-assets/audio/sfx/defeat.mp3 | MISSING |
| SFX | quest_update | /game-assets/audio/sfx/quest_update.mp3 | MISSING |
| SFX | important_discovery | /game-assets/audio/sfx/important_discovery.mp3 | MISSING |

Drop licensed files into the paths above. `AudioManager` will pick them up from the registry. Do not download copyright-unclear audio.

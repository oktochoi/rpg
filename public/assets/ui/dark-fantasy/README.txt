RPG Dark Fantasy UI Kit (direct-use pieces)

Use rules:
- All text/numbers should be rendered by React/Phaser, not baked into the UI image.
- *_frame assets are suitable for overlays/panels.
- bar fill images should be width-cropped or mask-scaled according to current value.
- nineSlice values are provided in manifest.json for scalable frames.
- choice/victory/defeat centers were cleared so game text can be drawn dynamically.

Suggested composition:
Player HUD = player_portrait_frame + player_panel_frame + hp/mp bars + skill slots
Boss HUD = boss_frame + boss_hp_bg + boss_hp_fill + dynamic boss name
Dialogue = dialog_frame + nameplate_frame + dynamic portrait/name/dialogue
Objective = objective_card_frame + dynamic objective text
Encounter = encounter_*_banner + dynamic label
Results = victory_frame/defeat_frame + dynamic result text
Rewards = reward_panel_frame + reward_item_slot_* + gold/exp icons + dynamic values

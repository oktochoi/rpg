# AI RPG Development Rules

## Architecture

- This is a single-player AI RPG.
- React handles RPG UI.
- Phaser handles real-time combat only.
- GameState is the single source of truth.

## Critical Rules

1. Never directly mutate GameState from React components.
2. React components may only dispatch Commands.
3. AI may never directly modify GameState.
4. All state changes must happen through validated Events.
5. Phaser owns only temporary CombatState during combat.
6. Phaser must not directly change NPC, Quest, World, or Story state.
7. AI output must be validated with Zod.
8. NPC AI may only receive knowledge the NPC actually knows.
9. Do not change architecture without explicit permission.
10. Do not install new dependencies unless necessary.

## Development

Before changing code:
- inspect existing related files
- preserve current architecture
- modify the smallest possible area

After changing code:
- run TypeScript check
- run lint
- verify build
- report changed files
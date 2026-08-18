import { runStep21EncounterScenarios } from '../src/game/combat/encounters/encounter-scenarios';
import { runStep25BossScenarios } from '../src/game/combat/boss/boss-scenarios';

async function main() {
  const lines = [...(await runStep21EncounterScenarios()), ...(await runStep25BossScenarios())];
  for (const line of lines) {
    console.log(line);
  }
  if (lines.some((line) => line.startsWith('FAIL'))) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { runRuinsKeyHuntScenarios } from '../src/game/quests/ruins-key-hunt-scenarios';

async function main() {
  const lines = await runRuinsKeyHuntScenarios();
  for (const line of lines) {
    console.log(line);
  }
  if (lines.some((line) => line.startsWith('FAIL'))) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

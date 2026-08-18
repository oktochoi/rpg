import { runStep25BossScenarios } from '../src/game/combat/boss/boss-scenarios';

runStep25BossScenarios()
  .then((lines) => {
    for (const line of lines) {
      console.log(line);
    }
    if (lines.some((line) => line.startsWith('FAIL'))) {
      process.exitCode = 1;
    }
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });

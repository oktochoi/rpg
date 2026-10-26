import { runNavigationScenarios } from '../src/game/combat/navigation/navigation-scenarios';

const lines = runNavigationScenarios();
for (const line of lines) {
  console.log(line);
}
if (lines.some((line) => line.startsWith('FAIL'))) {
  process.exit(1);
}

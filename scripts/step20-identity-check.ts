import { runStep20IdentityScenarios } from '../src/game/combat/skills/identity-scenarios';

const lines = runStep20IdentityScenarios();
for (const line of lines) {
  console.log(line);
}
if (lines.some((line) => line.startsWith('FAIL'))) {
  process.exitCode = 1;
}

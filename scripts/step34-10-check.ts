import { runStep3410Scenarios } from '../src/game/app-flow/step34-10-scenarios';
import { runStep349Scenarios } from '../src/game/app-flow/step34-9-scenarios';

async function main() {
  const lines = [...(await runStep3410Scenarios()), ...(await runStep349Scenarios())];
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

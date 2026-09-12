import { readFile } from "node:fs/promises";

import {
  runCurrentMusicBrainzBenchmark,
  validateFixture,
} from "./catalogue-quality-lib.mjs";

const fixtureUrl = new URL(
  "../catalogue-quality/fixture.json",
  import.meta.url,
);
const fixture = validateFixture(JSON.parse(await readFile(fixtureUrl, "utf8")));
const baseline = await runCurrentMusicBrainzBenchmark(fixture);

const spacing = process.argv.includes("--compact") ? 0 : 2;
process.stdout.write(`${JSON.stringify(baseline, null, spacing)}\n`);

if (
  baseline.results.some(
    (result) =>
      result.status === "request_failed" ||
      result.status === "malformed_response",
  )
) {
  process.exitCode = 1;
}

import { readFile } from "node:fs/promises";

import { validateFixture } from "./catalogue-quality-lib.mjs";
import { runProviderBenchmark } from "./catalogue-provider-comparison-lib.mjs";

const fixtureUrl = new URL(
  "../catalogue-quality/fixture.json",
  import.meta.url,
);
const fixture = validateFixture(JSON.parse(await readFile(fixtureUrl, "utf8")));
const requestedProvider = process.argv
  .find((argument) => argument.startsWith("--provider="))
  ?.split("=")[1];
const requestedCases = process.argv
  .find((argument) => argument.startsWith("--case="))
  ?.split("=")[1]
  ?.split(",")
  .filter(Boolean);
const probeArtwork = process.argv.includes("--artwork");
const providerIds = requestedProvider
  ? [requestedProvider]
  : ["musicbrainz_release_group", "itunes_album"];
const results = [];

for (const providerId of providerIds) {
  results.push(
    await runProviderBenchmark(fixture, providerId, {
      caseIds: requestedCases,
      probeArtwork,
    }),
  );
}

const output = { fixtureVersion: fixture.version, results };
const spacing = process.argv.includes("--compact") ? 0 : 2;
process.stdout.write(`${JSON.stringify(output, null, spacing)}\n`);

if (
  results.some((benchmark) =>
    benchmark.results.some((result) =>
      ["request_failed", "malformed_response"].includes(result.status),
    ),
  )
) {
  process.exitCode = 1;
}

import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { createLocalReleaseEnvironment } from "./local-release-environment.mjs";

const executableSuffix = process.platform === "win32" ? ".cmd" : "";
const supabaseExecutable = join(
  process.cwd(),
  "node_modules",
  ".bin",
  `supabase${executableSuffix}`,
);
const playwrightExecutable = join(
  process.cwd(),
  "node_modules",
  ".bin",
  `playwright${executableSuffix}`,
);
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";

function fail(message, result) {
  console.error(message);
  if (result?.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

const statusResult = spawnSync(supabaseExecutable, ["status", "-o", "json"], {
  encoding: "utf8",
  env: {
    ...process.env,
    SUPABASE_TELEMETRY_DISABLED: "1",
  },
  maxBuffer: 1024 * 1024,
});

if (statusResult.status !== 0) {
  fail(
    "Could not read the local Supabase status. Start it with `npx supabase start` and try again.",
    statusResult,
  );
}

let releaseEnvironment;
try {
  releaseEnvironment = createLocalReleaseEnvironment(statusResult.stdout);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const buildResult = spawnSync(npmExecutable, ["run", "build"], {
  env: releaseEnvironment,
  stdio: "inherit",
});

if (buildResult.status !== 0) process.exit(buildResult.status ?? 1);

const browserResult = spawnSync(playwrightExecutable, ["test"], {
  env: releaseEnvironment,
  stdio: "inherit",
});

process.exit(browserResult.status ?? 1);

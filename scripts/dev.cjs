const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const command = process.argv[2] || "start";
const isWindows = process.platform === "win32";
const allowedCommands = new Set(["start", "stop", "stop-all"]);

if (!allowedCommands.has(command)) {
  console.error("Usage: node scripts/dev.cjs <start|stop|stop-all>");
  process.exit(1);
}

function run(cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd: rootDir,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    windowsHide: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

if (isWindows) {
  const script =
    command === "start"
      ? path.join("scripts", "run-all.ps1")
      : path.join("scripts", "stop-all.ps1");
  const env = command === "stop-all" ? { STOP_XAMPP: "1" } : {};

  run("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    script,
  ], env);
} else {
  const script =
    command === "start"
      ? path.join("scripts", "run-all.sh")
      : path.join("scripts", "stop-all.sh");
  const env = command === "stop-all" ? { STOP_XAMPP: "1" } : {};

  run("bash", [script], env);
}

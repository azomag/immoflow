const { spawn } = require("node:child_process");
const path = require("node:path");

const action = process.argv[2];
const allowedActions = new Set(["start", "stop", "status"]);

if (!allowedActions.has(action)) {
  console.error("Usage: node scripts/xampp.cjs <start|stop|status>");
  process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";

function run(cmd, args) {
  const child = spawn(cmd, args, {
    cwd: rootDir,
    env: process.env,
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
  run("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join("scripts", "xampp.ps1"),
    "-Action",
    action,
  ]);
} else {
  const xamppCommand = process.env.XAMPP_CMD || "/opt/lampp/lampp";

  if (typeof process.getuid === "function" && process.getuid() === 0) {
    run(xamppCommand, [action]);
  } else {
    run("sudo", [xamppCommand, action]);
  }
}

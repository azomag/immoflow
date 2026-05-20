# ImmoFlow

Run the full project from the repository root with one command on Linux, macOS, or Windows:

```bash
npm run dev
```

This starts:

- XAMPP Apache and MySQL for phpMyAdmin
- Laravel API on `http://127.0.0.1:8001`
- Next.js frontend on `http://127.0.0.1:3001`
- phpMyAdmin at `http://127.0.0.1/phpmyadmin/`

Stop the Laravel and Next.js dev servers with:

```bash
npm run stop
```

Use `npm run stop:all` when you also want to stop XAMPP.

On a fresh clone, the command also installs missing dependencies, creates missing env files from the examples, configures the Laravel app for MySQL, creates the `immoflow` database when possible, and runs migrations.

If a default port is already in use, the script automatically chooses the next free port and prints the URL.
You can also force specific ports.

Linux/macOS:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=3001 npm run dev
```

Windows PowerShell:

```powershell
$env:BACKEND_PORT=8001; $env:FRONTEND_PORT=3001; npm run dev
```

To manage only XAMPP:

```bash
npm run xampp:start
npm run xampp:stop
npm run xampp:status
```

To skip XAMPP when it is already running.

Linux/macOS:

```bash
START_XAMPP=0 npm run dev
```

Windows PowerShell:

```powershell
$env:START_XAMPP=0; npm run dev
```

## Windows setup

Before running the project on Windows, install:

- Node.js LTS
- Composer
- XAMPP, preferably in `C:\xampp`

If XAMPP is installed somewhere else, set `XAMPP_DIR` before running the project:

```powershell
$env:XAMPP_DIR="D:\xampp"; npm run dev
```

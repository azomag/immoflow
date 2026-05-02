# ImmoFlow

Run the full project from the repository root with one command:

```bash
npm run dev
```

This starts:

- XAMPP Apache and MySQL for phpMyAdmin
- Laravel API on `http://127.0.0.1:8001`
- Next.js frontend on `http://127.0.0.1:3001`
- phpMyAdmin at `http://127.0.0.1/phpmyadmin/`

Press `Ctrl+C` in the terminal to stop the Laravel and Next.js dev servers.
Use `npm run xampp:stop` when you want to stop XAMPP.

On a fresh clone, the command also installs missing dependencies and creates missing env files from the examples.

If a default port is already in use, the script automatically chooses the next free port and prints the URL.
You can also force specific ports:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=3001 npm run dev
```

To manage only XAMPP:

```bash
npm run xampp:start
npm run xampp:stop
npm run xampp:status
```

To skip XAMPP when it is already running:

```bash
START_XAMPP=0 npm run dev
```

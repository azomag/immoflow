"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl, getBackendPing } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Checking backend connection...");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    async function checkBackendConnection() {
      try {
        const data = await getBackendPing();
        setStatus("connected");
        setMessage(data.message);
        setTimestamp(data.timestamp);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to connect to backend",
        );
      }
    }

    checkBackendConnection();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Frontend to Backend Link</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Backend URL: <span className="font-mono">{getApiBaseUrl()}</span>
      </p>
      <div
        className={`w-full rounded-lg border p-6 ${
          status === "connected"
            ? "border-green-500/40 bg-green-50 dark:bg-green-900/20"
            : status === "error"
              ? "border-red-500/40 bg-red-50 dark:bg-red-900/20"
              : "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        <p className="text-lg font-semibold">
          {status === "connected"
            ? "Connected"
            : status === "error"
              ? "Connection Failed"
              : "Checking..."}
        </p>
        <p className="mt-2 break-words">{message}</p>
        {timestamp ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Response time: {timestamp}
          </p>
        ) : null}
      </div>
    </main>
  );
}

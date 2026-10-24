// Real React -> Laravel browser test. Never runs against the user's database.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backend = resolve(frontend, "../backend");
const temp = mkdtempSync(resolve(tmpdir(), "queuenow-e2e-"));
const database = resolve(temp, "test.sqlite");
writeFileSync(database, "");
const password = randomBytes(24).toString("hex");
const env = {
  ...process.env,
  APP_ENV: "testing",
  APP_DEBUG: "false",
  APP_KEY: `base64:${randomBytes(32).toString("base64")}`,
  DB_CONNECTION: "sqlite",
  DB_DATABASE: database,
  DB_URL: "",
  CACHE_STORE: "array",
  SESSION_DRIVER: "array",
  E2E_PASSWORD: password,
};
const php = process.env.PHP_BIN || "php";
const children = [];
let browser;
function command(args) {
  const result = spawnSync(php, args, { cwd: backend, env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
}
function start(cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => {
    logs += data;
  });
  child.stderr.on("data", (data) => {
    logs += data;
  });
  child.on("error", (error) => {
    logs += error.message;
  });
  children.push(child);
  return () => logs;
}
async function ready(url, logs) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* Starting up. */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server not ready: ${url}\n${logs()}`);
}
try {
  command(["artisan", "migrate", "--force", "--no-interaction"]);
  command(["tests/Fixtures/e2e.php"]);
  const apiLogs = start(php, ["-S", "127.0.0.1:8000", "-t", "public"], backend);
  const viteLogs = start(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--strictPort"],
    frontend,
  );
  await ready("http://127.0.0.1:8000/api/v1/services", apiLogs);
  await ready("http://127.0.0.1:5173", viteLogs);
  browser = await chromium.launch({ headless: true });
  const patient = await browser.newPage();
  const employee = await browser.newPage();
  const errors = [];
  for (const page of [patient, employee])
    page.on("pageerror", (error) => errors.push(error.message));
  await patient.goto("http://127.0.0.1:5173/services");
  await patient
    .locator("article")
    .filter({ hasText: "Consultation E2E" })
    .getByRole("link")
    .click();
  await patient.getByRole("button", { name: /Take a Ticket/ }).click();
  await expect(patient).toHaveURL(/ticket-success\/\d+/);
  await patient.getByRole("button", { name: "View My Queue" }).click();
  await expect(
    patient.getByText("You are in the queue. Please stay nearby."),
  ).toBeVisible();
  await patient.reload();
  await expect(
    patient.getByText("You are in the queue. Please stay nearby."),
  ).toBeVisible();
  await employee.goto("http://127.0.0.1:5173/login");
  await employee
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("e2e@example.test");
  await employee.locator("input[type=password]").fill(password);
  await employee.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(employee).toHaveURL("http://127.0.0.1:5173/employee");
  await employee
    .getByRole("button", { name: "Next Ticket", exact: true })
    .click();
  await expect(
    employee.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible();
  await expect(
    employee.getByRole("button", { name: "Next Ticket", exact: true }),
  ).toBeDisabled();
  await expect(employee.getByRole("button", { name: /Cancel/ })).toHaveCount(0);
  await expect(
    patient.getByText("You have been called. Please be ready."),
  ).toBeVisible({ timeout: 15000 });
  await employee.getByRole("button", { name: "Start", exact: true }).click();
  await employee.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    patient.getByText("Your service is complete. Thank you!"),
  ).toBeVisible({ timeout: 15000 });
  // New ticket -> patient cancellation and server error display.
  await patient.goto("http://127.0.0.1:5173/services/1");
  await patient.getByRole("button", { name: /Take a Ticket/ }).click();
  await patient.getByRole("button", { name: "View My Queue" }).click();
  await patient.getByRole("button", { name: "Cancel My Queue" }).click();
  await patient.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(patient.getByText("Your queue was cancelled.")).toBeVisible();
  // Called tickets can be skipped, but cannot be cancelled by an employee.
  await patient.goto("http://127.0.0.1:5173/services/1");
  await patient.getByRole("button", { name: /Take a Ticket/ }).click();
  await patient.getByRole("button", { name: "View My Queue" }).click();
  await expect(employee.getByRole("button", { name: "Next Ticket", exact: true })).toBeEnabled({ timeout: 15000 });
  await employee.getByRole("button", { name: "Next Ticket", exact: true }).click();
  await employee.getByRole("button", { name: "Skip", exact: true }).click();
  await employee.getByRole("button", { name: "Skip Ticket", exact: true }).click();
  await expect(patient.getByText("This ticket was skipped. It remains stored.")).toBeVisible({ timeout: 15000 });
  // A ticket from another service never appears in this employee's queue.
  const other = await fetch("http://127.0.0.1:8000/api/v1/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ service_id: 2 }),
  });
  assert.equal(other.status, 201);
  await employee.reload();
  await expect(employee.getByText("Other E2E", { exact: true })).toHaveCount(0);
  await patient.goto("http://127.0.0.1:5173/queue/999999");
  await expect(patient.getByRole("alert")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real browser take/reload/login/next/start/done/poll/cancel/skip/service filtering/error flow",
  );
} finally {
  await browser?.close();
  for (const child of children) child.kill("SIGTERM");
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) resolve();
          else child.once("exit", resolve);
        }),
    ),
  );
  rmSync(temp, { recursive: true, force: true });
}

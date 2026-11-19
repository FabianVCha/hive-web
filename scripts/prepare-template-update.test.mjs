import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./prepare-template-update.mjs", import.meta.url));

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function initRepository(directory) {
  await mkdir(directory, { recursive: true });
  git(directory, "init", "-q", "-b", "main");
  git(directory, "config", "user.email", "template-test@example.com");
  git(directory, "config", "user.name", "Template Test");
}

async function hash(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

test("conflicting update leaves branch, remote, HEAD, status, and files unchanged", async () => {
  const root = await mkdtemp(join(tmpdir(), "template-update-test-"));
  const source = join(root, "source");
  const derived = join(root, "derived");

  try {
    await initRepository(source);
    await mkdir(join(source, "apps/storefront/data"), { recursive: true });
    await mkdir(join(source, "apps"), { recursive: true });
    await writeFile(join(source, "template-manifest.json"), JSON.stringify({
      schemaVersion: 1,
      template: { name: "hive-web", version: "0.1.0" },
      project: { id: "template", configPath: "apps/storefront/data/project-config.mjs" },
      sync: {
        strategy: "pull-request",
        baseBranch: "main",
        templateRef: "main",
        projectOwnedPaths: ["apps/storefront/data/project-config.mjs"],
        templateOwnedPaths: ["apps/"],
      },
    }, null, 2) + "\n");
    await writeFile(join(source, "apps/storefront/data/project-config.mjs"), "template config\n");
    await writeFile(join(source, "apps/core.txt"), "base\n");
    git(source, "add", ".");
    git(source, "commit", "-qm", "template base");

    git(root, "clone", "-q", source, derived);
    git(derived, "config", "user.email", "template-test@example.com");
    git(derived, "config", "user.name", "Template Test");
    await cp(scriptPath, join(derived, "prepare-template-update.mjs"));
    git(derived, "add", "prepare-template-update.mjs");
    git(derived, "commit", "-qm", "test harness");
    await rm(join(derived, "apps/core.txt"));
    git(derived, "add", "-u");
    git(derived, "commit", "-qm", "derived deletes conflicting file");

    await writeFile(join(source, "apps/core.txt"), "template changed\n");
    git(source, "add", ".");
    git(source, "commit", "-qm", "template changes conflicting file");

    const before = {
      branch: git(derived, "branch", "--show-current"),
      head: git(derived, "rev-parse", "HEAD"),
      remotes: git(derived, "remote"),
      status: git(derived, "status", "--porcelain=v1"),
      manifest: await hash(join(derived, "template-manifest.json")),
      config: await hash(join(derived, "apps/storefront/data/project-config.mjs")),
    };
    const result = spawnSync(process.execPath, ["prepare-template-update.mjs"], {
      cwd: derived,
      env: {
        ...process.env,
        TEMPLATE_REMOTE: source,
        TEMPLATE_REF: "main",
        UPDATE_BRANCH: "chore/template-conflict",
      },
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.equal(git(derived, "branch", "--show-current"), before.branch);
    assert.equal(git(derived, "rev-parse", "HEAD"), before.head);
    assert.equal(git(derived, "remote"), before.remotes);
    assert.equal(git(derived, "status", "--porcelain=v1"), before.status);
    assert.equal(await hash(join(derived, "template-manifest.json")), before.manifest);
    assert.equal(await hash(join(derived, "apps/storefront/data/project-config.mjs")), before.config);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

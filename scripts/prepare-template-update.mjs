import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const manifestPath = resolve(process.env.TEMPLATE_MANIFEST ?? "template-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const remoteUrl = process.env.TEMPLATE_REMOTE;
const templateRef = process.env.TEMPLATE_REF || manifest.sync.templateRef;
const updateBranch = process.env.UPDATE_BRANCH;
const projectId = manifest.project?.id;

if (!remoteUrl) throw new Error("TEMPLATE_REMOTE is required");
if (!updateBranch) throw new Error("UPDATE_BRANCH is required");

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const trackedFiles = git("ls-files", "-z").split("\0").filter(Boolean);

function globToRegExp(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length;) {
    if (glob.startsWith("**", index)) {
      pattern += ".*";
      index += 2;
    } else if (glob[index] === "*") {
      pattern += "[^/]*";
      index += 1;
    } else {
      pattern += glob[index].replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
      index += 1;
    }
  }
  return new RegExp(`^${pattern}$`);
}

function matchesAnyPath(path, patterns) {
  return patterns.some(pattern => globToRegExp(pattern).test(path));
}

const projectOwnedFiles = trackedFiles.filter(path =>
  matchesAnyPath(path, manifest.sync.projectOwnedPaths),
);
const savedProjectFiles = new Map(
  projectOwnedFiles.map(path => [path, Buffer.from(execFileSync("git", ["show", `HEAD:${path}`]))]),
);

try {
  try {
    git("remote", "get-url", "template");
  } catch {
    git("remote", "add", "template", remoteUrl);
  }

  git("fetch", "template", `${templateRef}:refs/remotes/template/${templateRef}`);
  const sourceManifest = JSON.parse(git("show", `refs/remotes/template/${templateRef}:template-manifest.json`));
  git("switch", "-c", updateBranch);
  try {
    // Prefer the derived project's side for conflicts. Project-owned files and
    // metadata are restored explicitly below, while template-owned changes
    // still enter the proposed branch and remain visible in the PR.
    git("merge", "--no-commit", "--no-ff", "-X", "ours", `refs/remotes/template/${templateRef}`);
  } catch (error) {
    try {
      git("merge", "--abort");
    } catch {
      // Preserve the original merge failure; the workflow must stop for review.
    }
    throw new Error(`Template merge has conflicts; resolve them manually in a PR: ${error.message}`);
  }

  for (const [path, content] of savedProjectFiles) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }

  const mergedManifest = {
    ...sourceManifest,
    project: { ...sourceManifest.project, id: projectId || sourceManifest.project.id },
  };
  await writeFile(manifestPath, `${JSON.stringify(mergedManifest, null, 2)}\n`);

  git("add", "--all");
  let changed = true;
  try {
    git("diff", "--cached", "--quiet");
    changed = false;
  } catch {
    // A non-zero status means the staged update contains changes.
  }
  if (changed) {
    git("commit", "-m", `chore(template): update from ${templateRef}`);
  }

  console.log(JSON.stringify({
    branch: updateBranch,
    templateRef,
    preservedProjectFiles: [...savedProjectFiles.keys()],
    changed,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

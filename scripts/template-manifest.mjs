import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const MANIFEST_PATH = resolve(process.cwd(), "template-manifest.json");

export async function readTemplateManifest(path = MANIFEST_PATH) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function validateTemplateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") return ["manifest must be an object"];
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!manifest.template || typeof manifest.template.name !== "string" || !manifest.template.name) {
    errors.push("template.name is required");
  }
  if (!manifest.template || !/^\d+\.\d+\.\d+$/.test(manifest.template.version ?? "")) {
    errors.push("template.version must use semantic versioning");
  }
  if (!manifest.project || typeof manifest.project.id !== "string" || !manifest.project.id) {
    errors.push("project.id is required");
  }
  if (!manifest.project || typeof manifest.project.configPath !== "string" || !manifest.project.configPath) {
    errors.push("project.configPath is required");
  }
  if (!manifest.sync || manifest.sync.strategy !== "pull-request") {
    errors.push("sync.strategy must be pull-request");
  }
  if (!manifest.sync || manifest.sync.baseBranch !== "main") {
    errors.push("sync.baseBranch must be main");
  }
  for (const key of ["projectOwnedPaths", "templateOwnedPaths"]) {
    if (!Array.isArray(manifest.sync?.[key]) || manifest.sync[key].length === 0) {
      errors.push(`sync.${key} must contain at least one path`);
    }
  }
  if (!manifest.sync?.projectOwnedPaths?.includes(manifest.project?.configPath)) {
    errors.push("project.configPath must be listed in sync.projectOwnedPaths");
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = await readTemplateManifest();
  const errors = validateTemplateManifest(manifest);
  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Template manifest valid: ${manifest.template.name} ${manifest.template.version}`);
  }
}

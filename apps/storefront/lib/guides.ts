import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { storefront } from "../data/storefront.mjs";
import { isDemoEnabled } from "./prototype.mjs";

const GUIDES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "content", "guias");

export type Guide = {
  slug: string;
  title: string;
  updated: string | null;
  markdown: string;
};

function parseFrontMatter(raw: string): { data: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: raw };
  }
  const header = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  const data: Record<string, string> = {};
  for (const line of header.split("\n")) {
    const separator = line.indexOf(":");
    if (separator > 0) {
      data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }
  return { data, body };
}

export async function listGuides(): Promise<Omit<Guide, "markdown">[]> {
  if (isDemoEnabled(process.env.FERREADY_DEMO)) return storefront.guides.map(({ markdown, ...guide }) => guide);
  let files: string[] = [];
  try {
    files = await readdir(GUIDES_DIR);
  } catch {
    return [];
  }

  const guides = [];
  for (const file of files.filter((name) => name.endsWith(".md") && name !== "README.md")) {
    const raw = await readFile(join(GUIDES_DIR, file), "utf8");
    const { data, body } = parseFrontMatter(raw);
    const heading = body.match(/^#\s+(.+)$/m);
    guides.push({
      slug: file.replace(/\.md$/, ""),
      title: data.title ?? heading?.[1] ?? file.replace(/\.md$/, ""),
      updated: data.updated ?? null,
    });
  }
  return guides.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getGuide(slug: string): Promise<Guide | null> {
  if (isDemoEnabled(process.env.FERREADY_DEMO)) return storefront.guides.find(guide => guide.slug === slug) ?? null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }
  try {
    const raw = await readFile(join(GUIDES_DIR, `${slug}.md`), "utf8");
    const { data, body } = parseFrontMatter(raw);
    const heading = body.match(/^#\s+(.+)$/m);
    return {
      slug,
      title: data.title ?? heading?.[1] ?? slug,
      updated: data.updated ?? null,
      markdown: body,
    };
  } catch {
    return null;
  }
}

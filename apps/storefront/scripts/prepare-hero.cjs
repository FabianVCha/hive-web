// Preserve the original generated PNGs; only derived WebP files are written.
const sharp = require('sharp');
const path = require('node:path');
const root = path.join(__dirname, '../public/ferready/hero');
(async () => {
  for (const name of ['drill', 'toolkit', 'shears']) {
    const source = path.join(root, `${name}-ai.png`);
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const hasTransparency = data.some((value, i) => i % channels === 3 && value < 255);
    // Legacy opaque sources: remove only near-white pixels connected to an edge.
    if (!hasTransparency) {
      const seen = new Uint8Array(width * height);
      const queue = [];
      const visit = (p) => {
        if (seen[p]) return;
        seen[p] = 1;
        const i = p * channels;
        if (data[i] < 242 || data[i + 1] < 242 || data[i + 2] < 242) return;
        data[i + 3] = 0;
        queue.push(p);
      };
      for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
      for (let q = 0; q < queue.length; q++) {
        const p = queue[q], x = p % width, y = Math.floor(p / width);
        if (x) visit(p - 1);
        if (x < width - 1) visit(p + 1);
        if (y) visit(p - width);
        if (y < height - 1) visit(p + width);
      }
    }
    let left = width, top = height, right = 0, bottom = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 8) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    if (right <= left || bottom <= top) throw new Error(`Empty alpha: ${name}`);
    const output = path.join(root, `${name}.webp`);
    await sharp(data, { raw: info }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: '#00000000' }).webp({ quality: 88, alphaQuality: 100 }).toFile(output);
    console.log(JSON.stringify({ name, nativeAlpha: hasTransparency, output, bytes: require('node:fs').statSync(output).size }));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

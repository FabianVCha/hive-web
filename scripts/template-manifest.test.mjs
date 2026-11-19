import test from 'node:test';
import assert from 'node:assert/strict';
import { readTemplateManifest, validateTemplateManifest } from './template-manifest.mjs';

test('template manifest describes a pull-request update boundary', async () => {
  const manifest = await readTemplateManifest();
  assert.deepEqual(validateTemplateManifest(manifest), []);
  assert.equal(manifest.sync.strategy, 'pull-request');
  assert.equal(manifest.sync.baseBranch, 'main');
  assert(manifest.sync.projectOwnedPaths.includes('apps/storefront/data/project-config.mjs'));
  assert(manifest.sync.templateOwnedPaths.includes('apps/'));
});

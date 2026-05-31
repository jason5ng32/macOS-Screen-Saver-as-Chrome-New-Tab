import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import manifest from './src/manifest.config.js';

// Required env vars — build fails fast if any of these are missing or
// blank. Inlined into the published bundle. See .env.example for what
// each one is for.
const REQUIRED_ENV = ['VITE_MACIFY_BASE'];

export default defineConfig(({ mode }) => {
  // loadEnv() resolves its envDir argument relative to process.cwd(),
  // which is already the project root when invoked via `pnpm run build`.
  // The vite `envDir` config is resolved relative to vite's `root`
  // (= 'src'), so '..' points to the same project root.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const missing = REQUIRED_ENV.filter((k) => !env[k] || !env[k].trim());
  if (missing.length > 0) {
    throw new Error(
      `\n\nMissing required env var(s): ${missing.join(', ')}\n` +
        `Set them in .env (or .env.local). See .env.example for what each one is for.\n`,
    );
  }

  return {
    root: 'src',
    envDir: '..',
    publicDir: false,
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    plugins: [
      tailwindcss(),
      svelte(),
      crx({ manifest }),
      Icons({ compiler: 'svelte' }),
    ],
  };
});

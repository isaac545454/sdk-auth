import nucleusPreset from '@isaac545454/nucleus/tailwind-preset';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Config } from 'tailwindcss';

const require = createRequire(import.meta.url);
const nucleusRoot = dirname(require.resolve('@isaac545454/nucleus/tailwind-preset'));

export default {
  presets: [nucleusPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    join(nucleusRoot, 'dist/**/*.js'),
  ],
} satisfies Config;

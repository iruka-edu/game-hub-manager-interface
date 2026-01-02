import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'validation/index': 'src/validation/index.ts',
    'utils/index': 'src/utils/index.ts',
    'runtime/index': 'src/runtime/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: [],
  noExternal: ['zod'],
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
});
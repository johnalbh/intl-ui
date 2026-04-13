import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
  external: [
    '@angular/core',
    '@angular/forms',
    '@angular/common',
    '@intl-ui/core',
    'rxjs',
  ],
});

import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/shelf-pack.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/shelf-pack.umd.js',
      format: 'umd',
      name: 'ShelfPack',
      sourcemap: true,
    },
  ],
  plugins: [typescript()],
};

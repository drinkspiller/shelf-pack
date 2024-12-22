import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/shelf-pack.esm.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/shelf-pack.umd.js",
      format: "umd",
      name: "ShelfPack",
      sourcemap: true,
    },
    {
      file: "dist/shelf-pack.min.js",
      format: "umd",
      name: "ShelfPack",
      sourcemap: true,
      plugins: [
        terser({
          module: false,
        }),
      ],
    },
  ],
  plugins: [typescript()],
};

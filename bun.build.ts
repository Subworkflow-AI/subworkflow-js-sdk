await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: true,
  sourcemap: "linked",
  target: "node",
  format: "esm",
  drop: ["debugger"],
  banner: `/** ${(new Date()).getFullYear()} © Subworkflow AI Limited. https://subworkflow.ai **/`,
});

export {};
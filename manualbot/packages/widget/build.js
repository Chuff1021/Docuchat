/**
 * Widget build script using esbuild.
 * Bundles src/widget.ts into a single self-contained widget.js file.
 *
 * Usage:
 *   node build.js           # Production build
 *   node build.js --watch   # Watch mode for development
 */

const esbuild = require("esbuild");
const path = require("path");

const isWatch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: [path.join(__dirname, "src/widget.ts")],
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: ["es2017", "chrome58", "firefox57", "safari11"],
  outfile: path.join(__dirname, "dist/widget.js"),
  platform: "browser",
  format: "iife",
  globalName: "ManualBotWidgetLib",
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
  },
  banner: {
    js: `/* ManualBot Widget v1.0.0 | MIT License | https://manualbot.ai */`,
  },
};

if (isWatch) {
  esbuild
    .context(buildOptions)
    .then((ctx) => {
      ctx.watch();
      console.log("👀 Watching for changes...");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  esbuild
    .build(buildOptions)
    .then(() => {
      console.log("✅ Widget built successfully → dist/widget.js");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

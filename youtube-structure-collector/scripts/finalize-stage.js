#!/usr/bin/env node
"use strict";

// Rewrites popup.html and manifest.json to point at the bundled files
// build.sh writes into the staging directory, instead of the multi-file
// src/ layout used for local unpacked development.

const fs = require("fs");
const path = require("path");

const stage = process.argv[2];
if (!stage) throw new Error("Usage: finalize-stage.js <stage-dir>");

const html = fs
  .readFileSync("src/popup/popup.html", "utf8")
  .replace('    <script src="../lib/structure-utils.js"></script>\n', "")
  .replace('src="popup.js"', 'src="popup.bundle.js"');
fs.writeFileSync(path.join(stage, "src/popup.html"), html);

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
manifest.action.default_popup = "src/popup.html";
manifest.content_scripts[0].js = ["src/content.bundle.js"];
manifest.content_scripts[0].css = ["src/content.css"];
fs.writeFileSync(path.join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

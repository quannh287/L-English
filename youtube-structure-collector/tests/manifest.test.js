const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));

test("manifest references existing extension files", () => {
  const referencedFiles = [
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    ...manifest.content_scripts.flatMap(({ js = [], css = [] }) => [...js, ...css])
  ];

  for (const file of referencedFiles) {
    assert.equal(fs.existsSync(path.join(projectRoot, file)), true, `${file} does not exist`);
  }
});

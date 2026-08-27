import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/quannh2871/Documents/ChatGPT/L-English/outputs/video-english-structures";
const videoLink = "https://www.youtube.com/watch?v=dUDi-F6eAvk";
const rows = [
  [videoLink, "What are you up to __________?", "1. What are you up to this weekend?\n2. What are you up to after work?\n3. What are you up to these days?"],
  [videoLink, "I don't think I've __________ since __________.", "1. I don't think I've used Java since university.\n2. I don't think I've seen him since our last meeting.\n3. I don't think I've exercised since Monday."],
  [videoLink, "It would've been __________ if we'd __________.", "1. It would've been better if we'd tested it first.\n2. It would've been easier if we'd planned ahead.\n3. It would've been faster if we'd reused the existing code."],
  [videoLink, "Do you remember how __________ we were?", "1. Do you remember how nervous we were?\n2. Do you remember how busy we were last month?\n3. Do you remember how into video games we were?"],
  [videoLink, "How long are you in __________?", "1. How long are you in Hanoi?\n2. How long are you in town for?\n3. How long are you in Singapore on this trip?"],
  [videoLink, "I think __________, but I can't __________.", "1. I think he's explaining the issue, but I can't make it out.\n2. I think the build is stuck, but I can't confirm it.\n3. I think she sent the file, but I can't find it."],
  [videoLink, "I'm having the hardest time __________.", "1. I'm having the hardest time reproducing the bug.\n2. I'm having the hardest time understanding this requirement.\n3. I'm having the hardest time remembering his name."],
  [videoLink, "Even if __________, I can __________.", "1. Even if nobody helps me, I can finish it.\n2. Even if the test fails, I can check the logs.\n3. Even if it rains, I can take a taxi."],
  [videoLink, "Can we please __________?", "1. Can we please discuss this after the meeting?\n2. Can we please keep this change small?\n3. Can we please confirm the deadline?"],
  [videoLink, "I had no idea __________.", "1. I had no idea the deployment had failed.\n2. I had no idea you were waiting for me.\n3. I had no idea the restaurant was closed."],
  [videoLink, "I just want to say that I'm really sorry for __________.", "1. I just want to say that I'm really sorry for the delay.\n2. I just want to say that I'm really sorry for missing your message.\n3. I just want to say that I'm really sorry for the confusion."],
  [videoLink, "Who else was in __________?", "1. Who else was in the meeting?\n2. Who else was in the project team?\n3. Who else was in the room?"],
].map((row, index) => [index === 0 ? videoLink : "", ...row.slice(1)]);

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sentence Structures");
sheet.getRange("A1:C13").values = [
  ["Video Link", "Cấu trúc học được", "Example áp dụng"],
  ...rows,
];
sheet.getRange("A1:C13").format.autofitColumns();
sheet.getRange("A1:C13").format.autofitRows();

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({ sheetName: "Sentence Structures", range: "A1:C13", scale: 1.5, format: "png" });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

const inspection = await workbook.inspect({ kind: "table", range: "Sentence Structures!A1:C13", include: "values,formulas", tableMaxRows: 15, tableMaxCols: 3 });
console.log(inspection.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 50 }, summary: "final formula error scan" });
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/english-structures-from-friends.xlsx`);

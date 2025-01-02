const fs = require("fs");
const path = require("path");

const OUT_DIR = path.resolve(__dirname, "../out");
const NEXT_BUILD_DIR = path.resolve(__dirname, "../.next");
const RENAMED_DIR = path.join(OUT_DIR, "assets");
const SCRIPTS_DIR = path.join(RENAMED_DIR, "static/scripts");
const filesToCopy = ["background.js", "content.js"];

// Utility function to traverse all files in a directory recursively
const traverseAndReplace = (directory, searchPattern, replaceWith) => {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  files.forEach((file) => {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      // Recurse into subdirectories
      traverseAndReplace(fullPath, searchPattern, replaceWith);
    } else if (file.isFile()) {
      // Process only files
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes(searchPattern)) {
        content = content.replace(new RegExp(searchPattern, "g"), replaceWith);
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Updated references in: ${fullPath}`);
      }
    }
  });
};

// Utility function to extract inline scripts from HTML
const extractInlineScripts = (htmlFile) => {
  const htmlContent = fs.readFileSync(htmlFile, "utf8");
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g;

  const inlineScripts = [];
  let match;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    inlineScripts.push(match[1]);
  }

  return { htmlContent, inlineScripts };
};

// Utility function to save extracted scripts to files
const saveScriptsToFiles = (scripts) => {
  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  }

  return scripts.map((script, index) => {
    const fileName = `script-${index + 1}.js`;
    const filePath = path.join(SCRIPTS_DIR, fileName);
    fs.writeFileSync(filePath, script, "utf8");
    console.log(`Saved inline script to: ${filePath}`);
    return `/assets/static/scripts/${fileName}`;
  });
};

// Step 1: Copy `background.js` and `content.js` from `.next` to `out`
filesToCopy.forEach((file) => {
  const sourcePath = path.join(NEXT_BUILD_DIR, file);
  const destPath = path.join(OUT_DIR, file);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} from ${sourcePath} to ${destPath}`);
  } else {
    console.error(`Error: ${file} not found in ${NEXT_BUILD_DIR}`);
  }
});

// Step 2: Rename `_next` directory to `assets`
const NEXT_DIR = path.join(OUT_DIR, "_next");
if (fs.existsSync(NEXT_DIR)) {
  fs.renameSync(NEXT_DIR, RENAMED_DIR);
  console.log(`Renamed _next to assets`);
} else {
  console.error(`Error: _next directory not found in ${OUT_DIR}`);
}

// Step 3: Traverse all files in `out` and replace `/next/` with `/assets/`
traverseAndReplace(OUT_DIR, "/_next/", "/assets/");

// Step 4: Extract and replace inline scripts in `index.html`
const INDEX_HTML = path.join(OUT_DIR, "index.html");
if (fs.existsSync(INDEX_HTML)) {
  const { htmlContent, inlineScripts } = extractInlineScripts(INDEX_HTML);
  const externalScriptPaths = saveScriptsToFiles(inlineScripts);

  // Replace inline scripts with external references
  let updatedHtml = htmlContent;
  externalScriptPaths.forEach((scriptPath, index) => {
    updatedHtml = updatedHtml.replace(
      /<script>([\s\S]*?)<\/script>/,
      `<script src="${scriptPath}"></script>`
    );
  });

  // Write updated HTML back to file
  fs.writeFileSync(INDEX_HTML, updatedHtml, "utf8");
  console.log(`Updated ${INDEX_HTML} to reference external scripts`);
} else {
  console.error(`Error: ${INDEX_HTML} not found`);
}

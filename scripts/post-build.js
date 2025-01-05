const fs = require("fs");
const path = require("path");

const OUT_DIR = path.resolve(__dirname, "../out");
const RENAMED_DIR = path.join(OUT_DIR, "assets");
const SCRIPTS_DIR = path.join(RENAMED_DIR, "static/scripts");

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

const saveScriptsToFiles = (scripts, htmlFileName) => {
  const htmlScriptsDir = path.join(
    SCRIPTS_DIR,
    htmlFileName.replace(".html", "")
  );
  if (!fs.existsSync(htmlScriptsDir)) {
    fs.mkdirSync(htmlScriptsDir, { recursive: true });
  }

  return scripts.map((script, index) => {
    const fileName = `script-${index + 1}.js`;
    const filePath = path.join(htmlScriptsDir, fileName);
    fs.writeFileSync(filePath, script, "utf8");
    console.log(`Saved inline script to: ${filePath}`);
    return `/assets/static/scripts/${htmlFileName.replace(
      ".html",
      ""
    )}/${fileName}`;
  });
};

// Rename `_next` directory to `assets`
const NEXT_DIR = path.join(OUT_DIR, "_next");
if (fs.existsSync(NEXT_DIR)) {
  fs.renameSync(NEXT_DIR, RENAMED_DIR);
  console.log(`Renamed _next to assets`);
} else {
  console.error(`Error: _next directory not found in ${OUT_DIR}`);
}

// Traverse all files in `out` and replace `/next/` with `/assets/`
traverseAndReplace(OUT_DIR, "/_next/", "/assets/");

const findHtmlFiles = (dir) => {
  let htmlFiles = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      htmlFiles = htmlFiles.concat(findHtmlFiles(fullPath));
    } else if (item.endsWith(".html")) {
      // Store the relative path from OUT_DIR
      htmlFiles.push(path.relative(OUT_DIR, fullPath));
    }
  });

  return htmlFiles;
};

const processHtmlFiles = () => {
  const htmlFiles = findHtmlFiles(OUT_DIR);

  htmlFiles.forEach((htmlFile) => {
    const htmlPath = path.join(OUT_DIR, htmlFile);
    const { htmlContent, inlineScripts } = extractInlineScripts(htmlPath);

    // Create script paths that maintain the same directory structure
    const scriptDirName = htmlFile.replace(".html", "");
    const externalScriptPaths = saveScriptsToFiles(
      inlineScripts,
      scriptDirName
    );

    // Replace inline scripts with external references
    let updatedHtml = htmlContent;
    externalScriptPaths.forEach((scriptPath) => {
      updatedHtml = updatedHtml.replace(
        /<script>([\s\S]*?)<\/script>/,
        `<script src="${scriptPath}"></script>`
      );
    });

    // Write updated HTML back to file
    fs.writeFileSync(htmlPath, updatedHtml, "utf8");
    console.log(`Updated ${htmlPath} to reference external scripts`);
  });
};

processHtmlFiles();

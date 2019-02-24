const fs = require("fs");
import glob from "glob";

export const concatFiles = (files, options) =>
  files.reduce((total, file) => {
    let code = "";
    try {
      code = fs.readFileSync(file, "utf8").toLowerCase();
    } catch (e) {
      console.warn(e.message);
    }
    return `${total}${code} `;
  }, "");

export const getFilesFromPatternArray = fileArray => {
  let sourceFiles = {};
  for (let string of fileArray) {
    try {
      // See if string is a filepath, not a file pattern.
      fs.statSync(string);
      sourceFiles[string] = true;
    } catch (e) {
      const files = glob.sync(string);
      files.forEach(file => {
        sourceFiles[file] = true;
      });
    }
  }
  return Object.keys(sourceFiles);
};

export const filesToSource = (files) => {
  if (Array.isArray(files)) {
    files = getFilesFromPatternArray(files);
    return concatFiles(files, {});
  }
  // 'files' is already a source string.
  return files;
};

export default {
  filesToSource
};

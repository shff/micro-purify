const fs = require("fs");
const path = require("path");

const glob = (filter, pathName = ".") => {
  if (typeof filter == "string") {
    filter = RegExp(
      filter
        .replace(/[-\/\\^$*+.[\]{}]/g, "\\$&")
        .replace("\\+(", "(")
        .replace("\\*\\*", ".*")
        .replace("\\*", "[^/]*")
    );
  }

  return fs.readdirSync(pathName).flatMap(file => {
    var filename = path.join(pathName, file);
    if (fs.lstatSync(filename).isDirectory()) {
      return glob(filter, filename);
    } else if (filename.match(filter)) {
      return [filename];
    } else {
      return [];
    }
  });
};

const concatFiles = (files, options) =>
  files.reduce((total, file) => {
    let code = "";
    try {
      code = fs.readFileSync(file, "utf8").toLowerCase();
    } catch (e) {
      console.warn(e.message);
    }
    return `${total}${code} `;
  }, "");

const filesToSource = files => {
  if (Array.isArray(files)) {
    files = files.flatMap(file => (fs.existsSync(file) ? file : glob(file)));
    return concatFiles(files, {});
  }
  return files;
};

module.exports = { filesToSource };

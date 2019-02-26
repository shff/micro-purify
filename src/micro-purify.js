const parse = require("./utils/parse.js");
const compile = require("./utils/compile.js");
const FileUtil = require("./utils/FileUtil.js");

const getAllWordsInSelector = selector =>
  selector
    .replace(/\[(.*?)\]/g, "")
    .replace(/[:*][a-z-_:]+/g, "")
    .toLowerCase()
    .match(/[a-z]+/g) || [];

module.exports = (searchThrough, css, options = {}) => {
  const whitelist = ["html", "body"].concat(options.whitelist || []);
  const cssString = FileUtil.filesToSource(css);
  const content = FileUtil.filesToSource(searchThrough).toLowerCase();
  const wordsInContent = content.split(/[^a-z]/g).concat(whitelist);

  const visitor = node => {
    if (node.type == "rule") {
      node.selectors = node.selectors.filter(selector =>
        getAllWordsInSelector(selector).every(word =>
          wordsInContent.includes(word)
        )
      );
    }
  };

  const ast = parse(cssString, { visitor });
  return compile(ast);
};

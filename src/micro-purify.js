import parse from "./utils/parse";
import compile from "./utils/compile";
import FileUtil from "./utils/FileUtil";

const getAllWordsInSelector = selector =>
  selector
    .replace(/\[(.*?)\]/g, "")
    .replace(/[:*][a-z-_:]+/g, "")
    .toLowerCase()
    .match(/[a-z]+/g) || [];

export default (searchThrough, css, options = {}) => {
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

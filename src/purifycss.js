import parse from "./utils/parse";
import compile from "./utils/compile";
import FileUtil from "./utils/FileUtil";

const RULE_TYPE = "rule";
const NON_ALPHA = /[^a-z]/g;

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
  const wordsInContent = content.split(NON_ALPHA).concat(whitelist);

  const nodeVisitor = node => {
    if (node.type == RULE_TYPE) {
      node.selectors = node.selectors.filter(selector =>
        getAllWordsInSelector(selector).every(word =>
          wordsInContent.includes(word)
        )
      );
    }
  };

  const ast = parse(cssString, { nodeVisitor });
  return compile(ast);
};

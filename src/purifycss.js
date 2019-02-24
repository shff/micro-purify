import parse from "./utils/parse";
import compile from "./utils/compile";
import FileUtil from "./utils/FileUtil";

const RULE_TYPE = "rule";
const MEDIA_TYPE = "media";
const NON_ALPHA = /[^a-z]/g;

const getAllWordsInSelector = selector =>
  selector
    .replace(/\[(.*?)\]/g, "")
    .replace(/[:*][a-z-_:]+/g, "")
    .toLowerCase()
    .match(/[a-z]+/g) || [];

const readRules = (rules, wordsInContent) => {
  for (let rule of rules) {
    if (rule.type === RULE_TYPE) {
      rule.selectors = rule.selectors.filter(selector =>
        getAllWordsInSelector(selector).every(word =>
          wordsInContent.includes(word)
        )
      );
    } else if (rule.type === MEDIA_TYPE) {
      readRules(rule.rules, wordsInContent);
    }
  }
};

export default (searchThrough, css, options = {}) => {
  const whitelist = ["html", "body"].concat(options.whitelist || []);
  const cssString = FileUtil.filesToSource(css);
  const content = FileUtil.filesToSource(searchThrough).toLowerCase();
  const wordsInContent = content.split(NON_ALPHA).concat(whitelist);

  const ast = parse(cssString);
  const rules = ast.stylesheet.rules;
  readRules(rules, wordsInContent);

  return compile(ast);
};

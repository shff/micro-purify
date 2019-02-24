const fs = require("fs");
import FileUtil from "./utils/FileUtil";
import SelectorFilter from "./SelectorFilter";
import parse from "./utils/parse";
import compile from "./utils/compile";

const RULE_TYPE = "rule";
const MEDIA_TYPE = "media";

const getAllWordsInContent = content => {
  return content.split(/[^a-z]/g).reduce(
    (used, word) => {
      used[word] = true;
      return used;
    },
    { html: true, body: true }
  );
};

const readRules = (rules, filter) => {
  for (let rule of rules) {
    if (rule.type === RULE_TYPE) {
      filter.parseRule(rule.selectors, rule);
    } else if (rule.type === MEDIA_TYPE) {
      readRules(rule.rules, filter);
    }
  }
};

const removeEmptyRules = rules => {
  let emptyRules = [];

  for (let rule of rules) {
    const ruleType = rule.type;

    if (ruleType === RULE_TYPE && rule.selectors.length === 0) {
      emptyRules.push(rule);
    } else if (ruleType === MEDIA_TYPE) {
      removeEmptyRules(rule.rules);
      if (rule.rules.length === 0) {
        emptyRules.push(rule);
      }
    }
  }

  emptyRules.forEach(emptyRule => {
    const index = rules.indexOf(emptyRule);
    rules.splice(index, 1);
  });
};

export default (searchThrough, css, options = {}) => {
  const whitelist = options.whitelist || [];
  const cssString = FileUtil.filesToSource(css);
  const content = FileUtil.filesToSource(searchThrough).toLowerCase();
  const wordsInContent = getAllWordsInContent(content);
  const selectorFilter = new SelectorFilter(wordsInContent, whitelist);

  const ast = parse(cssString);
  readRules(ast.stylesheet.rules, selectorFilter);
  removeEmptyRules(ast.stylesheet.rules);

  return compile(ast);
};

const fs = require("fs");
import parse from "./utils/parse";
import compile from "./utils/compile";
import FileUtil from "./utils/FileUtil";

const RULE_TYPE = "rule";
const MEDIA_TYPE = "media";

const getAllWordsInContent = content =>
  content.split(/[^a-z]/g).concat(["body", "html"]);

var getAllWordsInSelector = selector => {
  return selector
    .replace(/\[(.*?)\]/g, "")
    .replace(/[:*][a-z-_:]+/g, "")
    .toLowerCase()
    .match(/[a-z]+/g) || [];
}

const readRules = (rules, filter) => {
  for (let rule of rules) {
    if (rule.type === RULE_TYPE) {
      filter(rule);
    } else if (rule.type === MEDIA_TYPE) {
      readRules(rule.rules, filter);
    }
  }
};

const removeEmptyRules = rules => {
  let emptyRules = [];
  for (let rule of rules) {
    if (rule.type === RULE_TYPE && rule.selectors.length === 0) {
      emptyRules.push(rule);
    } else if (rule.type === MEDIA_TYPE) {
      removeEmptyRules(rule.rules);
      if (rule.rules.length === 0) {
        emptyRules.push(rule);
      }
    }
  }
  emptyRules.forEach(emptyRule => rules.splice(rules.indexOf(emptyRule), 1));
};

const filterSelectors = (selectors, contentWords) => {
  return selectors.filter(selector => {
    const words = getAllWordsInSelector(selector);
    const usedWords = words.filter(word => contentWords.includes(word));
    return usedWords.length === words.length;
  });
};

export default (searchThrough, css, options = {}) => {
  const whitelist = options.whitelist || [];
  const cssString = FileUtil.filesToSource(css);
  const content = FileUtil.filesToSource(searchThrough).toLowerCase();
  const wordsInContent = getAllWordsInContent(content).concat(whitelist);

  const ast = parse(cssString);
  const rules = ast.stylesheet.rules;
  readRules(
    rules,
    rule => (rule.selectors = filterSelectors(rule.selectors, wordsInContent))
  );
  removeEmptyRules(rules);

  return compile(ast);
};

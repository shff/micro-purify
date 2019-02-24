import parse from "./utils/parse";
import stringify from "./utils/stringify";

const RULE_TYPE = "rule";
const MEDIA_TYPE = "media";

class CssTreeWalker {
  constructor(code, plugins) {
    this.startingSource = code;
    this.ast = null;
    this.plugins = plugins;
  }

  beginReading() {
    this.ast = parse(this.startingSource);
    this.readRules(this.ast.stylesheet.rules);
    this.removeEmptyRules(this.ast.stylesheet.rules);
  }

  readRules(rules) {
    for (let rule of rules) {
      if (rule.type === RULE_TYPE) {
        this.plugins.forEach(plugin => {
          plugin.parseRule(rule.selectors, rule);
        });
      }
      if (rule.type === MEDIA_TYPE) {
        this.readRules(rule.rules);
      }
    }
  }

  removeEmptyRules(rules) {
    let emptyRules = [];

    for (let rule of rules) {
      const ruleType = rule.type;

      if (ruleType === RULE_TYPE && rule.selectors.length === 0) {
        emptyRules.push(rule);
      }
      if (ruleType === MEDIA_TYPE) {
        this.removeEmptyRules(rule.rules);
        if (rule.rules.length === 0) {
          emptyRules.push(rule);
        }
      }
    }

    emptyRules.forEach(emptyRule => {
      const index = rules.indexOf(emptyRule);
      rules.splice(index, 1);
    });
  }

  toString() {
    if (this.ast) {
      return stringify(this.ast, {}).replace(/,\n/g, ",");
    }
    return "";
  }
}

export default CssTreeWalker;

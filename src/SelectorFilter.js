const getAllWordsInSelector = selector => {
  // Remove attr selectors. "a[href...]"" will become "a".
  selector = selector.replace(/\[(.+?)\]/g, "").toLowerCase();
  // If complex attr selector (has a bracket in it) just leave
  // the selector in. ¯\_(ツ)_/¯
  if (selector.includes("[") || selector.includes("]")) {
    return [];
  }
  let skipNextWord = false,
    word = "",
    words = [];

  for (let letter of selector) {
    if (skipNextWord && !/[ #.]/.test(letter)) continue;
    // If pseudoclass or universal selector, skip the next word
    if (/[:*]/.test(letter)) {
      if (word) words.push(word);
      word = "";
      skipNextWord = true;
      continue;
    }
    if (/[a-z]/.test(letter)) {
      word += letter;
    } else {
      if (word) words.push(word);
      word = "";
      skipNextWord = false;
    }
  }

  if (word) words.push(word);
  return words;
};

const isWildcardWhitelistSelector = selector => {
  return selector[0] === "*" && selector[selector.length - 1] === "*";
};

const hasWhitelistMatch = (selector, whitelist) => {
  for (let el of whitelist) {
    if (selector.includes(el)) return true;
  }
  return false;
};

export default class SelectorFilter {
  constructor(contentWords, whitelist) {
    this.contentWords = contentWords;
    this.rejectedSelectors = [];
    this.wildcardWhitelist = [];
    this.parseWhitelist(whitelist);
  }

  parseWhitelist(whitelist) {
    whitelist.forEach(whitelistSelector => {
      whitelistSelector = whitelistSelector.toLowerCase();

      if (isWildcardWhitelistSelector(whitelistSelector)) {
        // If '*button*' then push 'button' onto list.
        this.wildcardWhitelist.push(
          whitelistSelector.substr(1, whitelistSelector.length - 2)
        );
      } else {
        getAllWordsInSelector(whitelistSelector).forEach(word => {
          this.contentWords[word] = true;
        });
      }
    });
  }

  parseRule(selectors, rule) {
    rule.selectors = this.filterSelectors(selectors);
  }

  filterSelectors(selectors) {
    let contentWords = this.contentWords,
      rejectedSelectors = this.rejectedSelectors,
      wildcardWhitelist = this.wildcardWhitelist,
      usedSelectors = [];

    selectors.forEach(selector => {
      if (hasWhitelistMatch(selector, wildcardWhitelist)) {
        usedSelectors.push(selector);
        return;
      }
      let words = getAllWordsInSelector(selector),
        usedWords = words.filter(word => contentWords[word]);

      if (usedWords.length === words.length) {
        usedSelectors.push(selector);
      } else {
        rejectedSelectors.push(selector);
      }
    });

    return usedSelectors;
  }
}

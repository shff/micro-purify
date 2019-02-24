const fs = require("fs");
import CssTreeWalker from "./CssTreeWalker";
import FileUtil from "./utils/FileUtil";
import SelectorFilter from "./SelectorFilter";
import { getAllWordsInContent } from "./utils/ExtractWordsUtil";

const purify = (searchThrough, css, options = {}) => {
  const cssString = FileUtil.filesToSource(css);
  const content = FileUtil.filesToSource(searchThrough).toLowerCase();
  const wordsInContent = getAllWordsInContent(content);
  const selectorFilter = new SelectorFilter(
    wordsInContent,
    options.whitelist || []
  );
  const tree = new CssTreeWalker(cssString, [selectorFilter]);
  tree.beginReading();

  return tree.toString();
};

export default purify;

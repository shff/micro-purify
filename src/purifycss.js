const fs = require("fs")
import CssTreeWalker from "./CssTreeWalker"
import FileUtil from "./utils/FileUtil"
import PrintUtil from "./utils/PrintUtil"
import SelectorFilter from "./SelectorFilter"
import { getAllWordsInContent } from "./utils/ExtractWordsUtil"

const OPTIONS = {
    output: false,
    info: false,
    rejected: false,
    whitelist: []
}

const getOptions = (options = {}) => {
    let opt = {}
    for (let option in OPTIONS) {
        opt[option] = options[option] || OPTIONS[option]
    }
    return opt
}


const purify = (searchThrough, css, options, callback) => {
    if (typeof options === "function") {
        callback = options
        options = {}
    }
    options = getOptions(options)
    let cssString = FileUtil.filesToSource(css, "css"),
        content = FileUtil.filesToSource(searchThrough, "content")
    let wordsInContent = getAllWordsInContent(content),
        selectorFilter = new SelectorFilter(wordsInContent, options.whitelist),
        tree = new CssTreeWalker(cssString, [selectorFilter])
    tree.beginReading()
    let source = tree.toString()

    // Option info = true
    if (options.info) {
        PrintUtil.printInfo(source.length)
    }

    // Option rejected = true
    if (options.rejected && selectorFilter.rejectedSelectors.length) {
        PrintUtil.printRejected(selectorFilter.rejectedSelectors)
    }

    if (options.output) {
        fs.writeFile(options.output, source, err => {
            if (err) return err
        })
    } else {
        return callback ? callback(source) : source
    }
}

export default purify

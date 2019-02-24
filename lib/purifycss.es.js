import glob from 'glob';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/*

Code extracted from https://github.com/reworkcss/css



(The MIT License)

Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

var parse = function parse(css, options) {
  options = options || {};

  /**
   * Positional.
   */

  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   */

  function updatePosition(str) {
    var lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf('\n');
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   */

  function position() {
    var start = { line: lineno, column: column };
    return function (node) {
      node.position = new Position(start);
      whitespace();
      return node;
    };
  }

  /**
   * Store position information for a node
   */

  function Position(start) {
    this.start = start;
    this.end = { line: lineno, column: column };
    this.source = options.source;
  }

  /**
   * Non-enumerable source string
   */

  Position.prototype.content = css;

  /**
   * Error `msg`.
   */

  var errorsList = [];

  function error(msg) {
    var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = css;

    if (options.silent) {
      errorsList.push(err);
    } else {
      throw err;
    }
  }

  /**
   * Parse stylesheet.
   */

  function stylesheet() {
    var rulesList = rules();

    return {
      type: 'stylesheet',
      stylesheet: {
        rules: rulesList,
        parsingErrors: errorsList
      }
    };
  }

  /**
   * Opening brace.
   */

  function open() {
    return match(/^{\s*/);
  }

  /**
   * Closing brace.
   */

  function close() {
    return match(/^}/);
  }

  /**
   * Parse ruleset.
   */

  function rules() {
    var node;
    var rules = [];
    whitespace();
    comments(rules);
    while (css.length && css.charAt(0) != '}' && (node = atrule() || rule())) {
      if (node !== false) {
        rules.push(node);
        comments(rules);
      }
    }
    return rules;
  }

  /**
   * Match `re` and return captures.
   */

  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */

  function whitespace() {
    match(/^\s*/);
  }

  /**
   * Parse comments;
   */

  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }

  /**
   * Parse comment.
   */

  function comment() {
    var pos = position();
    if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

    var i = 2;
    while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) {
      ++i;
    }i += 2;

    if ("" === css.charAt(i - 1)) {
      return error('End of comment missing');
    }

    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: 'comment',
      comment: str
    });
  }

  /**
   * Parse selector.
   */

  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;
    /* @fix Remove all comments from selectors
     * http://ostermiller.org/findcomment.html */
    return trim(m[0]).replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '').replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (m) {
      return m.replace(/,/g, '\u200C');
    }).split(/\s*(?![^(]*\)),\s*/).map(function (s) {
      return s.replace(/\u200C/g, ',');
    });
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return;
    prop = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error("property missing ':'");

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    var ret = pos({
      type: 'declaration',
      property: prop.replace(commentre, ''),
      value: val ? trim(val[0]).replace(commentre, '') : ''
    });

    // ;
    match(/^[;\s]*/);

    return ret;
  }

  /**
   * Parse declarations.
   */

  function declarations() {
    var decls = [];

    if (!open()) return error("missing '{'");
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }

    if (!close()) return error("missing '}'");
    return decls;
  }

  /**
   * Parse keyframe.
   */

  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    while (m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations()
    });
  }

  /**
   * Parse keyframes.
   */

  function atkeyframes() {
    var pos = position();
    var m = match(/^@([-\w]+)?keyframes\s*/);

    if (!m) return;
    var vendor = m[1];

    // identifier
    var m = match(/^([-\w]+)\s*/);
    if (!m) return error("@keyframes missing name");
    var name = m[1];

    if (!open()) return error("@keyframes missing '{'");

    var frame;
    var frames = comments();
    while (frame = keyframe()) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error("@keyframes missing '}'");

    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames
    });
  }

  /**
   * Parse supports.
   */

  function atsupports() {
    var pos = position();
    var m = match(/^@supports *([^{]+)/);

    if (!m) return;
    var supports = trim(m[1]);

    if (!open()) return error("@supports missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@supports missing '}'");

    return pos({
      type: 'supports',
      supports: supports,
      rules: style
    });
  }

  /**
   * Parse host.
   */

  function athost() {
    var pos = position();
    var m = match(/^@host\s*/);

    if (!m) return;

    if (!open()) return error("@host missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@host missing '}'");

    return pos({
      type: 'host',
      rules: style
    });
  }

  /**
   * Parse media.
   */

  function atmedia() {
    var pos = position();
    var m = match(/^@media *([^{]+)/);

    if (!m) return;
    var media = trim(m[1]);

    if (!open()) return error("@media missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@media missing '}'");

    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }

  /**
   * Parse custom-media.
   */

  function atcustommedia() {
    var pos = position();
    var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    if (!m) return;

    return pos({
      type: 'custom-media',
      name: trim(m[1]),
      media: trim(m[2])
    });
  }

  /**
   * Parse paged media.
   */

  function atpage() {
    var pos = position();
    var m = match(/^@page */);
    if (!m) return;

    var sel = selector() || [];

    if (!open()) return error("@page missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@page missing '}'");

    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  /**
   * Parse document.
   */

  function atdocument() {
    var pos = position();
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    var vendor = trim(m[1]);
    var doc = trim(m[2]);

    if (!open()) return error("@document missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@document missing '}'");

    return pos({
      type: 'document',
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  /**
   * Parse font-face.
   */

  function atfontface() {
    var pos = position();
    var m = match(/^@font-face\s*/);
    if (!m) return;

    if (!open()) return error("@font-face missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@font-face missing '}'");

    return pos({
      type: 'font-face',
      declarations: decls
    });
  }

  /**
   * Parse import
   */

  var atimport = _compileAtrule('import');

  /**
   * Parse charset
   */

  var atcharset = _compileAtrule('charset');

  /**
   * Parse namespace
   */

  var atnamespace = _compileAtrule('namespace');

  /**
   * Parse non-block at-rules
   */

  function _compileAtrule(name) {
    var re = new RegExp('^@' + name + '\\s*([^;]+);');
    return function () {
      var pos = position();
      var m = match(re);
      if (!m) return;
      var ret = { type: name };
      ret[name] = m[1].trim();
      return pos(ret);
    };
  }

  /**
   * Parse at rule.
   */

  function atrule() {
    if (css[0] != '@') return;

    return atkeyframes() || atmedia() || atcustommedia() || atsupports() || atimport() || atcharset() || atnamespace() || atdocument() || atpage() || athost() || atfontface();
  }

  /**
   * Parse rule.
   */

  function rule() {
    var pos = position();
    var sel = selector();

    if (!sel) return error('selector missing');
    comments();

    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return addParent(stylesheet());
};

/**
 * Trim `str`.
 */

function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : '';
}

/**
 * Adds non-enumerable parent node reference to each node.
 */

function addParent(obj, parent) {
  var isNode = obj && typeof obj.type === 'string';
  var childParent = isNode ? obj : parent;

  for (var k in obj) {
    var value = obj[k];
    if (Array.isArray(value)) {
      value.forEach(function (v) {
        addParent(v, childParent);
      });
    } else if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
      addParent(value, childParent);
    }
  }

  if (isNode) {
    Object.defineProperty(obj, 'parent', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null
    });
  }

  return obj;
}

/*

Code extracted from https://github.com/reworkcss/css



(The MIT License)

Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

/**
 * Expose compiler.
 */

var stringify = function stringify(node, options) {
  return new Compiler(options).compile(node);
};

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  this.options = options || {};
  this.indentation = options.indent;
}

/**
 * Emit `str`
 */

Compiler.prototype.emit = function (str) {
  return str;
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function (node) {
  return this[node.type](node);
};

/**
 * Map visit over array of `nodes`, optionally using a `delim`
 */

Compiler.prototype.mapVisit = function (nodes, delim) {
  var buf = '';
  delim = delim || '';

  for (var i = 0, length = nodes.length; i < length; i++) {
    buf += this.visit(nodes[i]);
    if (delim && i < length - 1) buf += this.emit(delim);
  }

  return buf;
};

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function (node) {
  return this.stylesheet(node);
};

/**
 * Visit stylesheet node.
 */

Compiler.prototype.stylesheet = function (node) {
  return this.mapVisit(node.stylesheet.rules, '\n\n');
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function (node) {
  return this.emit(this.indent() + '/*' + node.comment + '*/', node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function (node) {
  return this.emit('@import ' + node.import + ';', node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function (node) {
  return this.emit('@media ' + node.media, node.position) + this.emit(' {\n' + this.indent(1)) + this.mapVisit(node.rules, '\n\n') + this.emit(this.indent(-1) + '\n}');
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function (node) {
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return this.emit(doc, node.position) + this.emit(' ' + ' {\n' + this.indent(1)) + this.mapVisit(node.rules, '\n\n') + this.emit(this.indent(-1) + '\n}');
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function (node) {
  return this.emit('@charset ' + node.charset + ';', node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function (node) {
  return this.emit('@namespace ' + node.namespace + ';', node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function (node) {
  return this.emit('@supports ' + node.supports, node.position) + this.emit(' {\n' + this.indent(1)) + this.mapVisit(node.rules, '\n\n') + this.emit(this.indent(-1) + '\n}');
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function (node) {
  return this.emit('@' + (node.vendor || '') + 'keyframes ' + node.name, node.position) + this.emit(' {\n' + this.indent(1)) + this.mapVisit(node.keyframes, '\n') + this.emit(this.indent(-1) + '}');
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function (node) {
  var decls = node.declarations;

  return this.emit(this.indent()) + this.emit(node.values.join(', '), node.position) + this.emit(' {\n' + this.indent(1)) + this.mapVisit(decls, '\n') + this.emit(this.indent(-1) + '\n' + this.indent() + '}\n');
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function (node) {
  var sel = node.selectors.length ? node.selectors.join(', ') + ' ' : '';

  return this.emit('@page ' + sel, node.position) + this.emit('{\n') + this.emit(this.indent(1)) + this.mapVisit(node.declarations, '\n') + this.emit(this.indent(-1)) + this.emit('\n}');
};

/**
 * Visit font-face node.
 */

Compiler.prototype['font-face'] = function (node) {
  return this.emit('@font-face ', node.position) + this.emit('{\n') + this.emit(this.indent(1)) + this.mapVisit(node.declarations, '\n') + this.emit(this.indent(-1)) + this.emit('\n}');
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function (node) {
  return this.emit('@host', node.position) + this.emit(' {\n' + this.indent(1)) + this.mapVisit(node.rules, '\n\n') + this.emit(this.indent(-1) + '\n}');
};

/**
 * Visit custom-media node.
 */

Compiler.prototype['custom-media'] = function (node) {
  return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function (node) {
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return '';

  return this.emit(node.selectors.map(function (s) {
    return indent + s;
  }).join(',\n'), node.position) + this.emit(' {\n') + this.emit(this.indent(1)) + this.mapVisit(decls, '\n') + this.emit(this.indent(-1)) + this.emit('\n' + this.indent() + '}');
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function (node) {
  return this.emit(this.indent()) + this.emit(node.property + ': ' + node.value, node.position) + this.emit(';');
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function (level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return '';
  }

  return Array(this.level).join(this.indentation || '  ');
};

var RULE_TYPE = "rule";
var MEDIA_TYPE = "media";

var CssTreeWalker = function () {
    function CssTreeWalker(code, plugins) {
        classCallCheck(this, CssTreeWalker);

        this.startingSource = code;
        this.ast = null;
        this.plugins = plugins;
    }

    createClass(CssTreeWalker, [{
        key: "beginReading",
        value: function beginReading() {
            this.ast = parse(this.startingSource);
            this.readPlugin(this.ast.stylesheet);
        }
    }, {
        key: "readPlugin",
        value: function readPlugin(tree) {
            this.readRules(tree.rules);
            this.removeEmptyRules(tree.rules);
        }
    }, {
        key: "readRules",
        value: function readRules(rules) {
            var _this = this;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function _loop() {
                    var rule = _step.value;

                    if (rule.type === RULE_TYPE) {
                        _this.plugins.forEach(function (plugin) {
                            plugin.parseRule(rule.selectors, rule);
                        });
                    }
                    if (rule.type === MEDIA_TYPE) {
                        _this.readRules(rule.rules);
                    }
                };

                for (var _iterator = rules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "removeEmptyRules",
        value: function removeEmptyRules(rules) {
            var emptyRules = [];

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = rules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _rule = _step2.value;

                    var ruleType = _rule.type;

                    if (ruleType === RULE_TYPE && _rule.selectors.length === 0) {
                        emptyRules.push(_rule);
                    }
                    if (ruleType === MEDIA_TYPE) {
                        this.removeEmptyRules(_rule.rules);
                        if (_rule.rules.length === 0) {
                            emptyRules.push(_rule);
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            emptyRules.forEach(function (emptyRule) {
                var index = rules.indexOf(emptyRule);
                rules.splice(index, 1);
            });
        }
    }, {
        key: "toString",
        value: function toString() {
            if (this.ast) {
                return stringify(this.ast, {}).replace(/,\n/g, ",");
            }
            return "";
        }
    }]);
    return CssTreeWalker;
}();

var fs$1 = require("fs");
var concatFiles = function concatFiles(files, options) {
    return files.reduce(function (total, file) {
        var code = "";
        try {
            code = fs$1.readFileSync(file, "utf8").toLowerCase();
        } catch (e) {
            console.warn(e.message);
        }
        return "" + total + code + " ";
    }, "");
};

var getFilesFromPatternArray = function getFilesFromPatternArray(fileArray) {
    var sourceFiles = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = fileArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var string = _step.value;

            try {
                // See if string is a filepath, not a file pattern.
                fs$1.statSync(string);
                sourceFiles[string] = true;
            } catch (e) {
                var files = glob.sync(string);
                files.forEach(function (file) {
                    sourceFiles[file] = true;
                });
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return Object.keys(sourceFiles);
};

var filesToSource = function filesToSource(files, type) {
    var isContent = type === "content";
    if (Array.isArray(files)) {
        files = getFilesFromPatternArray(files);
        return concatFiles(files, {});
    }
    // 'files' is already a source string.
    return isContent ? files.toLowerCase() : files;
};

var FileUtil = {
    concatFiles: concatFiles,
    filesToSource: filesToSource,
    getFilesFromPatternArray: getFilesFromPatternArray
};

var startTime = void 0;
var beginningLength = void 0;

var printInfo = function printInfo(endingLength) {
    var sizeReduction = ((beginningLength - endingLength) / beginningLength * 100).toFixed(1);
    console.log("PurifyCSS has reduced the file size by ~ " + sizeReduction + "%");
};

var printRejected = function printRejected(rejectedTwigs) {
    console.log("PurifyCSS - Rejected selectors:\n    " + rejectedTwigs.join("\n    |\t"));
};

var startLog = function startLog(cssLength) {
    startTime = new Date();
    beginningLength = cssLength;
};

var PrintUtil = {
    printInfo: printInfo,
    printRejected: printRejected,
    startLog: startLog
};

var addWord = function addWord(words, word) {
    if (word) words.push(word);
};

var getAllWordsInContent = function getAllWordsInContent(content) {
    var used = {
        // Always include html and body.
        html: true,
        body: true
    };
    var words = content.split(/[^a-z]/g);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = words[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var word = _step.value;

            used[word] = true;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return used;
};

var getAllWordsInSelector = function getAllWordsInSelector(selector) {
    // Remove attr selectors. "a[href...]"" will become "a".
    selector = selector.replace(/\[(.+?)\]/g, "").toLowerCase
    // If complex attr selector (has a bracket in it) just leave
    // the selector in. ¯\_(ツ)_/¯
    ();if (selector.includes("[") || selector.includes("]")) {
        return [];
    }
    var skipNextWord = false,
        word = "",
        words = [];

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = selector[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var letter = _step2.value;

            if (skipNextWord && !/[ #.]/.test(letter)) continue;
            // If pseudoclass or universal selector, skip the next word
            if (/[:*]/.test(letter)) {
                addWord(words, word);
                word = "";
                skipNextWord = true;
                continue;
            }
            if (/[a-z]/.test(letter)) {
                word += letter;
            } else {
                addWord(words, word);
                word = "";
                skipNextWord = false;
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    addWord(words, word);
    return words;
};

var isWildcardWhitelistSelector = function isWildcardWhitelistSelector(selector) {
    return selector[0] === "*" && selector[selector.length - 1] === "*";
};

var hasWhitelistMatch = function hasWhitelistMatch(selector, whitelist) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = whitelist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var el = _step.value;

            if (selector.includes(el)) return true;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return false;
};

var SelectorFilter = function () {
    function SelectorFilter(contentWords, whitelist) {
        classCallCheck(this, SelectorFilter);

        this.contentWords = contentWords;
        this.rejectedSelectors = [];
        this.wildcardWhitelist = [];
        this.parseWhitelist(whitelist);
    }

    createClass(SelectorFilter, [{
        key: "parseWhitelist",
        value: function parseWhitelist(whitelist) {
            var _this = this;

            whitelist.forEach(function (whitelistSelector) {
                whitelistSelector = whitelistSelector.toLowerCase();

                if (isWildcardWhitelistSelector(whitelistSelector)) {
                    // If '*button*' then push 'button' onto list.
                    _this.wildcardWhitelist.push(whitelistSelector.substr(1, whitelistSelector.length - 2));
                } else {
                    getAllWordsInSelector(whitelistSelector).forEach(function (word) {
                        _this.contentWords[word] = true;
                    });
                }
            });
        }
    }, {
        key: "parseRule",
        value: function parseRule(selectors, rule) {
            rule.selectors = this.filterSelectors(selectors);
        }
    }, {
        key: "filterSelectors",
        value: function filterSelectors(selectors) {
            var contentWords = this.contentWords,
                rejectedSelectors = this.rejectedSelectors,
                wildcardWhitelist = this.wildcardWhitelist,
                usedSelectors = [];

            selectors.forEach(function (selector) {
                if (hasWhitelistMatch(selector, wildcardWhitelist)) {
                    usedSelectors.push(selector);
                    return;
                }
                var words = getAllWordsInSelector(selector),
                    usedWords = words.filter(function (word) {
                    return contentWords[word];
                });

                if (usedWords.length === words.length) {
                    usedSelectors.push(selector);
                } else {
                    rejectedSelectors.push(selector);
                }
            });

            return usedSelectors;
        }
    }]);
    return SelectorFilter;
}();

var fs = require("fs");
var OPTIONS = {
    output: false,
    info: false,
    rejected: false,
    whitelist: []
};

var getOptions = function getOptions() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var opt = {};
    for (var option in OPTIONS) {
        opt[option] = options[option] || OPTIONS[option];
    }
    return opt;
};

var purify = function purify(searchThrough, css, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    options = getOptions(options);
    var cssString = FileUtil.filesToSource(css, "css"),
        content = FileUtil.filesToSource(searchThrough, "content");
    var wordsInContent = getAllWordsInContent(content),
        selectorFilter = new SelectorFilter(wordsInContent, options.whitelist),
        tree = new CssTreeWalker(cssString, [selectorFilter]);
    tree.beginReading();
    var source = tree.toString

    // Option info = true
    ();if (options.info) {
        PrintUtil.printInfo(source.length);
    }

    // Option rejected = true
    if (options.rejected && selectorFilter.rejectedSelectors.length) {
        PrintUtil.printRejected(selectorFilter.rejectedSelectors);
    }

    if (options.output) {
        fs.writeFile(options.output, source, function (err) {
            if (err) return err;
        });
    } else {
        return callback ? callback(source) : source;
    }
};

export default purify;

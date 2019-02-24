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

export default (node, options) => new Compiler(options).compile(node);

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

Compiler.prototype.emit = function(str) {
  return str;
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node) {
  return this[node.type](node);
};

/**
 * Map visit over array of `nodes`, optionally using a `delim`
 */

Compiler.prototype.mapVisit = function(nodes, delim) {
  var buf = "";
  delim = delim || "";

  for (var i = 0, length = nodes.length; i < length; i++) {
    buf += this.visit(nodes[i]);
    if (delim && i < length - 1) buf += this.emit(delim);
  }

  return buf;
};

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node) {
  return this.stylesheet(node);
};

/**
 * Visit stylesheet node.
 */

Compiler.prototype.stylesheet = function(node) {
  return this.mapVisit(node.stylesheet.rules, "\n\n");
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node) {
  return this.emit(this.indent() + "/*" + node.comment + "*/", node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node) {
  return this.emit("@import " + node.import + ";", node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node) {
  return (
    this.emit("@media " + node.media, node.position) +
    this.emit(" {\n" + this.indent(1)) +
    this.mapVisit(node.rules, "\n\n") +
    this.emit(this.indent(-1) + "\n}")
  );
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node) {
  var doc = "@" + (node.vendor || "") + "document " + node.document;

  return (
    this.emit(doc, node.position) +
    this.emit(" " + " {\n" + this.indent(1)) +
    this.mapVisit(node.rules, "\n\n") +
    this.emit(this.indent(-1) + "\n}")
  );
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node) {
  return this.emit("@charset " + node.charset + ";", node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function(node) {
  return this.emit("@namespace " + node.namespace + ";", node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node) {
  return (
    this.emit("@supports " + node.supports, node.position) +
    this.emit(" {\n" + this.indent(1)) +
    this.mapVisit(node.rules, "\n\n") +
    this.emit(this.indent(-1) + "\n}")
  );
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node) {
  return (
    this.emit(
      "@" + (node.vendor || "") + "keyframes " + node.name,
      node.position
    ) +
    this.emit(" {\n" + this.indent(1)) +
    this.mapVisit(node.keyframes, "\n") +
    this.emit(this.indent(-1) + "}")
  );
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node) {
  var decls = node.declarations;

  return (
    this.emit(this.indent()) +
    this.emit(node.values.join(", "), node.position) +
    this.emit(" {\n" + this.indent(1)) +
    this.mapVisit(decls, "\n") +
    this.emit(this.indent(-1) + "\n" + this.indent() + "}\n")
  );
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node) {
  var sel = node.selectors.length ? node.selectors.join(", ") + " " : "";

  return (
    this.emit("@page " + sel, node.position) +
    this.emit("{\n") +
    this.emit(this.indent(1)) +
    this.mapVisit(node.declarations, "\n") +
    this.emit(this.indent(-1)) +
    this.emit("\n}")
  );
};

/**
 * Visit font-face node.
 */

Compiler.prototype["font-face"] = function(node) {
  return (
    this.emit("@font-face ", node.position) +
    this.emit("{\n") +
    this.emit(this.indent(1)) +
    this.mapVisit(node.declarations, "\n") +
    this.emit(this.indent(-1)) +
    this.emit("\n}")
  );
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function(node) {
  return (
    this.emit("@host", node.position) +
    this.emit(" {\n" + this.indent(1)) +
    this.mapVisit(node.rules, "\n\n") +
    this.emit(this.indent(-1) + "\n}")
  );
};

/**
 * Visit custom-media node.
 */

Compiler.prototype["custom-media"] = function(node) {
  return this.emit(
    "@custom-media " + node.name + " " + node.media + ";",
    node.position
  );
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node) {
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return "";

  return (
    this.emit(
      node.selectors
        .map(function(s) {
          return indent + s;
        })
        .join(",\n"),
      node.position
    ) +
    this.emit(" {\n") +
    this.emit(this.indent(1)) +
    this.mapVisit(decls, "\n") +
    this.emit(this.indent(-1)) +
    this.emit("\n" + this.indent() + "}")
  );
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node) {
  return (
    this.emit(this.indent()) +
    this.emit(node.property + ": " + node.value, node.position) +
    this.emit(";")
  );
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function(level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return "";
  }

  return Array(this.level).join(this.indentation || "  ");
};

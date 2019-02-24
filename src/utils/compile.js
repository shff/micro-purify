/*

Code extracted from https://github.com/reworkcss/css



(The MIT License)

Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

export default (node, options) => new Compiler(options).compile(node);

function Compiler(options = {}) {
  this.options = options;
}

Compiler.prototype.compile = function(node) {
  return this.stylesheet(node);
};

Compiler.prototype.stylesheet = function(node) {
  return this.mapVisit(node.stylesheet.rules);
};

Compiler.prototype.mapVisit = function(nodes) {
  var buf = "";

  for (var i = 0, length = nodes.length; i < length; i++) {
    buf += this[nodes[i].type](nodes[i]);
  }

  return buf;
};

Compiler.prototype.comment = function() {
  return "";
};

Compiler.prototype.import = function(node) {
  return "@import " + node.import + ";";
};

Compiler.prototype.media = function({ media, rules }) {
  return "@media " + media + "{" + this.mapVisit(rules) + "}";
};

Compiler.prototype.document = function({ vendor, document, rules }) {
  var doc = "@" + (vendor || "") + "document " + document;

  return doc + (" " + " {") + this.mapVisit(rules) + "}";
};

Compiler.prototype.charset = function({ charset }) {
  return "@charset " + charset + ";";
};

Compiler.prototype.namespace = function({ namespace }) {
  return "@namespace " + namespace + ";";
};

Compiler.prototype.supports = function({ supports, rules }) {
  return "@supports " + supports + " {" + this.mapVisit(rules) + "}";
};

Compiler.prototype.keyframes = function({ vendor, name, keyframes }) {
  return (
    "@" +
    (vendor || "") +
    "keyframes " +
    name +
    " {" +
    this.mapVisit(keyframes) +
    "}"
  );
};

Compiler.prototype.keyframe = function({ declarations, values }) {
  return values.join(", ") + " {" + this.mapVisit(declarations) + "}";
};

Compiler.prototype.page = function({ selectors, declarations }) {
  var sel = selectors.length ? selectors.join(", ") + " " : "";

  return "@page " + sel + "{" + this.mapVisit(declarations) + "}";
};

Compiler.prototype["font-face"] = function({ declarations }) {
  return "@font-face " + "{" + this.mapVisit(declarations) + "}";
};

Compiler.prototype.host = function({ rules }) {
  return "@host" + " {" + this.mapVisit(rules) + "}";
};

Compiler.prototype["custom-media"] = function({ name, media }) {
  return "@custom-media " + name + " " + media + ";";
};

Compiler.prototype.rule = function({ declarations, selectors }) {
  if (!declarations.length) return "";

  return selectors.join(",") + "{" + this.mapVisit(declarations) + "}";
};

Compiler.prototype.declaration = function({ property, value }) {
  return property + ": " + value + ";";
};

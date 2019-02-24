/*

Code extracted from https://github.com/reworkcss/css



(The MIT License)

Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

const compiler = {
  compile(node) {
    return this.stylesheet(node);
  },
  stylesheet(node) {
    return this.mapVisit(node.stylesheet.rules);
  },
  mapVisit(nodes) {
    return nodes.map(node => this[node.type](node)).join("");
  },
  comment() {
    return "";
  },
  import(node) {
    return "@import " + node.import + ";";
  },
  media({ media, rules }) {
    const result = this.mapVisit(rules);
    if (!result.length) return "";
    return "@media " + media + "{" + result + "}";
  },
  document({ vendor, document, rules }) {
    if (!rules.length) return "";
    var doc = "@" + (vendor || "") + "document " + document;
    return doc + (" " + " {") + this.mapVisit(rules) + "}";
  },
  charset({ charset }) {
    return "@charset " + charset + ";";
  },
  namespace({ namespace }) {
    return "@namespace " + namespace + ";";
  },
  supports({ supports, rules }) {
    if (!rules.length) return "";
    return "@supports " + supports + " {" + this.mapVisit(rules) + "}";
  },
  keyframes({ vendor = "", name, keyframes }) {
    return (
      "@" + vendor + "keyframes " + name + " {" + this.mapVisit(keyframes) + "}"
    );
  },
  keyframe({ declarations, values }) {
    return values.join(", ") + " {" + this.mapVisit(declarations) + "}";
  },
  page({ selectors, declarations }) {
    if (selectors.length == 0) return "";
    var sel = selectors.length ? selectors.join(", ") + " " : "";
    return "@page " + sel + "{" + this.mapVisit(declarations) + "}";
  },
  "font-face"({ declarations }) {
    return "@font-face " + "{" + this.mapVisit(declarations) + "}";
  },
  host({ rules }) {
    if (!rules.length) return "";
    return "@host" + " {" + this.mapVisit(rules) + "}";
  },
  "custom-media"({ name, media }) {
    return "@custom-media " + name + " " + media + ";";
  },
  rule({ declarations, selectors }) {
    if (!declarations.length || !selectors.length) return "";
    return selectors.join(",") + "{" + this.mapVisit(declarations) + "}";
  },
  declaration({ property, value }) {
    return property + ": " + value + ";";
  }
};

export default node => compiler.compile(node);

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

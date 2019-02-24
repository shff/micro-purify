# Micro-Purify

[![Circle](https://img.shields.io/circleci/project/github/shff/micro-purify/master.svg)]()
[![npm](https://img.shields.io/npm/dm/micro-purify.svg)]()
[![David](https://img.shields.io/david/shff/micro-purify.svg)]()

This is a zero-dependencies fork of purify-css.

Micro-purify is a function that takes content (HTML/JS/PHP/etc) and CSS, and returns only the **used CSS**.
Micro-Purify does not modify the original CSS files. You can write to a new file, like minification.  
If your application is using a CSS framework, this is especially useful as many selectors are often unused.

### Potential reduction

* [Bootstrap](https://github.com/twbs/bootstrap) file: ~140k
* App using ~40% of selectors.
* Minified: ~117k
* Purified + Minified: **~35k**

## Usage

### Standalone

Installation  

```bash
npm i -D micro-purify
```

```javascript
import purify from "micro-purify"
const purify = require("micro-purify")

let content = ""
let css = ""
let options = {
    output: "filepath/output.css"
}
purify(content, css, options)
```


## How it works

### Used selector detection

Statically analyzes your code to pick up which selectors are used.  
But will it catch all of the cases?  

#### Let's start off simple.
#### Detecting the use of: `button-active`

``` html
  <!-- html -->
  <!-- class directly on element -->
  <div class="button-active">click</div>
```

``` javascript
  // javascript
  // Anytime your class name is together in your files, it will find it.
  $(button).addClass('button-active');
```

#### Now let's get crazy.
#### Detecting the use of: `button-active`

``` javascript
  // Can detect if class is split.
  var half = 'button-';
  $(button).addClass(half + 'active');

  // Can detect if class is joined.
  var dynamicClass = ['button', 'active'].join('-');
  $(button).addClass(dynamicClass);

  // Can detect various more ways, including all Javascript frameworks.
  // A React example.
  var classes = classNames({
    'button-active': this.state.buttonActive
  });

  return (
    <button className={classes}>Submit</button>;
  );
```

### Examples


##### Example with source strings

```js
var content = '<button class="button-active"> Login </button>';
var css = '.button-active { color: green; }   .unused-class { display: block; }';

console.log(purify(content, css));
```

logs out:

```
.button-active { color: green; }
```


##### Example with [glob](https://github.com/isaacs/node-glob) file patterns + writing to a file

```js
var content = ['**/src/js/*.js', '**/src/html/*.html'];
var css = ['**/src/css/*.css'];

var options = {
  // Will write purified CSS to this file.
  output: './dist/purified.css'
};

purify(content, css, options);
```


##### Example with both [glob](https://github.com/isaacs/node-glob) file patterns and source strings

```js
var content = ['**/src/js/*.js', '**/src/html/*.html'];
var css = '.button-active { color: green; } .unused-class { display: block; }';

var options = {
  output: './dist/purified.css'
};

purify(content, css, options);
```



### API in depth

```javascript
// Three possible arguments.
purify(content, css, options);
```

#####  The `content` argument
##### Type: `Array` or `String`

**`Array`** of [glob](https://github.com/isaacs/node-glob) file patterns to the files to search through for used classes (HTML, JS, PHP, ERB, Templates, anything that uses CSS selectors).

**`String`** of content to look at for used classes.

<br />

##### The `css` argument
##### Type: `Array` or `String`

**`Array`** of [glob](https://github.com/isaacs/node-glob) file patterns to the CSS files you want to filter.

**`String`** of CSS to purify.

<br />

##### The (optional) `options` argument
##### Type: `Object`

##### Properties of options object:

* **`whitelist`** Array of selectors to always leave in. Ex. `['button-active', '*modal*']` this will leave any selector that includes `modal` in it and selectors that match `button-active`. (wrapping the string with *'s, leaves all selectors that include it)

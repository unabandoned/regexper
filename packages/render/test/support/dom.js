// svg.js needs a DOM. In a browser it finds one; here svgdom provides it, which
// is what lets the renderer be tested in-process instead of through a headless
// browser.
const { createSVGWindow } = require('svgdom');
const { registerWindow } = require('@svgdotjs/svg.js');

const win = createSVGWindow();
registerWindow(win, win.document);

const tagsOf = (el, name) => [...el.getElementsByTagName(name)];

const isInsideTitle = (el) => {
  for (let node = el.parentNode; node; node = node.parentNode) {
    if (node.tagName === 'title') return true;
  }
  return false;
};

/**
 * The visible text of every label in the diagram, in document order.
 *
 * A label's tooltip is a <title> nested inside its <text>, so `textContent`
 * alone would run the two together. Tooltips are read separately, by `tooltips`.
 */
const labels = (svg) => tagsOf(svg, 'text')
  .filter((text) => !isInsideTitle(text))
  .map((text) => {
    const nested = tagsOf(text, 'title').map((t) => t.textContent).join('');
    return nested ? text.textContent.replace(nested, '') : text.textContent;
  });

/** The text of every tooltip in the diagram. */
const tooltips = (svg) => tagsOf(svg, 'title').map((title) => title.textContent);

module.exports = { win, labels, tooltips };

// The renderer turns a regular expression into a railroad diagram. Upstream
// shipped `"test": "echo ."`, so none of this was covered — and the fork had to
// change the source to build against current @svgdotjs/svg.js, which is exactly
// the kind of change that needs something watching the output.
//
// Assertions are on the diagram's labels and shape rather than on an SVG string:
// element ids are generated per render, so byte comparison would be noise.

const test = require('node:test');
const assert = require('node:assert/strict');

const { win, labels, tooltips } = require('./support/dom');
const { generateSVG, render } = require('../lib/index.js');

test('renders every construct in a non-trivial expression', async () => {
  const svg = await generateSVG('/^ab+(c|d)[0-9]{2,3}$/gi');
  const text = labels(svg);

  assert.deepEqual(text, [
    'Flags: Global, Ignore Case',
    'Start of line',
    '“a”',
    '“b”',
    'group #1',
    '“c”',
    '“d”',
    'One of:',
    '-',
    '“0”',
    '“9”',
    '1…2 times',
    'End of line',
  ]);

  assert.deepEqual(tooltips(svg), ['repeats 2…3 times in total'],
    'the repeat count carries its explanation as a tooltip');
});

test('sizes the diagram to its content', async () => {
  const small = await generateSVG('/a/');
  const large = await generateSVG('/a very much longer pattern|with an alternate/');

  for (const svg of [small, large]) {
    assert.ok(Number(svg.getAttribute('width')) > 0, 'has a width');
    assert.ok(Number(svg.getAttribute('height')) > 0, 'has a height');
  }
  assert.ok(
    Number(large.getAttribute('width')) > Number(small.getAttribute('width')),
    'a bigger expression gets a bigger diagram',
  );
});

test('labels only the flags that are set', async () => {
  const { 0: first } = labels(await generateSVG('/a/m'));
  assert.equal(first, 'Flags: Multiline');

  const none = labels(await generateSVG('/a/'));
  assert.ok(!none.some((l) => l.startsWith('Flags:')), 'no flag label without flags');
});

test('accepts a RegExp as readily as a string', async () => {
  assert.deepEqual(
    labels(await generateSVG(/^a|b$/g)),
    labels(await generateSVG('/^a|b$/g')),
    'the two spellings describe the same diagram',
  );
});

test('embeds the stylesheet, so the diagram stands alone', async () => {
  const svg = await generateSVG('/a/');
  const [style] = svg.getElementsByTagName('style');

  assert.ok(style, 'there is a <style> element');
  assert.match(style.textContent, /\.root text/, 'it carries the package stylesheet');
});

test('does not leave svg.js private attributes on the output', async () => {
  // `render` removes xmlns:svgjs; without that the markup carries an attribute
  // that is meaningless to anything but svg.js.
  const svg = await generateSVG('/a/');
  assert.equal(svg.getAttribute('xmlns:svgjs'), null);
});

test('render draws into a container that is handed to it', async () => {
  const container = win.document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const root = await render('/ab/', container);

  assert.ok(root, 'returns the root node');
  assert.ok(labels(container).includes('“ab”'), 'the diagram went into the container');
  assert.ok(Number(container.getAttribute('width')) > 0, 'the container was sized');
});

test('refuses an expression it cannot parse', async () => {
  await assert.rejects(() => generateSVG('/(unclosed/'), (err) => {
    assert.match(err.message, /Line 1/, 'the parse error points at the input');
    return true;
  });
});

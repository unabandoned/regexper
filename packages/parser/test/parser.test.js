// `regexp.js` is generated from `regexp.peg` by canopy, and upstream shipped no
// tests for it — a grammar change, a canopy upgrade or a bad minify would all
// have gone unnoticed. These run against the built artifacts, which is what
// consumers get.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const parser = require('../regexp.js');

const grammar = fs.readFileSync(path.join(__dirname, '..', 'regexp.peg'), 'utf8');

// Every `<NodeType>` the grammar annotates is a type the caller has to supply:
// canopy mixes the matching entry of `types` into each node it builds. Deriving
// the list from the grammar keeps this honest if the grammar grows a node.
const NODE_TYPES = [...new Set(grammar.match(/<([A-Za-z]+)>/g).map((s) => s.slice(1, -1)))];
const types = Object.fromEntries(NODE_TYPES.map((name) => [name, {}]));

const parse = (input) => parser.parse(input, { types });

test('exposes canopy\'s parser surface', () => {
  assert.equal(typeof parser.parse, 'function');
  assert.equal(typeof parser.Parser, 'function');
  assert.equal(typeof parser.Grammar, 'object');
});

test('the grammar names exactly the node types the renderer implements', () => {
  // If this list changes, @unabandoned/regexper-render's getExtensions() has to
  // change with it, or parsing throws on the node that has no type.
  assert.deepEqual(NODE_TYPES.sort(), [
    'Anchor', 'AnyCharacter', 'Charset', 'CharsetEscape', 'CharsetRange',
    'Escape', 'Literal', 'Match', 'MatchFragment', 'Regexp', 'Repeat',
    'RepeatAny', 'RepeatOptional', 'RepeatRequired', 'RepeatSpec', 'Root',
    'Subexp',
  ]);
});

test('parse needs a type for every node it builds', () => {
  // The contract is easy to miss, because the failure is a TypeError from inside
  // the generated parser rather than a complaint about the argument.
  assert.throws(() => parser.parse('a'), TypeError);
});

test('reads an expression with delimiters and flags', () => {
  const root = parse('/ab/gi');

  assert.equal(root.regexp.text, 'ab');
  assert.equal(root.flags.text, 'gi');
});

test('reads a bare expression, with no delimiters at all', () => {
  const root = parse('ab');

  assert.equal(root.regexp.text, 'ab');
  assert.equal(root.flags.text, '', 'no flags, rather than no flags node');
});

test('splits alternation into a match and its alternates', () => {
  const { regexp } = parse('/a|b|c/');

  assert.equal(regexp.match.text, 'a');
  assert.deepEqual(
    regexp.alternates.elements.map((e) => e.match.text),
    ['b', 'c'],
  );
});

test('attaches a repeat to the fragment it repeats', () => {
  const parts = parse('/ab+/').regexp.match.parts.elements;

  assert.deepEqual(
    parts.map((part) => [part.content.text, part.repeat.text]),
    [['a', ''], ['b', '+']],
    'only the second fragment is repeated',
  );
});

test('reads the three spellings of a counted repeat', () => {
  const repeatOf = (pattern) => {
    const parts = parse(pattern).regexp.match.parts.elements;
    return parts[parts.length - 1].repeat.spec;
  };

  assert.equal(repeatOf('/a{2,3}/').min.text, '2');
  assert.equal(repeatOf('/a{2,3}/').max.text, '3');
  assert.equal(repeatOf('/a{2,}/').min.text, '2');
  assert.equal(repeatOf('/a{2}/').exact.text, '2');
});

test('reads a charset, inverted or not, with ranges and escapes', () => {
  const plain = parse('/[a-z0]/').regexp.match.parts.elements[0].content;
  assert.equal(plain.invert.text, '', 'not inverted');
  assert.deepEqual(plain.parts.elements.map((p) => p.text), ['a-z', '0']);

  const inverted = parse('/[^\\d]/').regexp.match.parts.elements[0].content;
  assert.equal(inverted.invert.text, '^');
  assert.deepEqual(inverted.parts.elements.map((p) => p.text), ['\\d']);
});

test('reads a subexpression and what kind of group it is', () => {
  const groupOf = (pattern) => parse(pattern).regexp.match.parts.elements[0].content;

  assert.equal(groupOf('/(a)/').capture.text, '', 'a capturing group');
  assert.equal(groupOf('/(?:a)/').capture.text, '?:', 'non-capturing');
  assert.equal(groupOf('/(?=a)/').capture.text, '?=', 'lookahead');
  assert.equal(groupOf('/(?!a)/').capture.text, '?!', 'negative lookahead');
  assert.equal(groupOf('/(a|b)/').regexp.text, 'a|b', 'it contains a whole expression');
});

test('reads anchors and the any-character dot', () => {
  const contentOf = (pattern) => parse(pattern).regexp.match.parts.elements[0].content;

  assert.equal(contentOf('/^a/').text, '^');
  assert.equal(contentOf('/a$/').text, 'a');
  assert.equal(contentOf('/./').text, '.');
});

test('rejects an expression it cannot parse, and says where', () => {
  assert.throws(() => parse('/(a/'), (err) => {
    assert.match(err.message, /Line 1/);
    assert.match(err.message, /\^/, 'the message points at the offending column');
    return true;
  });
});

test('the minified build parses identically to the readable one', () => {
  // regexp.min.js is what the unpkg and jsdelivr entry points serve, and nothing
  // else checks that terser left it working.
  const minified = require('../regexp.min.js');
  const pattern = '/^ab+(c|d)[0-9]{2,3}$/gi';

  assert.deepEqual(
    JSON.stringify(minified.parse(pattern, { types })),
    JSON.stringify(parse(pattern)),
  );
});

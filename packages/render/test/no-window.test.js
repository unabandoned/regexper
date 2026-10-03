// In its own file deliberately: `node --test` runs each file in its own process,
// and svg.js keeps its window in module state, so this is the only way to see the
// un-registered case after any other test has registered one.

const test = require('node:test');
const assert = require('node:assert/strict');

const { generateSVG } = require('../lib/index.js');

test('says plainly that no window is registered, instead of failing deep inside', async () => {
  await assert.rejects(() => generateSVG('/a/'), (err) => {
    assert.match(err.message, /No window is registered/);
    assert.match(err.message, /registerWindow/, 'and names the way out');
    return true;
  });
});

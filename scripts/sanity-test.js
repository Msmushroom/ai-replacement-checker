const assert = require('assert');
const { generateCheck, MODES, getCombinationEstimate } = require('../lib/generator');

const seenModes = new Set();

for (let i = 0; i < 300; i += 1) {
  const result = generateCheck('今天开会写周报然后发呆');

  assert.strictEqual(typeof result.rate, 'number');
  assert.strictEqual(typeof result.human_remaining, 'number');
  assert.strictEqual(typeof result.quote, 'string');
  assert.strictEqual(typeof result.mode, 'string');

  assert.ok(result.rate >= 5 && result.rate <= 95, `rate out of range: ${result.rate}`);
  assert.strictEqual(result.human_remaining, 100 - result.rate, 'human_remaining mismatch');
  assert.ok(MODES.includes(result.mode), `invalid mode: ${result.mode}`);
  assert.ok(result.quote.length >= 10, 'quote too short');

  seenModes.add(result.mode);
}

assert.ok(seenModes.size >= 3, `mode coverage too low: ${seenModes.size}`);

const combinations = getCombinationEstimate();
assert.ok(combinations >= 200, `combination space too small: ${combinations}`);

console.log(`sanity-test 通过：字段、范围、模式合法，组合空间估算=${combinations}`);

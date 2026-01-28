"use strict";

const assert = require("assert");
const leftPad = require("..");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  let failures = 0;
  for (const entry of tests) {
    try {
      entry.fn();
      console.log(`ok - ${entry.name}`);
    } catch (err) {
      failures += 1;
      console.error(`not ok - ${entry.name}`);
      console.error(err && err.stack ? err.stack : err);
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  }
}

function truncateTowardZero(value) {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randAsciiString(rng, maxLen) {
  const length = randInt(rng, 0, maxLen);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const code = randInt(rng, 32, 126);
    out += String.fromCharCode(code);
  }
  return out;
}

function pick(rng, items) {
  return items[randInt(rng, 0, items.length - 1)];
}

function computePadInfo(strValue, lenValue, padValue, hasPadArg) {
  const base = String(strValue);
  const target = Number(lenValue);
  const raw = target - base.length;
  if (!Number.isFinite(raw) || raw <= 0) {
    return { base, padCount: 0, padText: "" };
  }
  const padCount = truncateTowardZero(raw);
  if (padCount <= 0) {
    return { base, padCount: 0, padText: "" };
  }
  let padSource;
  if (!hasPadArg || (!padValue && padValue !== 0)) {
    padSource = " ";
  } else {
    padSource = padValue;
  }
  const padText = String(padSource);
  return { base, padCount, padText };
}

test("exports a function", () => {
  assert.strictEqual(typeof leftPad, "function");
});

test("coerces str before length checks", () => {
  assert.strictEqual(leftPad(null, 6, "."), "..null");
});

test("len less than or equal to length returns string", () => {
  assert.strictEqual(leftPad("abc", 2, "."), "abc");
  assert.strictEqual(leftPad("abc", 3, "."), "abc");
});

test("negative and non-finite lengths return string", () => {
  assert.strictEqual(leftPad("abc", -1, "."), "abc");
  assert.strictEqual(leftPad("abc", NaN, "."), "abc");
  assert.strictEqual(leftPad("abc", Infinity, "."), "abc");
});

test("undefined length returns string", () => {
  assert.strictEqual(leftPad("abc", undefined, "."), "abc");
});

test("fractional length truncates toward zero", () => {
  assert.strictEqual(leftPad("ab", 4.9, "."), "..ab");
});

test("default pad when omitted", () => {
  assert.strictEqual(leftPad("hi", 4), "  hi");
});

test("default pad for falsy values except numeric zero", () => {
  const falsyPads = ["", false, null, undefined, NaN];
  for (const pad of falsyPads) {
    assert.strictEqual(leftPad("ab", 4, pad), "  ab");
  }
});

test("numeric zero pad is preserved", () => {
  assert.strictEqual(leftPad("ab", 4, 0), "00ab");
});

test("multi-character pad repeats as a unit", () => {
  assert.strictEqual(leftPad("hi", 4, "ab"), "ababhi");
});

test("pad value is coerced to string when used", () => {
  assert.strictEqual(leftPad("x", 3, true), "truetruex");
});

test("surrogate pairs count as two code units", () => {
  const smile = String.fromCharCode(0xd83d, 0xde00);
  assert.strictEqual(smile.length, 2);
  assert.strictEqual(leftPad(smile, 4, "."), `..${smile}`);
});

test("errors from coercion propagate", () => {
  const badValue = {
    toString() {
      throw new Error("boom");
    },
  };
  assert.throws(() => leftPad(badValue, 5, "."), /boom/);
});

test("errors from pad coercion propagate", () => {
  const badPad = {
    toString() {
      throw new Error("pad boom");
    },
  };
  assert.throws(() => leftPad("x", 3, badPad), /pad boom/);
});

test("property-based invariants", () => {
  const rng = createRng(123456789);
  const iterations = 400;
  for (let i = 0; i < iterations; i += 1) {
    const baseValue = pick(rng, [
      randAsciiString(rng, 6),
      randInt(rng, -50, 50),
      true,
      false,
      null,
      undefined,
    ]);

    let lenValue;
    const lenChoice = rng();
    if (lenChoice < 0.1) {
      lenValue = NaN;
    } else if (lenChoice < 0.2) {
      lenValue = Infinity;
    } else if (lenChoice < 0.25) {
      lenValue = -Infinity;
    } else {
      const baseLen = randInt(rng, -3, 10);
      lenValue = rng() < 0.3 ? baseLen + 0.6 : baseLen;
    }

    const padValue = pick(rng, [
      randAsciiString(rng, 3),
      "",
      false,
      null,
      undefined,
      0,
      1,
      true,
    ]);

    const hasPadArg = rng() < 0.7;
    const result = hasPadArg
      ? leftPad(baseValue, lenValue, padValue)
      : leftPad(baseValue, lenValue);

    const info = computePadInfo(baseValue, lenValue, padValue, hasPadArg);
    assert.strictEqual(result.slice(-info.base.length), info.base);

    if (info.padCount <= 0) {
      assert.strictEqual(result, info.base);
      continue;
    }

    const expectedPrefix = info.padText.repeat(info.padCount);
    assert.ok(result.startsWith(expectedPrefix));
  }
});

run();

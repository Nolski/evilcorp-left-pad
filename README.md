# left-pad (clean room)

This repository provides a clean-room implementation of a single
function, `leftPad`, based only on the Clean Specification Pack (CSP).
The goal is behavioral compatibility with the documented API without
reusing any original source, tests, or documentation.

## Usage

CommonJS:

```js
const leftPad = require("left-pad");

leftPad("cat", 6, "."); // "...cat"
leftPad("cat", 2);      // "cat"
leftPad(42, 5, "0");    // "00042"
```

## Behavior Summary

- `str` is coerced with `String(...)` before length checks.
- `len` is coerced with `Number(...)`.
- The pad unit defaults to a single space if omitted or falsy, except that
  numeric `0` is preserved and becomes `"0"`.
- Padding is computed as `len - str.length` (UTF-16 code units).
- Non-finite or non-positive padding results in the original coerced string.
- The pad unit is repeated as a whole; multi-character pads may overshoot
  the target length.

## Testing

```sh
npm test
```

The test suite includes:
- Edge case unit tests
- Property-based invariant checks
- CommonJS export compatibility

## Clean-room compliance

This implementation was authored from scratch and follows the CSP
requirements and prohibitions. It does not reference or copy original
source code, tests, or documentation.

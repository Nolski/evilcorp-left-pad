"use strict";

function truncateTowardZero(value) {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}

function repeatUnit(unit, count) {
  if (count <= 0) {
    return "";
  }
  return unit.repeat(count);
}

function leftPad(input, targetLength, padUnit) {
  const valueStr = String(input);
  const desiredLength = Number(targetLength);
  const rawPadCount = desiredLength - valueStr.length;

  if (!Number.isFinite(rawPadCount) || rawPadCount <= 0) {
    return valueStr;
  }

  const padCount = truncateTowardZero(rawPadCount);
  if (padCount <= 0) {
    return valueStr;
  }

  const hasPadArg = arguments.length >= 3;
  let padSource;
  if (!hasPadArg || (!padUnit && padUnit !== 0)) {
    padSource = " ";
  } else {
    padSource = padUnit;
  }

  const padText = String(padSource);
  const prefix = repeatUnit(padText, padCount);
  return prefix + valueStr;
}

module.exports = leftPad;

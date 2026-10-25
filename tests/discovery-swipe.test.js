import test from "node:test";
import assert from "node:assert/strict";
import {
  commitThreshold,
  isInteractiveSwipeTarget,
  resolveSwipeAxis,
  shouldCommitSwipe,
  swipeActionFromDx,
  swipeStrength,
} from "../src/lib/discovery-swipe.js";

test("resolveSwipeAxis ignores jitter below lock distance", () => {
  assert.equal(resolveSwipeAxis(3, 2), null);
  assert.equal(resolveSwipeAxis(-5, 6), null);
});

test("resolveSwipeAxis locks horizontal and vertical intent", () => {
  assert.equal(resolveSwipeAxis(24, 4), "horizontal");
  assert.equal(resolveSwipeAxis(-30, 8), "horizontal");
  assert.equal(resolveSwipeAxis(5, 22), "vertical");
});

test("commitThreshold scales with card width and stays in bounds", () => {
  assert.equal(commitThreshold(100), 48);
  assert.equal(commitThreshold(320), 64);
  assert.equal(commitThreshold(800), 96);
});

test("shouldCommitSwipe accepts distance or flick velocity", () => {
  assert.equal(shouldCommitSwipe({ dx: 80, elapsedMs: 400, cardWidth: 320 }), true);
  assert.equal(shouldCommitSwipe({ dx: 24, elapsedMs: 40, cardWidth: 320 }), true);
  assert.equal(shouldCommitSwipe({ dx: 20, elapsedMs: 250, cardWidth: 320 }), false);
});

test("swipeActionFromDx maps direction", () => {
  assert.equal(swipeActionFromDx(42), "choose");
  assert.equal(swipeActionFromDx(-42), "pass");
});

test("swipeStrength saturates at 1", () => {
  assert.equal(swipeStrength(36, 72), 0.5);
  assert.equal(swipeStrength(-120, 72), 1);
});

test("isInteractiveSwipeTarget detects buttons and links", () => {
  assert.equal(isInteractiveSwipeTarget({ closest: (sel) => (sel.includes("button") ? {} : null) }), true);
  assert.equal(isInteractiveSwipeTarget({ closest: () => null }), false);
});

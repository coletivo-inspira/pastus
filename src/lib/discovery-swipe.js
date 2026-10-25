/** Pure helpers for discovery-card swipe (Tinder-like, cross-device). */

export const SWIPE = {
  lockPx: 8,
  lockRatio: 1.15,
  commitRatio: 0.2,
  commitMinPx: 48,
  commitMaxPx: 96,
  velocityCommit: 0.4,
  strengthPx: 72,
};

export function swipeDelta(start, clientX, clientY) {
  return {
    dx: clientX - start.x,
    dy: clientY - start.y,
  };
}

export function resolveSwipeAxis(dx, dy, { lockPx = SWIPE.lockPx, lockRatio = SWIPE.lockRatio } = {}) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < lockPx && ay < lockPx) return null;
  if (ay >= lockPx && ay > ax * lockRatio) return "vertical";
  if (ax >= lockPx && ax >= ay * lockRatio) return "horizontal";
  return null;
}

export function commitThreshold(cardWidth, {
  commitRatio = SWIPE.commitRatio,
  commitMinPx = SWIPE.commitMinPx,
  commitMaxPx = SWIPE.commitMaxPx,
} = {}) {
  const width = Math.max(0, Number(cardWidth) || 0);
  return Math.min(commitMaxPx, Math.max(commitMinPx, width * commitRatio));
}

export function shouldCommitSwipe({ dx, elapsedMs, cardWidth, velocityCommit = SWIPE.velocityCommit } = {}) {
  const distance = Math.abs(dx);
  const threshold = commitThreshold(cardWidth);
  if (distance >= threshold) return true;
  const dt = Math.max(elapsedMs || 0, 1);
  const velocity = distance / dt;
  return distance >= lockFloor() && elapsedMs > 0 && elapsedMs < 320 && velocity >= velocityCommit;
}

function lockFloor() {
  return SWIPE.lockPx * 2;
}

export function swipeActionFromDx(dx) {
  return dx > 0 ? "choose" : "pass";
}

export function swipeStrength(dx, strengthPx = SWIPE.strengthPx) {
  return Math.min(Math.abs(dx) / strengthPx, 1);
}

export function isInteractiveSwipeTarget(target) {
  return Boolean(target?.closest?.("button, a, input, textarea, select, label, [role='button']"));
}

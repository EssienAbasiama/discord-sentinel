// ─── RATE LIMITER ─────────────────────────────────────────────────────────────
// Prevents sending too many notifications too fast, which could flag your account

const COOLDOWNS = new Map();

/**
 * Checks if an action is allowed based on a cooldown window
 * @param {string} key        - Unique key e.g. "keyword-engineer" or "join-userId"
 * @param {number} cooldownMs - Minimum ms to wait before allowing the same key again
 * @returns {boolean}         - true = allowed, false = still on cooldown
 */
function isAllowed(key, cooldownMs) {
  const now = Date.now();
  const lastSent = COOLDOWNS.get(key);

  if (lastSent && now - lastSent < cooldownMs) {
    return false; // still on cooldown
  }

  COOLDOWNS.set(key, now);
  return true;
}

// ── Cooldown config (edit these to tune behaviour) ────────────────────────────
const COOLDOWNS_CONFIG = {
  // Same keyword from the same channel: wait 30 seconds before notifying again
  KEYWORD_PER_CHANNEL_MS: 30_000,

  // Same user joining (edge case for re-joins): wait 5 minutes
  MEMBER_JOIN_MS: 5 * 60_000,

  // Global max: no more than 1 notification every 2 seconds (burst protection)
  GLOBAL_MS: 2_000,
};

module.exports = { isAllowed, COOLDOWNS_CONFIG };

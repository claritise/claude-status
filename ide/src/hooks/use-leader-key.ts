import { useCallback, useRef } from 'react';
import { INSTANCE_COUNT, LEADER_TIMEOUT_MS } from '../lib/constants.js';

export type LeaderAction =
  /** Leader key consumed the input — do nothing further */
  | { type: 'consumed' }
  /** Switch to instance at this index (0-based) */
  | { type: 'switch'; index: number }
  /** Not a leader sequence — caller should handle the input normally */
  | { type: 'pass' };

/**
 * Create a leader key handler (pure state machine, no React dependency).
 * Used directly in tests and wrapped by the useLeaderKey hook.
 *
 * Leader sequences:
 * - Ctrl+A → 1/2/3/4: switch instance
 * - Ctrl+A → Ctrl+A: pass through (sends literal Ctrl+A to PTY)
 * - Ctrl+A → (timeout): calls onLeaderTimeout
 * - Ctrl+A → (other): pass through
 */
export function createLeaderKeyHandler(
  onLeaderTimeout: () => void,
): (input: string, key: { ctrl: boolean }) => LeaderAction {
  let leaderActive = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function clearLeaderTimeout() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  }

  return (input: string, key: { ctrl: boolean }): LeaderAction => {
    // Ctrl+A pressed
    if (key.ctrl && input === 'a') {
      if (leaderActive) {
        // Ctrl+A → Ctrl+A: forward literal Ctrl+A
        leaderActive = false;
        clearLeaderTimeout();
        return { type: 'pass' };
      }

      // Enter leader mode with timeout
      leaderActive = true;
      clearLeaderTimeout();
      timeout = setTimeout(() => {
        if (leaderActive) {
          leaderActive = false;
          onLeaderTimeout();
        }
      }, LEADER_TIMEOUT_MS);

      return { type: 'consumed' };
    }

    // In leader mode — check for follow-up key
    if (leaderActive) {
      leaderActive = false;
      clearLeaderTimeout();

      // 1-4 switches instance
      const num = parseInt(input, 10);
      if (!key.ctrl && num >= 1 && num <= INSTANCE_COUNT) {
        return { type: 'switch', index: num - 1 };
      }

      // Unknown leader combo — pass through
      return { type: 'pass' };
    }

    // Not in leader mode
    return { type: 'pass' };
  };
}

/**
 * React hook wrapping the leader key state machine.
 * Stable across re-renders via useRef.
 */
export function useLeaderKey(onLeaderTimeout: () => void) {
  const onTimeoutRef = useRef(onLeaderTimeout);
  onTimeoutRef.current = onLeaderTimeout;

  const handlerRef = useRef<ReturnType<typeof createLeaderKeyHandler> | null>(null);
  if (!handlerRef.current) {
    handlerRef.current = createLeaderKeyHandler(() => onTimeoutRef.current());
  }

  return useCallback(
    (input: string, key: { ctrl: boolean }) => handlerRef.current!(input, key),
    [],
  );
}

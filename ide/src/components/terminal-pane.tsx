import { useEffect, useRef } from 'react';
import { Box } from 'ink';
import type { Instance } from '../lib/types.js';
import { renderTerminalToScreen } from '../lib/terminal-renderer.js';
import { RENDER_INTERVAL_MS } from '../lib/constants.js';

interface TerminalPaneProps {
  instance: Instance | null;
  /** Row offset where the pane starts on screen (1-based) */
  offsetRow: number;
  /** Number of rows available for the pane */
  rows: number;
  /** Number of columns available for the pane */
  cols: number;
}

/**
 * Renders a PTY instance's xterm buffer to a reserved screen region.
 *
 * Ink renders a <Box> placeholder to reserve vertical space. The actual
 * terminal content is written directly to stdout via ANSI escape sequences,
 * bypassing Ink's reconciler.
 */
export default function TerminalPane({ instance, offsetRow, rows, cols }: TerminalPaneProps) {
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!instance) return;

    // Always repaint every tick. Ink's clearTerminal path can overwrite our
    // direct stdout writes, so we must repaint unconditionally to ensure
    // colors and content persist. The 16ms interval (~60fps) keeps CPU
    // usage reasonable.
    let disposed = false;

    const tick = () => {
      if (!disposed) {
        renderTerminalToScreen(instance.terminal, offsetRow, 1);
      }
      if (!disposed) {
        rafRef.current = setTimeout(tick, RENDER_INTERVAL_MS);
      }
    };

    // Initial render + start loop
    renderTerminalToScreen(instance.terminal, offsetRow, 1);
    rafRef.current = setTimeout(tick, RENDER_INTERVAL_MS);

    return () => {
      disposed = true;
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [instance, offsetRow]);

  // Reserve vertical space in Ink's layout so the status bar renders below
  return <Box height={rows} width={cols} />;
}

import { useEffect, useRef } from 'react';
import { Box } from 'ink';
import type { Instance } from '../lib/types.js';
import { renderTerminalToScreen } from '../lib/terminal-renderer.js';

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

    // Render on every xterm write (debounced via requestAnimationFrame-style loop)
    let dirty = false;

    const onWrite = instance.terminal.onWriteParsed(() => {
      dirty = true;
    });

    const tick = () => {
      if (dirty) {
        dirty = false;
        renderTerminalToScreen(instance.terminal, offsetRow, 1);
      }
      rafRef.current = setTimeout(tick, 16); // ~60fps
    };

    // Initial render
    renderTerminalToScreen(instance.terminal, offsetRow, 1);
    rafRef.current = setTimeout(tick, 16);

    return () => {
      onWrite.dispose();
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [instance, offsetRow]);

  // Reserve vertical space in Ink's layout so the status bar renders below
  return <Box height={rows} width={cols} />;
}

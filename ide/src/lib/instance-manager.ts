import * as pty from 'node-pty';
import xterm from '@xterm/headless';
const { Terminal } = xterm;
import { type Instance } from './types.js';

/**
 * Spawn a Claude Code process in a PTY with an xterm-headless terminal
 * for ANSI parsing. Returns an Instance with the pty and terminal.
 */
export function createInstance(id: number, cols: number, rows: number, cwd: string): Instance {
  const terminal = new Terminal({ cols, rows, scrollback: 5000 });

  const shell = process.env.SHELL ?? '/bin/zsh';
  const proc = pty.spawn(shell, ['-l', '-c', 'claude'], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: { ...process.env },
  });

  // Pipe PTY output into the xterm terminal for ANSI parsing
  proc.onData((data) => {
    terminal.write(data);
  });

  return { id, pty: proc, terminal };
}

/**
 * Resize both the PTY and the xterm terminal to new dimensions.
 */
export function resizeInstance(instance: Instance, cols: number, rows: number): void {
  instance.pty.resize(cols, rows);
  instance.terminal.resize(cols, rows);
}

/**
 * Write data (keystrokes) to an instance's PTY.
 */
export function writeToInstance(instance: Instance, data: string): void {
  instance.pty.write(data);
}

/**
 * Kill an instance's PTY process. Returns a promise that resolves
 * when the process exits or after a timeout.
 */
export function destroyInstance(instance: Instance): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      instance.pty.kill('SIGKILL');
      resolve();
    }, 3000);

    instance.pty.onExit(() => {
      clearTimeout(timeout);
      resolve();
    });

    instance.pty.kill('SIGTERM');
    instance.terminal.dispose();
  });
}

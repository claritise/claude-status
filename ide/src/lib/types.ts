import type { IPty } from 'node-pty';
import type { Terminal } from '@xterm/headless';

export interface Instance {
  id: number;
  pty: IPty;
  terminal: Terminal;
}

export type InstanceState =
  | 'idle'
  | 'running'
  | 'reading'
  | 'writing'
  | 'waiting'
  | 'error'
  | 'done';

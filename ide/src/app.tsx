import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import {
  CHROME_ROWS,
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  INSTANCE_COUNT,
  LEADER_KEY,
} from './lib/constants.js';
import {
  createInstance,
  destroyInstance,
  resizeInstance,
  writeToInstance,
} from './lib/instance-manager.js';
import { registerCleanupHandlers, setCleanupInstances } from './lib/cleanup.js';
import { useLeaderKey } from './hooks/use-leader-key.js';
import TerminalPane from './components/terminal-pane.js';
import type { Instance } from './lib/types.js';

interface AppProps {
  /** Skip PTY spawning (for tests) */
  skipPty?: boolean;
}

export default function App({ skipPty = false }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? DEFAULT_COLUMNS;
  const rows = stdout?.rows ?? DEFAULT_ROWS;
  const paneRows = rows - CHROME_ROWS;

  const [instances, setInstances] = useState<Instance[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const instancesRef = useRef<Instance[]>([]);

  // Get the currently focused instance
  const focused = instances[focusedIndex] ?? null;
  const focusedRef = useRef<Instance | null>(null);
  focusedRef.current = focused;

  // Leader key timeout: forward Ctrl+A to the focused PTY
  const onLeaderTimeout = useCallback(() => {
    if (focusedRef.current) {
      writeToInstance(focusedRef.current, '\x01');
    }
  }, []);

  const handleLeaderKey = useLeaderKey(onLeaderTimeout);

  // Register cleanup handlers once on mount
  useEffect(() => {
    if (skipPty) return;
    registerCleanupHandlers();
  }, [skipPty]);

  // Spawn all instances on mount, clean up on unmount
  useEffect(() => {
    if (skipPty) return;

    const cwd = process.cwd();
    const created: Instance[] = [];
    for (let i = 0; i < INSTANCE_COUNT; i++) {
      try {
        created.push(createInstance(i, columns, paneRows, cwd));
      } catch (err) {
        process.stderr.write(`[nekode] failed to spawn instance ${i}: ${err}\n`);
      }
    }
    instancesRef.current = created;
    setInstances(created);
    setCleanupInstances(created);

    return () => {
      instancesRef.current = [];
      setCleanupInstances([]);
      for (const inst of created) {
        void destroyInstance(inst);
      }
    };
  }, [skipPty]);

  // Handle terminal resize — resize all instances
  useEffect(() => {
    for (const inst of instancesRef.current) {
      resizeInstance(inst, columns, paneRows);
    }
  }, [columns, paneRows]);

  // Forward input to the focused PTY, with leader key interception
  useInput(
    (input, key) => {
      // Ctrl+D exits the nekode IDE
      if (key.ctrl && input === 'd') {
        exit();
        return;
      }

      // Run through leader key state machine first
      const action = handleLeaderKey(input, { ctrl: !!key.ctrl });
      if (action.type === 'consumed') return;
      if (action.type === 'switch') {
        setFocusedIndex(action.index);
        return;
      }

      // 'pass' — forward to focused PTY
      const inst = focusedRef.current;
      if (!inst) return;

      if (key.return) {
        writeToInstance(inst, '\r');
      } else if (key.backspace || key.delete) {
        writeToInstance(inst, '\x7f');
      } else if (key.escape) {
        writeToInstance(inst, '\x1b');
      } else if (key.upArrow) {
        writeToInstance(inst, '\x1b[A');
      } else if (key.downArrow) {
        writeToInstance(inst, '\x1b[B');
      } else if (key.rightArrow) {
        writeToInstance(inst, '\x1b[C');
      } else if (key.leftArrow) {
        writeToInstance(inst, '\x1b[D');
      } else if (key.tab) {
        writeToInstance(inst, '\t');
      } else if (key.ctrl && input) {
        // Convert letter to control char: 'a'(97) - 96 = 1 = Ctrl+A, etc.
        const code = input.charCodeAt(0) - 96;
        if (code > 0 && code < 27) {
          writeToInstance(inst, String.fromCharCode(code));
        }
      } else if (input) {
        writeToInstance(inst, input);
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color="white">
            nekode
          </Text>
          <Text color="gray"> — {INSTANCE_COUNT}x Claude Code multiplexer</Text>
        </Box>
        <Text bold color="cyan">
          [{focusedIndex + 1}]
        </Text>
      </Box>

      <TerminalPane instance={focused} offsetRow={2} rows={paneRows} cols={columns} />

      <Box paddingX={1} justifyContent="space-between">
        <Text>
          {Array.from({ length: INSTANCE_COUNT }, (_, i) => (
            <Text key={i} bold={i === focusedIndex} color={i === focusedIndex ? 'cyan' : 'gray'}>
              {i > 0 ? ' ' : ''}[{i + 1}]
            </Text>
          ))}
        </Text>
        <Text color="gray">
          {LEADER_KEY} → 1-{INSTANCE_COUNT} switch | Ctrl+D quit
        </Text>
      </Box>
    </Box>
  );
}

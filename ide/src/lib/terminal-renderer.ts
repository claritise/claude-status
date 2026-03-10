import type { Terminal } from '@xterm/headless';
import type { IBufferCell } from '@xterm/headless';

/**
 * Render the visible xterm buffer to a rectangular screen region
 * using direct ANSI escape sequences via process.stdout.write().
 *
 * @param terminal - The xterm-headless Terminal instance
 * @param offsetRow - The row offset on screen where the pane starts (1-based)
 * @param offsetCol - The column offset on screen where the pane starts (1-based)
 */
export function renderTerminalToScreen(
  terminal: Terminal,
  offsetRow: number,
  offsetCol: number,
): void {
  const buffer = terminal.buffer.active;
  const cols = terminal.cols;
  const rows = terminal.rows;
  const cell: IBufferCell = buffer.getNullCell();

  let output = '';
  // Hide cursor during rendering to prevent flicker
  output += '\x1b[?25l';

  for (let y = 0; y < rows; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;

    // Move cursor to the start of this row in the screen region
    output += `\x1b[${offsetRow + y};${offsetCol}H`;

    let prevFg = -1;
    let prevBg = -1;
    let prevBold = false;
    let prevItalic = false;
    let prevUnderline = false;

    for (let x = 0; x < cols; x++) {
      line.getCell(x, cell);
      const char = cell.getChars() || ' ';

      // Extract attributes
      const fg = cell.getFgColor();
      const bg = cell.getBgColor();
      const fgColorMode = cell.getFgColorMode();
      const bgColorMode = cell.getBgColorMode();
      const bold = cell.isBold() !== 0;
      const italic = cell.isItalic() !== 0;
      const underline = cell.isUnderline() !== 0;

      // Only emit SGR sequences when attributes change
      const fgChanged = fg !== prevFg || fgColorMode !== (prevFg === -1 ? -1 : fgColorMode);
      const bgChanged = bg !== prevBg || bgColorMode !== (prevBg === -1 ? -1 : bgColorMode);
      const attrsChanged =
        bold !== prevBold || italic !== prevItalic || underline !== prevUnderline;

      if (fgChanged || bgChanged || attrsChanged || x === 0) {
        output += '\x1b[0m'; // Reset
        if (bold) output += '\x1b[1m';
        if (italic) output += '\x1b[3m';
        if (underline) output += '\x1b[4m';
        if (fgColorMode === 1) {
          // Default color — no SGR needed
        } else if (fgColorMode === 2) {
          // 256-color
          output += `\x1b[38;5;${fg}m`;
        } else if (fgColorMode === 3) {
          // Truecolor (packed RGB)
          output += `\x1b[38;2;${(fg >> 16) & 0xff};${(fg >> 8) & 0xff};${fg & 0xff}m`;
        }
        if (bgColorMode === 1) {
          // Default bg
        } else if (bgColorMode === 2) {
          output += `\x1b[48;5;${bg}m`;
        } else if (bgColorMode === 3) {
          output += `\x1b[48;2;${(bg >> 16) & 0xff};${(bg >> 8) & 0xff};${bg & 0xff}m`;
        }
      }

      prevFg = fg;
      prevBg = bg;
      prevBold = bold;
      prevItalic = italic;
      prevUnderline = underline;

      output += char;
    }
  }

  // Reset attributes and restore cursor position
  output += '\x1b[0m';

  // Position cursor where xterm's cursor is
  const cursorY = buffer.cursorY;
  const cursorX = buffer.cursorX;
  output += `\x1b[${offsetRow + cursorY};${offsetCol + cursorX}H`;
  output += '\x1b[?25h'; // Show cursor

  process.stdout.write(output);
}

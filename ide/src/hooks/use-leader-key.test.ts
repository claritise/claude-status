import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLeaderKeyHandler } from './use-leader-key.js';

describe('leader key state machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes through normal input', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    expect(handleKey('h', { ctrl: false })).toEqual({ type: 'pass' });
  });

  it('consumes first Ctrl+A (enters leader mode)', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    expect(handleKey('a', { ctrl: true })).toEqual({ type: 'consumed' });
  });

  it('Ctrl+A → 1 switches to instance 0', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('1', { ctrl: false })).toEqual({ type: 'switch', index: 0 });
  });

  it('Ctrl+A → 4 switches to instance 3', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('4', { ctrl: false })).toEqual({ type: 'switch', index: 3 });
  });

  it('Ctrl+A → 5 passes through (out of range)', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('5', { ctrl: false })).toEqual({ type: 'pass' });
  });

  it('Ctrl+A → Ctrl+A passes through (sends literal Ctrl+A)', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('a', { ctrl: true })).toEqual({ type: 'pass' });
  });

  it('Ctrl+A → unknown key passes through', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('x', { ctrl: false })).toEqual({ type: 'pass' });
  });

  it('leader mode times out and calls onLeaderTimeout', () => {
    const onTimeout = vi.fn();
    createLeaderKeyHandler(onTimeout);

    // Enter leader mode (need to call handleKey)
    const handleKey = createLeaderKeyHandler(onTimeout);
    handleKey('a', { ctrl: true });

    expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('leader timeout is cancelled when follow-up key arrives', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    handleKey('2', { ctrl: false });

    vi.advanceTimersByTime(600);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('works correctly across multiple leader sequences', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    // First: switch to instance 1
    handleKey('a', { ctrl: true });
    expect(handleKey('1', { ctrl: false })).toEqual({ type: 'switch', index: 0 });

    // Normal input
    expect(handleKey('h', { ctrl: false })).toEqual({ type: 'pass' });

    // Second: switch to instance 3
    handleKey('a', { ctrl: true });
    expect(handleKey('3', { ctrl: false })).toEqual({ type: 'switch', index: 2 });
  });

  it('returns to normal after timeout', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    vi.advanceTimersByTime(500); // Timeout fires

    // Normal input should pass through
    expect(handleKey('h', { ctrl: false })).toEqual({ type: 'pass' });
  });

  it('Ctrl+A → Q sends option 1', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('q', { ctrl: false })).toEqual({ type: 'option', key: '1' });
  });

  it('Ctrl+A → W sends option 2', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('w', { ctrl: false })).toEqual({ type: 'option', key: '2' });
  });

  it('Ctrl+A → E sends option 3', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('e', { ctrl: false })).toEqual({ type: 'option', key: '3' });
  });

  it('Ctrl+A → R sends option 4', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('r', { ctrl: false })).toEqual({ type: 'option', key: '4' });
  });

  it('option keys work with uppercase too', () => {
    const onTimeout = vi.fn();
    const handleKey = createLeaderKeyHandler(onTimeout);

    handleKey('a', { ctrl: true });
    expect(handleKey('Q', { ctrl: false })).toEqual({ type: 'option', key: '1' });
  });
});

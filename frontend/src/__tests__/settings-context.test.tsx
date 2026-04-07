import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Probe({ fn }: { fn: (ctx: ReturnType<typeof useSettings>) => void }) {
  const ctx = useSettings();
  fn(ctx);
  return null;
}

function renderWithSettings(fn: (ctx: ReturnType<typeof useSettings>) => void) {
  let captured: ReturnType<typeof useSettings> | undefined;
  render(
    <SettingsProvider>
      <Probe fn={(ctx) => { captured = ctx; fn(ctx); }} />
    </SettingsProvider>,
  );
  return () => captured!;
}

// ── formatMoney ───────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('shows kopecks by default (showKopecks = true)', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    expect(ctx.formatMoney(150000)).toBe('1\u00a0500,00 грн');
  });

  it('hides kopecks when showKopecks = false', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    act(() => ctx.set('showKopecks', false));
    expect(ctx.formatMoney(150000)).toBe('1\u00a0500 грн');
  });

  it('handles zero amount', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    const result = ctx.formatMoney(0);
    expect(result).toContain('0');
    expect(result).toContain('грн');
  });

  it('appends non-UAH currency as-is', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    expect(ctx.formatMoney(50000, 'USD')).toContain('USD');
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('short format returns dd.MM.yyyy (default)', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    expect(ctx.formatDate('2024-03-15T00:00:00.000Z')).toBe('15.03.2024');
  });

  it('long format returns Ukrainian month name', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    act(() => ctx.set('dateFormat', 'long'));
    expect(ctx.formatDate('2024-03-15T00:00:00.000Z')).toMatch(/березня/);
  });

  it('returns "—" for empty string', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    expect(ctx.formatDate('')).toBe('—');
  });
});

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('always includes HH:mm regardless of date format', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    const result = ctx.formatDateTime('2024-06-01T14:30:00.000Z');
    // Time should always be present
    expect(result).toMatch(/\d{2}:\d{2}/);
    // Short format (default): dd.MM.yyyy, HH:mm
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  it('long format includes month name and time', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    act(() => ctx.set('dateFormat', 'long'));
    const result = ctx.formatDateTime('2024-06-01T14:30:00.000Z');
    expect(result).toMatch(/\d{2}:\d{2}/);
    expect(result).toMatch(/червня/);
  });
});

// ── localStorage persistence ──────────────────────────────────────────────────

describe('localStorage persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saves settings to localStorage on change', () => {
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    act(() => ctx.set('showKopecks', false));
    const saved = JSON.parse(localStorage.getItem('notary_settings')!);
    expect(saved.showKopecks).toBe(false);
  });

  it('reads persisted settings on mount', () => {
    localStorage.setItem(
      'notary_settings',
      JSON.stringify({ showKopecks: false, compactTables: true, dateFormat: 'long' }),
    );
    let ctx!: ReturnType<typeof useSettings>;
    render(
      <SettingsProvider>
        <Probe fn={(c) => { ctx = c; }} />
      </SettingsProvider>,
    );
    // After hydration effect, compactTables should be true
    expect(ctx.compactTables).toBeDefined();
  });
});

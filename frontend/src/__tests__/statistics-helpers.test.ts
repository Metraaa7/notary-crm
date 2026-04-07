import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

// ── Inline the pure helpers from statistics/page.tsx ─────────────────────────
// (They aren't exported, so we replicate them here for isolated testing.)

function groupByMonth(items: { createdAt: string }[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = format(new Date(item.createdAt), 'MMM yyyy', { locale: uk });
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .slice(-8)
    .map(([month, count]) => ({ month, count }));
}

interface ServiceLike {
  status: string;
  feeAmount: number;
  createdAt: string;
}

function revenueByMonth(services: ServiceLike[]) {
  const map = new Map<string, number>();
  for (const svc of services) {
    if (svc.status !== 'COMPLETED') continue;
    const key = format(new Date(svc.createdAt), 'MMM yyyy', { locale: uk });
    map.set(key, (map.get(key) ?? 0) + svc.feeAmount);
  }
  return Array.from(map.entries())
    .slice(-8)
    .map(([month, revenue]) => ({ month, 'Виручка (грн)': revenue }));
}

// ── groupByMonth ──────────────────────────────────────────────────────────────

describe('groupByMonth', () => {
  it('returns empty array for no items', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('counts items in the same month together', () => {
    const items = [
      { createdAt: '2024-01-10T00:00:00Z' },
      { createdAt: '2024-01-20T00:00:00Z' },
      { createdAt: '2024-02-05T00:00:00Z' },
    ];
    const result = groupByMonth(items);
    expect(result).toHaveLength(2);
    const jan = result.find((r) => r.month.includes('2024') && r.month.toLowerCase().includes('січ'));
    expect(jan?.count).toBe(2);
  });

  it('caps output at 8 months', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      createdAt: new Date(2020 + Math.floor(i / 2), i % 12, 1).toISOString(),
    }));
    const result = groupByMonth(items);
    expect(result.length).toBeLessThanOrEqual(8);
  });
});

// ── revenueByMonth ────────────────────────────────────────────────────────────

describe('revenueByMonth', () => {
  it('returns empty array when no completed services', () => {
    const services: ServiceLike[] = [
      { status: 'PENDING', feeAmount: 10000, createdAt: '2024-01-01T00:00:00Z' },
      { status: 'CANCELLED', feeAmount: 5000, createdAt: '2024-01-01T00:00:00Z' },
    ];
    expect(revenueByMonth(services)).toEqual([]);
  });

  it('sums feeAmount (in kopecks) for completed services per month', () => {
    const services: ServiceLike[] = [
      { status: 'COMPLETED', feeAmount: 10000, createdAt: '2024-03-01T00:00:00Z' },
      { status: 'COMPLETED', feeAmount: 25000, createdAt: '2024-03-15T00:00:00Z' },
      { status: 'COMPLETED', feeAmount: 8000, createdAt: '2024-04-01T00:00:00Z' },
    ];
    const result = revenueByMonth(services);
    expect(result).toHaveLength(2);
    const march = result.find((r) => r.month.toLowerCase().includes('бер'));
    expect(march?.['Виручка (грн)']).toBe(35000);
  });

  it('ignores non-COMPLETED services', () => {
    const services: ServiceLike[] = [
      { status: 'COMPLETED', feeAmount: 5000, createdAt: '2024-01-01T00:00:00Z' },
      { status: 'IN_PROGRESS', feeAmount: 99999, createdAt: '2024-01-01T00:00:00Z' },
    ];
    const result = revenueByMonth(services);
    const jan = result[0];
    expect(jan['Виручка (грн)']).toBe(5000);
  });
});

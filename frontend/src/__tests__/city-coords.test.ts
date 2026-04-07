import { describe, it, expect } from 'vitest';

import { getCityCoords } from '@/lib/cityCoords';

describe('getCityCoords', () => {
  it('resolves Kyiv in Ukrainian', () => {
    const coords = getCityCoords('Київ');
    expect(coords).toBeTruthy();
    expect(coords![0]).toBeCloseTo(50.45, 0);
  });

  it('is case-insensitive', () => {
    expect(getCityCoords('КИЇВ')).toEqual(getCityCoords('київ'));
  });

  it('trims whitespace', () => {
    expect(getCityCoords('  Львів  ')).toEqual(getCityCoords('Львів'));
  });

  it('returns null for unknown city', () => {
    expect(getCityCoords('Мумбай')).toBeNull();
  });

  it('resolves transliterated names', () => {
    expect(getCityCoords('Lviv')).toBeTruthy();
    expect(getCityCoords('Kharkiv')).toBeTruthy();
  });

  it('all resolved coords are within Ukraine bounding box', () => {
    const ukrainianCities = [
      'Київ', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя',
      'Львів', 'Вінниця', 'Херсон', 'Полтава', 'Чернігів',
    ];
    for (const city of ukrainianCities) {
      const coords = getCityCoords(city);
      expect(coords, `${city} should have coords`).toBeTruthy();
      const [lat, lng] = coords!;
      expect(lat, `${city} lat should be within Ukraine`).toBeGreaterThan(44);
      expect(lat).toBeLessThan(53);
      expect(lng, `${city} lng should be within Ukraine`).toBeGreaterThan(22);
      expect(lng).toBeLessThan(40);
    }
  });
});

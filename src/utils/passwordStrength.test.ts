import { describe, it, expect } from 'vitest';
import { calculatePasswordStrength } from './passwordStrength';

describe('calculatePasswordStrength', () => {
  it('identifies short or simple passwords as Weak', () => {
    const res = calculatePasswordStrength('123');
    expect(res.label).toBe('Weak');
    expect(res.headline).toBe('Weak password. Must contain:');
    expect(res.metCount).toBe(1); // Only hasNumber
    expect(res.percentage).toBe(20);
    expect(res.requirements.find((r) => r.id === 'length')?.met).toBe(false);
  });

  it('identifies 6-character mixed password from screenshot as Medium', () => {
    // Screenshot has: 6 chars, uppercase, lowercase, number, but < 8 chars and no special char
    const res = calculatePasswordStrength('Pass12');
    expect(res.label).toBe('Medium');
    expect(res.headline).toBe('Medium password. Must contain:');
    expect(res.metCount).toBe(3); // number, lowercase, uppercase
    expect(res.percentage).toBe(60);
    expect(res.requirements.find((r) => r.id === 'length')?.met).toBe(false);
    expect(res.requirements.find((r) => r.id === 'special')?.met).toBe(false);
    expect(res.requirements.find((r) => r.id === 'number')?.met).toBe(true);
    expect(res.requirements.find((r) => r.id === 'lowercase')?.met).toBe(true);
    expect(res.requirements.find((r) => r.id === 'uppercase')?.met).toBe(true);
  });

  it('identifies 4 met criteria as Good', () => {
    const res = calculatePasswordStrength('Password123');
    expect(res.label).toBe('Good');
    expect(res.headline).toBe('Good password. Must contain:');
    expect(res.metCount).toBe(4); // length, lowercase, uppercase, number
    expect(res.percentage).toBe(80);
    expect(res.requirements.find((r) => r.id === 'special')?.met).toBe(false);
  });

  it('identifies all 5 met criteria as Strong', () => {
    const res = calculatePasswordStrength('Password123!');
    expect(res.label).toBe('Strong');
    expect(res.headline).toBe('Strong password.');
    expect(res.metCount).toBe(5);
    expect(res.percentage).toBe(100);
    expect(res.requirements.every((r) => r.met)).toBe(true);
  });
});

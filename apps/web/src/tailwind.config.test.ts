import { describe, it, expect } from 'vitest';
import config from '../tailwind.config';

describe('Tailwind Config', () => {
  describe('color system', () => {
    it('has surface hierarchy colors', () => {
      const colors = config.theme?.extend?.colors as Record<string, unknown>;
      expect(colors).toBeDefined();
      expect(colors.surface).toEqual({
        1: 'hsl(var(--surface-1))',
        2: 'hsl(var(--surface-2))',
        3: 'hsl(var(--surface-3))',
      });
    });

    it('has muted color scale with subtle variant', () => {
      const colors = config.theme?.extend?.colors as Record<string, unknown>;
      const muted = colors.muted as Record<string, unknown>;
      expect(muted.subtle).toBe('hsl(var(--muted-foreground-subtle))');
    });

    it('has primary hover color', () => {
      const colors = config.theme?.extend?.colors as Record<string, unknown>;
      const primary = colors.primary as Record<string, unknown>;
      expect(primary.hover).toBe('hsl(var(--primary-hover))');
    });

    it('has border muted variant', () => {
      const colors = config.theme?.extend?.colors as Record<string, unknown>;
      const border = colors.border as Record<string, unknown>;
      expect(border.muted).toBe('hsl(var(--border-muted))');
    });
  });

  describe('typography', () => {
    it('has compact font sizes', () => {
      const fontSize = config.theme?.extend?.fontSize as Record<
        string,
        [string, { lineHeight: string }]
      >;
      expect(fontSize).toBeDefined();
      expect(fontSize.xs).toEqual(['11px', { lineHeight: '16px' }]);
      expect(fontSize.sm).toEqual(['12px', { lineHeight: '18px' }]);
      expect(fontSize.base).toEqual(['13px', { lineHeight: '20px' }]);
      expect(fontSize.lg).toEqual(['14px', { lineHeight: '20px' }]);
    });
  });

  describe('animations', () => {
    it('has fade-in animation', () => {
      const animation = config.theme?.extend?.animation as Record<string, string>;
      expect(animation?.['fade-in']).toBeDefined();
    });

    it('has slide-up animation', () => {
      const animation = config.theme?.extend?.animation as Record<string, string>;
      expect(animation?.['slide-up']).toBeDefined();
    });
  });

  describe('transitions', () => {
    it('has short transition durations', () => {
      const transitionDuration = config.theme?.extend?.transitionDuration as Record<
        string,
        string
      >;
      expect(transitionDuration?.['75']).toBe('75ms');
      expect(transitionDuration?.['100']).toBe('100ms');
    });
  });
});

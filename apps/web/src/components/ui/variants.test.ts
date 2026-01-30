import { describe, it, expect } from 'vitest';
import {
  buttonVariants,
  inputVariants,
  listItemVariants,
  badgeVariants,
} from './variants';

describe('CVA Variants', () => {
  describe('buttonVariants', () => {
    it('generates primary variant classes', () => {
      const classes = buttonVariants({ variant: 'primary' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('generates secondary variant classes', () => {
      const classes = buttonVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-surface-2');
    });

    it('generates ghost variant classes', () => {
      const classes = buttonVariants({ variant: 'ghost' });
      expect(classes).toContain('text-muted-foreground');
    });

    it('generates danger variant classes', () => {
      const classes = buttonVariants({ variant: 'danger' });
      expect(classes).toContain('text-red-600');
    });

    it('applies size variants', () => {
      expect(buttonVariants({ size: 'xs' })).toContain('h-6');
      expect(buttonVariants({ size: 'sm' })).toContain('h-7');
      expect(buttonVariants({ size: 'md' })).toContain('h-8');
      expect(buttonVariants({ size: 'lg' })).toContain('h-9');
    });

    it('has default variant and size', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-8');
    });
  });

  describe('inputVariants', () => {
    it('generates default variant classes', () => {
      const classes = inputVariants({ variant: 'default' });
      expect(classes).toContain('border');
      expect(classes).toContain('border-border');
    });

    it('generates ghost variant classes', () => {
      const classes = inputVariants({ variant: 'ghost' });
      expect(classes).toContain('border-transparent');
      expect(classes).toContain('bg-surface-2');
    });

    it('applies size variants', () => {
      expect(inputVariants({ size: 'sm' })).toContain('h-7');
      expect(inputVariants({ size: 'md' })).toContain('h-8');
      expect(inputVariants({ size: 'lg' })).toContain('h-9');
    });
  });

  describe('listItemVariants', () => {
    it('generates default variant classes', () => {
      const classes = listItemVariants({ variant: 'default' });
      expect(classes).toContain('hover:bg-surface-2');
    });

    it('generates nav variant classes', () => {
      const classes = listItemVariants({ variant: 'nav' });
      expect(classes).toContain('text-muted-foreground');
    });

    it('generates active variant classes', () => {
      const classes = listItemVariants({ variant: 'active' });
      expect(classes).toContain('bg-primary/10');
      expect(classes).toContain('text-primary');
    });

    it('applies size variants', () => {
      expect(listItemVariants({ size: 'compact' })).toContain('py-1');
      expect(listItemVariants({ size: 'default' })).toContain('py-1.5');
      expect(listItemVariants({ size: 'comfortable' })).toContain('py-2');
    });
  });

  describe('badgeVariants', () => {
    it('generates default variant classes', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-surface-2');
    });

    it('generates primary variant classes', () => {
      const classes = badgeVariants({ variant: 'primary' });
      expect(classes).toContain('bg-primary/10');
      expect(classes).toContain('text-primary');
    });

    it('generates status variant classes', () => {
      expect(badgeVariants({ variant: 'success' })).toContain('bg-green-500/10');
      expect(badgeVariants({ variant: 'warning' })).toContain('bg-yellow-500/10');
      expect(badgeVariants({ variant: 'error' })).toContain('bg-red-500/10');
    });

    it('applies size variants', () => {
      expect(badgeVariants({ size: 'sm' })).toContain('text-[10px]');
      expect(badgeVariants({ size: 'md' })).toContain('text-xs');
    });
  });
});

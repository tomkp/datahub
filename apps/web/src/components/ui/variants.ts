import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-surface-2 text-foreground hover:bg-surface-3',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-surface-2',
        success:
          'bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400',
        danger:
          'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400',
      },
      size: {
        xs: 'h-6 px-2 text-xs rounded-sm',
        sm: 'h-7 px-2.5 text-sm rounded',
        md: 'h-8 px-3 text-sm rounded',
        lg: 'h-9 px-4 text-base rounded',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const inputVariants = cva(
  'w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors duration-100',
  {
    variants: {
      variant: {
        default:
          'border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
        ghost:
          'border-transparent bg-surface-2 focus:bg-surface-1 focus:border-border',
      },
      size: {
        sm: 'h-7 px-2 text-xs rounded',
        md: 'h-8 px-2.5 text-sm rounded',
        lg: 'h-9 px-3 text-sm rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const listItemVariants = cva(
  'flex items-center gap-2 transition-colors duration-75 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'hover:bg-surface-2 text-foreground',
        nav: 'text-muted-foreground hover:text-foreground hover:bg-surface-2',
        active: 'bg-primary/10 text-primary',
      },
      size: {
        compact: 'py-1 px-2 text-xs rounded-sm',
        default: 'py-1.5 px-2 text-sm rounded',
        comfortable: 'py-2 px-3 text-sm rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const badgeVariants = cva('inline-flex items-center font-medium', {
  variants: {
    variant: {
      default: 'bg-surface-2 text-muted-foreground',
      primary: 'bg-primary/10 text-primary',
      success: 'bg-green-500/10 text-green-600 dark:text-green-400',
      warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      error: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    size: {
      sm: 'text-[10px] px-1.5 py-0.5 rounded',
      md: 'text-xs px-2 py-0.5 rounded',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
});

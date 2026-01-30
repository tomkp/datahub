import React, { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { inputVariants } from './variants';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

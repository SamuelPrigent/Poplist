'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // === EXISTING VARIANTS ===
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:ring-white focus-visible:border-white',
        link: 'text-primary underline-offset-4 hover:underline',

        // === NEW VARIANTS ===

        // Table action button (icon buttons in table rows)
        'table-action': 'cursor-pointer rounded p-2 transition-colors hover:bg-muted',

        // Table destructive action (delete buttons in table rows)
        'table-destructive':
          'cursor-pointer rounded p-2 text-red-500 transition-colors hover:bg-red-500/10',

        // Dropdown menu item style
        'dropdown-item':
          'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none',

        // Dropdown menu destructive item
        'dropdown-destructive':
          'relative flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-red-500 transition-colors outline-none select-none hover:bg-red-500/10 focus:bg-red-500/10',

        // Navigation link style (back buttons, breadcrumbs)
        'nav-link':
          'text-muted-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white',

        // Circular icon button (overlay buttons on posters)
        'icon-overlay':
          'cursor-pointer rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black',

        // Tab button style
        tab: 'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',

        // Tab active state
        'tab-active':
          'cursor-pointer rounded-full px-4 py-2 text-sm font-medium bg-white text-black transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',

        // Poster/Card clickable area
        poster:
          'group relative block cursor-pointer overflow-hidden rounded-lg text-left transition-transform hover:scale-[1.02]',

        // Language selector / footer button style
        selector:
          'border-border bg-card text-foreground hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',

        // Modal/Dialog close button
        'modal-close':
          'absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none',

        // Text with hover underline
        'text-link':
          'cursor-pointer text-left transition-colors hover:underline underline-offset-2',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
        // New sizes for table actions
        table: 'p-2',
        // Auto size for flex content
        auto: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

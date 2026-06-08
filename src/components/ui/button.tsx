"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-surface-2 text-foreground hover:bg-surface-2/70 border border-border",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface-2",
        ghost: "bg-transparent text-foreground hover:bg-surface-2",
        danger: "bg-error text-white hover:opacity-90",
        link: "bg-transparent text-primary underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  href?: string;
  external?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, href, external, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const content = (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </>
    );

    if (href && !disabled) {
      if (external) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
            {content}
          </a>
        );
      }
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";

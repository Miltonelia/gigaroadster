import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-display uppercase tracking-wide transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-mint text-void hover:bg-fg",
        brake: "bg-violet text-fg hover:bg-fg hover:text-void",
        gold: "border border-gold bg-transparent text-gold hover:bg-ink",
        ghost: "border border-line bg-ink text-fg hover:border-violet",
      },
      size: {
        sm: "min-h-11 px-4 text-sm",
        md: "min-h-12 px-6 text-base",
        lg: "min-h-14 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

import { cva, type VariantProps } from 'class-variance-authority'

export { default as Input } from './Input.vue'

export const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-sm aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'bg-transparent file:bg-transparent dark:bg-input/30 selection:bg-primary',
      },
      focus: {
        default: 'focus-visible:ring-ring focus-visible:ring-[2px] focus-visible:ring-offset-0',
        'no-ring': 'focus-visible:ring-0 focus-visible:ring-offset-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      focus: 'default',
    },
  }
)

export type InputVariants = VariantProps<typeof inputVariants>

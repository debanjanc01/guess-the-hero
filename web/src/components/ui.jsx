// shadcn/ui-style, source-owned primitives. Radix supplies accessible dialog behavior.
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export const cn = (...inputs) => twMerge(clsx(inputs));
const variants = cva('btn', { variants: { variant: { default: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost' }, size: { default: '', icon: 'btn-icon', small: 'btn-small' } }, defaultVariants: { variant: 'default', size: 'default' } });
export function Button({ className, variant, size, asChild = false, ...props }) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(variants({ variant, size }), className)} {...props} />;
}
export function Input({ className, ...props }) { return <input className={cn('input', className)} {...props} />; }
export function Modal({ open, onOpenChange, title, description, children, className }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={cn('dialog-content', className)}>
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="dialog-description">{description}</DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" className="dialog-close" aria-label="Close dialog"><X size={20} /></Button></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

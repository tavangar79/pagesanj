// Confirmation for destructive actions: reject, dismiss, delete (PRD §9). Stays open while the action runs.
import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** Resolve to close; throw to keep the dialog open (the caller shows the error). */
  onConfirm: () => Promise<void>;
  destructive?: boolean;
  children?: ReactNode;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller reported it; keep the dialog open so the admin can retry or cancel.
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-start sm:text-start">
          <AlertDialogTitle className="text-ink">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="leading-6 text-ink-3">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="gap-2 sm:justify-start">
          <Button variant={destructive ? 'destructive' : 'default'} disabled={pending} onClick={confirm}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
          <AlertDialogCancel disabled={pending} className="h-10 rounded-xl">
            انصراف
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

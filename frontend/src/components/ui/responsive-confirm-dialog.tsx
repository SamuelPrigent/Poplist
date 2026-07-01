'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/cn';

export interface ResponsiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optionnel : bloc icône à gauche du titre (ex. pastille rouge d'alerte). */
  icon?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  error?: string | null;
  loading?: boolean;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  onConfirm: () => void;
  confirmVariant?: 'default' | 'destructive';
  confirmClassName?: string;
  confirmDisabled?: boolean;
  /** Classes ajoutées au conteneur (ex. bordure jaune sur "Quitter"). */
  contentClassName?: string;
  /** Contenu additionnel entre la description et les actions (ex. input "confirmer"). */
  children?: ReactNode;
}

/**
 * Confirmation responsive : < 750px → drawer bottom (vaul), sinon modale desktop.
 * Deux branches internes isolées ; la logique métier reste chez l'appelant
 * (via `onConfirm` / `loading` / `error`).
 */
export function ResponsiveConfirmDialog(props: ResponsiveConfirmDialogProps) {
  const isMobile = useIsMobile();
  return isMobile ? <ConfirmDrawerShell {...props} /> : <ConfirmModalShell {...props} />;
}

// Bloc commun : message d'erreur + contenu additionnel + boutons.
// `stacked` (drawer mobile) : boutons empilés pleine largeur (Annuler au-dessus,
// Confirmer en dessous). Sinon (modale desktop) : côte à côte, alignés à droite.
function ConfirmBody({
  error,
  children,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
  confirmVariant = 'default',
  confirmClassName,
  confirmDisabled,
  stacked = false,
}: {
  error?: string | null;
  children?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmVariant?: 'default' | 'destructive';
  confirmClassName?: string;
  confirmDisabled?: boolean;
  stacked?: boolean;
}) {
  return (
    <>
      {children}
      {error && (
        <div className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className={cn('mt-6 flex gap-2', stacked ? 'flex-col' : 'justify-end')}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className={cn(
            'focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white',
            stacked && 'w-full'
          )}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={loading || confirmDisabled}
          className={cn(
            'focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none',
            stacked && 'w-full',
            confirmClassName
          )}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

// -------------------------------------------------------------------------
// Shell modale (desktop)
// -------------------------------------------------------------------------
function ConfirmModalShell({
  open,
  onOpenChange,
  icon,
  title,
  titleClassName,
  description,
  contentClassName,
  ...body
}: ResponsiveConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            'border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border p-6 shadow-lg duration-200 sm:rounded-lg',
            contentClassName
          )}
        >
          <div className="flex items-center gap-3">
            {icon}
            <DialogPrimitive.Title className={cn('text-lg font-semibold', titleClassName)}>
              {title}
            </DialogPrimitive.Title>
          </div>
          {description && (
            <DialogPrimitive.Description className="text-muted-foreground mt-2 text-sm">
              {description}
            </DialogPrimitive.Description>
          )}

          <ConfirmBody {...body} onCancel={() => onOpenChange(false)} />

          <DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// -------------------------------------------------------------------------
// Shell drawer (mobile)
// -------------------------------------------------------------------------
function ConfirmDrawerShell({
  open,
  onOpenChange,
  icon,
  title,
  titleClassName,
  description,
  ...body
}: ResponsiveConfirmDialogProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3">
            {icon}
            <DrawerTitle className={titleClassName}>{title}</DrawerTitle>
          </div>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 pb-[calc(2.25rem+env(safe-area-inset-bottom))]">
          <ConfirmBody {...body} stacked onCancel={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

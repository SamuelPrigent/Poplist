'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/cn';

/**
 * Blur l'élément focusé (le bouton/card déclencheur) au mount du drawer.
 * Sans ça, vaul pose aria-hidden sur le layout pendant que le déclencheur
 * garde le focus → warning Chrome "Blocked aria-hidden on an element because
 * its descendant retained focus". Rendu en premier enfant du Content : son
 * effect s'exécute avant celui de vaul (bottom-up), donc avant l'application
 * de aria-hidden. Couvre TOUS les drawers de l'app, présents et futurs.
 */
function BlurTriggerOnMount() {
  React.useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);
  return null;
}

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  // repositionInputs=false : on laisse le clavier redimensionner le layout via
  // `interactive-widget=resizes-content` (meta viewport). Le repositionnement
  // interne de vaul ferait double emploi et laissait le drawer coincé « petit »
  // à la fermeture du clavier.
  return <DrawerPrimitive.Root data-slot="drawer" repositionInputs={false} {...props} />;
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      // z au-dessus de la bottom-nav (z-2000) pour que le drawer la recouvre.
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[2100] bg-black/80',
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        // Liseré du haut via une ombre interne de 1px (pas une border CSS) :
        // elle épouse parfaitement le rounded-t-2xl sans se rétrécir dans les
        // coins, et il n'y a aucun liseré sur les côtés.
        className={cn(
          'bg-background fixed inset-x-0 bottom-0 z-[2100] mt-24 flex h-auto max-h-[85vh] flex-col rounded-t-2xl shadow-[inset_0_1px_0_0_var(--color-border)]',
          className,
        )}
        {...props}
      >
        <BlurTriggerOnMount />
        {/* Poignée de préhension (grip) */}
        <div className="bg-muted-foreground/40 mx-auto mt-3 mb-1 h-1.5 w-11 shrink-0 rounded-full" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="drawer-header" className={cn('flex flex-col gap-1.5 p-4', className)} {...props} />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="drawer-footer" className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-foreground text-lg font-semibold', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};

'use client';

import { Toaster as Sonner } from 'sonner';
import { useIsMobile } from '@/hooks/useIsMobile';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Mobile : le bas de l'écran est occupé par les drawers et la bottom-nav →
  // on affiche les toasts en haut, juste sous la navbar (h-16 = 64px).
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position={isMobile ? 'top-center' : 'bottom-right'}
      offset={isMobile ? { top: 62 } : undefined}
      mobileOffset={isMobile ? { top: 62 } : undefined}
      toastOptions={{
        classNames: {
          toast: 'group toast !bg-card !text-foreground !border-border shadow-lg',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-muted !text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

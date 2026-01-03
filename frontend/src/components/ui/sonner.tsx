'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast !bg-[#020817] !text-foreground !border-[hsl(222,20%,20%)] shadow-lg',
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

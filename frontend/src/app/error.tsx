'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error: errorInfo,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', errorInfo);
  }, [errorInfo]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          {"Quelque chose s'est mal passé. Veuillez réessayer ou retourner à l'accueil."}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            Réessayer
          </Button>
          <Button onClick={handleGoHome}>{"Retour à l'accueil"}</Button>
        </div>
      </div>
    </div>
  );
}

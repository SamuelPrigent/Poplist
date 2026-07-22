import { AppState } from 'react-native'
import { QueryClient, focusManager } from '@tanstack/react-query'

/**
 * QueryClient partagé de l'app mobile (remplace le cache SWR).
 *
 * focusManager branché sur AppState : équivalent RN du `revalidateOnFocus` de
 * SWR — les queries stale refetchent quand l'app revient au premier plan.
 */
focusManager.setEventListener(handleFocus => {
  const subscription = AppState.addEventListener('change', state => {
    handleFocus(state === 'active')
  })
  return () => subscription.remove()
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aligné sur le comportement SWR précédent : retry léger, refetch au
      // focus piloté par le focusManager ci-dessus.
      retry: 1,
    },
  },
})

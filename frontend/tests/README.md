# Stratégie de Tests Frontend - 3 Niveaux

## Vue d'ensemble

Cette stratégie de tests est organisée en 3 niveaux distincts pour maximiser la détection rapide des erreurs tout en minimisant les coûts de maintenance.

```
tests/
├── contract/      # Tests avec vraie API (haute valeur)
├── integration/   # Tests de composants (interactions UI)
├── unit/          # Tests de logique pure (fonctions isolées)
└── __mocks__/     # Mocks réutilisables
```

---

## 1. Tests Contract (`tests/contract/`)

### 🎯 Objectif
Tests qui donnent **le plus de valeur** : vérifient le contrat réel avec le backend.

### ✅ Caractéristiques
- **Aucun mock backend** : appels HTTP réels
- **Vraie instance API de test** (port 3001) + **vraie DB de test**
- Vérifie que le contrat API est respecté (structure des réponses, codes HTTP, etc.)
- Détecte les breaking changes dans l'API

### ❌ Ce qu'on NE fait PAS
- ❌ JAMAIS utiliser l'API de dev (port 3000)
- ❌ JAMAIS mocker fetch ou les services
- ❌ JAMAIS partager la DB avec dev/prod

### 📝 Configuration
```bash
# .env.test
TEST_API_URL=http://localhost:3001
```

### 🚀 Exécution
```bash
# Lancer l'API de test d'abord
npm run test:contract
```

### 📋 Exemple
```typescript
// tests/contract/watchlist-api.test.ts
describe('Watchlist API Contract', () => {
  it('should create watchlist and return correct schema', async () => {
    const response = await fetch(`${TEST_API_URL}/api/watchlists`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test' })
    });

    const data = await response.json();
    expect(data.watchlist).toHaveProperty('_id');
    expect(data.watchlist).toHaveProperty('name');
  });
});
```

---

## 2. Tests d'Intégration (`tests/integration/`)

### 🎯 Objectif
Tester les **composants avec leurs enfants** et leurs **interactions**.

### ✅ Caractéristiques
- Utilise `@testing-library/react` pour le rendu
- Teste plusieurs composants ensemble
- Focus sur les interactions utilisateur (clicks, formulaires, navigation)
- Backend **toujours mocké** (fetch/stores/services)

### ❌ Ce qu'on NE fait PAS
- ❌ Appels API réels
- ❌ Tester la logique pure isolée (c'est pour les tests unit)

### 🚀 Exécution
```bash
npm run test:integration
```

### 📋 Exemple
```typescript
// tests/integration/edit-watchlist-form.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('EditWatchlistForm', () => {
  it('should submit form with correct data', async () => {
    const onSubmit = vi.fn();
    render(<EditWatchlistForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'My Watchlist');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'My Watchlist' });
  });
});
```

---

## 3. Tests Unitaires (`tests/unit/`)

### 🎯 Objectif
Tester la **logique métier pure** de manière isolée.

### ✅ Caractéristiques
- Fonctions pures uniquement (input → output)
- Pas de rendu de composants
- Rapides et nombreux
- Toujours mocker les dépendances externes (HTTP, localStorage, etc.)

### ❌ Ce qu'on NE fait PAS
- ❌ Tester des composants React
- ❌ Appels HTTP réels
- ❌ Accès direct au localStorage/sessionStorage

### 🚀 Exécution
```bash
npm run test:unit
```

### 📋 Exemple
```typescript
// tests/unit/calculate-progress.test.ts
function calculateProgress(total: number, completed: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

describe('calculateProgress', () => {
  it('should return 0 when no items', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should return correct percentage', () => {
    expect(calculateProgress(10, 5)).toBe(50);
  });
});
```

---

## 🛠️ Configuration et Scripts

### Scripts npm disponibles

```json
{
  "test": "vitest",                           // Mode watch
  "test:ui": "vitest --ui",                   // Interface graphique
  "test:unit": "vitest --run tests/unit",     // Tests unitaires uniquement
  "test:integration": "vitest --run tests/integration",  // Tests d'intégration
  "test:contract": "vitest --run tests/contract",        // Tests contract
  "test:coverage": "vitest --coverage"        // Rapport de couverture
}
```

### Workflow recommandé

1. **Développement** : `npm test` (mode watch)
2. **Avant commit** : `npm run test:unit && npm run test:integration`
3. **CI/CD** : `npm run test:unit && npm run test:integration && npm run test:contract`

---

## 📦 Mocks Disponibles

### `tests/__mocks__/api-client.ts`
Mock des appels API pour les tests integration/unit :
- `mockWatchlistAPI` : CRUD watchlists
- `mockAuthAPI` : Authentification
- `mockTmdbAPI` : TMDB API

### `tests/__mocks__/localStorageHelpers.ts`
Mock des helpers localStorage pour les tests unit/integration.

---

## 🚨 Règles Importantes

### Pour les Tests Contract
1. ⚠️ **TOUJOURS** utiliser `TEST_API_URL` depuis `.env.test`
2. ⚠️ **JAMAIS** pointer vers l'API de dev (`http://localhost:3000`)
3. ⚠️ Cleanup obligatoire dans `afterAll` ou `afterEach`
4. ⚠️ Vérifier que l'API de test tourne avant d'exécuter

### Pour tous les tests
1. ✅ Utiliser `describe` pour grouper les tests
2. ✅ Noms de tests descriptifs : "should do X when Y"
3. ✅ Arrange / Act / Assert pattern
4. ✅ Cleanup avec `afterEach` si nécessaire
5. ✅ Tests isolés : pas de dépendances entre tests

---

## 📊 Pyramide de Tests

```
        /\
       /  \
      / CO \      Contract (peu, haute valeur)
     /------\
    /        \
   / INTEGR.  \   Integration (moyennement nombreux)
  /------------\
 /              \
/      UNIT      \ Unit (nombreux, rapides)
------------------
```

- **Unit** : 60-70% des tests (rapides, nombreux)
- **Integration** : 20-30% des tests (interactions UI)
- **Contract** : 10-20% des tests (haute valeur, lents)

---

## 🔧 Troubleshooting

### "Module not found" dans les tests
- Vérifier les alias dans `vitest.config.ts`
- S'assurer que `tsconfig.json` est cohérent

### Tests contract qui échouent
- Vérifier que l'API de test tourne : `curl http://localhost:3001/health`
- Vérifier `.env.test` : `TEST_API_URL` correct
- Vérifier la DB de test

### Tests lents
- Utiliser `--run` pour éviter le mode watch
- Vérifier qu'il n'y a pas d'appels API dans unit/integration

---

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

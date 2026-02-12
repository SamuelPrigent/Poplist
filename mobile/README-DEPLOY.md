# Poplist — Installer l'APK sur ton Android (sans Play Store)

## Build APK via EAS (recommandé)

Crée un APK installable directement sur ton Android. Gratuit, sans Play Store, utilisable partout sans ordinateur.

### Prérequis

1. Avoir un compte Expo (gratuit) : https://expo.dev/signup
2. Se connecter :

```bash
npx eas login
```

### Lancer le build

```bash
cd mobile
npx eas build --platform android --profile preview
```

Le build prend ~10 minutes (compilé dans le cloud Expo, gratuit jusqu'a 30 builds/mois).

### Installer sur ton telephone

Une fois le build termine, EAS te donne :
- Un **lien de telechargement** dans le terminal
- Le meme lien est aussi visible sur https://expo.dev > ton projet > Builds

**Sur ton Android :**
1. Ouvre le lien dans Chrome sur ton telephone
2. Telecharge l'APK
3. Ouvre le fichier APK telecharge
4. Android te demandera d'autoriser l'installation depuis "sources inconnues" > Accepte
5. L'app s'installe

C'est tout. L'app fonctionne sans ton Mac, sans WiFi, partout.

### Mettre a jour apres des changements de code

```bash
# Mise a jour OTA (instantanee, sans rebuild — pour du JS/UI uniquement) :
npx eas update --branch preview

# Nouveau build complet (si tu as change des dependances natives) :
npx eas build --platform android --profile preview
```

---

## Alternative : Tunnel Expo (pour tester vite sans build)

Si tu veux juste montrer rapidement sans generer d'APK, mais ton Mac doit rester allume :

```bash
cd mobile
npm install -g @expo/ngrok   # une seule fois
npx expo start --tunnel
```

Scanne le QR code avec **Expo Go** (app gratuite sur Play Store) depuis n'importe quel reseau (4G, WiFi du travail, etc.).

**Limite** : ton Mac doit tourner et etre connecte a internet.

---

## Resume

| Methode | Cout | Autonome ? | Temps |
|---------|------|-----------|-------|
| **APK via EAS** | Gratuit | Oui, 100% autonome | ~10 min build |
| Tunnel Expo | Gratuit | Non (Mac allume) | 30 sec |

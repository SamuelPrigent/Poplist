# Poplist Mobile — Workflow de dev

App Expo / React Native.

Les commandes du quotidien se lancent **depuis la racine du monorepo** :

```bash
npm run mobile:build:dev       # 1x : outil de dev, pour le hot reload (cf. §1)
npm run mobile:dev             # à chaque session de dev, itération instantanée
npm run mobile:build:preview   # 1x : la vraie app autonome, partageable (cf. §3)
npm run mobile:update:preview  # pousser les modifs JS sur l'app preview (OTA)
npm run mobile:typecheck       # avant de valider une feature
```

**Deux apps distinctes cohabitent sur le téléphone**, ne pas les confondre :

| | Development build | Preview build |
| --- | --- | --- |
| Rôle | Outil de dev | La vraie app |
| Contient le JS ? | Non, le lit depuis Metro | Oui, embarqué |
| Perfs | 3-5x plus lent (mode debug) | Optimisé, comme la prod |
| Connexion Expo | Requise | Aucune |
| Marche hors du Wi-Fi du Mac ? | Non | Oui, partout |
| Partageable | Non | Oui, lien EAS |
| Mise à jour | Instantanée via Metro | `mobile:update:preview`, 1-2 min |

Les commandes plus rares vivent dans `mobile/package.json` et se lancent avec
`npm --prefix mobile run <script>` depuis la racine (ou `npm run <script>` depuis
`mobile/`). Elles sont listées en bas de ce fichier.

## 1. Installer l'app de dev sur le téléphone

```bash
npm run mobile:build:dev
```

Lance un build EAS dans le cloud (profil `development`, ~10-15 min). Aucun câble,
aucun émulateur, pas besoin d'Android Studio. À la fin, EAS affiche un QR code :
on le scanne avec l'appareil photo du téléphone pour installer l'APK.

Résultat : une icône **Poplist** sur le téléphone. C'est elle qu'on ouvre pour
développer, plus jamais Expo Go.

> **Expo Go ne fonctionne plus sur ce projet.** L'app embarque du code natif que
> le binaire Expo Go ne contient pas (`expo-dev-client`, `expo-updates`,
> `react-native-image-colors`, `react-native-sortables`,
> `@quidone/react-native-wheel-picker`, `expo-notifications`...). Il faut donc un
> *development build*, c'est-à-dire notre propre binaire.

À refaire **uniquement** quand on ajoute une lib avec du code natif, un plugin
Expo, une permission, ou qu'on change l'icône / le nom / le package. Une modif de
TS/TSX ne demande jamais de rebuild.

## 2. Développer au quotidien

```bash
npm run mobile:dev
```

Démarre Metro en mode tunnel et affiche un QR code. On ouvre l'app **Poplist** sur
le téléphone et on scanne ce QR. À partir de là, chaque sauvegarde de fichier se
recharge instantanément (Fast Refresh).

Dans le terminal Metro : `r` recharge l'app, `m` ouvre le menu dev.

Le tunnel passe par ngrok et fonctionne même si le téléphone n'est pas sur le
même réseau que le Mac. Sur le même Wi-Fi, `npm --prefix mobile run dev:lan` est
plus rapide (pas d'intermédiaire).

## 3. Construire la vraie app (autonome, partageable)

```bash
npm run mobile:build:preview
```

Profil `preview` : mêmes optimisations que la prod, JS embarqué, aucune connexion
Expo, aucun Metro. Sort un `.apk` installable et partageable via le lien EAS, à
donner à qui on veut. Le profil `production` sort un `.aab` (format Play Store,
non installable à la main), c'est donc `preview` qu'on utilise pour distribuer
soi-même.

C'est cette app-là qu'on garde sur son téléphone pour un usage normal, à côté du
development build.

## 4. Publier une mise à jour (OTA)

```bash
npm run mobile:update:preview
```

`eas update --branch preview` : bundle le JS/TSX et les assets et les publie sur
le channel `preview`. Tous les téléphones ayant l'APK preview reçoivent la modif
au prochain lancement, en 1-2 min, sans rebuild ni réinstallation.

**Un update ne recompile rien de natif.** Nouvelle lib native, plugin Expo,
permission, icône, nom, package : il faut un build, pas un update.

Variantes :

```bash
npm --prefix mobile run update:prod   # → builds production (Play Store)
npm run mobile:update:main            # → branche EAS nommée d'après la branche git
```

`update:main` (`eas update --auto`) publie sur une branche portant le nom de ta
branche git, avec le dernier message de commit comme description. Utile pour
archiver un état dans le dashboard expo.dev, mais **aucun channel ne pointe
dessus** : ça n'atteint aucun téléphone.

Le **development build ne reçoit jamais d'update** : il charge son JS depuis
Metro. Pour tester tes modifs sur ton téléphone, c'est `npm run mobile:dev`.

## Dépannage

| Symptôme | Cause / correction |
| --- | --- |
| `No apps connected` au moment du `r` | Aucun dev build n'est connecté à Metro. Ouvrir l'app Poplist et scanner le QR. Expo Go ne compte pas. |
| L'app crash au lancement sur une lib | On est dans Expo Go, ou le dev build date d'avant l'ajout de la lib native → `npm run mobile:build:dev`. |
| Modifs pas prises en compte / bundle bizarre | Cache Metro : `npm --prefix mobile run dev:clear`. |
| QR scanné mais rien ne se passe | Scanner depuis l'écran de launcher **dans l'app Poplist**, pas depuis l'appareil photo (le QR de l'appareil photo ne sert qu'à l'installation initiale de l'APK). |

## Autres commandes

Toutes en `npm --prefix mobile run <script>` depuis la racine.

| Script | Rôle |
| --- | --- |
| `dev:lan` | Metro sans tunnel. Plus rapide, exige le même Wi-Fi que le Mac. |
| `dev:clear` | Metro en tunnel avec purge du cache. |
| `web` | Rendu react-native-web dans le navigateur. Pratique pour itérer vite sur du layout, mais les libs natives se comportent différemment. |
| `android` / `ios` | Build natif **local** sur émulateur ou appareil USB. Nécessite Android Studio / Xcode. Alternative au build EAS, pas le workflow par défaut. |
| `build:android:prod` | Build de release Play Store (profil `production`, `.aab`, incrémente la version). |
| `update:prod` | Update OTA sur le channel `production` (cf. §4). |
| `submit:android` | Soumission du build de prod au Play Store. |

### Build local (optionnel)

`mobile:android` demande le SDK Android dans le PATH. Si besoin, ajouter à
`~/.zshrc` :

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

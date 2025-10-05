# 📐 Structure détaillée du projet

## 🗂️ Organisation des fichiers

### Fichiers HTML

#### `index.html` - Page d'accueil

**Objectif** : Point d'entrée principal du site

**Sections** :

- Navigation globale
- Hero section (titre + sous-titre)
- Section "À propos"
- Grille d'outils (cards cliquables)
- Footer

**Dépendances** :

- `styles.css` (styles globaux)

---

#### `generator.html` - Générateur poétique

**Objectif** : Application interactive de génération de poésie

**Sections** :

- Navigation globale
- Sélection des mots (liste interactive)
- Contrôles de génération
- Zone de résultat (avec animation)
- Système de notation (1-10)
- Partage social
- Statistiques
- Historique

**Dépendances** :

- `styles.css` (styles globaux)
- `js/main.js` (point d'entrée JavaScript)
- jsPDF (bibliothèque externe pour PDF)

---

### Fichier CSS

#### `styles.css` - Styles globaux

**Organisation** :

```css
/* 1. Variables CSS */
:root {
  ...;
}

/* 2. Reset et base */
*,
body {
  ...;
}

/* 3. Navigation */
.main-nav {
  ...;
}

/* 4. Classes utilitaires */
.sr-only,
.subtitle {
  ...;
}

/* 5. Styles des mots */
.full-word-list,
.word-group-1,
.word-group-2 {
  ...;
}

/* 6. Contrôles */
select,
button {
  ...;
}

/* 7. Résultat */
.result {
  ...;
}

/* 8. Système de notation */
.rating-container {
  ...;
}

/* 9. Statistiques */
#statistics {
  ...;
}

/* 10. Historique */
#history {
  ...;
}

/* 11. Notifications */
.notification {
  ...;
}

/* 12. Page d'accueil */
.hero-section,
.tools-grid {
  ...;
}

/* 13. Responsive */
@media (max-width: 768px) {
  ...;
}
```

---

### Modules JavaScript

#### `js/main.js`

**Rôle** : Bootstrap de l'application

- Vérification de compatibilité navigateur
- Gestion d'erreurs globales
- Instanciation de `PoeticGenerator`

---

#### `js/config.js`

**Rôle** : Configuration centralisée

- Liste des mots
- Délais d'animation
- Messages utilisateur
- Limites et contraintes
- URLs de partage

**Variables principales** :

```javascript
WORDS: [...],
ANIMATION_DELAY: 80,
STORAGE_KEY: 'poeticHistory',
MESSAGES: { ... },
DEBUG: { ... }
```

---

#### `js/PoeticGenerator.js`

**Rôle** : Orchestrateur principal

- Initialise tous les modules
- Gère les dépendances
- Configure les event listeners globaux
- Raccourcis clavier

**Managers gérés** :

- AudioManager
- WordManager
- CombinationGenerator
- HistoryManager
- RatingManager
- ShareManager
- OrdinationManager

---

#### `js/AudioManager.js`

**Rôle** : Gestion complète du son

**Fonctionnalités** :

- Web Audio API (oscillateurs)
- Fallback HTML5 Audio
- Persistance préférences
- Détection autoplay policies

**Méthodes clés** :

```javascript
playSound(options);
toggleSound();
isSoundEnabled();
```

---

#### `js/WordManager.js`

**Rôle** : Gestion de la sélection des mots

**Fonctionnalités** :

- Toggle mot par clic
- Navigation clavier
- Animation de sélection
- Compteur dynamique

**Méthodes clés** :

```javascript
toggleWord(word);
selectAllWords();
resetAllWords();
getSelectedWords();
```

---

#### `js/CombinationGenerator.js`

**Rôle** : Génération et animation des combinaisons

**Fonctionnalités** :

- Sélection aléatoire intelligente
- Évitement répétitions
- Animation typewriter
- Intégration audio

**Méthodes clés** :

```javascript
generate(useSelectedOnly);
getCurrentCombination();
isCombinationReady();
```

---

#### `js/RatingManager.js`

**Rôle** : Système de notation

**Fonctionnalités** :

- Notation 1-10
- Feedback contextuel
- Validation timing
- Accessibilité complète

**Méthodes clés** :

```javascript
submitRating();
enableRating();
disableRating();
```

---

#### `js/HistoryManager.js`

**Rôle** : Historique et statistiques

**Fonctionnalités** :

- Stockage localStorage
- Calcul statistiques
- Tri/filtrage
- Export TXT/PDF

**Méthodes clés** :

```javascript
addEntry(combination, rating);
sortByRating(ascending);
exportTXT();
exportPDF();
```

---

#### `js/ShareManager.js`

**Rôle** : Partage et export

**Fonctionnalités** :

- Réseaux sociaux
- Génération images Canvas
- Copy to clipboard
- Détection capacités

**Méthodes clés** :

```javascript
shareOnTwitter();
generateImage();
copyToClipboard();
```

---

#### `js/OrdinationManager.js`

**Rôle** : Permutation des ordinations

**Fonctionnalités** :

- 2 ordinations de mots
- Animation de transition
- Persistance sélection
- Reconstruction event listeners

**Méthodes clés** :

```javascript
toggleOrdination();
getCurrentOrdination();
```

---

#### `js/NotificationManager.js`

**Rôle** : Notifications utilisateur

**Fonctionnalités** :

- Toast messages
- File d'attente
- Types (info, success, warning, error)
- Auto-dismiss

**Méthodes clés** :

```javascript
show(message, options);
success(message);
error(message);
dismiss();
```

---

## 🔄 Flux de données

### Initialisation

```
main.js
  └─> PoeticGenerator
       ├─> AudioManager
       ├─> WordManager
       ├─> CombinationGenerator
       ├─> HistoryManager
       ├─> RatingManager
       ├─> ShareManager
       └─> OrdinationManager
```

### Génération de combinaison

```
User click "Générer"
  └─> CombinationGenerator.generate()
       ├─> WordManager.getSelectedWords()
       ├─> Animation typewriter
       │    └─> AudioManager.playSound() (pour chaque lettre)
       └─> RatingManager.enableRating()
```

### Soumission de note

```
User submit rating
  └─> RatingManager.submitRating()
       ├─> Validation
       ├─> HistoryManager.addEntry()
       │    ├─> localStorage.setItem()
       │    └─> updateDisplay()
       └─> NotificationManager.success()
```

---

## 🎨 Système de design

### Tokens de couleur

```css
--forest: #52796F      /* Navigation, titres */
--sage: #B5C99A        /* Bordures, accents */
--moss: #84A98C        /* Éléments interactifs */
--accent-color: #F4A261 /* Actions principales */
--terracotta: #E76F51   /* Hover, accents chauds */
```

### Espacement

```css
--border-radius: 20px      /* Standard */
--border-radius-lg: 30px   /* Large (sections) */
```

### Ombres

```css
--shadow-light: rgba(82, 121, 111, 0.1)
--shadow-medium: rgba(82, 121, 111, 0.15)
--shadow-dark: rgba(82, 121, 111, 0.25)
```

---

## 📦 Dépendances externes

### jsPDF

**Version** : 2.5.1
**Source** : CDN Cloudflare
**Usage** : Export PDF de l'historique
**Chargement** : Defer (non bloquant)

---

## 🔐 Sécurité et validation

### Input sanitization

- Validation longueur messages
- Échappement HTML
- Validation types

### localStorage

- Try/catch systématique
- Validation JSON
- Gestion quota

### CORS

- Pas de requêtes externes (sauf jsPDF CDN)
- Pas d'API backend

---

## 📊 Performance

### Optimisations

- CSS variables pour réutilisation
- Animations CSS (GPU accelerated)
- Debounce sur événements fréquents
- Lazy loading des stats

### Bundle size

- Pas de framework lourd
- Modules ES6 natifs
- CSS pur (pas de préprocesseur)

---

## 🧪 Testing

### Points de validation

Chaque module expose :

```javascript
validate(); // Vérifie l'état
getDebugInfo(); // Informations de debug
```

### Mode debug

Activer dans config.js :

```javascript
DEBUG: {
  ENABLED: true,
  LOG_EVENTS: true,
  LOG_STORAGE: true,
  LOG_AUDIO: true
}
```

---

## 🔄 Cycle de vie

### Initialisation

1. DOMContentLoaded
2. Vérification compatibilité
3. Instanciation modules
4. Setup event listeners
5. Chargement données localStorage
6. Notification ready

### Runtime

1. User interaction
2. Validation
3. Traitement
4. Mise à jour UI
5. Sauvegarde état
6. Notification résultat

### Cleanup

1. beforeunload
2. Sauvegarde localStorage
3. Cleanup event listeners
4. Fermeture contextes audio

---

Cette structure modulaire permet une maintenance facile et l'ajout de nouvelles fonctionnalités ! 🚀

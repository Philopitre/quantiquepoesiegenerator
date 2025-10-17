# 🌿 Générateur de Combinaisons Poétiques

### Les éditions augmentées Philopitre

Une application web interactive pour créer des combinaisons poétiques uniques avec une interface moderne inspirée de la nature.

---

## 📁 Structure du projet

```
projet/
├── index.html              # Page d'accueil
├── generator.html          # Page du générateur poétique
├── styles.css              # Fichier CSS global
├── js/
│   ├── main.js            # Point d'entrée de l'application
│   ├── config.js          # Configuration globale
│   ├── PoeticGenerator.js # Orchestrateur principal
│   ├── AudioManager.js    # Gestion du son
│   ├── WordManager.js     # Gestion des mots
│   ├── CombinationGenerator.js  # Génération des combinaisons
│   ├── RatingManager.js   # Système de notation
│   ├── HistoryManager.js  # Historique et statistiques
│   ├── ShareManager.js    # Partage sur réseaux sociaux
│   ├── OrdinationManager.js # Permutation des ordinations
│   └── NotificationManager.js # Notifications utilisateur
└── README.md              # Ce fichier
```

---

## 🎨 Palette de couleurs Nature

La palette s'inspire des couleurs naturelles apaisantes :

| Couleur           | Hex       | Usage                         |
| ----------------- | --------- | ----------------------------- |
| Forêt             | `#52796F` | Navigation, titres principaux |
| Vert sauge        | `#B5C99A` | Bordures, accents doux        |
| Mousse            | `#84A98C` | Éléments interactifs          |
| Orange chaleureux | `#F4A261` | Boutons d'action              |
| Terre cuite       | `#E76F51` | Accents, hover states         |
| Crème             | `#FFF8E7` | Arrière-plans                 |
| Sable             | `#F5E6D3` | Zones de contenu              |

---

## 🚀 Fonctionnalités principales

### Page d'accueil (`index.html`)

- ✨ Section hero avec présentation
- 📖 Section "À propos"
- 🛠️ Grille d'outils disponibles
- 🔮 Placeholder pour futurs outils
- 🧭 Navigation sticky

### Générateur poétique (`generator.html`)

- 🎯 Sélection interactive des mots
- 🔄 Deux ordinations de mots permutables
- ✨ Génération avec animation machine à écrire
- ⭐ Système de notation (1-10)
- 📊 Statistiques en temps réel
- 📚 Historique avec tri et filtres
- 📤 Export TXT et PDF
- 🔊 Effets sonores activables/désactivables
- 📱 Partage sur réseaux sociaux
- 📸 Génération d'images pour Instagram

---

## 🎯 Modules JavaScript

### `PoeticGenerator.js`

Orchestrateur principal qui initialise et coordonne tous les modules.

### `AudioManager.js`

- Web Audio API avec fallback
- Effets sonores machine à écrire
- Contrôle du volume
- Persistance des préférences

### `WordManager.js`

- Gestion de la sélection des mots
- Support clavier complet
- Animation des transitions
- Validation des sélections

### `CombinationGenerator.js`

- Algorithme de génération aléatoire
- Évitement des répétitions récentes
- Animation typewriter
- Gestion de l'état

### `RatingManager.js`

- Système de notation 1-10
- Feedback contextuel
- Protection contre notation prématurée
- Accessibilité complète

### `HistoryManager.js`

- Stockage localStorage
- Calcul de statistiques
- Tri et filtrage
- Export multi-format

### `ShareManager.js`

- Partage Twitter, WhatsApp, Facebook, Email
- Génération d'images Canvas
- Détection des capacités du navigateur
- Analytics de partage

### `OrdinationManager.js`

- Permutation entre ordinations
- Animation de transition
- Persistance de la sélection
- Événements personnalisés

### `NotificationManager.js`

- Système de notifications toast
- File d'attente
- Types : info, success, warning, error
- Auto-dismiss configurable

---

## 🎨 Architecture CSS

Le fichier `styles.css` est organisé en sections :

1. **Variables CSS** - Palette de couleurs et constantes
2. **Reset et base** - Styles de base du document
3. **Navigation** - Menu sticky responsive
4. **Classes utilitaires** - Helpers et accessibilité
5. **Mots** - Bulles de mots interactives
6. **Contrôles** - Boutons, selects, inputs
7. **Résultat** - Zone d'affichage de la combinaison
8. **Notation** - Interface de notation 1-10
9. **Statistiques** - Grille de stats
10. **Historique** - Liste et contrôles
11. **Notifications** - Toast messages
12. **Page d'accueil** - Hero, intro, tools grid
13. **Responsive** - Media queries

---

## 🌐 Compatibilité navigateurs

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ⚠️ IE11 non supporté (modules ES6 requis)

---

## 📱 Responsive Design

L'application est entièrement responsive avec breakpoints :

- **Mobile** : < 480px
- **Tablette** : 481px - 768px
- **Desktop** : > 768px

---

## ♿ Accessibilité

L'application suit les recommandations WCAG 2.1 :

- ✅ Navigation au clavier complète
- ✅ Attributs ARIA appropriés
- ✅ Contraste des couleurs optimisé
- ✅ Focus visible
- ✅ Textes alternatifs
- ✅ Messages pour lecteurs d'écran

---

## 🔊 Gestion audio

### Web Audio API

- Oscillateurs pour sons synthétiques
- Enveloppe ADSR
- Variation de fréquence aléatoire

### Fallback

- Element `<audio>` HTML5
- Son base64 embarqué
- Détection automatique des capacités

---

## 💾 Stockage de données

### localStorage

- Historique des combinaisons
- Préférences sonores
- Ordination sélectionnée
- Limite : 1000 entrées max

---

## 🚀 Démarrage rapide

1. **Cloner le repository**

```bash
git clone [url-du-repo]
cd projet
```

2. **Ouvrir dans un navigateur**

```bash
# Serveur simple Python
python -m http.server 8000

# Ou serveur Node.js
npx serve
```

3. **Accéder à l'application**

```
http://localhost:8000
```

---

## 🛠️ Développement

### Structure modulaire

Chaque module est indépendant et peut être testé séparément.

### Debug mode

Activer dans `config.js` :

```javascript
DEBUG: {
  ENABLED: true,
  LOG_EVENTS: true,
  LOG_STORAGE: true,
  LOG_AUDIO: true
}
```

### Validation

Chaque module dispose d'une méthode `validate()` et `getDebugInfo()`.

---

## 📝 Configuration

Toute la configuration est centralisée dans `js/config.js` :

- Liste des mots
- Délais d'animation
- Messages utilisateur
- Limites et contraintes
- URLs de partage
- Configuration PDF/Image

---

## 🎯 Prochaines fonctionnalités

- [ ] Mode sombre/clair
- [ ] Personnalisation des palettes de couleurs
- [ ] Export JSON
- [ ] Importation de listes de mots personnalisées
- [ ] Multilingue (EN, ES, DE)
- [ ] PWA (Progressive Web App)
- [ ] Sauvegarde cloud
- [ ] Partage de combinaisons par URL

---

## 📄 Licence

© Tous droits réservés — Les éditions augmentées Provoq'émois

---

## 👥 Contribution

Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🐛 Rapport de bugs

Utiliser le système d'issues du repository avec :

- Description détaillée
- Étapes de reproduction
- Navigateur et version
- Captures d'écran si pertinent

---

## 📞 Contact

Les éditions Philopitre

- Site web : [[URL](https://philopitre.github.io/quantiquepoesiegenerator/)]
- Email : [contact@provoqemois.fr]

---

## 🙏 Remerciements

- Bibliothèque jsPDF pour l'export PDF
- Web Audio API pour les effets sonores
- Community open source

---

**Version 2.1** - Générateur de poésie quantique 🌟

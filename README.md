# 🌿 La Poésie Quantique

### Les éditions Philopitre

[![Version](https://img.shields.io/badge/version-2.2-green.svg)](https://github.com/philopitre/quantiquepoesiegenerator)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

> Une expérience littéraire interactive où la technologie rencontre la poésie pour créer des combinaisons inédites et inspirantes.

**🔗 [Accéder à l'application](https://philopitre.github.io/quantiquepoesiegenerator/)**

---

## 🎯 À propos

Les éditions Philopitre vous proposent deux outils créatifs uniques :

- **🎲 Générateur de Combinaisons Poétiques** : Un algorithme intelligent génère des phrases poétiques à partir d'une sélection de 20 mots soigneusement choisis
- **✍️ Compositeur Libre** : Déplacez les mots librement sur un tableau blanc pour créer votre propre poème

---

## ✨ Fonctionnalités principales

### Générateur de Combinaisons
- ✅ Sélection interactive de mots (2 groupes stylistiques)
- ✅ Animation typewriter avec effets sonores
- ✅ Système de notation 1-10 avec feedback contextuel
- ✅ Statistiques et historique persistant
- ✅ Export multi-format (TXT, PDF)
- ✅ Partage sur réseaux sociaux (Twitter, WhatsApp, Facebook)
- ✅ Génération d'images Instagram
- ✅ 2 ordinations de mots permutables

### Compositeur Libre
- ✅ Drag & Drop intuitif (desktop)
- ✅ Touch-friendly (mobile)
- ✅ Lecture automatique gauche→droite, haut→bas
- ✅ Export en image PNG
- ✅ Son d'ambiance activable

---

## 🚀 Démarrage rapide

### Prérequis
- Navigateur moderne (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript activé
- Pas de dépendances à installer !

### Installation

#### Option 1 : Serveur local Python
```bash
# Cloner le repository
git clone https://github.com/philopitre/quantiquepoesiegenerator.git
cd quantiquepoesiegenerator

# Lancer le serveur
python -m http.server 8000

# Ouvrir http://localhost:8000
```

#### Option 2 : Serveur Node.js
```bash
# Avec npx (pas d'installation requise)
npx serve

# Ou avec http-server
npm install -g http-server
http-server -p 8000
```

#### Option 3 : Extension VS Code
- Installer "Live Server" dans VS Code
- Clic droit sur `index.html` → "Open with Live Server"

---

## 📁 Structure du projet

```
quantiquepoesiegenerator/
├── index.html                 # Page d'accueil
├── generator.html             # Générateur poétique
├── create-poem.html           # Compositeur libre
├── styles.css                 # Styles globaux
├── compose-poem.css           # Styles compositeur
├── js/
│   ├── main.js               # Point d'entrée
│   ├── config.js             # Configuration centralisée
│   ├── PoeticGenerator.js    # Orchestrateur principal
│   ├── AudioManager.js       # Gestion audio
│   ├── WordManager.js        # Gestion des mots
│   ├── CombinationGenerator.js # Génération combinaisons
│   ├── RatingManager.js      # Système de notation
│   ├── HistoryManager.js     # Historique et stats
│   ├── ShareManager.js       # Partage et export
│   ├── OrdinationManager.js  # Permutation ordinations
│   ├── NotificationManager.js # Notifications
│   ├── compose-poem.js       # Compositeur libre
│   ├── hero-animation.js     # Animation page accueil
│   └── VisitorCounter.js     # Compteur de visites
├── README.md                 # Ce fichier
└── ARCHITECTURE.md           # Documentation technique
```

---

## 🎨 Design System

### Palette Nature
| Couleur | Hex | Usage |
|---------|-----|-------|
| 🌲 Forêt | `#52796F` | Navigation, titres |
| 🌿 Sauge | `#B5C99A` | Bordures, accents |
| 🍃 Mousse | `#84A98C` | Éléments interactifs |
| 🧡 Orange | `#F4A261` | Boutons d'action |
| 🔥 Terracotta | `#E76F51` | Hover states |
| 🏜️ Crème | `#FFF8E7` | Arrière-plans |

### Technologies
- **Frontend** : Vanilla JavaScript (ES6 Modules)
- **Styles** : CSS moderne (Variables, Grid, Flexbox)
- **Audio** : Web Audio API + fallback HTML5
- **Canvas** : Génération d'images
- **Storage** : localStorage (persistance)
- **Export** : jsPDF (bibliothèque CDN)

---

## 🎯 Utilisation

### Générateur de Combinaisons

1. **Sélectionner les mots** : Cliquez sur les mots pour les activer/désactiver
2. **Choisir le nombre** : Menu déroulant (1-20 mots ou "Surprise")
3. **Générer** : Bouton "Générer" ou "Générer avec mots sélectionnés"
4. **Noter** : Évaluez de 1 à 10 après la génération
5. **Partager** : Export, réseaux sociaux ou image

### Compositeur Libre

1. **Glisser-déposer** : Prenez un mot de la banque et placez-le sur le tableau
2. **Déplacer** : Cliquez et glissez pour repositionner
3. **Supprimer** : Bouton × sur chaque mot
4. **Copier** : Le poème se construit automatiquement
5. **Exporter** : Télécharger en image PNG

---

## 🔧 Configuration

Toute la configuration est centralisée dans `js/config.js` :

```javascript
// Exemple : Modifier les mots
const CONFIG = {
  WORDS: [
    "Je", "suis", "rêveur", // ...
  ],
  
  // Activer le mode debug
  DEBUG: {
    ENABLED: true,
    LOG_EVENTS: true,
    LOG_STORAGE: true,
    LOG_AUDIO: true
  }
};
```

---

## 🌐 Compatibilité

| Navigateur | Version minimale | Support |
|------------|------------------|---------|
| Chrome | 90+ | ✅ Complet |
| Firefox | 88+ | ✅ Complet |
| Safari | 14+ | ✅ Complet |
| Edge | 90+ | ✅ Complet |
| Opera | 76+ | ✅ Complet |
| IE 11 | - | ❌ Non supporté |

**Raison** : Modules ES6 requis (pas de polyfill IE11)

---

## 📱 Responsive Design

L'application est entièrement responsive avec 3 breakpoints :

- **📱 Mobile** : < 480px (interface tactile optimisée)
- **📱 Tablette** : 481px - 768px (layout adapté)
- **💻 Desktop** : > 768px (expérience complète)

---

## ♿ Accessibilité

Conforme aux standards **WCAG 2.1 Niveau AA** :

- ✅ Navigation au clavier complète
- ✅ Attributs ARIA appropriés
- ✅ Contraste des couleurs optimisé (ratio 4.5:1)
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Textes alternatifs et labels descriptifs
- ✅ Support des lecteurs d'écran
- ✅ Mode `prefers-reduced-motion` pour animations

**Raccourcis clavier** :
- `G` : Générer une combinaison
- `S` : Générer avec mots sélectionnés
- `R` : Réinitialiser tous les mots
- `C` : Copier la combinaison
- `M` : Toggle son
- `Esc` : Fermer les notifications

---

## 🏗️ Architecture technique

Pour la documentation technique approfondie (flux de données, patterns, API interne), consultez **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

**Principes clés** :
- Architecture modulaire (9 modules indépendants)
- Event-driven avec custom events
- Gestion d'état locale (pas de framework)
- Progressive enhancement
- Graceful degradation

---

## 🧪 Debug et validation

### Mode Debug
Activer dans `js/config.js` :
```javascript
DEBUG: {
  ENABLED: true,
  LOG_EVENTS: true,
  LOG_STORAGE: true,
  LOG_AUDIO: true
}
```

### Console utilitaire
```javascript
// Disponibles globalement en mode debug
window.poeticGenerator      // Instance principale
window.debugPoetic()         // Informations de debug
window.cleanupPoetic()       // Nettoyage manuel
```

### Validation des modules
Chaque module expose :
```javascript
manager.validate()           // Vérifie l'état
manager.getDebugInfo()       // Informations détaillées
```

---

## 🎯 Roadmap

### Version 2.3 (À venir)
- [ ] Mode sombre/clair
- [ ] Personnalisation des palettes de couleurs
- [ ] Export JSON structuré
- [ ] Historique avec recherche et filtres avancés
- [ ] Statistiques détaillées (graphiques)

### Version 3.0 (Future)
- [ ] Multilingue (EN, ES, DE)
- [ ] PWA (mode offline)
- [ ] Listes de mots personnalisées
- [ ] Sauvegarde cloud (comptes utilisateur)
- [ ] Partage de combinaisons par URL
- [ ] API publique

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### 1. Fork & Clone
```bash
git clone https://github.com/votre-username/quantiquepoesiegenerator.git
cd quantiquepoesiegenerator
```

### 2. Créer une branche
```bash
git checkout -b feature/ma-super-fonctionnalite
```

### 3. Développer
- Respecter l'architecture modulaire
- Ajouter des validations
- Documenter les fonctions publiques
- Tester sur tous les navigateurs

### 4. Commit & Push
```bash
git add .
git commit -m "✨ feat: ajout de ma fonctionnalité"
git push origin feature/ma-super-fonctionnalite
```

### 5. Pull Request
Ouvrir une PR avec :
- Description détaillée des changements
- Screenshots (si UI)
- Tests effectués (navigateurs)

### Guidelines de code
- Suivre le style existant
- Utiliser ES6+ moderne
- Pas de dépendances externes (sauf justification)
- Commentaires JSDoc sur fonctions publiques
- Nommage explicite (en français pour cohérence)

---

## 🐛 Rapporter un bug

Utiliser le [système d'issues GitHub](https://github.com/philopitre/quantiquepoesiegenerator/issues) avec :

**Template** :
```markdown
### Description
[Description claire du bug]

### Reproduction
1. Aller sur...
2. Cliquer sur...
3. Voir l'erreur

### Résultat attendu
[Ce qui devrait se passer]

### Résultat observé
[Ce qui se passe réellement]

### Environnement
- Navigateur: Chrome 120
- OS: Windows 11
- Version app: 2.2

### Screenshots
[Si pertinent]
```

---

## 📄 Licence

**© Tous droits réservés — Les éditions Philopitre**

Ce projet est sous licence propriétaire. Toute utilisation, modification ou redistribution nécessite une autorisation écrite préalable.

Pour obtenir une licence d'utilisation, contactez : **contact@provoqemois.fr**

---

## 📞 Contact

**Les éditions Philopitre**

- 🌐 Site web : [philopitre.github.io](https://philopitre.github.io/quantiquepoesiegenerator/)
- 📧 Email : contact@provoqemois.fr
- 🐦 Twitter : [@philopitre](https://twitter.com/philopitre)
- 💼 LinkedIn : [Les éditions Philopitre](https://linkedin.com/company/philopitre)

---

## 🙏 Remerciements

- **jsPDF** pour l'export PDF
- **Web Audio API** pour les effets sonores immersifs
- **La communauté open source** pour l'inspiration
- **Tous les curieux** qui testent et donnent leur feedback

---

## 📊 Statistiques du projet

![Lignes de code](https://img.shields.io/badge/Lignes%20de%20code-8500+-blue)
![Modules JS](https://img.shields.io/badge/Modules-12-green)
![Taille bundle](https://img.shields.io/badge/Bundle-~45KB-orange)
![Couverture](https://img.shields.io/badge/Accessibilit%C3%A9-WCAG%202.1%20AA-brightgreen)

---

<div align="center">

**🌟 Fait avec passion par Les éditions Philopitre 🌟**

*La Poésie Quantique - Version 2.2*

[⬆️ Retour en haut](#-la-poésie-quantique)

</div>
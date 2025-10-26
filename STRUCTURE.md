# 🏗️ Architecture Technique

Documentation technique approfondie pour les développeurs qui souhaitent comprendre le fonctionnement interne de La Poésie Quantique.

---

## 📐 Vue d'ensemble

### Architecture modulaire

```
┌─────────────────────────────────────────────────────────┐
│                   PoeticGenerator                       │
│                  (Orchestrateur)                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│AudioManager  │  │WordManager   │  │HistoryMgr   │
│              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                ┌──────────────────┐
                │CombinationGen    │
                └──────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│RatingMgr     │  │ShareManager  │  │OrdinationMgr │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Principes architecturaux

1. **Modularité** : Chaque module est autonome et testable
2. **Event-driven** : Communication via Custom Events
3. **Single Responsibility** : Un module = une responsabilité
4. **Dependency Injection** : Dépendances passées au constructeur
5. **Progressive Enhancement** : Fonctionne même sans JS moderne
6. **Graceful Degradation** : Fallbacks pour features non supportées

---

## 🔄 Flux de données

### 1. Initialisation de l'application

```
User loads page
    │
    ▼
main.js (DOMContentLoaded)
    │
    ├─► Check browser compatibility
    │   ├─► ES6 Modules support?
    │   ├─► localStorage available?
    │   └─► Basic APIs present?
    │
    ▼
new PoeticGenerator()
    │
    ├─► Phase 1: Independent modules
    │   ├─► HistoryManager (standalone)
    │   └─► AudioManager (standalone)
    │
    ├─► Phase 2: Simple dependencies
    │   ├─► OrdinationManager(audio)
    │   ├─► WordManager(audio)
    │   └─► CombinationGenerator(word, audio)
    │
    ├─► Phase 3: Circular dependencies
    │   ├─► RatingManager(history)
    │   └─► ShareManager(combination, rating)
    │
    ├─► Phase 4: Finalize dependencies
    │   ├─► combination.setRatingManager(rating)
    │   └─► rating.setCombinationGenerator(combination)
    │
    ├─► Phase 5: Global event listeners
    │   └─► setupGlobalEventListeners()
    │
    └─► Phase 6: Keyboard shortcuts
        └─► setupKeyboardShortcuts()
```

### 2. Génération d'une combinaison

```
User clicks "Générer"
    │
    ▼
CombinationGenerator.generate()
    │
    ├─► WordManager.getSelectedWords()
    │   └─► Returns: ["Je", "suis", "rêveur"]
    │
    ├─► Create combination
    │   ├─► selectRandomWords()
    │   ├─► shuffleArray()
    │   ├─► formatCombination()
    │   └─► addToRecentCombinations()
    │
    ├─► animateResult()
    │   ├─► For each character:
    │   │   ├─► Append to DOM
    │   │   └─► AudioManager.playSound()
    │   └─► After completion:
    │       └─► RatingManager.enableRating()
    │
    └─► Dispatch 'combinationGenerated' event
        └─► Listeners can react
```

### 3. Soumission d'une note

```
User rates combination (1-10)
    │
    ▼
RatingManager.handleRatingChange()
    │
    ├─► Validate timing
    │   └─► isCombinationReadyForRating()?
    │
    ├─► Update UI
    │   ├─► updateFeedback()
    │   └─► updateSubmitButtonState()
    │
    ▼
User clicks "Envoyer"
    │
    ▼
RatingManager.submitRating()
    │
    ├─► Validate conditions
    │   ├─► Combination exists?
    │   ├─► Rating selected?
    │   └─► Rating enabled?
    │
    ├─► Update result display
    │   └─► Show rating on result
    │
    ├─► HistoryManager.addEntry()
    │   ├─► Add to history array
    │   ├─► Save to localStorage
    │   ├─► updateDisplay()
    │   │   ├─► updateStatistics()
    │   │   └─► updateHistoryList()
    │   └─► notifyObservers()
    │
    ├─► RatingManager.disableRating()
    │
    └─► NotificationManager.success()
```

### 4. Permutation d'ordination

```
User clicks "Permuter l'ordre"
    │
    ▼
OrdinationManager.toggleOrdination()
    │
    ├─► Determine new ordination
    │   └─► current === 'original' ? 'alternative' : 'original'
    │
    ├─► addTransitionEffect()
    │   └─► CSS opacity/scale animation
    │
    ├─► applyOrdination()
    │   ├─► generateWordsHTML()
    │   └─► updateWordListContent()
    │       └─► wordList.innerHTML = newHTML
    │
    ├─► saveOrdination()
    │   └─► localStorage.setItem('ordination', ...)
    │
    ├─► dispatchOrdinationChangeEvent()
    │   └─► 'ordinationChanged' event
    │
    ▼
WordManager receives event
    │
    ├─► onOrdinationChanged()
    │   ├─► Re-query DOM for word elements
    │   ├─► attachWordEventListeners()
    │   └─► reapplySelectionState()
    │
    └─► Ready for new interactions
```

---

## 📦 Modules détaillés

### 1. PoeticGenerator.js (Orchestrateur)

**Rôle** : Point central qui initialise et coordonne tous les modules.

**Dépendances** : Tous les autres modules

**Méthodes publiques** :
```javascript
constructor()
  // Initialise l'application complète
  
isReady()
  // → Boolean : État de l'initialisation
  
getManager(name)
  // → Manager : Récupère un manager spécifique
  
validateInitialization()
  // → Object : Validation de tous les modules
  
getDebugInfo()
  // → Object : Informations de debug complètes
  
cleanup()
  // Nettoie tous les event listeners et ressources
```

**Phases d'initialisation** :

```javascript
init() {
  initializeIndependentModules();    // history, audio
  initializeDependentModules();      // ordination, word, combination
  initializeCircularDependencies();  // rating, share
  finalizeDependencies();            // connect circular refs
  setupGlobalEventListeners();       // event delegation
  setupKeyboardShortcuts();          // keyboard support
}
```

**Event delegation** :
```javascript
// Un seul listener pour tous les boutons
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  
  const handler = actionMap[button.id];
  if (handler) handler();
});
```

---

### 2. AudioManager.js (Gestion audio)

**Rôle** : Gère les effets sonores avec fallback gracieux.

**API** :

```javascript
class AudioManager {
  constructor()
    // Initialise Web Audio API ou fallback
  
  playSound(options = {})
    // options: { volume, playbackRate }
    
  toggleSound()
    // Active/désactive le son
    
  isSoundEnabled()
    // → Boolean
    
  isReady()
    // → Boolean : Audio context prêt?
}
```

**Architecture audio** :

```javascript
// Web Audio API (prioritaire)
AudioContext
  └─► GainNode (volume control)
      └─► OscillatorNode (sine/square wave)
          └─► Destination (speakers)

// Fallback HTML5
<audio> element avec src base64 intégré
```

**Stratégie de fallback** :
1. Tenter Web Audio API
2. Si échec → créer `<audio>` element
3. Si échec → mode silencieux (pas d'erreur)

**Gestion autoplay policies** :
```javascript
// Résumer le contexte au premier clic
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true });
```

---

### 3. WordManager.js (Gestion des mots)

**Rôle** : Gère la sélection interactive des mots et leur état.

**État interne** :
```javascript
{
  words: ["Je", "suis", ...],              // Tous les mots
  selectedWords: Set(["Je", "suis", ...]), // Mots sélectionnés
  wordElements: NodeList,                  // Éléments DOM
  eventHandlers: Map<Element, {click, keydown}>
}
```

**API** :
```javascript
toggleWord(word)
  // Toggle sélection d'un mot
  
selectAllWords()
  // Sélectionner tous les mots
  
resetAllWords()
  // Réinitialiser (tous sélectionnés)
  
getSelectedWords()
  // → Array<String> : Mots actifs
  
isWordSelected(word)
  // → Boolean
```

**Gestion des ordinations** :
```javascript
// Écoute le changement d'ordination
document.addEventListener('ordinationChanged', () => {
  // Re-query le DOM
  this.wordElements = document.querySelectorAll('[data-word]');
  
  // Nettoyer anciens listeners
  this.eventHandlers.forEach((handlers, element) => {
    element.removeEventListener('click', handlers.click);
    element.removeEventListener('keydown', handlers.keydown);
  });
  
  // Réattacher les nouveaux listeners
  this.attachWordEventListeners();
  
  // Réappliquer l'état de sélection
  this.reapplySelectionState();
});
```

**Validation** :
```javascript
// Protection : toujours au moins 1 mot sélectionné
toggleWord(word) {
  if (this.selectedWords.has(word) && this.selectedWords.size === 1) {
    NotificationManager.warning('Au moins un mot doit rester sélectionné');
    return;
  }
  // ...
}
```

---

### 4. CombinationGenerator.js (Génération)

**Rôle** : Génère les combinaisons poétiques avec animation.

**Algorithme de génération** :
```javascript
createCombination(words, count, config) {
  let attempts = 0;
  let combination = null;
  
  while (attempts < config.maxAttempts && !combination) {
    const selected = this.selectRandomWords(words, count);
    const formatted = this.formatCombination(selected);
    
    // Éviter les répétitions récentes
    if (!this.recentCombinations.has(formatted)) {
      combination = formatted;
      break;
    }
    
    attempts++;
  }
  
  // Si échec après N tentatives, accepter une répétition
  if (!combination) {
    combination = this.formatCombination(
      this.selectRandomWords(words, count)
    );
  }
  
  this.addToRecentCombinations(combination);
  return combination;
}
```

**Animation typewriter** :
```javascript
animateResult(text) {
  const resultElement = document.getElementById('result');
  const textSpan = document.createElement('span');
  const cursor = this.createCursor();
  
  resultElement.innerHTML = '';
  resultElement.appendChild(textSpan);
  resultElement.appendChild(cursor);
  
  let index = 0;
  
  const animateChar = () => {
    if (index >= text.length) {
      this.onAnimationComplete();
      return;
    }
    
    const char = text[index];
    textSpan.textContent += char;
    
    // Son pour caractères visibles uniquement
    if (char !== ' ') {
      this.audioManager.playSound({
        volume: 0.5,
        playbackRate: 1 + Math.random() * 0.2 - 0.1
      });
    }
    
    index++;
    this.animationTimeout = setTimeout(animateChar, DELAY);
  };
  
  animateChar();
}
```

**Gestion des états** :
```javascript
{
  currentCombination: "",
  isCombinationGenerated: false,
  isAnimationComplete: false,
  isGenerating: false
}

// Protection contre génération multiple simultanée
generate() {
  if (this.isGenerating) {
    console.warn('Génération déjà en cours');
    return;
  }
  
  this.isGenerating = true;
  // ...
}
```

---

### 5. RatingManager.js (Notation)

**Rôle** : Système de notation avec validation stricte du timing.

**Machine à états** :
```
[Idle] 
  ↓ (génération complète)
[Enabled] 
  ↓ (sélection note)
[Rating Selected]
  ↓ (soumission)
[Submitted] → [Disabled]
```

**Validation du timing** :
```javascript
isCombinationReadyForRating() {
  return this.combinationGenerator &&
         this.combinationGenerator.isCombinationReady() &&
         this.combinationGenerator.isAnimationFinished() &&
         !this.combinationGenerator.isCurrentlyGenerating();
}

handleRatingChange(event) {
  if (!this.isCombinationReadyForRating()) {
    event.target.checked = false;
    NotificationManager.warning('Attends la fin de la génération');
    return;
  }
  // ...
}
```

**Feedback contextuel** :
```javascript
getFeedbackText(rating) {
  if (rating <= 3) return "Farfelu mais intéressant !";
  if (rating <= 6) return "Intrigant !";
  if (rating <= 8) return "Belle matière poétique !";
  return "Très réaliste et crédible !";
}
```

**Accessibilité** :
```javascript
// Navigation clavier complète
handleRatingKeydown(event) {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      navigateRating(-1);
      break;
    case 'ArrowRight':
    case 'ArrowUp':
      navigateRating(1);
      break;
    case 'Home':
      focusRating(1);
      break;
    case 'End':
      focusRating(10);
      break;
  }
}
```

---

### 6. HistoryManager.js (Historique)

**Rôle** : Persistance et gestion de l'historique des combinaisons notées.

**Structure de données** :
```javascript
{
  history: [
    {
      text: "Je suis rêveur professionnel.",
      note: 8,
      timestamp: 1704067200000,
      id: "entry_1704067200000_abc123"
    },
    // ...
  ]
}
```

**Validation des entrées** :
```javascript
isValidHistoryEntry(entry) {
  return entry &&
         typeof entry === 'object' &&
         typeof entry.text === 'string' &&
         entry.text.length > 0 &&
         typeof entry.note === 'number' &&
         entry.note >= 1 &&
         entry.note <= 10;
}

validateHistoryData() {
  this.history = this.history.filter(this.isValidHistoryEntry);
  
  if (this.history.length > MAX_ENTRIES) {
    this.history = this.history.slice(-MAX_ENTRIES);
    this.saveHistory();
  }
}
```

**Calcul de statistiques** :
```javascript
calculateStatistics() {
  if (this.history.length === 0) {
    return { total: 0, average: '-', best: '-', worst: '-' };
  }
  
  const notes = this.history.map(e => e.note);
  const sum = notes.reduce((a, b) => a + b, 0);
  
  return {
    total: this.history.length,
    average: (sum / this.history.length).toFixed(2),
    best: Math.max(...notes),
    worst: Math.min(...notes)
  };
}
```

**Export PDF** :
```javascript
exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let y = 20;
  doc.text('Historique - Poésie Quantique', 10, y);
  y += 20;
  
  this.history.forEach((entry, index) => {
    const text = `${index + 1}. ${entry.text} (${entry.note}/10)`;
    const lines = doc.splitTextToSize(text, 180);
    
    // Gestion de pagination
    if (y + (lines.length * 8) > 280) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(lines, 10, y);
    y += (lines.length * 8) + 7;
  });
  
  doc.save('historique.pdf');
}
```

---

### 7. ShareManager.js (Partage)

**Rôle** : Partage sur réseaux sociaux et génération d'images.

**Détection des capacités** :
```javascript
detectCapabilities() {
  return {
    canvas: typeof HTMLCanvasElement !== 'undefined',
    clipboard: typeof navigator.clipboard !== 'undefined',
    share: typeof navigator.share !== 'undefined'
  };
}
```

**Génération d'image Canvas** :
```javascript
createCombinationCanvas(combination, rating, dateTime) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1080;
  canvas.height = 1080;
  
  // 1. Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#FAF3E0');
  gradient.addColorStop(1, '#F5E6D3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);
  
  // 2. Border
  ctx.strokeStyle = '#52796F';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, 1000, 1000);
  
  // 3. Text (wrapped)
  ctx.font = 'italic 52px Georgia';
  ctx.fillStyle = '#4A4A3A';
  ctx.textAlign = 'center';
  
  const lines = this.wrapText(ctx, combination.split(' '), 880);
  const startY = (1080 - lines.length * 70) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, 540, startY + i * 70);
  });
  
  // 4. Rating (si présent)
  if (rating !== null) {
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`Note : ${rating}/10`, 540, startY + lines.length * 70 + 80);
  }
  
  // 5. DateTime
  ctx.font = 'bold 22px Arial';
  ctx.fillText(dateTime, 540, 920);
  
  // 6. Watermark
  ctx.font = 'bold 28px Georgia';
  ctx.fillText('© Les éditions Philopitre', 540, 1000);
  
  return canvas;
}
```

**Partage social** :
```javascript
shareOnTwitter() {
  const combination = this.getCombinationForSharing();
  const rating = this.getCurrentRating();
  const text = `${combination} (Note: ${rating}/10) #PoésieQuantique`;
  const url = 'https://twitter.com/intent/tweet?text=' + 
              encodeURIComponent(text);
  
  this.openShareWindow(url, 'Twitter', 550, 420);
}

// Détection mobile pour WhatsApp
shareOnWhatsApp() {
  const url = 'https://api.whatsapp.com/send?text=' + 
              encodeURIComponent(text);
  
  if (this.isMobileDevice()) {
    window.location.href = url;  // Ouvre l'app
  } else {
    this.openShareWindow(url, 'WhatsApp', 600, 500);
  }
}
```

---

### 8. OrdinationManager.js (Permutation)

**Rôle** : Gère les deux ordinations de mots avec transition fluide.

**Définition des ordinations** :
```javascript
ordinations = {
  original: {
    name: 'Ordination Originale',
    words: [
      { text: "Je", group: 1 },
      { text: "suis", group: 1 },
      { text: "rêveur", group: 2 },
      // ... ordre original du poème
    ]
  },
  alternative: {
    name: 'Ordination Alternative',
    words: [
      { text: "Je", group: 1 },
      { text: "suis", group: 1 },
      { text: "professionnel", group: 1 },
      // ... regroupement par groupes
    ]
  }
}
```

**Processus de permutation** :
```javascript
toggleOrdination() {
  const newOrdination = this.currentOrdination === 'original' 
    ? 'alternative' 
    : 'original';
  
  // 1. Transition CSS
  this.addTransitionEffect();
  
  // 2. Attendre l'animation
  setTimeout(() => {
    // 3. Mettre à jour le DOM
    this.applyOrdination(newOrdination);
    
    // 4. Sauvegarder
    this.saveOrdination();
    
    // 5. Notifier
    this.dispatchOrdinationChangeEvent();
  }, 150);
}
```

**Événement personnalisé** :
```javascript
dispatchOrdinationChangeEvent() {
  document.dispatchEvent(new CustomEvent('ordinationChanged', {
    detail: {
      currentOrdination: this.currentOrdination,
      ordinationName: this.ordinations[this.currentOrdination].name,
      wordCount: this.ordinations[this.currentOrdination].words.length,
      timestamp: Date.now()
    }
  }));
}
```

---

### 9. NotificationManager.js (Notifications)

**Rôle** : Système de toast notifications avec file d'attente.

**Architecture** :
```javascript
static {
  currentNotification: null,
  queue: [],
  notificationElements: WeakMap  // Évite fuites mémoire
}
```

**Système de queue** :
```javascript
show(message, options) {
  if (this.currentNotification) {
    // Ajouter à la queue
    this.queue.push({ message, options });
    return;
  }
  
  this._displayNotification(message, options);
}

_removeNotification(notification) {
  notification.remove();
  this.currentNotification = null;
  
  // Traiter la queue
  if (this.queue.length > 0) {
    const { message, options } = this.queue.shift();
    this._displayNotification(message, options);
  }
}
```

**Types de notifications** :
```javascript
success(message) → green background
error(message)   → red background
warning(message) → orange background
info(message)    → blue background
```

**Auto-dismiss** :
```javascript
_scheduleRemoval(notification, duration) {
  setTimeout(() => {
    notification.classList.add('fade-out');
    
    notification.addEventListener('transitionend', () => {
      this._removeNotification(notification);
    }, { once: true });
  }, duration);
}
```

---

## 🎨 Design System technique

### CSS Architecture

```css
/* 1. Variables (tokens design) */
:root {
  --primary-color: #7A9E7E;
  --accent-color: #F4A261;
  /* ... */
}

/* 2. Reset & Base */
*, body { /* ... */ }

/* 3. Components */
.button { /* ... */ }
.word-group-1 { /* ... */ }

/* 4. Utilities */
.sr-only { /* ... */ }

/* 5. Responsive */
@media (max-width: 768px) { /* ... */ }
```

### Naming convention

- **BEM-like** : `.component__element--modifier`
- **Semantic** : `.word-group-1` plutôt que `.blue-pill`
- **State** : `.word-hidden`, `.notification-fade-out`

### Performance CSS

```css
/* GPU acceleration pour animations */
.word-group-1 {
  transform: translateZ(0);
  will-change: transform;
}

/* Transitions optimisées */
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 🔒 Sécurité et validation

### Input sanitization

```javascript
// Limitation longueur
if (message.length > MAX_LENGTH) {
  message = message.substring(0, MAX_LENGTH) + '...';
}

// Échappement HTML (pas de innerHTML avec user input)
element.textContent = userInput;  // Safe
// element.innerHTML = userInput;  // Dangereux!
```

### localStorage validation

```javascript
function safeLocalStorageGet(key, defaultValue) {
  if (typeof localStorage === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Erreur lecture localStorage: ${error}`);
    return defaultValue;
  }
}
```

### XSS Protection

- Pas de `eval()`
- Pas de `innerHTML` avec user input
- Validation stricte des types
- Échappement systématique

---

## 🧪 Testing et validation

### Validation automatique

Chaque module expose :

```javascript
validate() {
  const issues = [];
  const warnings = [];
  
  if (!this.essentialProperty) {
    issues.push('Property manquante');
  }
  
  if (this.optionalProperty === null) {
    warnings.push('Property optionnelle absente');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
}
```

### Debug info

```javascript
getDebugInfo() {
  return {
    state: this.currentState,
    elements: {
      input: !!this.inputElement,
      output: !!this.outputElement
    },
    validation: this.validate(),
    timestamp: Date.now()
  };
}
```

### Tests manuels

```javascript
// En mode debug, dans la console :
window.poeticGenerator.validateInitialization();
window.poeticGenerator.getDebugInfo();

// Tester un module spécifique
const audio = window.poeticGenerator.getManager('audio');
audio.validate();
audio.getDebugInfo();
```

---

## 🚀 Performance

### Optimisations implémentées

1. **Event Delegation**
   ```javascript
   // ✅ Un seul listener pour tous les boutons
   document.addEventListener('click', handleGlobalClick);
   
   // ❌ Pas de listener par bouton
   // buttons.forEach(btn => btn.addEventListener('click', ...))
   ```

2. **Debouncing / Throttling**
   ```javascript
   // Limiter les sauvegardes fréquentes
   let saveTimer;
   function debouncedSave() {
     clearTimeout(saveTimer);
     saveTimer = setTimeout(() => {
       localStorage.setItem(KEY, data);
     }, 300);
   }
   ```

3. **requestAnimationFrame**
   ```javascript
   // Pour animations fluides
   requestAnimationFrame(() => {
     element.classList.add('animated');
   });
   ```

4. **CSS containment**
   ```css
   .notification {
     contain: layout style paint;
   }
   ```

### Bundle size

- **Total** : ~45KB (non minifié)
- **Modules JS** : ~35KB
- **CSS** : ~10KB
- **Pas de framework** : React/Vue ajouterait ~40KB+

### Métriques cibles

- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3s
- **CLS** (Cumulative Layout Shift) : < 0.1

---

## 🔄 Cycle de vie

### Lifecycle hooks

```javascript
// 1. Construction
constructor() {
  this.init();
}

// 2. Initialisation
init() {
  this.setupDOMReferences();
  this.setupEventListeners();
  this.loadState();
}

// 3. Runtime
// Les méthodes publiques sont appelées

// 4. Cleanup
cleanup() {
  this.removeEventListeners();
  this.saveState();
  this.clearTimers();
}

// 5. beforeunload (automatique)
window.addEventListener('beforeunload', () => {
  app.cleanup();
});
```

### Memory management

```javascript
// WeakMap pour éviter les fuites
this.elementData = new WeakMap();
this.elementData.set(element, data);

// Clear des timers
cleanup() {
  if (this.timeout) clearTimeout(this.timeout);
  if (this.interval) clearInterval(this.interval);
}

// Suppression des event listeners
cleanup() {
  this.listeners.forEach(({ el, type, fn }) => {
    el.removeEventListener(type, fn);
  });
  this.listeners = [];
}
```

---

## 📈 Monitoring et analytics

### Events trackés

```javascript
// Génération de combinaison
document.dispatchEvent(new CustomEvent('combinationGenerated', {
  detail: {
    combination,
    wordCount,
    useSelectedOnly,
    timestamp: Date.now()
  }
}));

// Note soumise
document.dispatchEvent(new CustomEvent('combinationRated', {
  detail: {
    combination,
    rating,
    timestamp: Date.now()
  }
}));

// Partage
document.dispatchEvent(new CustomEvent('contentShared', {
  detail: {
    platform: 'twitter',
    combination,
    timestamp: Date.now()
  }
}));
```

### Intégration analytics (future)

```javascript
// Google Analytics 4
document.addEventListener('combinationGenerated', (e) => {
  gtag('event', 'generate_combination', {
    word_count: e.detail.wordCount,
    use_selected: e.detail.useSelectedOnly
  });
});

// Plausible Analytics
document.addEventListener('combinationRated', (e) => {
  plausible('Rate Combination', {
    props: { rating: e.detail.rating }
  });
});
```

---

## 🔧 Environnement de développement

### Setup recommandé

```bash
# VS Code Extensions
- ESLint
- Prettier
- Live Server
- GitLens
- Error Lens

# Configuration
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Outils de debug

```javascript
// Mode debug global
CONFIG.DEBUG.ENABLED = true;

// Inspection des modules
window.poeticGenerator.getManager('word').getDebugInfo();

// Validation complète
window.poeticGenerator.validateInitialization();

// Cleanup manuel
window.cleanupPoetic();
```

---

## 📚 Ressources et références

### APIs utilisées

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)

### Bibliothèques externes

- [jsPDF](https://github.com/parallax/jsPDF) - Génération PDF

### Patterns utilisés

- **Module Pattern** : Encapsulation ES6
- **Observer Pattern** : Custom Events
- **Singleton Pattern** : NotificationManager
- **Factory Pattern** : Création d'éléments DOM
- **Strategy Pattern** : Ordinations interchangeables

---

## 🎯 Best practices

### JavaScript

```javascript
// ✅ Utiliser const par défaut
const data = loadData();

// ✅ Destructuring
const { word, group } = wordData;

// ✅ Arrow functions
const filtered = words.filter(w => w.selected);

// ✅ Template literals
const message = `${count} mots sélectionnés`;

// ✅ Optional chaining
const value = obj?.prop?.nested;

// ✅ Nullish coalescing
const result = value ?? defaultValue;
```

### CSS

```css
/* ✅ Variables CSS */
:root {
  --spacing: 1rem;
}

/* ✅ Flexbox/Grid moderne */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* ✅ Transitions performantes */
.element {
  transition: transform 0.3s ease;
}

/* ✅ Media queries mobile-first */
.component { /* mobile */ }
@media (min-width: 768px) {
  .component { /* desktop */ }
}
```

### Accessibilité

```html
<!-- ✅ ARIA labels -->
<button aria-label="Générer une combinaison">Générer</button>

<!-- ✅ Roles -->
<div role="radiogroup" aria-labelledby="rating-title">

<!-- ✅ Live regions -->
<div aria-live="polite" aria-atomic="true">

<!-- ✅ Focus management -->
<div tabindex="0" role="button">
```

---

## 🐛 Debugging avancé

### Breakpoints conditionnels

```javascript
// Dans Chrome DevTools
// Clic droit sur ligne > Add conditional breakpoint
if (rating === null) {
  debugger;
}
```

### Performance profiling

```javascript
// Console
console.time('generation');
generateCombination();
console.timeEnd('generation');

// Performance API
const t0 = performance.now();
doSomething();
const t1 = performance.now();
console.log(`Took ${t1 - t0}ms`);
```

### Memory leaks detection

```javascript
// Chrome DevTools > Memory > Take heap snapshot
// Comparer avant/après actions répétées
// Chercher les objets qui ne sont pas libérés
```

---

## 🔮 Architecture future

### Version 3.0 (planifiée)

```
┌─────────────────────────────────────┐
│         Service Worker              │
│         (PWA, offline)              │
└─────────────────────────────────────┘
              │
┌─────────────┼─────────────┐
│             │             │
▼             ▼             ▼
[Cache]    [Sync]    [Notifications]

┌─────────────────────────────────────┐
│         API Layer                   │
│    (REST + WebSocket)               │
└─────────────────────────────────────┘
              │
┌─────────────┼─────────────┐
│             │             │
▼             ▼             ▼
[Auth]    [Cloud Save]  [Analytics]
```

### Améliorations techniques prévues

- [ ] TypeScript migration
- [ ] Web Components
- [ ] IndexedDB pour historique illimité
- [ ] Service Worker pour mode offline
- [ ] WebSocket pour collaboration temps réel
- [ ] Web Share API v2
- [ ] Compression gzip/brotli
- [ ] Code splitting dynamique

---

<div align="center">

**🏗️ Documentation maintenue avec ❤️ par l'équipe Philopitre**

*Dernière mise à jour : 2024*

[⬆️ Retour en haut](#-architecture-technique)

</div>
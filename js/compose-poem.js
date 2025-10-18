// ============================================
// COMPOSE-POEM.JS - Compositeur de poèmes
// ============================================

// Import du ShareManager pour réutiliser la génération d'image
import { ShareManager } from './ShareManager.js';

// Configuration des mots
const WORDS = [
  { text: "Je", group: 1 },
  { text: "suis", group: 1 },
  { text: "rêveur", group: 2 },
  { text: "professionnel", group: 1 },
  { text: "dans", group: 1 },
  { text: "mon", group: 2 },
  { text: "métier", group: 2 },
  { text: "exceptionnel", group: 2 },
  { text: "l'erreur", group: 1 },
  { text: "en", group: 1 },
  { text: "tout", group: 1 },
  { text: "genre", group: 1 },
  { text: "est", group: 2 },
  { text: "proscrite", group: 1 },
  { text: "la", group: 1 },
  { text: "souveraine", group: 1 },
  { text: "intelligence", group: 1 },
  { text: "pour", group: 2 },
  { text: "moi-même", group: 2 },
  { text: "grandissant", group: 2 }
];

// Gestionnaire de notifications
class NotificationManager {
  static show(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error');
  }
}

// Gestionnaire audio simple
class AudioManager {
  constructor() {
    this.enabled = localStorage.getItem('composePoemSoundEnabled') !== 'false';
  }

  playSound() {
    if (!this.enabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.log('Audio non disponible');
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('composePoemSoundEnabled', this.enabled);
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Compositeur de poème principal
class PoemComposer {
  constructor() {
    this.whiteboard = document.getElementById('whiteboard');
    this.wordListContainer = document.getElementById('wordList');
    this.placeholder = document.getElementById('placeholder');
    this.poemText = document.getElementById('poemText');
    this.placedWords = [];
    this.audioManager = new AudioManager();
    this.usedWords = new Set(); // Suivi des mots utilisés
    
    // Créer une instance de ShareManager pour réutiliser la génération d'image
    this.shareManager = new ShareManager();
    
    this.init();
  }

  init() {
    this.createWordBank();
    this.setupEventListeners();
    this.updateSoundButton();
    this.updatePlaceholder();
  }

  createWordBank() {
    this.wordListContainer.innerHTML = '';
    
    WORDS.forEach(wordData => {
      // Ne créer que si le mot n'est pas déjà utilisé
      if (!this.usedWords.has(wordData.text)) {
        const wordElement = this.createWordElement(wordData);
        this.wordListContainer.appendChild(wordElement);
      }
    });
  }

  createWordElement(wordData) {
    const div = document.createElement('div');
    div.className = `word-item word-group-${wordData.group}`;
    div.textContent = wordData.text;
    div.draggable = true;
    div.dataset.word = wordData.text;
    div.dataset.group = wordData.group;

    div.addEventListener('dragstart', (e) => this.onDragStart(e));
    div.addEventListener('dragend', (e) => this.onDragEnd(e));

    return div;
  }

  setupEventListeners() {
    // Drag & Drop sur le whiteboard
    this.whiteboard.addEventListener('dragover', (e) => this.onDragOver(e));
    this.whiteboard.addEventListener('drop', (e) => this.onDrop(e));
    this.whiteboard.addEventListener('dragleave', (e) => this.onDragLeave(e));

    // Boutons
    document.getElementById('clearCanvas')?.addEventListener('click', () => this.clearCanvas());
    document.getElementById('toggleSound')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('copyPoem')?.addEventListener('click', () => this.copyPoem());
    document.getElementById('sharePoem')?.addEventListener('click', () => this.sharePoem());
  }

  onDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.word);
    e.dataTransfer.setData('group', e.target.dataset.group);
    e.target.classList.add('dragging');
  }

  onDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.whiteboard.classList.add('drag-over');
  }

  onDragLeave(e) {
    if (e.target === this.whiteboard) {
      this.whiteboard.classList.remove('drag-over');
    }
  }

  onDrop(e) {
    e.preventDefault();
    this.whiteboard.classList.remove('drag-over');

    const word = e.dataTransfer.getData('text/plain');
    const group = e.dataTransfer.getData('group');

    if (!word) return;

    // Calculer la position relative au whiteboard
    const rect = this.whiteboard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Créer le mot placé
    this.createPlacedWord(word, group, x, y);
    
    // Marquer le mot comme utilisé et retirer de la banque
    this.usedWords.add(word);
    this.removeWordFromBank(word);
    
    this.playSound();
    this.updatePlaceholder();
    this.updatePoemText();
  }

  removeWordFromBank(word) {
    const wordElement = this.wordListContainer.querySelector(`[data-word="${word}"]`);
    if (wordElement) {
      wordElement.remove();
    }
  }

  restoreWordToBank(word) {
    // Trouver les données du mot
    const wordData = WORDS.find(w => w.text === word);
    if (!wordData) return;

    // Retirer des mots utilisés
    this.usedWords.delete(word);

    // Trouver la position correcte pour réinsérer le mot
    const wordIndex = WORDS.findIndex(w => w.text === word);
    const existingWords = Array.from(this.wordListContainer.querySelectorAll('.word-item'));
    
    // Créer l'élément
    const wordElement = this.createWordElement(wordData);

    // Insérer à la bonne position
    if (existingWords.length === 0) {
      this.wordListContainer.appendChild(wordElement);
    } else {
      let inserted = false;
      for (let i = 0; i < existingWords.length; i++) {
        const existingWord = existingWords[i].dataset.word;
        const existingIndex = WORDS.findIndex(w => w.text === existingWord);
        
        if (wordIndex < existingIndex) {
          this.wordListContainer.insertBefore(wordElement, existingWords[i]);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.wordListContainer.appendChild(wordElement);
      }
    }
  }

  createPlacedWord(word, group, x, y) {
    const wordDiv = document.createElement('div');
    wordDiv.className = `placed-word word-group-${group}`;
    wordDiv.textContent = word;
    wordDiv.style.left = `${x}px`;
    wordDiv.style.top = `${y}px`;
    wordDiv.dataset.word = word;

    // Bouton de suppression
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', 'Supprimer ce mot');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeWord(wordDiv);
    });

    wordDiv.appendChild(removeBtn);

    // Rendre le mot déplaçable
    this.makeDraggable(wordDiv);

    this.whiteboard.appendChild(wordDiv);
    this.placedWords.push({ element: wordDiv, word, x, y });
  }

  makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    element.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('remove-btn')) return;
      
      isDragging = true;
      initialX = e.clientX - element.offsetLeft;
      initialY = e.clientY - element.offsetTop;
      element.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      element.style.left = `${currentX}px`;
      element.style.top = `${currentY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.zIndex = 1;
        this.updatePoemText();
      }
    });
  }

  removeWord(wordElement) {
    const word = wordElement.dataset.word;
    
    // Retirer du tableau
    this.placedWords = this.placedWords.filter(w => w.element !== wordElement);
    
    // Retirer du DOM
    wordElement.remove();
    
    // Restaurer dans la banque
    this.restoreWordToBank(word);
    
    this.updatePlaceholder();
    this.updatePoemText();
    this.playSound();
    NotificationManager.show('Mot retiré');
  }

  updatePlaceholder() {
    if (this.placedWords.length === 0) {
      this.placeholder.classList.add('show');
    } else {
      this.placeholder.classList.remove('show');
    }
  }

  updatePoemText() {
    if (this.placedWords.length === 0) {
      this.poemText.textContent = 'Commencez à composer...';
      this.poemText.classList.add('empty');
      return;
    }

    // Trier les mots par position (de gauche à droite, de haut en bas)
    const sortedWords = [...this.placedWords].sort((a, b) => {
      const yDiff = a.element.offsetTop - b.element.offsetTop;
      if (Math.abs(yDiff) > 30) return yDiff;
      return a.element.offsetLeft - b.element.offsetLeft;
    });

    let poemText = sortedWords.map(w => w.word).join(' ');
    
    // Ajouter un point final s'il n'y en a pas
    if (poemText && !poemText.match(/[.!?]$/)) {
      poemText += '.';
    }
    
    this.poemText.textContent = poemText;
    this.poemText.classList.remove('empty');
  }

  clearCanvas() {
    if (this.placedWords.length === 0) {
      NotificationManager.show('Le tableau est déjà vide');
      return;
    }

    // Restaurer tous les mots dans la banque
    this.placedWords.forEach(w => {
      w.element.remove();
      this.restoreWordToBank(w.word);
    });
    
    this.placedWords = [];
    this.updatePlaceholder();
    this.updatePoemText();
    this.playSound();
    NotificationManager.success('Tableau effacé');
  }

  copyPoem() {
    const poemText = document.getElementById('poemText');
    if (!poemText || poemText.classList.contains('empty')) {
      NotificationManager.error('Créez d\'abord un poème !');
      return;
    }

    navigator.clipboard.writeText(poemText.textContent).then(() => {
      NotificationManager.success('Poème copié dans le presse-papier !');
    }).catch(() => {
      NotificationManager.error('Erreur lors de la copie');
    });
  }

  sharePoem() {
    const poemText = document.getElementById('poemText');
    if (!poemText || poemText.classList.contains('empty')) {
      NotificationManager.error('Créez d\'abord un poème !');
      return;
    }

    const poem = poemText.textContent;
    
    // Créer un canvas temporaire en utilisant ShareManager
    try {
      const canvas = this.shareManager.createCombinationCanvas(
        poem,
        null, // pas de note pour le compositeur
        this.getFormattedDateTime()
      );
      
      this.downloadCanvas(canvas, 'mon-poeme-quantique.png');
      NotificationManager.success('Image générée et téléchargée !');
    } catch (error) {
      console.error('Erreur génération image:', error);
      NotificationManager.error('Erreur lors de la génération de l\'image');
    }
  }

  getFormattedDateTime() {
    return new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  downloadCanvas(canvas, filename) {
    canvas.toBlob(blob => {
      if (!blob) {
        NotificationManager.error('Erreur lors de la conversion en image');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  toggleSound() {
    if (!this.audioManager) return;

    const isEnabled = this.audioManager.toggle();
    this.updateSoundButton();
    
    const message = isEnabled ? 'Son activé ! 🔊' : 'Son désactivé 🔇';
    NotificationManager.show(message);
  }

  updateSoundButton() {
    const soundBtn = document.getElementById('toggleSound');
    if (!soundBtn || !this.audioManager) return;

    const isEnabled = this.audioManager.isEnabled();
    soundBtn.innerHTML = isEnabled ? '<span aria-hidden="true">🔊</span> Son' : '<span aria-hidden="true">🔇</span> Son';
    soundBtn.setAttribute('aria-pressed', isEnabled.toString());
    soundBtn.className = isEnabled ? 'secondary' : 'secondary sound-disabled';
  }

  playSound() {
    this.audioManager.playSound();
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  new PoemComposer();
});
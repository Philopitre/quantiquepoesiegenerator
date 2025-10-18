/**
 * Gestionnaire de sélection des mots (VERSION OPTIMISÉE)
 * Gère l'affichage, la sélection et la validation des mots disponibles
 * @module WordManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class WordManager {
  constructor(audioManager) {
    if (!audioManager) throw new Error('AudioManager requis');
    
    this.audioManager = audioManager;
    this.words = [...CONFIG.WORDS];
    this.selectedWords = new Set(this.words);
    this.wordElements = [];
    this.wordListElement = null;
    this.counterElement = null;
    this.eventHandlers = new Map();
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager initialized with', this.words.length, 'words');
    }
  }
  
  init() {
    this.setupDOMReferences();
    this.setupEventListeners();
    this.updateCounter();
    this.validateWords();
    
    document.addEventListener('ordinationChanged', () => this.onOrdinationChanged());
  }
  
  onOrdinationChanged() {
    this.wordElements = this.wordListElement.querySelectorAll(CONFIG.SELECTORS.WORD_ELEMENTS);
    this.attachWordEventListeners();
    this.reapplySelectionState();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Event listeners réinitialisés après changement d\'ordination');
    }
  }
  
  setupDOMReferences() {
    this.wordListElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_LIST);
    this.counterElement = document.getElementById(CONFIG.DOM_ELEMENTS.SELECTED_WORDS_COUNTER);
    
    if (!this.wordListElement) {
      console.error('Liste de mots non trouvée');
      return;
    }
    
    this.wordElements = this.wordListElement.querySelectorAll(CONFIG.SELECTORS.WORD_ELEMENTS);
  }
  
  setupEventListeners() {
    this.attachWordEventListeners();
    
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
  }
  
  attachWordEventListeners() {
    this.wordElements.forEach(element => {
      // ✅ ÉTAPE 1 : Supprimer les anciens handlers si existants
      const oldHandlers = this.eventHandlers.get(element);
      if (oldHandlers) {
        element.removeEventListener('click', oldHandlers.click);
        element.removeEventListener('keydown', oldHandlers.keydown);
      }
      
      // ✅ ÉTAPE 2 : Créer les nouveaux handlers
      const clickHandler = (e) => this.handleWordClick(e);
      const keydownHandler = (e) => this.handleWordKeydown(e);
      
      // ✅ ÉTAPE 3 : Attacher les nouveaux handlers
      element.addEventListener('click', clickHandler);
      element.addEventListener('keydown', keydownHandler);
      
      // ✅ ÉTAPE 4 : Sauvegarder pour futur nettoyage
      this.eventHandlers.set(element, {
        click: clickHandler,
        keydown: keydownHandler
      });
      
      // ✅ ÉTAPE 5 : Mettre à jour les attributs (sans toucher au DOM)
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'checkbox');
      
      const word = element.getAttribute('data-word');
      const isSelected = this.selectedWords.has(word);
      element.setAttribute('aria-checked', isSelected.toString());
      element.classList.toggle(CONFIG.CSS_CLASSES.WORD_HIDDEN, !isSelected);
    });
  }
  
  reapplySelectionState() {
    this.wordElements.forEach(element => {
      const word = element.getAttribute('data-word');
      const isSelected = this.selectedWords.has(word);
      element.classList.toggle(CONFIG.CSS_CLASSES.WORD_HIDDEN, !isSelected);
      element.setAttribute('aria-checked', isSelected.toString());
    });
    
    this.updateCounter();
  }
  
  validateWords() {
    const issues = [];
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (!element) issues.push(`Mot "${word}" manquant dans le DOM`);
    });
    
    this.wordElements.forEach(element => {
      const word = element.getAttribute('data-word');
      if (!word || !this.words.includes(word)) {
        issues.push(`Élément DOM sans mot correspondant: "${word}"`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('Problèmes de validation:', issues);
    }
  }
  
  handleWordClick(event) {
    event.preventDefault();
    
    const word = event.target.getAttribute('data-word');
    if (!word) {
      console.error('Mot non trouvé pour l\'élément cliqué');
      return;
    }
    
    this.toggleWord(word);
    this.playWordSound();
  }
  
  handleWordKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleWordClick(event);
    }
  }
  
  handleGlobalKeydown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    if (event.key === 'a' && event.ctrlKey) {
      event.preventDefault();
      this.selectAllWords();
    } else if (event.key === 'd' && event.ctrlKey) {
      event.preventDefault();
      this.deselectAllWords();
    }
  }
  
  toggleWord(word) {
    if (!this.words.includes(word)) {
      console.error('Mot non valide:', word);
      return;
    }
    
    const element = this.getWordElement(word);
    if (!element) {
      console.error('Élément non trouvé pour le mot:', word);
      return;
    }
    
    if (this.selectedWords.has(word) && this.selectedWords.size === 1) {
      NotificationManager.warning('Au moins un mot doit rester sélectionné');
      return;
    }
    
    const isSelected = this.selectedWords.has(word);
    if (isSelected) {
      this.selectedWords.delete(word);
    } else {
      this.selectedWords.add(word);
    }
    
    this.updateWordAppearance(element, !isSelected);
    this.updateCounter();
    this.dispatchWordToggleEvent(word, !isSelected);
  }
  
  updateWordAppearance(element, selected) {
    element.classList.add(CONFIG.CSS_CLASSES.WORD_TOGGLING);
    
    setTimeout(() => {
      element.classList.remove(CONFIG.CSS_CLASSES.WORD_TOGGLING);
      element.classList.toggle(CONFIG.CSS_CLASSES.WORD_HIDDEN, !selected);
      element.setAttribute('aria-checked', selected.toString());
    }, CONFIG.ANIMATION.WORD_TOGGLE_DURATION);
  }
  
  selectAllWords() {
    this.selectedWords = new Set(this.words);
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (element) {
        element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'true');
      }
    });
    
    this.updateCounter();
    this.playWordSound();
  }
  
  deselectAllWords() {
    if (this.selectedWords.size === 1) {
      NotificationManager.warning('Au moins un mot doit rester sélectionné');
      return;
    }
    
    // Garder juste un mot sélectionné (le premier)
    const firstWord = this.words[0];
    this.selectedWords = new Set([firstWord]);
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (element) {
        const isSelected = word === firstWord;
        element.classList.toggle(CONFIG.CSS_CLASSES.WORD_HIDDEN, !isSelected);
        element.setAttribute('aria-checked', isSelected.toString());
      }
    });
    
    this.updateCounter();
    this.playWordSound();
  }
  
  resetAllWords() {
    let delay = 0;
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (element) {
        setTimeout(() => {
          element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
          element.setAttribute('aria-checked', 'true');
          this.selectedWords.add(word);
          
          element.classList.add(CONFIG.CSS_CLASSES.WORD_TOGGLING);
          setTimeout(() => {
            element.classList.remove(CONFIG.CSS_CLASSES.WORD_TOGGLING);
          }, CONFIG.ANIMATION.WORD_TOGGLE_DURATION);
        }, delay);
        
        delay += CONFIG.ANIMATION.WORD_RESET_STAGGER;
      }
    });
    
    setTimeout(() => this.updateCounter(), delay);
    
    this.playWordSound();
    NotificationManager.success(CONFIG.MESSAGES.ALL_WORDS_RESET);
  }
  
  updateCounter() {
    if (this.counterElement) {
      this.counterElement.textContent = this.selectedWords.size;
    }
    
    if (this.wordListElement) {
      this.wordListElement.setAttribute('aria-label', 
        `${this.selectedWords.size} mots sélectionnés sur ${this.words.length}`);
    }
  }
  
  playWordSound() {
    if (this.audioManager && this.audioManager.isSoundEnabled()) {
      try {
        this.audioManager.playSound({ volume: 0.3, playbackRate: 1.2 });
      } catch (error) {
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
          console.warn('Erreur lors de la lecture du son:', error);
        }
      }
    }
  }
  
  getWordElement(word) {
    return this.wordListElement.querySelector(`[data-word="${word}"]`);
  }
  
  getAllWords() {
    return [...this.words];
  }
  
  getSelectedWords() {
    return Array.from(this.selectedWords);
  }
  
  getSelectedWordsCount() {
    return this.selectedWords.size;
  }
  
  isWordSelected(word) {
    return this.selectedWords.has(word);
  }
  
  selectWords(words) {
    if (!Array.isArray(words)) {
      console.error('selectWords attend un tableau');
      return;
    }
    
    const validWords = words.filter(word => this.words.includes(word));
    
    if (validWords.length === 0) {
      NotificationManager.warning('Aucun mot valide à sélectionner');
      return;
    }
    
    this.selectedWords = new Set(validWords);
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (element) {
        const isSelected = this.selectedWords.has(word);
        element.classList.toggle(CONFIG.CSS_CLASSES.WORD_HIDDEN, !isSelected);
        element.setAttribute('aria-checked', isSelected.toString());
      }
    });
    
    this.updateCounter();
    this.playWordSound();
  }
  
  dispatchWordToggleEvent(word, selected) {
    document.dispatchEvent(new CustomEvent(CONFIG.EVENTS.WORD_TOGGLED, {
      detail: {
        word,
        selected,
        totalSelected: this.selectedWords.size,
        totalWords: this.words.length,
        timestamp: Date.now()
      }
    }));
  }
  
  validate() {
    const issues = [];
    const warnings = [];
    
    if (!this.wordListElement) issues.push('Liste de mots manquante');
    if (this.wordElements.length === 0) issues.push('Aucun élément de mot trouvé');
    if (!this.counterElement) warnings.push('Compteur de mots manquant');
    if (this.words.length !== this.wordElements.length) {
      issues.push('Incohérence entre mots configurés et éléments DOM');
    }
    if (this.selectedWords.size === 0) issues.push('Aucun mot sélectionné');
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      elementsChecked: {
        wordListElement: !!this.wordListElement,
        counterElement: !!this.counterElement,
        wordElements: this.wordElements.length,
        audioManager: !!this.audioManager
      }
    };
  }
  
  getDebugInfo() {
    return {
      totalWords: this.words.length,
      selectedWords: this.selectedWords.size,
      selectedWordsList: Array.from(this.selectedWords),
      wordElements: this.wordElements.length,
      elements: {
        wordListElement: !!this.wordListElement,
        counterElement: !!this.counterElement,
        audioManager: !!this.audioManager
      },
      audioInfo: this.audioManager ? {
        isReady: this.audioManager.isReady(),
        soundEnabled: this.audioManager.isSoundEnabled()
      } : null,
      validation: this.validate()
    };
  }
  
   cleanup() {
    // ✅ Nettoyage propre et efficace
    this.eventHandlers.forEach((handlers, element) => {
      element.removeEventListener('click', handlers.click);
      element.removeEventListener('keydown', handlers.keydown);
    });
    this.eventHandlers.clear();
    
    document.removeEventListener('keydown', this.globalKeydownHandler);
    document.removeEventListener('ordinationChanged', this.ordinationChangedHandler);
    
    this.selectedWords.clear();
    this.wordElements = [];
    this.wordListElement = null;
    this.counterElement = null;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Nettoyage effectué');
    }
  }
}

export default WordManager;
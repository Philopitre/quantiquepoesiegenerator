/**
 * Gestionnaire de sélection des mots (VERSION AUDIO CORRIGÉE)
 * Gère l'affichage, la sélection et la validation des mots disponibles
 * @module WordManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer la sélection des mots
 */
export class WordManager {
  
  /**
   * Initialise le gestionnaire de mots
   * @param {AudioManager} audioManager - Instance du gestionnaire audio
   */
  constructor(audioManager) {
    if (!audioManager) {
      throw new Error('WordManager: AudioManager requis');
    }
    
    this.audioManager = audioManager;
    this.words = [...CONFIG.WORDS];
    this.selectedWords = new Set();
    this.wordElements = [];
    this.wordListElement = null;
    this.counterElement = null;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager initialized with', this.words.length, 'words');
    }
  }
  
  /**
   * Initialise le gestionnaire
   * @private
   */
  init() {
    this.setupDOMReferences();
    this.setupEventListeners();
    this.selectAllWords();
    this.updateCounter();
    this.validateWords();
    
    // Écouter les changements d'ordination pour réinitialiser les listeners
    document.addEventListener('ordinationChanged', () => {
      this.onOrdinationChanged();
    });
  }
  
  /**
   * Appelée quand l'ordination change
   * @private
   */
  onOrdinationChanged() {
    // Rafraîchir les références DOM
    this.wordElements = this.wordListElement.querySelectorAll(CONFIG.SELECTORS.WORD_ELEMENTS);
    
    // Réappliquer les event listeners
    this.attachWordEventListeners();
    
    // Réappliquer l'état de sélection
    this.reapplySelectionState();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Event listeners réinitialisés après changement d\'ordination');
    }
  }
  
  /**
   * Configure les références DOM
   * @private
   */
  setupDOMReferences() {
    this.wordListElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_LIST);
    this.counterElement = document.getElementById(CONFIG.DOM_ELEMENTS.SELECTED_WORDS_COUNTER);
    
    if (!this.wordListElement) {
      console.error('WordManager: Liste de mots non trouvée');
      return;
    }
    
    // Récupérer tous les éléments de mots
    this.wordElements = this.wordListElement.querySelectorAll(CONFIG.SELECTORS.WORD_ELEMENTS);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Références DOM configurées:', {
        wordListElement: !!this.wordListElement,
        counterElement: !!this.counterElement,
        wordElements: this.wordElements.length
      });
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    // Event listeners pour chaque mot
    this.attachWordEventListeners();
    
    // Event listeners pour les raccourcis clavier globaux
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
  }
  
  /**
   * Attache les event listeners aux éléments de mots
   * @private
   */
  attachWordEventListeners() {
    this.wordElements.forEach(element => {
      // Cloner l'élément pour supprimer les anciens listeners
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      
      // Ajouter les nouveaux listeners
      newElement.addEventListener('click', (e) => this.handleWordClick(e));
      newElement.addEventListener('keydown', (e) => this.handleWordKeydown(e));
      
      // Rendre focusable pour l'accessibilité
      newElement.setAttribute('tabindex', '0');
      newElement.setAttribute('role', 'checkbox');
      
      // Appliquer l'état de sélection actuel
      const word = newElement.getAttribute('data-word');
      if (this.selectedWords.has(word)) {
        newElement.setAttribute('aria-checked', 'true');
        newElement.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
      } else {
        newElement.setAttribute('aria-checked', 'false');
        newElement.classList.add(CONFIG.CSS_CLASSES.WORD_HIDDEN);
      }
    });
    
    // Mettre à jour la référence wordElements
    this.wordElements = this.wordListElement.querySelectorAll(CONFIG.SELECTORS.WORD_ELEMENTS);
  }
  
  /**
   * Réapplique l'état de sélection après un changement d'ordination
   * @private
   */
  reapplySelectionState() {
    this.wordElements.forEach(element => {
      const word = element.getAttribute('data-word');
      if (this.selectedWords.has(word)) {
        element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'true');
      } else {
        element.classList.add(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'false');
      }
    });
    
    this.updateCounter();
  }
  
  /**
   * Valide les mots configurés
   * @private
   */
  validateWords() {
    const issues = [];
    
    // Vérifier que tous les mots de la config sont présents dans le DOM
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (!element) {
        issues.push(`Mot "${word}" manquant dans le DOM`);
      }
    });
    
    // Vérifier que tous les éléments DOM ont un mot correspondant
    this.wordElements.forEach(element => {
      const word = element.getAttribute('data-word');
      if (!word || !this.words.includes(word)) {
        issues.push(`Élément DOM sans mot correspondant: "${word}"`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('WordManager: Problèmes de validation:', issues);
    }
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Validation terminée:', { issues: issues.length, words: this.words.length });
    }
  }
  
  /**
   * Gère le clic sur un mot
   * @param {Event} event - Événement de clic
   * @private
   */
  handleWordClick(event) {
    event.preventDefault();
    
    const word = event.target.getAttribute('data-word');
    if (!word) {
      console.error('WordManager: Mot non trouvé pour l\'élément cliqué');
      return;
    }
    
    this.toggleWord(word);
    this.playWordSound();
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('WordManager: Clic sur mot:', word);
    }
  }
  
  /**
   * Gère les événements clavier sur les mots
   * @param {Event} event - Événement clavier
   * @private
   */
  handleWordKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleWordClick(event);
    }
  }
  
  /**
   * Gère les raccourcis clavier globaux
   * @param {Event} event - Événement clavier
   * @private
   */
  handleGlobalKeydown(event) {
    // Ignorer si dans un champ de saisie
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Raccourcis pour la sélection de mots
    if (event.key === 'a' && event.ctrlKey) {
      event.preventDefault();
      this.selectAllWords();
    } else if (event.key === 'd' && event.ctrlKey) {
      event.preventDefault();
      this.deselectAllWords();
    }
  }
  
  /**
   * Bascule l'état d'un mot (sélectionné/non sélectionné)
   * @param {string} word - Mot à basculer
   */
  toggleWord(word) {
    if (!this.words.includes(word)) {
      console.error('WordManager: Mot non valide:', word);
      return;
    }
    
    const element = this.getWordElement(word);
    if (!element) {
      console.error('WordManager: Élément non trouvé pour le mot:', word);
      return;
    }
    
    // Empêcher la déselection si c'est le dernier mot
    if (this.selectedWords.has(word) && this.selectedWords.size === 1) {
      NotificationManager.warning('Au moins un mot doit rester sélectionné');
      return;
    }
    
    // Basculer l'état
    if (this.selectedWords.has(word)) {
      this.selectedWords.delete(word);
      this.updateWordAppearance(element, false);
    } else {
      this.selectedWords.add(word);
      this.updateWordAppearance(element, true);
    }
    
    this.updateCounter();
    this.dispatchWordToggleEvent(word, this.selectedWords.has(word));
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('WordManager: Mot basculé:', { word, selected: this.selectedWords.has(word) });
    }
  }
  
  /**
   * Met à jour l'apparence visuelle d'un mot
   * @param {HTMLElement} element - Élément du mot
   * @param {boolean} selected - État de sélection
   * @private
   */
  updateWordAppearance(element, selected) {
    // Ajouter une classe d'animation temporaire
    element.classList.add(CONFIG.CSS_CLASSES.WORD_TOGGLING);
    
    setTimeout(() => {
      element.classList.remove(CONFIG.CSS_CLASSES.WORD_TOGGLING);
      
      if (selected) {
        element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'true');
      } else {
        element.classList.add(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'false');
      }
    }, CONFIG.WORD_TOGGLE_DURATION);
  }
  
  /**
   * Sélectionne tous les mots
   */
  selectAllWords() {
    this.selectedWords.clear();
    
    this.words.forEach(word => {
      this.selectedWords.add(word);
      const element = this.getWordElement(word);
      if (element) {
        element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'true');
      }
    });
    
    this.updateCounter();
    this.playWordSound();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Tous les mots sélectionnés');
    }
  }
  
  /**
   * Remet tous les mots à l'état sélectionné
   */
  resetAllWords() {
    // Animation séquencée pour un effet visuel
    let delay = 0;
    
    this.words.forEach(word => {
      const element = this.getWordElement(word);
      if (element) {
        setTimeout(() => {
          element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
          element.setAttribute('aria-checked', 'true');
          this.selectedWords.add(word);
          
          // Effet visuel temporaire
          element.classList.add(CONFIG.CSS_CLASSES.WORD_TOGGLING);
          setTimeout(() => {
            element.classList.remove(CONFIG.CSS_CLASSES.WORD_TOGGLING);
          }, CONFIG.WORD_TOGGLE_DURATION);
        }, delay);
        
        delay += CONFIG.WORD_RESET_STAGGER;
      }
    });
    
    // Mettre à jour le compteur après toutes les animations
    setTimeout(() => {
      this.updateCounter();
    }, delay);
    
    this.playWordSound();
    NotificationManager.success(CONFIG.MESSAGES.ALL_WORDS_RESET);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Réinitialisation de tous les mots');
    }
  }
  
  /**
   * Met à jour le compteur de mots sélectionnés
   * @private
   */
  updateCounter() {
    if (this.counterElement) {
      this.counterElement.textContent = this.selectedWords.size;
    }
    
    // Mettre à jour l'accessibilité
    if (this.wordListElement) {
      this.wordListElement.setAttribute('aria-label', 
        `${this.selectedWords.size} mots sélectionnés sur ${this.words.length}`);
    }
  }
  
  /**
   * Joue le son d'interaction avec les mots (CORRIGÉ)
   * @private
   */
  playWordSound() {
    if (this.audioManager && this.audioManager.isSoundEnabled()) {
      try {
        this.audioManager.playSound({
          volume: 0.3,
          playbackRate: 1.2
        });
      } catch (error) {
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
          console.warn('WordManager: Erreur lors de la lecture du son:', error);
        }
      }
    }
  }
  
  /**
   * Récupère l'élément DOM d'un mot
   * @param {string} word - Mot à chercher
   * @returns {HTMLElement|null} Élément du mot
   * @private
   */
  getWordElement(word) {
    return this.wordListElement.querySelector(`[data-word="${word}"]`);
  }
  
  /**
   * Retourne tous les mots disponibles
   * @returns {string[]} Liste des mots
   */
  getAllWords() {
    return [...this.words];
  }
  
  /**
   * Retourne les mots sélectionnés
   * @returns {string[]} Liste des mots sélectionnés
   */
  getSelectedWords() {
    return Array.from(this.selectedWords);
  }
  
  /**
   * Retourne le nombre de mots sélectionnés
   * @returns {number} Nombre de mots sélectionnés
   */
  getSelectedWordsCount() {
    return this.selectedWords.size;
  }
  
  /**
   * Vérifie si un mot est sélectionné
   * @param {string} word - Mot à vérifier
   * @returns {boolean} État de sélection
   */
  isWordSelected(word) {
    return this.selectedWords.has(word);
  }
  
  /**
   * Sélectionne des mots spécifiques
   * @param {string[]} words - Mots à sélectionner
   */
  selectWords(words) {
    if (!Array.isArray(words)) {
      console.error('WordManager: selectWords attend un tableau');
      return;
    }
    
    // Valider les mots
    const validWords = words.filter(word => this.words.includes(word));
    
    if (validWords.length === 0) {
      NotificationManager.warning('Aucun mot valide à sélectionner');
      return;
    }
    
    // Désélectionner tous les mots
    this.selectedWords.clear();
    
    // Sélectionner les mots spécifiés
    validWords.forEach(word => {
      this.selectedWords.add(word);
      const element = this.getWordElement(word);
      if (element) {
        element.classList.remove(CONFIG.CSS_CLASSES.WORD_HIDDEN);
        element.setAttribute('aria-checked', 'true');
      }
    });
    
    // Masquer les mots non sélectionnés
    this.words.forEach(word => {
      if (!this.selectedWords.has(word)) {
        const element = this.getWordElement(word);
        if (element) {
          element.classList.add(CONFIG.CSS_CLASSES.WORD_HIDDEN);
          element.setAttribute('aria-checked', 'false');
        }
      }
    });
    
    this.updateCounter();
    this.playWordSound();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('WordManager: Mots sélectionnés:', validWords);
    }
  }
  
  /**
   * Émet un événement de basculement de mot
   * @param {string} word - Mot basculé
   * @param {boolean} selected - Nouvel état
   * @private
   */
  dispatchWordToggleEvent(word, selected) {
    const event = new CustomEvent(CONFIG.EVENTS.WORD_TOGGLED, {
      detail: {
        word,
        selected,
        totalSelected: this.selectedWords.size,
        totalWords: this.words.length,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Valide le gestionnaire de mots
   * @returns {Object} Résultat de la validation
   */
  validate() {
    const issues = [];
    const warnings = [];
    
    // Vérifier les éléments DOM
    if (!this.wordListElement) {
      issues.push('Liste de mots manquante');
    }
    
    if (this.wordElements.length === 0) {
      issues.push('Aucun élément de mot trouvé');
    }
    
    if (!this.counterElement) {
      warnings.push('Compteur de mots manquant');
    }
    
    // Vérifier la cohérence des données
    if (this.words.length !== this.wordElements.length) {
      issues.push('Incohérence entre mots configurés et éléments DOM');
    }
    
    if (this.selectedWords.size === 0) {
      issues.push('Aucun mot sélectionné');
    }
    
    // Vérifier l'accessibilité
    this.wordElements.forEach((element, index) => {
      if (!element.hasAttribute('tabindex')) {
        warnings.push(`Élément ${index} sans tabindex`);
      }
      
      if (!element.hasAttribute('aria-checked')) {
        warnings.push(`Élément ${index} sans aria-checked`);
      }
    });
    
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
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
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
  
  /**
   * Nettoie les ressources et event listeners
   */
  cleanup() {
    // Supprimer les event listeners
    this.wordElements.forEach(element => {
      element.removeEventListener('click', () => {});
      element.removeEventListener('keydown', () => {});
    });
    
    document.removeEventListener('keydown', () => {});
    document.removeEventListener('ordinationChanged', () => {});
    
    // Réinitialiser les références
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
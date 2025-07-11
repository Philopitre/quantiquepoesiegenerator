/**
 * Générateur de combinaisons poétiques
 * Gère la génération, l'animation et la validation des combinaisons de mots
 * @module CombinationGenerator
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour générer des combinaisons poétiques avec animation
 */
export class CombinationGenerator {
  
  /**
   * Initialise le générateur de combinaisons
   * @param {WordManager} wordManager - Instance du gestionnaire de mots
   * @param {AudioManager} audioManager - Instance du gestionnaire audio
   */
  constructor(wordManager, audioManager) {
    if (!wordManager) {
      throw new Error('CombinationGenerator: WordManager requis');
    }
    if (!audioManager) {
      throw new Error('CombinationGenerator: AudioManager requis');
    }
    
    this.wordManager = wordManager;
    this.audioManager = audioManager;
    this.ratingManager = null; // Sera défini plus tard
    
    // État de la génération
    this.currentCombination = '';
    this.isCombinationGenerated = false;
    this.isAnimationComplete = false;
    this.isGenerating = false;
    
    // Configuration de l'animation
    this.animationTimeout = null;
    this.currentAnimationFrame = null;
    
    // Historique des générations (pour éviter les répétitions)
    this.recentCombinations = new Set();
    this.maxRecentCombinations = 10;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('CombinationGenerator initialized');
    }
  }
  
  /**
   * Définit le gestionnaire de notation (référence circulaire)
   * @param {RatingManager} ratingManager - Instance du gestionnaire de notation
   */
  setRatingManager(ratingManager) {
    this.ratingManager = ratingManager;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('CombinationGenerator: RatingManager connecté');
    }
  }
  
  /**
   * Génère une nouvelle combinaison
   * @param {boolean} useSelectedOnly - Si true, utilise uniquement les mots sélectionnés
   * @param {Object} options - Options de génération
   * @param {boolean} options.avoidRecent - Éviter les combinaisons récentes
   * @param {number} options.maxAttempts - Nombre maximum de tentatives pour éviter les répétitions
   */
  generate(useSelectedOnly = false, options = {}) {
    const config = {
      avoidRecent: true,
      maxAttempts: 5,
      ...options
    };
    
    if (this.isGenerating) {
      console.warn('CombinationGenerator: Génération déjà en cours');
      return;
    }
    
    const words = useSelectedOnly ? this.wordManager.getSelectedWords() : this.wordManager.getAllWords();
    
    // Validation des mots disponibles
    if (!this.validateWordsForGeneration(words, useSelectedOnly)) {
      return;
    }
    
    try {
      this.isGenerating = true;
      this.resetCombinationState();
      
      // Désactiver le système de notation immédiatement
      if (this.ratingManager) {
        this.ratingManager.disableRating();
      }
      
      // Déterminer le nombre de mots à utiliser
      const wordCount = this.determineWordCount(words, useSelectedOnly);
      
      // Générer la combinaison
      const combination = this.createCombination(words, wordCount, config);
      
      if (!combination) {
        throw new Error('Impossible de générer une combinaison unique');
      }
      
      // Sauvegarder la combinaison courante
      this.currentCombination = combination;
      
      // Démarrer l'animation
      this.animateResult(combination);
      
      // Notification pour les générations avec mots sélectionnés
      if (useSelectedOnly) {
        const message = CONFIG.MESSAGES.SELECTED_WORDS_GENERATION.replace('{count}', words.length);
        NotificationManager.info(message);
      }
      
      // Émettre un événement
      this.dispatchGenerationEvent(combination, useSelectedOnly, words.length);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
        console.log('CombinationGenerator: Combinaison générée:', {
          combination,
          useSelectedOnly,
          wordCount: words.length,
          selectedWords: wordCount
        });
      }
      
    } catch (error) {
      console.error('CombinationGenerator: Erreur lors de la génération:', error);
      NotificationManager.error('Erreur lors de la génération de la combinaison');
      this.isGenerating = false;
    }
  }
  
  /**
   * Valide les mots pour la génération
   * @private
   * @param {string[]} words - Mots disponibles
   * @param {boolean} useSelectedOnly - Mode de sélection
   * @returns {boolean} Validation réussie
   */
  validateWordsForGeneration(words, useSelectedOnly) {
    if (!words || words.length === 0) {
      const message = useSelectedOnly 
        ? CONFIG.MESSAGES.NO_WORDS_SELECTED 
        : CONFIG.MESSAGES.NO_WORDS_AVAILABLE;
      NotificationManager.warning(message);
      return false;
    }
    
    if (words.length === 1 && !useSelectedOnly) {
      NotificationManager.warning('Au moins 2 mots sont nécessaires pour une génération variée');
    }
    
    return true;
  }
  
  /**
   * Détermine le nombre de mots à utiliser dans la combinaison
   * @private
   * @param {string[]} words - Mots disponibles
   * @param {boolean} useSelectedOnly - Mode de sélection
   * @returns {number} Nombre de mots à utiliser
   */
  determineWordCount(words, useSelectedOnly) {
    if (useSelectedOnly) {
      return words.length; // Utiliser tous les mots sélectionnés
    }
    
    const selectElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_COUNT_SELECT);
    if (!selectElement) {
      console.warn('CombinationGenerator: Sélecteur de nombre de mots non trouvé');
      return Math.min(3, words.length); // Valeur par défaut
    }
    
    const selectedValue = selectElement.value;
    
    switch (selectedValue) {
      case 'surprise':
        return Math.floor(Math.random() * words.length) + 1;
      case 'max':
        return words.length;
      default:
        const count = parseInt(selectedValue);
        return isNaN(count) ? 3 : Math.min(count, words.length);
    }
  }
  
  /**
   * Crée une combinaison de mots
   * @private
   * @param {string[]} words - Mots disponibles
   * @param {number} count - Nombre de mots à sélectionner
   * @param {Object} config - Configuration
   * @returns {string|null} Combinaison générée ou null si échec
   */
  createCombination(words, count, config) {
    let attempts = 0;
    let combination = null;
    
    while (attempts < config.maxAttempts && !combination) {
      const selectedWords = this.selectRandomWords(words, count);
      const formattedCombination = this.formatCombination(selectedWords);
      
      // Vérifier si cette combinaison a été récemment générée
      if (!config.avoidRecent || !this.recentCombinations.has(formattedCombination)) {
        combination = formattedCombination;
        break;
      }
      
      attempts++;
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('CombinationGenerator: Tentative', attempts, 'combinaison déjà récente');
      }
    }
    
    // Si on n'arrive pas à éviter les répétitions, prendre la dernière tentative
    if (!combination && attempts >= config.maxAttempts) {
      const selectedWords = this.selectRandomWords(words, count);
      combination = this.formatCombination(selectedWords);
    }
    
    // Ajouter à l'historique des récentes
    if (combination) {
      this.addToRecentCombinations(combination);
    }
    
    return combination;
  }
  
  /**
   * Sélectionne des mots aléatoirement
   * @private
   * @param {string[]} words - Mots disponibles
   * @param {number} count - Nombre de mots à sélectionner
   * @returns {string[]} Mots sélectionnés
   */
  selectRandomWords(words, count) {
    const wordsCopy = [...words];
    const selectedWords = [];
    
    // Sélection aléatoire sans répétition
    for (let i = 0; i < count && wordsCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * wordsCopy.length);
      selectedWords.push(wordsCopy[randomIndex]);
      wordsCopy.splice(randomIndex, 1);
    }
    
    // Mélanger pour un ordre aléatoire
    return this.shuffleArray(selectedWords);
  }
  
  /**
   * Mélange un tableau (algorithme Fisher-Yates)
   * @private
   * @param {Array} array - Tableau à mélanger
   * @returns {Array} Tableau mélangé
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Formate une combinaison de mots avec la capitalisation appropriée
   * @private
   * @param {string[]} words - Mots à formater
   * @returns {string} Combinaison formatée
   */
  formatCombination(words) {
    const formattedWords = words.map((word, index) => {
      if (index === 0) {
        // Premier mot : première lettre en majuscule
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else if (word === "Je") {
        // "Je" en milieu de phrase devient "je"
        return "je";
      } else {
        // Autres mots : conserver la casse originale
        return word;
      }
    });
    
    return formattedWords.join(' ') + '.';
  }
  
  /**
   * Ajoute une combinaison à l'historique des récentes
   * @private
   * @param {string} combination - Combinaison à ajouter
   */
  addToRecentCombinations(combination) {
    this.recentCombinations.add(combination);
    
    // Limiter la taille de l'historique
    if (this.recentCombinations.size > this.maxRecentCombinations) {
      const firstItem = this.recentCombinations.values().next().value;
      this.recentCombinations.delete(firstItem);
    }
  }
  
  /**
   * Anime l'affichage du résultat avec l'effet machine à écrire
   * @private
   * @param {string} text - Texte à animer
   */
  animateResult(text) {
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    
    if (!resultElement) {
      console.error('CombinationGenerator: Élément de résultat non trouvé');
      this.isGenerating = false;
      return;
    }
    
    // Nettoyer l'animation précédente
    this.stopCurrentAnimation();
    
    // Initialiser l'affichage
    resultElement.innerHTML = '';
    resultElement.setAttribute('aria-busy', 'true');
    
    let characterIndex = 0;
    
    // Créer et ajouter le curseur
    const cursor = this.createCursor();
    resultElement.appendChild(cursor);
    
    // Fonction d'animation récursive
    const animateNextCharacter = () => {
      if (characterIndex < text.length) {
        // Ajouter le caractère avant le curseur
        const character = text[characterIndex];
        cursor.insertAdjacentText('beforebegin', character);
        
        // Jouer le son pour les lettres (pas pour les espaces)
        if (character !== ' ') {
          this.audioManager.playSound({
            volume: 0.5,
            playbackRate: 1 + (Math.random() * 0.2 - 0.1) // Légère variation
          });
        }
        
        characterIndex++;
        
        // Programmer la prochaine lettre
        this.animationTimeout = setTimeout(animateNextCharacter, CONFIG.ANIMATION_DELAY);
      } else {
        // Animation terminée
        this.onAnimationComplete(resultElement, cursor);
      }
    };
    
    // Démarrer l'animation
    animateNextCharacter();
  }
  
  /**
   * Crée l'élément curseur pour l'animation
   * @private
   * @returns {HTMLElement} Élément curseur
   */
  createCursor() {
    const cursor = document.createElement('span');
    cursor.className = CONFIG.CSS_CLASSES.CURSOR;
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    return cursor;
  }
  
  /**
   * Appelée quand l'animation est terminée
   * @private
   * @param {HTMLElement} resultElement - Élément de résultat
   * @param {HTMLElement} cursor - Élément curseur
   */
  onAnimationComplete(resultElement, cursor) {
    // Marquer l'animation comme terminée
    cursor.classList.add(CONFIG.CSS_CLASSES.CURSOR_BLINK);
    this.isAnimationComplete = true;
    this.isCombinationGenerated = true;
    this.isGenerating = false;
    
    // Mettre à jour l'accessibilité
    resultElement.setAttribute('aria-busy', 'false');
    resultElement.setAttribute('aria-live', 'polite');
    
    // Activer le système de notation
    if (this.ratingManager) {
      this.ratingManager.enableRating();
    }
    
    // Nettoyer le feedback
    const feedbackElement = document.getElementById(CONFIG.DOM_ELEMENTS.FEEDBACK);
    if (feedbackElement) {
      feedbackElement.textContent = '';
    }
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('CombinationGenerator: Animation terminée');
    }
  }
  
  /**
   * Arrête l'animation en cours
   * @private
   */
  stopCurrentAnimation() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    if (this.currentAnimationFrame) {
      cancelAnimationFrame(this.currentAnimationFrame);
      this.currentAnimationFrame = null;
    }
  }
  
  /**
   * Retourne la combinaison actuelle
   * @returns {string} Combinaison courante
   */
  getCurrentCombination() {
    return this.currentCombination;
  }
  
  /**
   * Vérifie si une combinaison est prête (générée et animation terminée)
   * @returns {boolean} État de préparation
   */
  isCombinationReady() {
    return this.isCombinationGenerated && this.isAnimationComplete;
  }
  
  /**
   * Vérifie si l'animation est terminée
   * @returns {boolean} État de l'animation
   */
  isAnimationFinished() {
    return this.isAnimationComplete;
  }
  
  /**
   * Vérifie si une génération est en cours
   * @returns {boolean} État de génération
   */
  isCurrentlyGenerating() {
    return this.isGenerating;
  }
  
  /**
   * Remet à zéro l'état de la combinaison
   */
  resetCombinationState() {
    this.stopCurrentAnimation();
    this.currentCombination = '';
    this.isCombinationGenerated = false;
    this.isAnimationComplete = false;
    this.isGenerating = false;
    
    // Réinitialiser l'affichage
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    if (resultElement) {
      resultElement.innerHTML = '<span class="cursor">|</span>';
      resultElement.setAttribute('aria-busy', 'false');
    }
  }
  
  /**
   * Émet un événement personnalisé lors de la génération
   * @private
   * @param {string} combination - Combinaison générée
   * @param {boolean} useSelectedOnly - Mode utilisé
   * @param {number} totalWords - Nombre total de mots disponibles
   */
  dispatchGenerationEvent(combination, useSelectedOnly, totalWords) {
    const event = new CustomEvent(CONFIG.EVENTS.COMBINATION_GENERATED, {
      detail: {
        combination,
        useSelectedOnly,
        totalWords,
        timestamp: Date.now(),
        generator: 'CombinationGenerator'
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Valide l'état du générateur
   * @returns {Object} Résultat de la validation
   */
  validate() {
    return {
      isValid: !!this.wordManager && !!this.audioManager,
      currentCombination: this.currentCombination,
      isCombinationGenerated: this.isCombinationGenerated,
      isAnimationComplete: this.isAnimationComplete,
      isGenerating: this.isGenerating,
      managers: {
        wordManager: !!this.wordManager,
        audioManager: !!this.audioManager,
        ratingManager: !!this.ratingManager
      },
      timestamp: Date.now()
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      currentCombination: this.currentCombination,
      isCombinationGenerated: this.isCombinationGenerated,
      isAnimationComplete: this.isAnimationComplete,
      isGenerating: this.isGenerating,
      recentCombinationsCount: this.recentCombinations.size,
      recentCombinations: Array.from(this.recentCombinations),
      managers: {
        wordManager: !!this.wordManager,
        audioManager: !!this.audioManager,
        ratingManager: !!this.ratingManager
      },
      animation: {
        timeoutActive: !!this.animationTimeout,
        frameActive: !!this.currentAnimationFrame
      },
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources
   */
  cleanup() {
    this.stopCurrentAnimation();
    this.recentCombinations.clear();
    this.resetCombinationState();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('CombinationGenerator: Nettoyage effectué');
    }
  }
}

export default CombinationGenerator;
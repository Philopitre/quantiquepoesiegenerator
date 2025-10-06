/**
 * Générateur de combinaisons poétiques (VERSION OPTIMISÉE)
 * Gère la génération, l'animation et la validation des combinaisons de mots
 * @module CombinationGenerator
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class CombinationGenerator {
  constructor(wordManager, audioManager) {
    if (!wordManager) throw new Error('WordManager requis');
    if (!audioManager) throw new Error('AudioManager requis');
    
    this.wordManager = wordManager;
    this.audioManager = audioManager;
    this.ratingManager = null;
    
    this.currentCombination = '';
    this.isCombinationGenerated = false;
    this.isAnimationComplete = false;
    this.isGenerating = false;
    
    this.animationTimeout = null;
    this.recentCombinations = new Set();
    this.maxRecentCombinations = CONFIG.LIMITS.MAX_RECENT_COMBINATIONS;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('CombinationGenerator initialized');
    }
  }
  
  setRatingManager(ratingManager) {
    this.ratingManager = ratingManager;
  }
  
  generate(useSelectedOnly = false, options = {}) {
    const config = { avoidRecent: true, maxAttempts: 5, ...options };
    
    if (this.isGenerating) {
      console.warn('Génération déjà en cours');
      return;
    }
    
    const words = useSelectedOnly ? this.wordManager.getSelectedWords() : this.wordManager.getAllWords();
    
    if (!this.validateWordsForGeneration(words, useSelectedOnly)) return;
    
    try {
      this.isGenerating = true;
      this.resetCombinationState();
      
      if (this.ratingManager) this.ratingManager.disableRating();
      
      const wordCount = this.determineWordCount(words, useSelectedOnly);
      const combination = this.createCombination(words, wordCount, config);
      
      if (!combination) throw new Error('Impossible de générer une combinaison unique');
      
      this.currentCombination = combination;
      this.animateResult(combination);
      
      if (useSelectedOnly) {
        NotificationManager.info(CONFIG.MESSAGES.SELECTED_WORDS_GENERATION.replace('{count}', words.length));
      }
      
      this.dispatchGenerationEvent(combination, useSelectedOnly, words.length);
      
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      NotificationManager.error('Erreur lors de la génération de la combinaison');
      this.isGenerating = false;
    }
  }
  
  validateWordsForGeneration(words, useSelectedOnly) {
    if (!words || words.length === 0) {
      NotificationManager.warning(useSelectedOnly ? CONFIG.MESSAGES.NO_WORDS_SELECTED : CONFIG.MESSAGES.NO_WORDS_AVAILABLE);
      return false;
    }
    
    if (words.length === 1 && !useSelectedOnly) {
      NotificationManager.warning('Au moins 2 mots sont nécessaires pour une génération variée');
    }
    
    return true;
  }
  
  determineWordCount(words, useSelectedOnly) {
    if (useSelectedOnly) return words.length;
    
    const selectElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_COUNT_SELECT);
    if (!selectElement) return Math.min(3, words.length);
    
    const selectedValue = selectElement.value;
    
    switch (selectedValue) {
      case 'surprise': return Math.floor(Math.random() * words.length) + 1;
      case 'max': return words.length;
      default: {
        const count = parseInt(selectedValue);
        return isNaN(count) ? 3 : Math.min(count, words.length);
      }
    }
  }
  
  createCombination(words, count, config) {
    let attempts = 0;
    let combination = null;
    
    while (attempts < config.maxAttempts && !combination) {
      const selectedWords = this.selectRandomWords(words, count);
      const formattedCombination = this.formatCombination(selectedWords);
      
      if (!config.avoidRecent || !this.recentCombinations.has(formattedCombination)) {
        combination = formattedCombination;
        break;
      }
      
      attempts++;
    }
    
    if (!combination && attempts >= config.maxAttempts) {
      const selectedWords = this.selectRandomWords(words, count);
      combination = this.formatCombination(selectedWords);
    }
    
    if (combination) this.addToRecentCombinations(combination);
    
    return combination;
  }
  
  selectRandomWords(words, count) {
    const wordsCopy = [...words];
    const selectedWords = [];
    
    for (let i = 0; i < count && wordsCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * wordsCopy.length);
      selectedWords.push(wordsCopy[randomIndex]);
      wordsCopy.splice(randomIndex, 1);
    }
    
    return this.shuffleArray(selectedWords);
  }
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  formatCombination(words) {
    const formattedWords = words.map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else if (word === "Je") {
        return "je";
      } else {
        return word;
      }
    });
    
    return formattedWords.join(' ') + '.';
  }
  
  addToRecentCombinations(combination) {
    this.recentCombinations.add(combination);
    
    if (this.recentCombinations.size > this.maxRecentCombinations) {
      const firstItem = this.recentCombinations.values().next().value;
      this.recentCombinations.delete(firstItem);
    }
  }
  
  animateResult(text) {
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    
    if (!resultElement) {
      console.error('Élément de résultat non trouvé');
      this.isGenerating = false;
      return;
    }
    
    this.stopCurrentAnimation();
    
    // Vider le contenu texte tout en gardant les nœuds enfants
    while (resultElement.firstChild) {
      resultElement.removeChild(resultElement.firstChild);
    }
    
    resultElement.setAttribute('aria-busy', 'true');
    
    let characterIndex = 0;
    const cursor = this.createCursor();
    resultElement.appendChild(cursor);
    
    const animateNextCharacter = () => {
      if (characterIndex < text.length) {
        const character = text[characterIndex];
        const textNode = document.createTextNode(character);
        cursor.parentNode.insertBefore(textNode, cursor);
        
        if (character !== ' ') {
          this.audioManager.playSound({
            volume: 0.5,
            playbackRate: 1 + (Math.random() * 0.2 - 0.1)
          });
        }
        
        characterIndex++;
        this.animationTimeout = setTimeout(animateNextCharacter, CONFIG.ANIMATION.DELAY);
      } else {
        this.onAnimationComplete(resultElement, cursor);
      }
    };
    
    animateNextCharacter();
  }
  
  createCursor() {
    const cursor = document.createElement('span');
    cursor.className = CONFIG.CSS_CLASSES.CURSOR;
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    return cursor;
  }
  
  onAnimationComplete(resultElement, cursor) {
    cursor.classList.add(CONFIG.CSS_CLASSES.CURSOR_BLINK);
    this.isAnimationComplete = true;
    this.isCombinationGenerated = true;
    this.isGenerating = false;
    
    resultElement.setAttribute('aria-busy', 'false');
    resultElement.setAttribute('aria-live', 'polite');
    
    if (this.ratingManager) this.ratingManager.enableRating();
    
    const feedbackElement = document.getElementById(CONFIG.DOM_ELEMENTS.FEEDBACK);
    if (feedbackElement) feedbackElement.textContent = '';
  }
  
  stopCurrentAnimation() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
  }
  
  getCurrentCombination() {
    return this.currentCombination;
  }
  
  isCombinationReady() {
    return this.isCombinationGenerated && this.isAnimationComplete;
  }
  
  isAnimationFinished() {
    return this.isAnimationComplete;
  }
  
  isCurrentlyGenerating() {
    return this.isGenerating;
  }
  
  resetCombinationState() {
    this.stopCurrentAnimation();
    this.currentCombination = '';
    this.isCombinationGenerated = false;
    this.isAnimationComplete = false;
    this.isGenerating = false;
    
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    if (resultElement) {
      resultElement.innerHTML = '<span class="cursor">|</span>';
      resultElement.setAttribute('aria-busy', 'false');
    }
  }
  
  dispatchGenerationEvent(combination, useSelectedOnly, totalWords) {
    document.dispatchEvent(new CustomEvent(CONFIG.EVENTS.COMBINATION_GENERATED, {
      detail: { combination, useSelectedOnly, totalWords, timestamp: Date.now(), generator: 'CombinationGenerator' }
    }));
  }
  
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
  
  getDebugInfo() {
    return {
      currentCombination: this.currentCombination,
      isCombinationGenerated: this.isCombinationGenerated,
      isAnimationComplete: this.isAnimationComplete,
      isGenerating: this.isGenerating,
      recentCombinationsCount: this.recentCombinations.size,
      managers: {
        wordManager: !!this.wordManager,
        audioManager: !!this.audioManager,
        ratingManager: !!this.ratingManager
      },
      validation: this.validate()
    };
  }
  
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
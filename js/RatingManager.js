/**
 * Gestionnaire du système de notation (VERSION OPTIMISÉE)
 * Gère la notation des combinaisons avec protection contre les notations prématurées
 * @module RatingManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class RatingManager {
  constructor(historyManager) {
    if (!historyManager) throw new Error('HistoryManager requis');
    
    this.historyManager = historyManager;
    this.combinationGenerator = null;
    this.isRatingEnabled = false;
    this.currentRating = null;
    this.ratingInputs = [];
    this.submitButton = null;
    this.feedbackElement = null;
    this.ratingContainer = null;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager initialized');
    }
  }
  
  setCombinationGenerator(combinationGenerator) {
    this.combinationGenerator = combinationGenerator;
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: CombinationGenerator connecté');
    }
  }
  
  init() {
    this.setupDOMReferences();
    this.setupEventListeners();
    this.disableRating();
    this.validateConfiguration();
  }
  
  setupDOMReferences() {
    this.ratingInputs = document.querySelectorAll(CONFIG.DOM_ELEMENTS.RATING_INPUTS);
    this.submitButton = document.getElementById(CONFIG.DOM_ELEMENTS.SUBMIT_RATING);
    this.feedbackElement = document.getElementById(CONFIG.DOM_ELEMENTS.FEEDBACK);
    this.ratingContainer = document.querySelector(CONFIG.DOM_ELEMENTS.RATING_CONTAINER);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Références DOM configurées:', {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement
      });
    }
  }
  
  setupEventListeners() {
    this.ratingInputs.forEach(input => {
      input.addEventListener('change', (e) => this.handleRatingChange(e));
      input.addEventListener('focus', (e) => this.handleRatingFocus(e));
      input.addEventListener('keydown', (e) => this.handleRatingKeydown(e));
    });
    
    document.addEventListener(CONFIG.EVENTS.COMBINATION_GENERATED, () => {
      this.onCombinationGenerated();
    });
  }
  
  validateConfiguration() {
    const expectedInputs = CONFIG.LIMITS.MAX_RATING - CONFIG.LIMITS.MIN_RATING + 1;
    
    if (this.ratingInputs.length !== expectedInputs) {
      console.warn(`Nombre d'inputs incorrect. Attendu: ${expectedInputs}, trouvé: ${this.ratingInputs.length}`);
    }
    
    this.validateAccessibility();
  }
  
  validateAccessibility() {
    this.ratingInputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.hasAttribute('aria-label')) {
        console.warn(`Label ou aria-label manquant pour ${input.id}`);
      }
    });
    
    if (!document.querySelector('[role="radiogroup"]')) {
      console.warn('Attribut role="radiogroup" manquant');
    }
  }
  
  handleRatingChange(event) {
    if (!this.isCombinationReadyForRating()) {
      this.preventRatingAndNotify(event);
      return;
    }
    
    const selectedRating = parseInt(event.target.value);
    
    if (!this.isValidRating(selectedRating)) {
      console.error('Note invalide:', selectedRating);
      event.target.checked = false;
      return;
    }
    
    this.currentRating = selectedRating;
    this.updateFeedback(selectedRating);
    this.updateSubmitButtonState();
    this.dispatchRatingChangeEvent(selectedRating);
  }
  
  isCombinationReadyForRating() {
    return this.combinationGenerator &&
           this.combinationGenerator.isCombinationReady() &&
           this.combinationGenerator.isAnimationFinished() &&
           !this.combinationGenerator.isCurrentlyGenerating();
  }
  
  preventRatingAndNotify(event) {
    event.target.checked = false;
    
    let message;
    if (!this.combinationGenerator) {
      message = "Système de génération non disponible.";
    } else if (this.combinationGenerator.isCurrentlyGenerating()) {
      message = CONFIG.MESSAGES.GENERATION_NOT_COMPLETE;
    } else if (!this.combinationGenerator.isAnimationFinished()) {
      message = CONFIG.MESSAGES.GENERATION_NOT_COMPLETE;
    } else {
      message = "Génère d'abord une combinaison avant de noter !";
    }
    
    NotificationManager.warning(message);
  }
  
  isValidRating(rating) {
    return Number.isInteger(rating) &&
           rating >= CONFIG.LIMITS.MIN_RATING &&
           rating <= CONFIG.LIMITS.MAX_RATING;
  }
  
  updateFeedback(rating) {
    if (!this.feedbackElement) return;
    
    const feedbackText = this.getFeedbackText(rating);
    
    this.feedbackElement.style.opacity = '0';
    
    setTimeout(() => {
      this.feedbackElement.textContent = feedbackText;
      this.feedbackElement.style.opacity = '1';
      this.feedbackElement.classList.add('feedback-updated');
      setTimeout(() => {
        this.feedbackElement.classList.remove('feedback-updated');
      }, 300);
    }, 150);
  }
  
  getFeedbackText(rating) {
    if (rating <= CONFIG.RATING_THRESHOLDS.LOW) {
      return CONFIG.RATING_FEEDBACK.LOW;
    } else if (rating <= CONFIG.RATING_THRESHOLDS.MEDIUM) {
      return CONFIG.RATING_FEEDBACK.MEDIUM;
    } else if (rating <= CONFIG.RATING_THRESHOLDS.HIGH) {
      return CONFIG.RATING_FEEDBACK.HIGH;
    } else {
      return CONFIG.RATING_FEEDBACK.EXCELLENT;
    }
  }
  
  updateSubmitButtonState() {
    if (!this.submitButton) return;
    
    const hasRating = this.currentRating !== null;
    const canSubmit = hasRating && this.isRatingEnabled;
    
    this.submitButton.disabled = !canSubmit;
    this.submitButton.classList.toggle('ready-to-submit', canSubmit);
  }
  
  handleRatingFocus(event) {
    const rating = parseInt(event.target.value);
    if (this.feedbackElement && this.isValidRating(rating)) {
      const previewText = `Aperçu: ${this.getFeedbackText(rating)}`;
      this.feedbackElement.setAttribute('data-preview', previewText);
    }
  }
  
  handleRatingKeydown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.target.checked = true;
        this.handleRatingChange(event);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        this.navigateRating(-1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        this.navigateRating(1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusRating(CONFIG.LIMITS.MIN_RATING);
        break;
      case 'End':
        event.preventDefault();
        this.focusRating(CONFIG.LIMITS.MAX_RATING);
        break;
    }
  }
  
  navigateRating(direction) {
    const currentFocus = document.activeElement;
    const currentValue = parseInt(currentFocus.value);
    if (isNaN(currentValue)) return;
    
    const newValue = currentValue + direction;
    if (newValue >= CONFIG.LIMITS.MIN_RATING && newValue <= CONFIG.LIMITS.MAX_RATING) {
      this.focusRating(newValue);
    }
  }
  
  focusRating(rating) {
    const targetInput = Array.from(this.ratingInputs).find(input => 
      parseInt(input.value) === rating
    );
    if (targetInput) targetInput.focus();
  }
  
  onCombinationGenerated() {
    this.resetRating();
  }
  
  submitRating() {
    if (!this.validateSubmissionConditions()) return;
    
    try {
      const rating = this.getCurrentSelectedRating();
      const combination = this.combinationGenerator.getCurrentCombination();
      
      if (!rating || !combination) {
        throw new Error('Note ou combinaison manquante');
      }
      
      this.updateResultDisplay(combination, rating);
      this.historyManager.addEntry(combination, rating);
      this.disableRating();
      
      NotificationManager.success(CONFIG.MESSAGES.RATING_SUBMITTED);
      this.dispatchRatingSubmittedEvent(combination, rating);
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      NotificationManager.error('Erreur lors de la soumission de la note');
    }
  }
  
  validateSubmissionConditions() {
    if (!this.isCombinationReadyForRating()) {
      NotificationManager.warning(CONFIG.MESSAGES.GENERATION_NOT_FINISHED);
      return false;
    }
    
    const selectedRating = this.getCurrentSelectedRating();
    if (!selectedRating) {
      NotificationManager.warning(CONFIG.MESSAGES.CHOOSE_RATING);
      return false;
    }
    
    if (!this.isRatingEnabled) {
      NotificationManager.warning('Le système de notation n\'est pas activé');
      return false;
    }
    
    return true;
  }
  
  getCurrentSelectedRating() {
    const selectedInput = document.querySelector(CONFIG.DOM_ELEMENTS.RATING_CHECKED);
    return selectedInput ? parseInt(selectedInput.value) : null;
  }
  /**
 * Met à jour l'affichage du résultat avec la note
 * La note doit apparaître CENTRÉE SOUS le texte de la combinaison
 */
/**
 * Met à jour l'affichage du résultat avec la note
 * La note doit apparaître CENTRÉE SOUS le texte de la combinaison
 * avec un espacement important (plusieurs lignes)
 */
updateResultDisplay(combination, rating) {
  const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
  if (!resultElement) return;
  
  const cleanCombination = combination.replace(/\s*\(Note\s*:\s*\d+\/10\)\s*$/i, '').trim();
  
  // ✅ SOLUTION : Utiliser un conteneur avec display: flex et column-gap
  resultElement.innerHTML = `
    <div class="result-content">
      <div class="result-text">${cleanCombination}</div>
      <div class="result-rating new">${rating}/10</div>
    </div>
  `;
  
  resultElement.classList.add('rated');
  
  setTimeout(() => {
    resultElement.classList.remove('rated');
    const ratingDiv = resultElement.querySelector('.result-rating');
    if (ratingDiv) {
      ratingDiv.classList.remove('new');
    }
  }, 1000);
  
  if (CONFIG.DEBUG.ENABLED) {
    console.log('✅ Affichage mis à jour:', {
      combinaison: cleanCombination,
      note: rating,
      structure: 'vertical avec flexbox'
    });
  }
}
  
  enableRating() {
    this.isRatingEnabled = true;
    this.ratingInputs.forEach(input => input.disabled = false);
    this.updateSubmitButtonState();
    this.updateRatingContainerAppearance();
    this.updateRatingAccessibility(true);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Notation activée');
    }
  }
  
  disableRating() {
    this.isRatingEnabled = false;
    this.ratingInputs.forEach(input => {
      input.disabled = true;
      input.checked = false;
    });
    
    if (this.submitButton) this.submitButton.disabled = true;
    this.currentRating = null;
    if (this.feedbackElement) this.feedbackElement.textContent = '';
    
    this.updateRatingContainerAppearance();
    this.updateRatingAccessibility(false);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Notation désactivée');
    }
  }
  
  updateRatingContainerAppearance() {
    if (!this.ratingContainer) return;
    
    if (this.isRatingEnabled) {
      this.ratingContainer.style.opacity = '1';
      this.ratingContainer.classList.remove('rating-disabled');
      this.ratingContainer.classList.add('rating-enabled');
    } else {
      this.ratingContainer.style.opacity = '0.5';
      this.ratingContainer.classList.remove('rating-enabled');
      this.ratingContainer.classList.add('rating-disabled');
    }
  }
  
  updateRatingAccessibility(enabled) {
    const ratingGroup = document.querySelector('[role="radiogroup"]');
    
    if (ratingGroup) {
      ratingGroup.setAttribute('aria-disabled', (!enabled).toString());
      ratingGroup.setAttribute('aria-label', 
        enabled ? 'Noter la combinaison de 1 à 10' : 'Notation désactivée - générez d\'abord une combinaison'
      );
    }
  }
  
  resetRating() {
    this.currentRating = null;
    this.ratingInputs.forEach(input => input.checked = false);
    if (this.feedbackElement) {
      this.feedbackElement.textContent = '';
      this.feedbackElement.removeAttribute('data-preview');
    }
    this.updateSubmitButtonState();
  }
  
  dispatchRatingChangeEvent(rating) {
    document.dispatchEvent(new CustomEvent('ratingChanged', {
      detail: {
        rating,
        isValid: this.isValidRating(rating),
        timestamp: Date.now(),
        feedbackText: this.getFeedbackText(rating)
      }
    }));
  }
  
  dispatchRatingSubmittedEvent(combination, rating) {
    document.dispatchEvent(new CustomEvent(CONFIG.EVENTS.COMBINATION_RATED, {
      detail: {
        combination,
        rating,
        timestamp: Date.now(),
        historyLength: this.historyManager ? this.historyManager.history?.length : 0
      }
    }));
  }
  
  validate() {
    const issues = [];
    const warnings = [];
    
    if (this.ratingInputs.length === 0) issues.push('Aucun input de notation trouvé');
    if (!this.submitButton) issues.push('Bouton de soumission manquant');
    if (!this.feedbackElement) warnings.push('Élément de feedback manquant');
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      elementsChecked: {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement
      }
    };
  }
  
  getDebugInfo() {
    return {
      isRatingEnabled: this.isRatingEnabled,
      currentRating: this.currentRating,
      hasValidCombination: this.isCombinationReadyForRating(),
      elements: {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement
      },
      validation: this.validate()
    };
  }
  
  cleanup() {
    this.ratingInputs.forEach(input => {
      input.removeEventListener('change', () => {});
      input.removeEventListener('focus', () => {});
      input.removeEventListener('keydown', () => {});
    });
    
    this.disableRating();
    this.currentRating = null;
    this.ratingInputs = [];
    this.submitButton = null;
    this.feedbackElement = null;
    this.ratingContainer = null;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Nettoyage effectué');
    }
  }
}

export default RatingManager;
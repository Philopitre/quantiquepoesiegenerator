/**
 * Gestionnaire du système de notation
 * Gère la notation des combinaisons avec protection contre les notations prématurées
 * @module RatingManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer le système de notation des combinaisons
 */
export class RatingManager {
  
  /**
   * Initialise le gestionnaire de notation
   * @param {HistoryManager} historyManager - Instance du gestionnaire d'historique
   */
  constructor(historyManager) {
    if (!historyManager) {
      throw new Error('RatingManager: HistoryManager requis');
    }
    
    this.historyManager = historyManager;
    this.combinationGenerator = null; // Sera défini plus tard via setCombinationGenerator
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
  
  /**
   * Définit la référence au générateur de combinaisons (référence circulaire)
   * @param {CombinationGenerator} combinationGenerator - Instance du générateur
   */
  setCombinationGenerator(combinationGenerator) {
    this.combinationGenerator = combinationGenerator;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: CombinationGenerator connecté');
    }
  }
  
  /**
   * Initialise le gestionnaire
   * @private
   */
  init() {
    this.setupDOMReferences();
    this.setupEventListeners();
    this.disableRating();
    this.validateConfiguration();
  }
  
  /**
   * Configure les références DOM
   * @private
   */
  setupDOMReferences() {
    // Inputs de notation
    this.ratingInputs = document.querySelectorAll(CONFIG.DOM_ELEMENTS.RATING_INPUTS);
    
    // Bouton de soumission
    this.submitButton = document.getElementById(CONFIG.DOM_ELEMENTS.SUBMIT_RATING);
    
    // Élément de feedback
    this.feedbackElement = document.getElementById(CONFIG.DOM_ELEMENTS.FEEDBACK);
    
    // Conteneur de notation
    this.ratingContainer = document.querySelector(CONFIG.DOM_ELEMENTS.RATING_CONTAINER);
    
    // Validation des éléments essentiels
    if (this.ratingInputs.length === 0) {
      console.warn('RatingManager: Aucun input de notation trouvé');
    }
    
    if (!this.submitButton) {
      console.warn('RatingManager: Bouton de soumission non trouvé');
    }
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Références DOM configurées:', {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement,
        ratingContainer: !!this.ratingContainer
      });
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    // Event listeners pour les inputs de notation
    this.ratingInputs.forEach(input => {
      input.addEventListener('change', (e) => this.handleRatingChange(e));
      input.addEventListener('focus', (e) => this.handleRatingFocus(e));
      input.addEventListener('keydown', (e) => this.handleRatingKeydown(e));
    });
    
    // Écouter les événements de génération de combinaison
    document.addEventListener(CONFIG.EVENTS.COMBINATION_GENERATED, () => {
      this.onCombinationGenerated();
    });
  }
  
  /**
   * Valide la configuration du système de notation
   * @private
   */
  validateConfiguration() {
    // Vérifier que le nombre d'inputs correspond à la plage de notation
    const expectedInputs = CONFIG.LIMITS.MAX_RATING - CONFIG.LIMITS.MIN_RATING + 1;
    
    if (this.ratingInputs.length !== expectedInputs) {
      console.warn(`RatingManager: Nombre d'inputs incorrect. Attendu: ${expectedInputs}, trouvé: ${this.ratingInputs.length}`);
    }
    
    // Vérifier les valeurs des inputs
    this.ratingInputs.forEach(input => {
      const value = parseInt(input.value);
      if (isNaN(value) || value < CONFIG.LIMITS.MIN_RATING || value > CONFIG.LIMITS.MAX_RATING) {
        console.warn(`RatingManager: Valeur d'input invalide: ${input.value}`);
      }
    });
    
    // Vérifier l'accessibilité
    this.validateAccessibility();
  }
  
  /**
   * Valide l'accessibilité du système de notation
   * @private
   */
  validateAccessibility() {
    // Vérifier les attributs ARIA
    this.ratingInputs.forEach((input, index) => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      
      if (!label) {
        console.warn(`RatingManager: Label manquant pour l'input ${input.id}`);
      }
      
      if (!input.hasAttribute('aria-label') && !label) {
        console.warn(`RatingManager: Attribut aria-label manquant pour l'input ${input.id}`);
      }
    });
    
    // Vérifier le groupe radio
    const ratingGroup = document.querySelector('[role="radiogroup"]');
    if (!ratingGroup) {
      console.warn('RatingManager: Attribut role="radiogroup" manquant');
    }
  }
  
  /**
   * Gère le changement de notation
   * @param {Event} event - Événement de changement
   * @private
   */
  handleRatingChange(event) {
    // Vérification critique : combinaison prête ET animation terminée
    if (!this.isCombinationReadyForRating()) {
      this.preventRatingAndNotify(event);
      return;
    }
    
    const selectedRating = parseInt(event.target.value);
    
    // Validation de la valeur
    if (!this.isValidRating(selectedRating)) {
      console.error('RatingManager: Note invalide:', selectedRating);
      event.target.checked = false;
      return;
    }
    
    this.currentRating = selectedRating;
    this.updateFeedback(selectedRating);
    this.updateSubmitButtonState();
    
    // Émettre un événement personnalisé
    this.dispatchRatingChangeEvent(selectedRating);
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('RatingManager: Note sélectionnée:', selectedRating);
    }
  }
  
  /**
   * Vérifie si une combinaison est prête pour la notation
   * @returns {boolean} État de préparation
   * @private
   */
  isCombinationReadyForRating() {
    return this.combinationGenerator &&
           this.combinationGenerator.isCombinationReady() &&
           this.combinationGenerator.isAnimationFinished() &&
           !this.combinationGenerator.isCurrentlyGenerating();
  }
  
  /**
   * Empêche la notation et notifie l'utilisateur
   * @param {Event} event - Événement à annuler
   * @private
   */
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
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Notation empêchée:', {
        hasGenerator: !!this.combinationGenerator,
        isGenerating: this.combinationGenerator?.isCurrentlyGenerating(),
        isReady: this.combinationGenerator?.isCombinationReady(),
        isAnimationFinished: this.combinationGenerator?.isAnimationFinished()
      });
    }
  }
  
  /**
   * Valide une note
   * @param {number} rating - Note à valider
   * @returns {boolean} Validité de la note
   * @private
   */
  isValidRating(rating) {
    return Number.isInteger(rating) &&
           rating >= CONFIG.LIMITS.MIN_RATING &&
           rating <= CONFIG.LIMITS.MAX_RATING;
  }
  
  /**
   * Met à jour le feedback selon la note
   * @param {number} rating - Note sélectionnée
   * @private
   */
  updateFeedback(rating) {
    if (!this.feedbackElement) return;
    
    const feedbackText = this.getFeedbackText(rating);
    
    // Animation du changement de feedback
    this.feedbackElement.style.opacity = '0';
    
    setTimeout(() => {
      this.feedbackElement.textContent = feedbackText;
      this.feedbackElement.style.opacity = '1';
      
      // Ajouter une classe CSS pour l'animation
      this.feedbackElement.classList.add('feedback-updated');
      setTimeout(() => {
        this.feedbackElement.classList.remove('feedback-updated');
      }, 300);
    }, 150);
  }
  
  /**
   * Retourne le texte de feedback approprié
   * @param {number} rating - Note donnée
   * @returns {string} Texte de feedback
   * @private
   */
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
  
  /**
   * Met à jour l'état du bouton de soumission
   * @private
   */
  updateSubmitButtonState() {
    if (!this.submitButton) return;
    
    const hasRating = this.currentRating !== null;
    const canSubmit = hasRating && this.isRatingEnabled;
    
    this.submitButton.disabled = !canSubmit;
    
    if (canSubmit) {
      this.submitButton.classList.add('ready-to-submit');
    } else {
      this.submitButton.classList.remove('ready-to-submit');
    }
  }
  
  /**
   * Gère le focus sur un input de notation
   * @param {Event} event - Événement de focus
   * @private
   */
  handleRatingFocus(event) {
    const rating = parseInt(event.target.value);
    
    // Prévisualisation du feedback au focus
    if (this.feedbackElement && this.isValidRating(rating)) {
      const previewText = `Aperçu: ${this.getFeedbackText(rating)}`;
      this.feedbackElement.setAttribute('data-preview', previewText);
    }
  }
  
  /**
   * Gère les événements clavier sur les inputs de notation
   * @param {Event} event - Événement clavier
   * @private
   */
  handleRatingKeydown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        // Sélectionner la note
        event.target.checked = true;
        this.handleRatingChange(event);
        break;
        
      case 'ArrowLeft':
      case 'ArrowDown':
        // Note précédente
        event.preventDefault();
        this.navigateRating(-1);
        break;
        
      case 'ArrowRight':
      case 'ArrowUp':
        // Note suivante
        event.preventDefault();
        this.navigateRating(1);
        break;
        
      case 'Home':
        // Première note
        event.preventDefault();
        this.focusRating(CONFIG.LIMITS.MIN_RATING);
        break;
        
      case 'End':
        // Dernière note
        event.preventDefault();
        this.focusRating(CONFIG.LIMITS.MAX_RATING);
        break;
    }
  }
  
  /**
   * Navigue entre les options de notation
   * @param {number} direction - Direction de navigation (-1 ou 1)
   * @private
   */
  navigateRating(direction) {
    const currentFocus = document.activeElement;
    const currentValue = parseInt(currentFocus.value);
    
    if (isNaN(currentValue)) return;
    
    const newValue = currentValue + direction;
    
    if (newValue >= CONFIG.LIMITS.MIN_RATING && newValue <= CONFIG.LIMITS.MAX_RATING) {
      this.focusRating(newValue);
    }
  }
  
  /**
   * Met le focus sur une note spécifique
   * @param {number} rating - Note à cibler
   * @private
   */
  focusRating(rating) {
    const targetInput = Array.from(this.ratingInputs).find(input => 
      parseInt(input.value) === rating
    );
    
    if (targetInput) {
      targetInput.focus();
    }
  }
  
  /**
   * Appelée lors de la génération d'une nouvelle combinaison
   * @private
   */
  onCombinationGenerated() {
    // La notation sera activée automatiquement par le CombinationGenerator
    // une fois l'animation terminée
    this.resetRating();
  }
  
  /**
   * Soumet la notation
   */
  submitRating() {
    // Double vérification avant soumission
    if (!this.validateSubmissionConditions()) {
      return;
    }
    
    try {
      const rating = this.getCurrentSelectedRating();
      const combination = this.combinationGenerator.getCurrentCombination();
      
      if (!rating || !combination) {
        throw new Error('Note ou combinaison manquante');
      }
      
      // Mettre à jour l'affichage du résultat
      this.updateResultDisplay(combination, rating);
      
      // Sauvegarder dans l'historique
      this.historyManager.addEntry(combination, rating);
      
      // Désactiver le système de notation
      this.disableRating();
      
      // Notification de succès
      NotificationManager.success(CONFIG.MESSAGES.RATING_SUBMITTED);
      
      // Émettre un événement personnalisé
      this.dispatchRatingSubmittedEvent(combination, rating);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
        console.log('RatingManager: Note soumise:', { combination, rating });
      }
      
    } catch (error) {
      console.error('RatingManager: Erreur lors de la soumission:', error);
      NotificationManager.error('Erreur lors de la soumission de la note');
    }
  }
  
  /**
   * Valide les conditions de soumission
   * @returns {boolean} Conditions validées
   * @private
   */
  validateSubmissionConditions() {
    // Vérifier que la combinaison est prête
    if (!this.isCombinationReadyForRating()) {
      NotificationManager.warning(CONFIG.MESSAGES.GENERATION_NOT_FINISHED);
      return false;
    }
    
    // Vérifier qu'une note est sélectionnée
    const selectedRating = this.getCurrentSelectedRating();
    if (!selectedRating) {
      NotificationManager.warning(CONFIG.MESSAGES.CHOOSE_RATING);
      return false;
    }
    
    // Vérifier que le système de notation est activé
    if (!this.isRatingEnabled) {
      NotificationManager.warning('Le système de notation n\'est pas activé');
      return false;
    }
    
    return true;
  }
  
  /**
   * Récupère la note actuellement sélectionnée
   * @returns {number|null} Note sélectionnée
   * @private
   */
  getCurrentSelectedRating() {
    const selectedInput = document.querySelector(CONFIG.DOM_ELEMENTS.RATING_CHECKED);
    return selectedInput ? parseInt(selectedInput.value) : null;
  }
  
  /**
   * Met à jour l'affichage du résultat avec la note
   * @param {string} combination - Combinaison notée
   * @param {number} rating - Note attribuée
   * @private
   */
  updateResultDisplay(combination, rating) {
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    if (resultElement) {
      const ratedText = `${combination} (Note : ${rating}/10)`;
      resultElement.textContent = ratedText;
      
      // Ajouter une classe pour l'animation
      resultElement.classList.add('rated');
      setTimeout(() => {
        resultElement.classList.remove('rated');
      }, 1000);
    }
  }
  
  /**
   * Active le système de notation
   */
  enableRating() {
    this.isRatingEnabled = true;
    
    // Activer les inputs
    this.ratingInputs.forEach(input => {
      input.disabled = false;
    });
    
    // Activer le bouton de soumission si une note est sélectionnée
    this.updateSubmitButtonState();
    
    // Mettre à jour l'apparence du conteneur
    this.updateRatingContainerAppearance();
    
    // Mettre à jour l'accessibilité
    this.updateRatingAccessibility(true);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Notation activée');
    }
  }
  
  /**
   * Désactive le système de notation
   */
  disableRating() {
    this.isRatingEnabled = false;
    
    // Désactiver les inputs
    this.ratingInputs.forEach(input => {
      input.disabled = true;
      input.checked = false;
    });
    
    // Désactiver le bouton de soumission
    if (this.submitButton) {
      this.submitButton.disabled = true;
    }
    
    // Réinitialiser l'état
    this.currentRating = null;
    
    // Nettoyer le feedback
    if (this.feedbackElement) {
      this.feedbackElement.textContent = '';
    }
    
    // Mettre à jour l'apparence du conteneur
    this.updateRatingContainerAppearance();
    
    // Mettre à jour l'accessibilité
    this.updateRatingAccessibility(false);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('RatingManager: Notation désactivée');
    }
  }
  
  /**
   * Met à jour l'apparence du conteneur de notation
   * @private
   */
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
  
  /**
   * Met à jour l'accessibilité du système de notation
   * @param {boolean} enabled - État d'activation
   * @private
   */
  updateRatingAccessibility(enabled) {
    const ratingGroup = document.querySelector('[role="radiogroup"]');
    
    if (ratingGroup) {
      ratingGroup.setAttribute('aria-disabled', (!enabled).toString());
      
      if (enabled) {
        ratingGroup.setAttribute('aria-label', 'Noter la combinaison de 1 à 10');
      } else {
        ratingGroup.setAttribute('aria-label', 'Notation désactivée - générez d\'abord une combinaison');
      }
    }
    
    // Mettre à jour les labels individuels
    this.ratingInputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label && !enabled) {
        label.setAttribute('aria-label', `Note ${input.value} - non disponible`);
      } else if (label && enabled) {
        label.setAttribute('aria-label', `Donner la note ${input.value}`);
      }
    });
  }
  
  /**
   * Réinitialise l'état de notation
   * @private
   */
  resetRating() {
    this.currentRating = null;
    
    // Décocher tous les inputs
    this.ratingInputs.forEach(input => {
      input.checked = false;
    });
    
    // Nettoyer le feedback
    if (this.feedbackElement) {
      this.feedbackElement.textContent = '';
      this.feedbackElement.removeAttribute('data-preview');
    }
    
    // Mettre à jour le bouton de soumission
    this.updateSubmitButtonState();
  }
  
  /**
   * Émet un événement de changement de notation
   * @param {number} rating - Nouvelle note
   * @private
   */
  dispatchRatingChangeEvent(rating) {
    const event = new CustomEvent('ratingChanged', {
      detail: {
        rating,
        isValid: this.isValidRating(rating),
        timestamp: Date.now(),
        feedbackText: this.getFeedbackText(rating)
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Émet un événement de soumission de notation
   * @param {string} combination - Combinaison notée
   * @param {number} rating - Note soumise
   * @private
   */
  dispatchRatingSubmittedEvent(combination, rating) {
    const event = new CustomEvent(CONFIG.EVENTS.COMBINATION_RATED, {
      detail: {
        combination,
        rating,
        timestamp: Date.now(),
        historyLength: this.historyManager ? this.historyManager.history?.length : 0
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Valide le système de notation
   * @returns {Object} Résultat de la validation
   */
  validate() {
    const issues = [];
    const warnings = [];
    
    // Vérifier les éléments DOM
    if (this.ratingInputs.length === 0) {
      issues.push('Aucun input de notation trouvé');
    }
    
    if (!this.submitButton) {
      issues.push('Bouton de soumission manquant');
    }
    
    if (!this.feedbackElement) {
      warnings.push('Élément de feedback manquant');
    }
    
    // Vérifier la cohérence des valeurs
    const expectedValues = [];
    for (let i = CONFIG.LIMITS.MIN_RATING; i <= CONFIG.LIMITS.MAX_RATING; i++) {
      expectedValues.push(i);
    }
    
    const actualValues = Array.from(this.ratingInputs).map(input => parseInt(input.value)).sort();
    
    if (JSON.stringify(expectedValues) !== JSON.stringify(actualValues)) {
      issues.push('Valeurs d\'inputs incohérentes avec la configuration');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      elementsChecked: {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement,
        ratingContainer: !!this.ratingContainer
      }
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      isRatingEnabled: this.isRatingEnabled,
      currentRating: this.currentRating,
      hasValidCombination: this.isCombinationReadyForRating(),
      elements: {
        ratingInputs: this.ratingInputs.length,
        submitButton: !!this.submitButton,
        feedbackElement: !!this.feedbackElement,
        ratingContainer: !!this.ratingContainer
      },
      managers: {
        historyManager: !!this.historyManager,
        combinationGenerator: !!this.combinationGenerator
      },
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources
   */
  cleanup() {
    // Supprimer les event listeners
    this.ratingInputs.forEach(input => {
      input.removeEventListener('change', () => {});
      input.removeEventListener('focus', () => {});
      input.removeEventListener('keydown', () => {});
    });
    
    // Réinitialiser l'état
    this.disableRating();
    this.currentRating = null;
    
    // Supprimer les références
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
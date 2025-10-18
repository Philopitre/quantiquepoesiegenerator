/**
 * Générateur Poétique Principal
 * Module orchestrateur qui initialise et coordonne tous les autres modules
 * @module PoeticGenerator
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';
import { AudioManager } from './AudioManager.js';
import { WordManager } from './WordManager.js';
import { CombinationGenerator } from './CombinationGenerator.js';
import { HistoryManager } from './HistoryManager.js';
import { RatingManager } from './RatingManager.js';
import { ShareManager } from './ShareManager.js';
import { OrdinationManager } from './OrdinationManager.js';

/**
 * Classe principale qui orchestre toute l'application
 */
export class PoeticGenerator {
  
  /**
   * Initialise l'application complète
   */
  constructor() {
    this.managers = {};
    this.isInitialized = false;
    this.eventListeners = new Map();
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Application initialisée');
      // Exposer pour le debug global
      window.poeticGenerator = this;
      window.debugPoetic = () => this.getDebugInfo();
      window.cleanupPoetic = () => this.cleanup();
    }
  }
  
  /**
   * Initialise tous les modules dans l'ordre correct
   * @private
   */
  init() {
  try {
    // Phase 1: Modules indépendants
    this.initializeIndependentModules();
    
    // Phase 2: Modules avec dépendances simples
    this.initializeDependentModules();
    
    // Phase 3: Modules avec références circulaires
    this.initializeCircularDependencies();
    
    // Phase 4: Configuration finale
    this.finalizeDependencies();
    
    // Phase 5: Event listeners globaux
    this.setupGlobalEventListeners();
    
    // Phase 6: Raccourcis clavier
    this.setupKeyboardShortcuts();
      
      this.isInitialized = true;
      
      // Notification de démarrage
      setTimeout(() => {
        NotificationManager.info('Application prête ! 🌟');
      }, 500);
      
    } catch (error) {
      console.error('PoeticGenerator: Erreur lors de l\'initialisation:', error);
      this.handleInitializationError(error);
    }
  }
  
  /**
   * Initialise les modules indépendants
   * @private
   */
  async initializeIndependentModules() {
    // HistoryManager - complètement indépendant
    this.managers.history = new HistoryManager();
    
    // AudioManager - indépendant
    this.managers.audio = new AudioManager();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Modules indépendants initialisés');
    }
  }
  
  /**
   * Initialise les modules avec dépendances simples
   * @private
   */
  async initializeDependentModules() {
    // OrdinationManager dépend d'AudioManager - DOIT ÊTRE INITIALISÉ EN PREMIER
    this.managers.ordination = new OrdinationManager(this.managers.audio);
    
    // WordManager dépend d'AudioManager
    this.managers.word = new WordManager(this.managers.audio);
    
    // CombinationGenerator dépend de WordManager et AudioManager
    this.managers.combination = new CombinationGenerator(
      this.managers.word, 
      this.managers.audio
    );
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Modules avec dépendances simples initialisés');
    }
  }
  
  /**
   * Initialise les modules avec références circulaires
   * @private
   */
  async initializeCircularDependencies() {
    // RatingManager dépend d'HistoryManager
    this.managers.rating = new RatingManager(this.managers.history);
    
    // ShareManager dépend de CombinationGenerator ET RatingManager
    // IMPORTANT: RatingManager doit être créé AVANT ShareManager
    this.managers.share = new ShareManager(
      this.managers.combination,
      this.managers.rating
    );
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Modules avec références circulaires initialisés');
    }
  }
  
  /**
   * Finalise les dépendances circulaires
   * @private
   */
  async finalizeDependencies() {
    // Connecter CombinationGenerator et RatingManager (référence circulaire)
    this.managers.combination.setRatingManager(this.managers.rating);
    this.managers.rating.setCombinationGenerator(this.managers.combination);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Dépendances circulaires finalisées');
    }
  }
  
  /**
   * Configure les event listeners globaux de l'application
   * @private
   */
  setupGlobalEventListeners() {
  // Map des actions par ID de bouton
  const actionMap = {
    [CONFIG.DOM_ELEMENTS.RESET_ALL_WORDS]: () => this.managers.word.resetAllWords(),
    [CONFIG.DOM_ELEMENTS.TOGGLE_SOUND]: () => this.managers.audio.toggleSound(),
    [CONFIG.DOM_ELEMENTS.GENERATE_BTN]: () => this.managers.combination.generate(),
    [CONFIG.DOM_ELEMENTS.GENERATE_SELECTED_BTN]: () => this.managers.combination.generate(true),
    [CONFIG.DOM_ELEMENTS.NEW_COMBINATION_BTN]: () => this.managers.combination.generate(),
    [CONFIG.DOM_ELEMENTS.COPY_BTN]: () => this.managers.share.copyToClipboard(),
    [CONFIG.DOM_ELEMENTS.SUBMIT_RATING]: () => this.managers.rating.submitRating(),
    [CONFIG.DOM_ELEMENTS.SHARE_TWITTER]: () => this.managers.share.shareOnTwitter(),
    [CONFIG.DOM_ELEMENTS.SHARE_WHATSAPP]: () => this.managers.share.shareOnWhatsApp(),
    [CONFIG.DOM_ELEMENTS.SHARE_FACEBOOK]: () => this.managers.share.shareOnFacebook(),
    [CONFIG.DOM_ELEMENTS.SHARE_EMAIL]: () => this.managers.share.shareByEmail(),
    [CONFIG.DOM_ELEMENTS.GENERATE_IMAGE]: () => this.managers.share.generateImage(),
    [CONFIG.DOM_ELEMENTS.SORT_UP]: () => this.managers.history.sortByRating(true),
    [CONFIG.DOM_ELEMENTS.SORT_DOWN]: () => this.managers.history.sortByRating(false),
    [CONFIG.DOM_ELEMENTS.RANDOM_SORT]: () => this.managers.history.randomSort(),
    [CONFIG.DOM_ELEMENTS.EXPORT_TXT]: () => this.managers.history.exportTXT(),
    [CONFIG.DOM_ELEMENTS.EXPORT_PDF]: () => this.managers.history.exportPDF(),
    [CONFIG.DOM_ELEMENTS.RESET_CACHE]: () => this.handleResetCache()
  };
  
  // Event listener avec delegation - MAIS on évite les mots !
  const globalClickHandler = (event) => {
    const target = event.target;
    
    // ⚠️ NE PAS intercepter les clics sur les mots (gérés par WordManager)
    if (target.classList.contains('word-group-1') || 
        target.classList.contains('word-group-2') ||
        target.closest('.full-word-list')) {
      return; // Laisser WordManager gérer
    }
    
    // Chercher le bouton cliqué
    const button = target.closest('button, [role="button"]');
    if (!button || !button.id) return;
    
    const handler = actionMap[button.id];
    if (handler) {
      event.preventDefault();
      
      try {
        if (CONFIG.DEBUG.ENABLED) {
          console.log(`PoeticGenerator: Action déclenchée: ${button.id}`);
        }
        handler();
      } catch (error) {
        console.error(`PoeticGenerator: Erreur dans ${button.id}:`, error);
        NotificationManager.error('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };
  
  document.addEventListener('click', globalClickHandler);
  this.eventListeners.set('global-click', { element: document, handler: globalClickHandler, type: 'click' });
  
  if (CONFIG.DEBUG.ENABLED) {
    console.log(`PoeticGenerator: Event delegation configuré pour ${Object.keys(actionMap).length} actions`);
  }
}
  
  /**
   * Gère la réinitialisation du cache
   * @private
   */
  handleResetCache() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser tout l\'historique ? Cette action est irréversible.')) {
      try {
        this.managers.history.clear();
        NotificationManager.success('Historique réinitialisé avec succès');
      } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        NotificationManager.error('Erreur lors de la réinitialisation');
      }
    }
  }
  
  /**
   * Crée un gestionnaire d'événement sécurisé avec gestion d'erreurs
   * @private
   * @param {Function} handler - Gestionnaire original
   * @param {string} buttonId - ID du bouton pour le debug
   * @returns {Function} Gestionnaire sécurisé
   */
  createSafeEventHandler(handler, buttonId) {
    return async (event) => {
      try {
        if (CONFIG.DEBUG.ENABLED) {
          console.log(`PoeticGenerator: Événement déclenché: ${buttonId}`);
        }
        
        await handler(event);
        
      } catch (error) {
        console.error(`PoeticGenerator: Erreur dans le gestionnaire ${buttonId}:`, error);
        NotificationManager.error('Une erreur est survenue. Veuillez réessayer.');
        
        if (CONFIG.DEBUG.ENABLED) {
          console.error('Stack trace:', error.stack);
        }
      }
    };
  }
  
  /**
   * Configure les raccourcis clavier
   * @private
   */
  setupKeyboardShortcuts() {
    const shortcuts = new Map([
      ['KeyG', () => this.managers.combination.generate()],
      ['KeyS', () => this.managers.combination.generate(true)],
      ['KeyR', () => this.managers.word.resetAllWords()],
      ['KeyC', () => this.managers.share.copyToClipboard()],
      ['KeyM', () => this.managers.audio.toggleSound()],
      ['Escape', () => NotificationManager.dismissAll()]
    ]);
    
    const keyboardHandler = (event) => {
      // Ignorer si dans un champ de saisie
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return;
      }
      
      const key = event.code || event.key;
      const handler = shortcuts.get(key);
      
      if (handler) {
        event.preventDefault();
        try {
          handler();
        } catch (error) {
          console.error('PoeticGenerator: Erreur dans le raccourci clavier:', error);
        }
      }
    };
    
    document.addEventListener('keydown', keyboardHandler);
    this.eventListeners.set('keyboard', { element: document, handler: keyboardHandler });
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Raccourcis clavier configurés:', Array.from(shortcuts.keys()));
    }
  }
  
  /**
   * Gère les erreurs d'initialisation
   * @private
   * @param {Error} error - Erreur survenue
   */
  handleInitializationError(error) {
    // Notification d'erreur à l'utilisateur
    NotificationManager.error('Erreur lors du chargement de l\'application. Veuillez recharger la page.');
    
    // Tentative de nettoyage partiel
    try {
      this.cleanup();
    } catch (cleanupError) {
      console.error('PoeticGenerator: Erreur lors du nettoyage après échec d\'initialisation:', cleanupError);
    }
    
    // Log détaillé pour le développement
    console.error('PoeticGenerator: Détails de l\'erreur d\'initialisation:', {
      message: error.message,
      stack: error.stack,
      managers: Object.keys(this.managers),
      isInitialized: this.isInitialized
    });
  }
  
  /**
   * Valide que tous les modules sont correctement initialisés
   * @returns {Object} Résultat de la validation
   */
  validateInitialization() {
    const expectedManagers = ['audio', 'word', 'combination', 'history', 'rating', 'share', 'ordination'];
    const actualManagers = Object.keys(this.managers);
    
    const missing = expectedManagers.filter(name => !this.managers[name]);
    const extra = actualManagers.filter(name => !expectedManagers.includes(name));
    
    const validationResult = {
      isValid: missing.length === 0 && this.isInitialized,
      missing,
      extra,
      managersCount: actualManagers.length,
      expectedCount: expectedManagers.length,
      eventListeners: this.eventListeners.size
    };
    
    // Validation individuelle des modules
    const moduleValidation = {};
    Object.entries(this.managers).forEach(([name, manager]) => {
      if (typeof manager.validate === 'function') {
        try {
          moduleValidation[name] = manager.validate();
        } catch (error) {
          moduleValidation[name] = { valid: false, error: error.message };
        }
      } else {
        moduleValidation[name] = { valid: true, note: 'No validation method' };
      }
    });
    
    validationResult.moduleValidation = moduleValidation;
    
    return validationResult;
  }
  
  /**
   * Vérifie si l'application est prête à être utilisée
   * @returns {boolean} True si l'application est initialisée
   */
  isReady() {
    return this.isInitialized && Object.keys(this.managers).length > 0;
  }
  
  /**
   * Récupère un manager spécifique par son nom
   * @param {string} name - Nom du manager (audio, word, combination, history, rating, share, ordination)
   * @returns {Object|null} Le manager demandé ou null si non trouvé
   */
  getManager(name) {
    return this.managers[name] || null;
  }
  
  /**
   * Retourne les informations de debug de l'application
   * @returns {Object} Informations de debug complètes
   */
  getDebugInfo() {
    const debugInfo = {
      application: {
        isInitialized: this.isInitialized,
        managersLoaded: Object.keys(this.managers),
        eventListeners: this.eventListeners.size,
        timestamp: Date.now()
      },
      validation: this.validateInitialization(),
      managers: {}
    };
    
    // Collecter les infos debug de chaque module
    Object.entries(this.managers).forEach(([name, manager]) => {
      if (typeof manager.getDebugInfo === 'function') {
        try {
          debugInfo.managers[name] = manager.getDebugInfo();
        } catch (error) {
          debugInfo.managers[name] = { error: error.message };
        }
      }
    });
    
    return debugInfo;
  }
  
  /**
   * Nettoie tous les event listeners et ressources
   */
  cleanup() {
    // Supprimer tous les event listeners
    this.eventListeners.forEach(({ element, handler }) => {
      try {
        element.removeEventListener('click', handler);
        element.removeEventListener('keydown', handler);
      } catch (error) {
        console.warn('PoeticGenerator: Erreur lors du nettoyage d\'un listener:', error);
      }
    });
    
    this.eventListeners.clear();
    
    // Nettoyer chaque module
    Object.values(this.managers).forEach(manager => {
      if (typeof manager.cleanup === 'function') {
        try {
          manager.cleanup();
        } catch (error) {
          console.warn('PoeticGenerator: Erreur lors du nettoyage d\'un module:', error);
        }
      }
    });
    
    // Réinitialiser l'état
    this.managers = {};
    this.isInitialized = false;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Nettoyage complet effectué');
    }
  }
}
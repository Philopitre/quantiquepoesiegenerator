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
  async init() {
    try {
      // Phase 1: Modules indépendants
      await this.initializeIndependentModules();
      
      // Phase 2: Modules avec dépendances simples
      await this.initializeDependentModules();
      
      // Phase 3: Modules avec références circulaires
      await this.initializeCircularDependencies();
      
      // Phase 4: Configuration finale
      await this.finalizeDependencies();
      
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
    
    // ShareManager dépend de CombinationGenerator
    this.managers.share = new ShareManager(this.managers.combination);
    
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
    const buttons = [
      { id: CONFIG.DOM_ELEMENTS.RESET_ALL_WORDS, handler: () => this.managers.word.resetAllWords() },
      { id: CONFIG.DOM_ELEMENTS.TOGGLE_SOUND, handler: () => this.managers.audio.toggleSound() },
      { id: CONFIG.DOM_ELEMENTS.GENERATE_BTN, handler: () => this.managers.combination.generate() },
      { id: CONFIG.DOM_ELEMENTS.GENERATE_SELECTED_BTN, handler: () => this.managers.combination.generate(true) },
      { id: CONFIG.DOM_ELEMENTS.NEW_COMBINATION_BTN, handler: () => this.managers.combination.generate() },
      { id: CONFIG.DOM_ELEMENTS.COPY_BTN, handler: () => this.managers.share.copyToClipboard() },
      { id: CONFIG.DOM_ELEMENTS.SUBMIT_RATING, handler: () => this.managers.rating.submitRating() },
      { id: CONFIG.DOM_ELEMENTS.SHARE_TWITTER, handler: () => this.managers.share.shareOnTwitter() },
      { id: CONFIG.DOM_ELEMENTS.SHARE_WHATSAPP, handler: () => this.managers.share.shareOnWhatsApp() },
      { id: CONFIG.DOM_ELEMENTS.SHARE_FACEBOOK, handler: () => this.managers.share.shareOnFacebook() },
      { id: CONFIG.DOM_ELEMENTS.SHARE_EMAIL, handler: () => this.managers.share.shareByEmail() },
      { id: CONFIG.DOM_ELEMENTS.GENERATE_IMAGE, handler: () => this.managers.share.generateImage() },
      { id: CONFIG.DOM_ELEMENTS.SORT_UP, handler: () => this.managers.history.sortByRating(true) },
      { id: CONFIG.DOM_ELEMENTS.SORT_DOWN, handler: () => this.managers.history.sortByRating(false) },
      { id: CONFIG.DOM_ELEMENTS.RANDOM_SORT, handler: () => this.managers.history.randomSort() },
      { id: CONFIG.DOM_ELEMENTS.EXPORT_TXT, handler: () => this.managers.history.exportTXT() },
      { id: CONFIG.DOM_ELEMENTS.EXPORT_PDF, handler: () => this.managers.history.exportPDF() },
      { id: CONFIG.DOM_ELEMENTS.RESET_CACHE, handler: () => this.managers.history.reset() }
    ];
    
    buttons.forEach(({ id, handler }) => {
      const element = document.getElementById(id);
      if (element) {
        const wrappedHandler = this.createSafeEventHandler(handler, id);
        element.addEventListener('click', wrappedHandler);
        this.eventListeners.set(id, { element, handler: wrappedHandler });
      } else {
        console.warn(`PoeticGenerator: Élément ${id} non trouvé`);
      }
    });
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log(`PoeticGenerator: ${this.eventListeners.size} event listeners configurés`);
    }
  }
  
  /**
   * Crée un gestionnaire d'événement sécurisé avec gestion d'erreur
   * @private
   * @param {Function} handler - Gestionnaire original
   * @param {string} elementId - ID de l'élément pour le debug
   * @returns {Function} Gestionnaire sécurisé
   */
  createSafeEventHandler(handler, elementId) {
    return async (event) => {
      try {
        event.preventDefault();
        await handler(event);
      } catch (error) {
        console.error(`PoeticGenerator: Erreur dans le gestionnaire ${elementId}:`, error);
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
      } else {
        debugInfo.managers[name] = { status: 'No debug info available' };
      }
    });
    
    return debugInfo;
  }
  
  /**
   * Retourne un gestionnaire spécifique
   * @param {string} name - Nom du gestionnaire
   * @returns {Object|null} Instance du gestionnaire
   */
  getManager(name) {
    return this.managers[name] || null;
  }
  
  /**
   * Vérifie si l'application est prête
   * @returns {boolean} État de préparation
   */
  isReady() {
    return this.isInitialized && this.validateInitialization().isValid;
  }
  
  /**
   * Redémarre l'application
   */
  async restart() {
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Redémarrage de l\'application...');
    }
    
    // Nettoyer d'abord
    this.cleanup();
    
    // Réinitialiser l'état
    this.managers = {};
    this.isInitialized = false;
    this.eventListeners.clear();
    
    // Relancer l'initialisation
    await this.init();
    
    NotificationManager.success('Application redémarrée avec succès !');
  }
  
  /**
   * Nettoie toutes les ressources
   */
  cleanup() {
    // Nettoyer les event listeners
    this.eventListeners.forEach(({ element, handler }, id) => {
      if (element && handler) {
        if (id === 'keyboard') {
          element.removeEventListener('keydown', handler);
        } else {
          element.removeEventListener('click', handler);
        }
      }
    });
    this.eventListeners.clear();
    
    // Nettoyer les gestionnaires
    Object.values(this.managers).forEach(manager => {
      if (typeof manager.cleanup === 'function') {
        try {
          manager.cleanup();
        } catch (error) {
          console.error('PoeticGenerator: Erreur lors du nettoyage d\'un gestionnaire:', error);
        }
      }
    });
    
    // Nettoyer les références globales
    if (window.poeticGenerator === this) {
      delete window.poeticGenerator;
      delete window.debugPoetic;
      delete window.cleanupPoetic;
    }
    
    this.isInitialized = false;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('PoeticGenerator: Nettoyage terminé');
    }
  }
}

export default PoeticGenerator;
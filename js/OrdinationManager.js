/**
 * Gestionnaire d'ordination des mots
 * Gère la permutation entre différents arrangements des mots
 * @module OrdinationManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer les différentes ordinations des mots
 */
export class OrdinationManager {
  
  /**
   * Initialise le gestionnaire d'ordination
   * @param {AudioManager} audioManager - Instance du gestionnaire audio
   */
  constructor(audioManager) {
    if (!audioManager) {
      throw new Error('OrdinationManager: AudioManager requis');
    }
    
    this.audioManager = audioManager;
    this.currentOrdination = 'original'; // 'original' ou 'alternative'
    this.wordListElement = null;
    this.toggleButton = null;
    
    // Définition des deux ordinations
    this.ordinations = {
      original: {
        name: 'Ordination Originale',
        words: [
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
        ]
      },
      alternative: {
        name: 'Ordination Alternative',
        words: [
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
        ]
      }
    };
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('OrdinationManager initialized');
    }
  }
  
  /**
   * Initialise le gestionnaire
   * @private
   */
  init() {
    this.setupDOMReferences();
    this.createToggleButton();
    this.setupEventListeners();
    this.loadSavedOrdination();
  }
  
  /**
   * Configure les références DOM
   * @private
   */
  setupDOMReferences() {
    this.wordListElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_LIST);
    
    if (!this.wordListElement) {
      console.error('OrdinationManager: Liste de mots non trouvée');
      return;
    }
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('OrdinationManager: Références DOM configurées');
    }
  }
  
  /**
   * Crée le bouton de basculement
   * @private
   */
  createToggleButton() {
    // Trouver le conteneur des contrôles
    const controlsTop = document.querySelector('.controls-top');
    if (!controlsTop) {
      console.error('OrdinationManager: Conteneur de contrôles non trouvé');
      return;
    }
    
    // Créer le bouton
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'toggleOrdination';
    this.toggleButton.className = 'secondary';
    this.toggleButton.innerHTML = '🔄 Permuter l\'ordre';
    this.toggleButton.setAttribute('aria-label', 'Permuter entre les deux ordinations des mots');
    this.toggleButton.setAttribute('title', 'Changer l\'arrangement des mots');
    
    // Ajouter au conteneur
    controlsTop.appendChild(this.toggleButton);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('OrdinationManager: Bouton de basculement créé');
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleOrdination());
    }
  }
  
  /**
   * Charge l'ordination sauvegardée
   * @private
   */
  loadSavedOrdination() {
    try {
      const saved = localStorage.getItem('poeticOrdination');
      if (saved && ['original', 'alternative'].includes(saved)) {
        this.currentOrdination = saved;
      }
      
      // Appliquer l'ordination courante
      this.applyOrdination(this.currentOrdination, false);
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('OrdinationManager: Ordination chargée:', this.currentOrdination);
      }
    } catch (error) {
      console.error('OrdinationManager: Erreur lors du chargement:', error);
    }
  }
  
  /**
   * Sauvegarde l'ordination courante
   * @private
   */
  saveOrdination() {
    try {
      localStorage.setItem('poeticOrdination', this.currentOrdination);
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('OrdinationManager: Ordination sauvegardée:', this.currentOrdination);
      }
    } catch (error) {
      console.error('OrdinationManager: Erreur lors de la sauvegarde:', error);
    }
  }
  
  /**
   * Bascule entre les ordinations
   */
  toggleOrdination() {
    const newOrdination = this.currentOrdination === 'original' ? 'alternative' : 'original';
    
    // Effet visuel de transition
    this.addTransitionEffect();
    
    // Changer l'ordination après un court délai pour l'effet visuel
    setTimeout(() => {
      this.applyOrdination(newOrdination, true);
      this.currentOrdination = newOrdination;
      this.saveOrdination();
      this.updateButtonDisplay();
      
      // Son de confirmation
      this.playToggleSound();
      
      // Notification
      const ordinationName = this.ordinations[newOrdination].name;
      NotificationManager.show(`Basculé vers : ${ordinationName} ✨`);
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('OrdinationManager: Basculement vers:', newOrdination);
      }
    }, 150);
  }
  
  /**
   * Applique une ordination spécifique
   * @param {string} ordinationType - Type d'ordination ('original' ou 'alternative')
   * @param {boolean} animate - Activer l'animation
   * @private
   */
  applyOrdination(ordinationType, animate = false) {
    if (!this.ordinations[ordinationType]) {
      console.error('OrdinationManager: Ordination inconnue:', ordinationType);
      return;
    }
    
    const ordination = this.ordinations[ordinationType];
    const wordsHTML = this.generateWordsHTML(ordination.words);
    
    if (animate) {
      // Animation de transition
      this.wordListElement.style.opacity = '0';
      setTimeout(() => {
        this.updateWordListContent(wordsHTML);
        this.wordListElement.style.opacity = '1';
      }, 150);
    } else {
      // Mise à jour directe
      this.updateWordListContent(wordsHTML);
    }
  }
  
  /**
   * Génère le HTML pour une liste de mots
   * @param {Array} words - Liste des mots avec leurs groupes
   * @returns {string} HTML généré
   * @private
   */
  generateWordsHTML(words) {
    const wordsSpans = words.map(word => {
      const groupClass = `word-group-${word.group}`;
      return `<span class="${groupClass}" data-word="${word.text}">${word.text}</span>`;
    }).join('\n      ');
    
    return `Mots disponibles:\n      ${wordsSpans}`;
  }
  
  /**
   * Met à jour le contenu de la liste de mots
   * @param {string} htmlContent - Nouveau contenu HTML
   * @private
   */
  updateWordListContent(htmlContent) {
    this.wordListElement.innerHTML = htmlContent;
    
    // Émettre un événement pour notifier les autres modules
    this.dispatchOrdinationChangeEvent();
  }
  
  /**
   * Ajoute un effet de transition visuelle
   * @private
   */
  addTransitionEffect() {
    if (this.wordListElement) {
      this.wordListElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      this.wordListElement.style.transform = 'scale(0.98)';
      
      setTimeout(() => {
        this.wordListElement.style.transform = 'scale(1)';
      }, 300);
    }
  }
  
  /**
   * Met à jour l'affichage du bouton
   * @private
   */
  updateButtonDisplay() {
    if (!this.toggleButton) return;
    
    const ordinationName = this.ordinations[this.currentOrdination].name;
    const nextOrdination = this.currentOrdination === 'original' ? 'alternative' : 'original';
    const nextName = this.ordinations[nextOrdination].name;
    
    this.toggleButton.innerHTML = `🔄 Vers ${nextName.replace('Ordination ', '')}`;
    this.toggleButton.setAttribute('title', `Actuellement: ${ordinationName}. Cliquer pour passer à: ${nextName}`);
    
    // Effet visuel temporaire
    this.toggleButton.classList.add('ordination-changed');
    setTimeout(() => {
      this.toggleButton.classList.remove('ordination-changed');
    }, 500);
  }
  
  /**
   * Joue le son de basculement
   * @private
   */
  playToggleSound() {
    if (this.audioManager && this.audioManager.isSoundEnabled()) {
      try {
        // Son spécial pour le basculement (fréquence plus haute)
        this.audioManager.playSound({
          volume: 0.2,
          playbackRate: 1.5
        });
      } catch (error) {
        if (CONFIG.DEBUG.ENABLED) {
          console.warn('OrdinationManager: Erreur lors de la lecture du son:', error);
        }
      }
    }
  }
  
  /**
   * Émet un événement de changement d'ordination
   * @private
   */
  dispatchOrdinationChangeEvent() {
    const event = new CustomEvent('ordinationChanged', {
      detail: {
        currentOrdination: this.currentOrdination,
        ordinationName: this.ordinations[this.currentOrdination].name,
        wordCount: this.ordinations[this.currentOrdination].words.length,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Retourne l'ordination courante
   * @returns {string} Type d'ordination courante
   */
  getCurrentOrdination() {
    return this.currentOrdination;
  }
  
  /**
   * Retourne les mots de l'ordination courante
   * @returns {Array} Liste des mots
   */
  getCurrentWords() {
    return this.ordinations[this.currentOrdination].words.map(word => word.text);
  }
  
  /**
   * Retourne toutes les ordinations disponibles
   * @returns {Object} Toutes les ordinations
   */
  getAllOrdinations() {
    return this.ordinations;
  }
  
  /**
   * Définit une nouvelle ordination personnalisée
   * @param {string} name - Nom de l'ordination
   * @param {Array} words - Liste des mots
   */
  setCustomOrdination(name, words) {
    if (!name || !Array.isArray(words)) {
      console.error('OrdinationManager: Paramètres invalides pour l\'ordination personnalisée');
      return;
    }
    
    this.ordinations[name] = {
      name: name,
      words: words
    };
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('OrdinationManager: Ordination personnalisée ajoutée:', name);
    }
  }
  
  /**
   * Valide le gestionnaire d'ordination
   * @returns {Object} Résultat de la validation
   */
  validate() {
    const issues = [];
    const warnings = [];
    
    // Vérifier les éléments DOM
    if (!this.wordListElement) {
      issues.push('Liste de mots manquante');
    }
    
    if (!this.toggleButton) {
      issues.push('Bouton de basculement manquant');
    }
    
    // Vérifier les ordinations
    Object.entries(this.ordinations).forEach(([key, ordination]) => {
      if (!ordination.words || !Array.isArray(ordination.words)) {
        issues.push(`Ordination ${key} invalide`);
      }
      
      if (ordination.words && ordination.words.length === 0) {
        warnings.push(`Ordination ${key} vide`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      currentOrdination: this.currentOrdination,
      ordinationsCount: Object.keys(this.ordinations).length
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      currentOrdination: this.currentOrdination,
      ordinationsAvailable: Object.keys(this.ordinations),
      currentWords: this.getCurrentWords(),
      elements: {
        wordListElement: !!this.wordListElement,
        toggleButton: !!this.toggleButton,
        audioManager: !!this.audioManager
      },
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources
   */
  cleanup() {
    // Supprimer les event listeners
    if (this.toggleButton) {
      this.toggleButton.removeEventListener('click', () => {});
    }
    
    // Supprimer le bouton du DOM
    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
    }
    
    // Réinitialiser les références
    this.wordListElement = null;
    this.toggleButton = null;
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('OrdinationManager: Nettoyage effectué');
    }
  }
}

export default OrdinationManager;
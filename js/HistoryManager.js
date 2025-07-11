/**
 * Gestionnaire d'historique et de statistiques
 * Gère la persistance, l'affichage et l'export de l'historique des combinaisons
 * @module HistoryManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer l'historique et les statistiques
 */
export class HistoryManager {
  
  /**
   * Initialise le gestionnaire d'historique
   */
  constructor() {
    this.history = this.loadHistory();
    this.observers = [];
    this.autoSaveTimer = null;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager initialized with', this.history.length, 'entries');
    }
  }
  
  /**
   * Initialise le gestionnaire
   * @private
   */
  init() {
    this.validateHistoryData();
    this.updateDisplay();
    this.setupEventListeners();
  }
  
  /**
   * Charge l'historique depuis le localStorage
   * @returns {Array} Historique chargé
   * @private
   */
  loadHistory() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : [];
      
      // Validation et nettoyage des données
      const validated = Array.isArray(parsed) ? parsed.filter(this.isValidHistoryEntry) : [];
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('HistoryManager: Historique chargé:', {
          raw: data ? data.length : 0,
          parsed: Array.isArray(parsed) ? parsed.length : 0,
          validated: validated.length
        });
      }
      
      return validated;
    } catch (error) {
      console.error('HistoryManager: Erreur lors du chargement de l\'historique:', error);
      return [];
    }
  }
  
  /**
   * Valide une entrée d'historique
   * @param {Object} entry - Entrée à valider
   * @returns {boolean} Validité de l'entrée
   * @private
   */
  isValidHistoryEntry(entry) {
    return entry &&
           typeof entry === 'object' &&
           typeof entry.text === 'string' &&
           entry.text.length > 0 &&
           typeof entry.note === 'number' &&
           entry.note >= CONFIG.LIMITS.MIN_RATING &&
           entry.note <= CONFIG.LIMITS.MAX_RATING;
  }
  
  /**
   * Valide et nettoie les données d'historique
   * @private
   */
  validateHistoryData() {
    const originalLength = this.history.length;
    this.history = this.history.filter(this.isValidHistoryEntry);
    
    // Limiter la taille de l'historique
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(-CONFIG.LIMITS.MAX_HISTORY_ENTRIES);
      this.saveHistory();
    }
    
    if (originalLength !== this.history.length) {
      console.warn(`HistoryManager: ${originalLength - this.history.length} entrées invalides supprimées`);
    }
  }
  
  /**
   * Sauvegarde l'historique dans le localStorage
   * @private
   */
  saveHistory() {
    try {
      const data = JSON.stringify(this.history);
      localStorage.setItem(CONFIG.STORAGE_KEY, data);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('HistoryManager: Historique sauvegardé:', {
          entries: this.history.length,
          size: data.length
        });
      }
    } catch (error) {
      console.error('HistoryManager: Erreur lors de la sauvegarde:', error);
      NotificationManager.error('Erreur lors de la sauvegarde de l\'historique');
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    // Écouter les changements de visibilité de la page pour sauvegarder
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveHistory();
      }
    });
    
    // Sauvegarder avant fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.saveHistory();
    });
  }
  
  /**
   * Ajoute une nouvelle entrée à l'historique
   * @param {string} combination - Combinaison de mots
   * @param {number} rating - Note attribuée
   */
  addEntry(combination, rating) {
    // Validation des paramètres
    if (!combination || typeof combination !== 'string') {
      console.error('HistoryManager: Combinaison invalide');
      return;
    }
    
    if (!Number.isInteger(rating) || rating < CONFIG.LIMITS.MIN_RATING || rating > CONFIG.LIMITS.MAX_RATING) {
      console.error('HistoryManager: Note invalide:', rating);
      return;
    }
    
    // Créer l'entrée avec métadonnées
    const entry = {
      text: combination,
      note: rating,
      timestamp: Date.now(),
      id: this.generateEntryId()
    };
    
    // Ajouter à l'historique
    this.history.push(entry);
    
    // Limiter la taille
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      this.history.shift(); // Supprimer la plus ancienne
    }
    
    // Sauvegarder et mettre à jour l'affichage
    this.saveHistory();
    this.updateDisplay();
    this.notifyObservers();
    
    // Émettre un événement
    this.dispatchHistoryUpdateEvent(entry);
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('HistoryManager: Nouvelle entrée ajoutée:', entry);
    }
  }
  
  /**
   * Génère un ID unique pour une entrée
   * @returns {string} ID unique
   * @private
   */
  generateEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Met à jour l'affichage complet
   */
  updateDisplay() {
    this.updateStatistics();
    this.updateHistoryList();
  }
  
  /**
   * Met à jour les statistiques
   * @private
   */
  updateStatistics() {
    const stats = this.calculateStatistics();
    
    this.animateStatistic(CONFIG.DOM_ELEMENTS.TOTAL_COMBINATIONS, 
      `Total des combinaisons notées : ${stats.total}`);
    this.animateStatistic(CONFIG.DOM_ELEMENTS.AVERAGE_NOTE, 
      `Note moyenne : ${stats.average}`);
    this.animateStatistic(CONFIG.DOM_ELEMENTS.BEST_NOTE, 
      `Meilleure note : ${stats.best}`);
    this.animateStatistic(CONFIG.DOM_ELEMENTS.WORST_NOTE, 
      `Pire note : ${stats.worst}`);
  }
  
  /**
   * Calcule les statistiques
   * @returns {Object} Statistiques calculées
   * @private
   */
  calculateStatistics() {
    const total = this.history.length;
    
    if (total === 0) {
      return {
        total: 0,
        average: '-',
        best: '-',
        worst: '-'
      };
    }
    
    const notes = this.history.map(entry => entry.note);
    const sum = notes.reduce((a, b) => a + b, 0);
    const average = (sum / total).toFixed(2);
    const best = Math.max(...notes);
    const worst = Math.min(...notes);
    
    return { total, average, best, worst };
  }
  
  /**
   * Anime l'affichage d'une statistique
   * @param {string} elementId - ID de l'élément
   * @param {string} text - Texte à afficher
   * @private
   */
  animateStatistic(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Éviter les mises à jour inutiles
    if (element.textContent === text) return;
    
    element.textContent = text;
    element.classList.add(CONFIG.CSS_CLASSES.ANIMATE);
    
    setTimeout(() => {
      element.classList.remove(CONFIG.CSS_CLASSES.ANIMATE);
    }, CONFIG.STATISTICS_ANIMATION_DURATION);
  }
  
  /**
   * Met à jour la liste d'historique
   * @private
   */
  updateHistoryList() {
    const historyContainer = document.getElementById(CONFIG.DOM_ELEMENTS.HISTORY);
    if (!historyContainer) {
      console.warn('HistoryManager: Conteneur d\'historique non trouvé');
      return;
    }
    
    // Conserver l'en-tête et les contrôles
    const h3 = historyContainer.querySelector('h3');
    const controls = historyContainer.querySelector(`.${CONFIG.CSS_CLASSES.HISTORY_CONTROLS}`);
    
    // Nettoyer les entrées existantes
    this.clearHistoryEntries(historyContainer);
    
    // Ajouter les nouvelles entrées
    this.renderHistoryEntries(historyContainer, h3, controls);
    
    // Mettre à jour l'accessibilité
    this.updateHistoryAccessibility(historyContainer);
  }
  
  /**
   * Nettoie les entrées d'historique existantes
   * @param {HTMLElement} container - Conteneur d'historique
   * @private
   */
  clearHistoryEntries(container) {
    const entries = container.querySelectorAll(`div:not(.${CONFIG.CSS_CLASSES.HISTORY_CONTROLS})`);
    entries.forEach(entry => {
      const isHeader = entry.tagName === 'H3';
      const isControls = entry.classList.contains(CONFIG.CSS_CLASSES.HISTORY_CONTROLS);
      
      if (!isHeader && !isControls) {
        entry.remove();
      }
    });
  }
  
  /**
   * Rend les entrées d'historique
   * @param {HTMLElement} container - Conteneur
   * @param {HTMLElement} header - En-tête
   * @param {HTMLElement} controls - Contrôles
   * @private
   */
  renderHistoryEntries(container, header, controls) {
    if (this.history.length === 0) {
      this.renderEmptyState(container, controls);
      return;
    }
    
    this.history.forEach((entry, index) => {
      const entryElement = this.createHistoryEntryElement(entry, index);
      
      // Insérer avant les contrôles ou à la fin
      if (controls) {
        container.insertBefore(entryElement, controls);
      } else {
        container.appendChild(entryElement);
      }
    });
  }
  
  /**
   * Crée un élément d'entrée d'historique
   * @param {Object} entry - Entrée d'historique
   * @param {number} index - Index de l'entrée
   * @returns {HTMLElement} Élément créé
   * @private
   */
  createHistoryEntryElement(entry, index) {
    const div = document.createElement('div');
    div.className = CONFIG.CSS_CLASSES.HISTORY_ENTRY;
    div.setAttribute('data-entry-id', entry.id || `entry-${index}`);
    
    // Contenu de l'entrée
    const entryNumber = index + 1;
    const displayText = `${entryNumber}. ${entry.text} (Note : ${entry.note}/10)`;
    div.textContent = displayText;
    
    // Métadonnées pour l'accessibilité
    div.setAttribute('role', 'listitem');
    div.setAttribute('aria-label', `Entrée ${entryNumber}: ${entry.text}, notée ${entry.note} sur 10`);
    
    // Ajouter la date si disponible
    if (entry.timestamp) {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString(CONFIG.DATE_FORMAT.LOCALE, CONFIG.DATE_FORMAT.OPTIONS);
      div.setAttribute('title', `Créé le ${dateStr}`);
    }
    
    // Interactions
    this.addEntryInteractions(div, entry, index);
    
    return div;
  }
  
  /**
   * Ajoute les interactions à une entrée
   * @param {HTMLElement} element - Élément d'entrée
   * @param {Object} entry - Données de l'entrée
   * @param {number} index - Index de l'entrée
   * @private
   */
  addEntryInteractions(element, entry, index) {
    // Clic pour copier
    element.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(entry.text)
          .then(() => NotificationManager.success('Combinaison copiée !'))
          .catch(() => NotificationManager.error('Erreur lors de la copie'));
      }
    });
    
    // Support clavier
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }
  
  /**
   * Rend l'état vide de l'historique
   * @param {HTMLElement} container - Conteneur
   * @param {HTMLElement} controls - Contrôles
   * @private
   */
  renderEmptyState(container, controls) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'history-empty';
    emptyDiv.textContent = 'Aucune combinaison notée pour le moment.';
    emptyDiv.style.fontStyle = 'italic';
    emptyDiv.style.color = '#666';
    emptyDiv.style.textAlign = 'center';
    emptyDiv.style.padding = '20px';
    
    if (controls) {
      container.insertBefore(emptyDiv, controls);
    } else {
      container.appendChild(emptyDiv);
    }
  }
  
  /**
   * Met à jour l'accessibilité de l'historique
   * @param {HTMLElement} container - Conteneur d'historique
   * @private
   */
  updateHistoryAccessibility(container) {
    container.setAttribute('role', 'list');
    container.setAttribute('aria-label', `Historique avec ${this.history.length} combinaisons`);
    
    if (this.history.length === 0) {
      container.setAttribute('aria-label', 'Historique vide');
    }
  }
  
  /**
   * Trie l'historique par note
   * @param {boolean} ascending - Tri croissant si true
   */
  sortByRating(ascending = true) {
    this.history.sort((a, b) => {
      const comparison = a.note - b.note;
      return ascending ? comparison : -comparison;
    });
    
    this.updateHistoryList();
    this.notifyObservers();
    
    const direction = ascending ? 'croissant' : 'décroissant';
    NotificationManager.info(`Historique trié par note ${direction}`);
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager: Tri par note', direction);
    }
  }
  
  /**
   * Trie l'historique aléatoirement
   */
  randomSort() {
    // Algorithme Fisher-Yates
    for (let i = this.history.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.history[i], this.history[j]] = [this.history[j], this.history[i]];
    }
    
    this.updateHistoryList();
    this.notifyObservers();
    
    NotificationManager.info('Historique mélangé aléatoirement');
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager: Tri aléatoire effectué');
    }
  }
  
  /**
   * Exporte l'historique au format TXT
   */
  exportTXT() {
    if (!this.validateHistoryForExport()) return;
    
    try {
      const content = this.generateTextContent();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      this.downloadFile(blob, CONFIG.EXPORT_FILE_NAMES.TXT);
      
      NotificationManager.success('Export TXT téléchargé avec succès');
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('HistoryManager: Export TXT réussi');
      }
    } catch (error) {
      console.error('HistoryManager: Erreur lors de l\'export TXT:', error);
      NotificationManager.error('Erreur lors de l\'export TXT');
    }
  }
  
  /**
   * Valide l'historique pour l'export
   * @returns {boolean} Validité pour l'export
   * @private
   */
  validateHistoryForExport() {
    if (this.history.length === 0) {
      NotificationManager.warning(CONFIG.MESSAGES.HISTORY_EMPTY);
      return false;
    }
    return true;
  }
  
  /**
   * Génère le contenu texte pour l'export
   * @returns {string} Contenu formaté
   * @private
   */
  generateTextContent() {
    const header = `Historique des Combinaisons Poétiques\nGénéré le ${new Date().toLocaleString(CONFIG.DATE_FORMAT.LOCALE)}\n\n`;
    
    const stats = this.calculateStatistics();
    const statsSection = `Statistiques:\n- Total: ${stats.total} combinaisons\n- Note moyenne: ${stats.average}\n- Meilleure note: ${stats.best}\n- Pire note: ${stats.worst}\n\n`;
    
    const entriesSection = 'Combinaisons:\n' + this.history
      .map((entry, index) => `${index + 1}. ${entry.text} (Note: ${entry.note}/10)`)
      .join('\n');
    
    const footer = `\n\n---\n© Les éditions augmentées Provoq'émois`;
    
    return header + statsSection + entriesSection + footer;
  }
  
  /**
   * Exporte l'historique au format PDF
   */
  exportPDF() {
    if (!this.validateHistoryForExport()) return;
    
    try {
      if (!this.checkPDFLibrary()) {
        NotificationManager.error(CONFIG.MESSAGES.PDF_LIBRARY_ERROR);
        return;
      }
      
      const doc = this.createPDFDocument();
      this.addPDFContent(doc);
      doc.save(CONFIG.EXPORT_FILE_NAMES.PDF);
      
      NotificationManager.success('Export PDF téléchargé avec succès');
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('HistoryManager: Export PDF réussi');
      }
    } catch (error) {
      console.error('HistoryManager: Erreur lors de l\'export PDF:', error);
      NotificationManager.error(CONFIG.MESSAGES.PDF_GENERATION_ERROR);
    }
  }
  
  /**
   * Vérifie la disponibilité de la bibliothèque PDF
   * @returns {boolean} Disponibilité
   * @private
   */
  checkPDFLibrary() {
    return typeof window.jspdf !== 'undefined' && 
           typeof window.jspdf.jsPDF === 'function';
  }
  
  /**
   * Crée un document PDF
   * @returns {Object} Document jsPDF
   * @private
   */
  createPDFDocument() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont(CONFIG.PDF_CONFIG.FONT_FAMILY);
    doc.setFontSize(CONFIG.PDF_CONFIG.FONT_SIZE);
    
    return doc;
  }
  
  /**
   * Ajoute le contenu au PDF
   * @param {Object} doc - Document PDF
   * @private
   */
  addPDFContent(doc) {
    let y = CONFIG.PDF_CONFIG.HEADER_Y;
    
    // En-tête
    doc.text('La poésie quantique est une invention originale de Philow pour les éditions Provoq\'émois.', 
             CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
    y += 10;
    
    doc.text('Historique des combinaisons notées :', CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
    y = CONFIG.PDF_CONFIG.CONTENT_START_Y;
    
    // Contenu
    this.history.forEach((entry, index) => {
      const entryText = `${index + 1}. ${entry.text} (Note : ${entry.note}/10)`;
      const splitText = doc.splitTextToSize(entryText, CONFIG.PDF_CONFIG.MAX_WIDTH);
      
      // Vérifier le saut de page
      if (y + (splitText.length * CONFIG.PDF_CONFIG.LINE_HEIGHT) > CONFIG.PDF_CONFIG.PAGE_BREAK_Y) {
        doc.addPage();
        y = CONFIG.PDF_CONFIG.MARGIN_TOP;
      }
      
      doc.text(splitText, CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
      y += (splitText.length * CONFIG.PDF_CONFIG.LINE_HEIGHT) + 7;
    });
  }
  
  /**
   * Télécharge un fichier
   * @param {Blob} blob - Contenu du fichier
   * @param {string} filename - Nom du fichier
   * @private
   */
  downloadFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
  
  /**
   * Réinitialise complètement l'historique
   */
  reset() {
    const confirmMessage = CONFIG.MESSAGES.CACHE_RESET_CONFIRM;
    
    if (confirm(confirmMessage)) {
      this.history = [];
      
      try {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        this.updateDisplay();
        this.notifyObservers();
        
        NotificationManager.success(CONFIG.MESSAGES.CACHE_RESET_SUCCESS);
        
        if (CONFIG.DEBUG.ENABLED) {
          console.log('HistoryManager: Cache réinitialisé');
        }
      } catch (error) {
        console.error('HistoryManager: Erreur lors de la réinitialisation:', error);
        NotificationManager.error('Erreur lors de la réinitialisation');
      }
    }
  }
  
  /**
   * Ajoute un observateur pour les changements d'historique
   * @param {Function} callback - Fonction callback
   * @returns {Function} Fonction de suppression de l'observateur
   */
  addObserver(callback) {
    if (typeof callback !== 'function') {
      throw new Error('HistoryManager: L\'observateur doit être une fonction');
    }
    
    this.observers.push(callback);
    
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notifie tous les observateurs
   * @private
   */
  notifyObservers() {
    const data = {
      history: [...this.history],
      statistics: this.calculateStatistics()
    };
    
    this.observers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('HistoryManager: Erreur dans un observateur:', error);
      }
    });
  }
  
  /**
   * Émet un événement de mise à jour d'historique
   * @param {Object} entry - Nouvelle entrée
   * @private
   */
  dispatchHistoryUpdateEvent(entry) {
    const event = new CustomEvent(CONFIG.EVENTS.HISTORY_UPDATED, {
      detail: {
        entry,
        totalEntries: this.history.length,
        statistics: this.calculateStatistics(),
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Calcule la médiane
   * @param {number[]} numbers - Tableau de nombres
   * @returns {number} Médiane
   * @private
   */
  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Calcule le mode (valeur la plus fréquente)
   * @param {number[]} numbers - Tableau de nombres
   * @returns {number|number[]} Mode ou tableau des modes en cas d'égalité
   * @private
   */
  calculateMode(numbers) {
    if (numbers.length === 0) return null;
    
    const frequency = {};
    let maxFreq = 0;
    
    // Compter les fréquences
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[num]);
    });
    
    // Trouver toutes les valeurs avec la fréquence maximale
    const modes = Object.keys(frequency)
      .filter(key => frequency[key] === maxFreq)
      .map(key => parseInt(key));
    
    return modes.length === 1 ? modes[0] : modes;
  }
  
  /**
   * Calcule l'écart type
   * @param {number[]} numbers - Tableau de nombres
   * @returns {number} Écart type
   * @private
   */
  calculateStandardDeviation(numbers) {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Retourne les statistiques détaillées
   * @returns {Object} Statistiques complètes
   */
  getDetailedStatistics() {
    const basic = this.calculateStatistics();
    
    if (this.history.length === 0) {
      return { ...basic, distribution: {}, trends: {} };
    }
    
    const notes = this.history.map(entry => entry.note);
    
    // Distribution des notes
    const distribution = {};
    for (let i = CONFIG.LIMITS.MIN_RATING; i <= CONFIG.LIMITS.MAX_RATING; i++) {
      distribution[i] = notes.filter(note => note === i).length;
    }
    
    return {
      ...basic,
      distribution,
      median: this.calculateMedian(notes),
      mode: this.calculateMode(notes),
      standardDeviation: this.calculateStandardDeviation(notes)
    };
  }
  
  /**
   * Valide le gestionnaire d'historique
   * @returns {Object} Résultat de la validation
   */
  validate() {
    const issues = [];
    const warnings = [];
    
    // Vérifier la validité des entrées
    this.history.forEach((entry, index) => {
      if (!this.isValidHistoryEntry(entry)) {
        issues.push(`Entrée ${index} invalide`);
      }
    });
    
    // Vérifier la taille de l'historique
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      warnings.push(`Historique trop volumineux: ${this.history.length} > ${CONFIG.LIMITS.MAX_HISTORY_ENTRIES}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      historyLength: this.history.length,
      timestamp: Date.now()
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      historyLength: this.history.length,
      observers: this.observers.length,
      autoSaveActive: !!this.autoSaveTimer,
      statistics: this.getDetailedStatistics(),
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources et event listeners
   */
  cleanup() {
    // Sauvegarder une dernière fois
    this.saveHistory();
    
    // Arrêter la sauvegarde automatique
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    // Supprimer les event listeners
    document.removeEventListener('visibilitychange', () => {});
    window.removeEventListener('beforeunload', () => {});
    
    // Vider les observateurs
    this.observers = [];
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager: Nettoyage effectué');
    }
  }
}

export default HistoryManager;
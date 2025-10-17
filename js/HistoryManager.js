/**
 * Gestionnaire d'historique et de statistiques (VERSION OPTIMISÉE)
 * Gère la persistance, l'affichage et l'export de l'historique des combinaisons
 * @module HistoryManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class HistoryManager {
  constructor() {
    this.history = this.loadHistory();
    this.observers = [];
    this.autoSaveTimer = null;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager initialized with', this.history.length, 'entries');
    }
  }
  
  init() {
    this.validateHistoryData();
    this.updateDisplay();
    this.setupEventListeners();
  }
  
  loadHistory() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.HISTORY_KEY);
      const parsed = data ? JSON.parse(data) : [];
      const validated = Array.isArray(parsed) ? parsed.filter(this.isValidHistoryEntry) : [];
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('Historique chargé:', { validated: validated.length });
      }
      
      return validated;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      return [];
    }
  }
  
  isValidHistoryEntry(entry) {
    return entry &&
           typeof entry === 'object' &&
           typeof entry.text === 'string' &&
           entry.text.length > 0 &&
           typeof entry.note === 'number' &&
           entry.note >= CONFIG.LIMITS.MIN_RATING &&
           entry.note <= CONFIG.LIMITS.MAX_RATING;
  }
  
  validateHistoryData() {
    const originalLength = this.history.length;
    this.history = this.history.filter(this.isValidHistoryEntry);
    
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(-CONFIG.LIMITS.MAX_HISTORY_ENTRIES);
      this.saveHistory();
    }
    
    if (originalLength !== this.history.length) {
      console.warn(`${originalLength - this.history.length} entrées invalides supprimées`);
    }
  }
  
  saveHistory() {
    try {
      const data = JSON.stringify(this.history);
      localStorage.setItem(CONFIG.STORAGE.HISTORY_KEY, data);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('Historique sauvegardé:', { entries: this.history.length });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      NotificationManager.error('Erreur lors de la sauvegarde de l\'historique');
    }
  }
  
  setupEventListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveHistory();
    });
    
    window.addEventListener('beforeunload', () => this.saveHistory());
  }
  
  addEntry(combination, rating) {
    if (!combination || typeof combination !== 'string') {
      console.error('Combinaison invalide');
      return;
    }
    
    if (!Number.isInteger(rating) || rating < CONFIG.LIMITS.MIN_RATING || rating > CONFIG.LIMITS.MAX_RATING) {
      console.error('Note invalide:', rating);
      return;
    }
    
    const entry = {
      text: combination,
      note: rating,
      timestamp: Date.now(),
      id: this.generateEntryId()
    };
    
    this.history.push(entry);
    
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      this.history.shift();
    }
    
    this.saveHistory();
    this.updateDisplay();
    this.notifyObservers();
    this.dispatchHistoryUpdateEvent(entry);
  }
  
  generateEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  updateDisplay() {
    this.updateStatistics();
    this.updateHistoryList();
  }
  
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
  
  calculateStatistics() {
    const total = this.history.length;
    
    if (total === 0) {
      return { total: 0, average: '-', best: '-', worst: '-' };
    }
    
    const notes = this.history.map(entry => entry.note);
    const sum = notes.reduce((a, b) => a + b, 0);
    const average = (sum / total).toFixed(2);
    const best = Math.max(...notes);
    const worst = Math.min(...notes);
    
    return { total, average, best, worst };
  }
  
  animateStatistic(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element || element.textContent === text) return;
    
    element.textContent = text;
    element.classList.add(CONFIG.CSS_CLASSES.ANIMATE);
    
    setTimeout(() => {
      element.classList.remove(CONFIG.CSS_CLASSES.ANIMATE);
    }, CONFIG.ANIMATION.STATISTICS_DURATION);
  }
  
  updateHistoryList() {
    const historyContainer = document.getElementById(CONFIG.DOM_ELEMENTS.HISTORY);
    if (!historyContainer) {
      console.warn('Conteneur d\'historique non trouvé');
      return;
    }
    
    const h3 = historyContainer.querySelector('h3');
    const controls = historyContainer.querySelector(`.${CONFIG.CSS_CLASSES.HISTORY_CONTROLS}`);
    
    this.clearHistoryEntries(historyContainer);
    this.renderHistoryEntries(historyContainer, h3, controls);
    this.updateHistoryAccessibility(historyContainer);
  }
  
  clearHistoryEntries(container) {
    const entries = container.querySelectorAll(`div:not(.${CONFIG.CSS_CLASSES.HISTORY_CONTROLS})`);
    entries.forEach(entry => {
      if (entry.tagName !== 'H3' && !entry.classList.contains(CONFIG.CSS_CLASSES.HISTORY_CONTROLS)) {
        entry.remove();
      }
    });
  }
  
  renderHistoryEntries(container, header, controls) {
    if (this.history.length === 0) {
      this.renderEmptyState(container, controls);
      return;
    }
    
    this.history.forEach((entry, index) => {
      const entryElement = this.createHistoryEntryElement(entry, index);
      
      if (controls) {
        container.insertBefore(entryElement, controls);
      } else {
        container.appendChild(entryElement);
      }
    });
  }
  
  createHistoryEntryElement(entry, index) {
    const div = document.createElement('div');
    div.className = CONFIG.CSS_CLASSES.HISTORY_ENTRY;
    div.setAttribute('data-entry-id', entry.id || `entry-${index}`);
    
    const entryNumber = index + 1;
    div.textContent = `${entryNumber}. ${entry.text} (Note : ${entry.note}/10)`;
    
    div.setAttribute('role', 'listitem');
    div.setAttribute('aria-label', `Entrée ${entryNumber}: ${entry.text}, notée ${entry.note} sur 10`);
    
    if (entry.timestamp) {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString(CONFIG.DATE_FORMAT.LOCALE, CONFIG.DATE_FORMAT.OPTIONS);
      div.setAttribute('title', `Créé le ${dateStr}`);
    }
    
    this.addEntryInteractions(div, entry);
    
    return div;
  }
  
  addEntryInteractions(element, entry) {
    element.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(entry.text)
          .then(() => NotificationManager.success('Combinaison copiée !'))
          .catch(() => NotificationManager.error('Erreur lors de la copie'));
      }
    });
    
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }
  
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
  
  updateHistoryAccessibility(container) {
    container.setAttribute('role', 'list');
    container.setAttribute('aria-label', 
      this.history.length === 0 ? 'Historique vide' : `Historique avec ${this.history.length} combinaisons`
    );
  }
  
  sortByRating(ascending = true) {
    this.history.sort((a, b) => ascending ? a.note - b.note : b.note - a.note);
    this.updateHistoryList();
    this.notifyObservers();
    
    NotificationManager.info(`Historique trié par note ${ascending ? 'croissant' : 'décroissant'}`);
  }
  
  randomSort() {
    for (let i = this.history.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.history[i], this.history[j]] = [this.history[j], this.history[i]];
    }
    
    this.updateHistoryList();
    this.notifyObservers();
    NotificationManager.info('Historique mélangé aléatoirement');
  }
  
  exportTXT() {
    if (!this.validateHistoryForExport()) return;
    
    try {
      const content = this.generateTextContent();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      this.downloadFile(blob, CONFIG.EXPORT_FILE_NAMES.TXT);
      NotificationManager.success('Export TXT téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export TXT:', error);
      NotificationManager.error('Erreur lors de l\'export TXT');
    }
  }
  
  validateHistoryForExport() {
    if (this.history.length === 0) {
      NotificationManager.warning(CONFIG.MESSAGES.HISTORY_EMPTY);
      return false;
    }
    return true;
  }
  
  generateTextContent() {
    const header = `Historique des Combinaisons Poétiques\nGénéré le ${new Date().toLocaleString(CONFIG.DATE_FORMAT.LOCALE)}\n\n`;
    const stats = this.calculateStatistics();
    const statsSection = `Statistiques:\n- Total: ${stats.total} combinaisons\n- Note moyenne: ${stats.average}\n- Meilleure note: ${stats.best}\n- Pire note: ${stats.worst}\n\n`;
    const entriesSection = 'Combinaisons:\n' + this.history.map((entry, index) => 
      `${index + 1}. ${entry.text} (Note: ${entry.note}/10)`
    ).join('\n');
    const footer = `\n\n---\n© Les éditions Philopitre`;
    
    return header + statsSection + entriesSection + footer;
  }
  
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
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      NotificationManager.error(CONFIG.MESSAGES.PDF_GENERATION_ERROR);
    }
  }
  
  checkPDFLibrary() {
    return typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function';
  }
  
  createPDFDocument() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont(CONFIG.PDF_CONFIG.FONT_FAMILY);
    doc.setFontSize(CONFIG.PDF_CONFIG.FONT_SIZE);
    return doc;
  }
  
  addPDFContent(doc) {
    let y = CONFIG.PDF_CONFIG.HEADER_Y;
    
    doc.text('La poésie quantique - Les éditions Philopitre', CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
    y += 10;
    doc.text('Historique des combinaisons notées :', CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
    y = CONFIG.PDF_CONFIG.CONTENT_START_Y;
    
    this.history.forEach((entry, index) => {
      const entryText = `${index + 1}. ${entry.text} (Note : ${entry.note}/10)`;
      const splitText = doc.splitTextToSize(entryText, CONFIG.PDF_CONFIG.MAX_WIDTH);
      
      if (y + (splitText.length * CONFIG.PDF_CONFIG.LINE_HEIGHT) > CONFIG.PDF_CONFIG.PAGE_BREAK_Y) {
        doc.addPage();
        y = CONFIG.PDF_CONFIG.MARGIN_TOP;
      }
      
      doc.text(splitText, CONFIG.PDF_CONFIG.MARGIN_LEFT, y);
      y += (splitText.length * CONFIG.PDF_CONFIG.LINE_HEIGHT) + 7;
    });
  }
  
  downloadFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
  
  reset() {
    if (confirm(CONFIG.MESSAGES.CACHE_RESET_CONFIRM)) {
      this.history = [];
      
      try {
        localStorage.removeItem(CONFIG.STORAGE.HISTORY_KEY);
        this.updateDisplay();
        this.notifyObservers();
        NotificationManager.success(CONFIG.MESSAGES.CACHE_RESET_SUCCESS);
      } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        NotificationManager.error('Erreur lors de la réinitialisation');
      }
    }
  }
  
  addObserver(callback) {
    if (typeof callback !== 'function') {
      throw new Error('L\'observateur doit être une fonction');
    }
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) this.observers.splice(index, 1);
    };
  }
  
  notifyObservers() {
    const data = { history: [...this.history], statistics: this.calculateStatistics() };
    this.observers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Erreur dans un observateur:', error);
      }
    });
  }
  
  dispatchHistoryUpdateEvent(entry) {
    document.dispatchEvent(new CustomEvent(CONFIG.EVENTS.HISTORY_UPDATED, {
      detail: {
        entry,
        totalEntries: this.history.length,
        statistics: this.calculateStatistics(),
        timestamp: Date.now()
      }
    }));
  }
  
  getDetailedStatistics() {
    const basic = this.calculateStatistics();
    if (this.history.length === 0) {
      return { ...basic, distribution: {}, median: 0, mode: null, standardDeviation: 0 };
    }
    
    const notes = this.history.map(entry => entry.note);
    const distribution = {};
    for (let i = CONFIG.LIMITS.MIN_RATING; i <= CONFIG.LIMITS.MAX_RATING; i++) {
      distribution[i] = notes.filter(note => note === i).length;
    }
    
    return { ...basic, distribution };
  }
  
  validate() {
    const issues = [];
    const warnings = [];
    
    this.history.forEach((entry, index) => {
      if (!this.isValidHistoryEntry(entry)) {
        issues.push(`Entrée ${index} invalide`);
      }
    });
    
    if (this.history.length > CONFIG.LIMITS.MAX_HISTORY_ENTRIES) {
      warnings.push(`Historique trop volumineux: ${this.history.length} > ${CONFIG.LIMITS.MAX_HISTORY_ENTRIES}`);
    }
    
    return { isValid: issues.length === 0, issues, warnings, historyLength: this.history.length };
  }
  
  getDebugInfo() {
    return {
      historyLength: this.history.length,
      observers: this.observers.length,
      statistics: this.getDetailedStatistics(),
      validation: this.validate()
    };
  }
  
  cleanup() {
    this.saveHistory();
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.observers = [];
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('HistoryManager: Nettoyage effectué');
    }
  }
  /**
 * Réinitialise complètement l'historique
 * Vide toutes les entrées et met à jour l'affichage
 */
clear() {
  this.history = [];
  this.saveHistory();
  this.updateDisplay();
  this.notifyObservers();
  
  if (CONFIG.DEBUG.ENABLED) {
    console.log('HistoryManager: Historique réinitialisé');
  }
}
}

export default HistoryManager;
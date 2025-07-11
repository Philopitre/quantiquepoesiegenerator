/**
 * Gestionnaire de notifications pour l'application
 * Gère l'affichage, l'animation et la suppression des notifications utilisateur
 * @module NotificationManager
 */

import { CONFIG } from './config.js';

/**
 * Classe statique pour gérer les notifications
 */
export class NotificationManager {
  
  /**
   * Instance unique pour le singleton (optionnel)
   * @private
   */
  static instance = null;
  
  /**
   * Queue des notifications en attente
   * @private
   */
  static queue = [];
  
  /**
   * Notification actuellement affichée
   * @private
   */
  static currentNotification = null;
  
  /**
   * Affiche une notification à l'utilisateur
   * @param {string} message - Le message à afficher
   * @param {Object} options - Options d'affichage
   * @param {string} options.type - Type de notification ('info', 'success', 'warning', 'error')
   * @param {number} options.duration - Durée d'affichage en ms
   * @param {boolean} options.persistent - Si true, la notification ne disparaît pas automatiquement
   */
  static show(message, options = {}) {
    // Validation des paramètres
    if (!message || typeof message !== 'string') {
      console.error('NotificationManager: Le message doit être une chaîne non vide');
      return;
    }
    
    // Configuration par défaut
    const config = {
      type: 'info',
      duration: CONFIG.NOTIFICATION_DURATION,
      persistent: false,
      ...options
    };
    
    // Limitation de la longueur du message
    const truncatedMessage = message.length > CONFIG.LIMITS.MAX_NOTIFICATION_LENGTH 
      ? message.substring(0, CONFIG.LIMITS.MAX_NOTIFICATION_LENGTH) + '...'
      : message;
    
    // Si une notification est déjà affichée, l'ajouter à la queue
    if (this.currentNotification) {
      this.queue.push({ message: truncatedMessage, config });
      return;
    }
    
    this._displayNotification(truncatedMessage, config);
    
    // Log de debug
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('Notification displayed:', { message: truncatedMessage, config });
    }
  }
  
  /**
   * Affiche effectivement la notification
   * @private
   * @param {string} message - Message à afficher
   * @param {Object} config - Configuration de la notification
   */
  static _displayNotification(message, config) {
    // Supprimer toute notification existante
    this._removeExistingNotification();
    
    // Créer l'élément de notification
    const notification = this._createNotificationElement(message, config);
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    this.currentNotification = notification;
    
    // Animation d'entrée
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Programmer la suppression automatique si non persistante
    if (!config.persistent) {
      this._scheduleRemoval(notification, config.duration);
    }
    
    // Ajouter les event listeners pour l'interaction
    this._addNotificationListeners(notification);
  }
  
  /**
   * Crée l'élément DOM de la notification
   * @private
   * @param {string} message - Message à afficher
   * @param {Object} config - Configuration
   * @returns {HTMLElement} L'élément de notification
   */
  static _createNotificationElement(message, config) {
    const notification = document.createElement('div');
    notification.className = `${CONFIG.CSS_CLASSES.NOTIFICATION} notification-${config.type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.textContent = message;
    
    // Ajouter un bouton de fermeture pour les notifications persistantes
    if (config.persistent) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.className = 'notification-close';
      closeButton.setAttribute('aria-label', 'Fermer la notification');
      closeButton.addEventListener('click', () => this.dismiss());
      notification.appendChild(closeButton);
    }
    
    return notification;
  }
  
  /**
   * Supprime une notification existante
   * @private
   */
  static _removeExistingNotification() {
    const existingNotif = document.querySelector(CONFIG.SELECTORS.EXISTING_NOTIFICATION);
    if (existingNotif) {
      existingNotif.remove();
    }
  }
  
  /**
   * Programme la suppression automatique d'une notification
   * @private
   * @param {HTMLElement} notification - Élément de notification
   * @param {number} duration - Durée avant suppression
   */
  static _scheduleRemoval(notification, duration) {
    setTimeout(() => {
      this._fadeOutNotification(notification);
    }, duration);
  }
  
  /**
   * Anime la disparition d'une notification
   * @private
   * @param {HTMLElement} notification - Élément de notification
   */
  static _fadeOutNotification(notification) {
    if (!notification || !notification.parentNode) {
      return;
    }
    
    notification.classList.add(CONFIG.CSS_CLASSES.NOTIFICATION_FADE);
    
    // Attendre la fin de l'animation CSS
    notification.addEventListener('transitionend', () => {
      this._removeNotification(notification);
    }, { once: true });
    
    // Fallback si l'événement transitionend ne se déclenche pas
    setTimeout(() => {
      this._removeNotification(notification);
    }, CONFIG.NOTIFICATION_FADE_DURATION + 100);
  }
  
  /**
   * Supprime définitivement une notification du DOM
   * @private
   * @param {HTMLElement} notification - Élément de notification
   */
  static _removeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    
    // Réinitialiser la notification courante
    if (this.currentNotification === notification) {
      this.currentNotification = null;
    }
    
    // Traiter la queue si elle contient des notifications en attente
    this._processQueue();
  }
  
  /**
   * Traite la queue des notifications en attente
   * @private
   */
  static _processQueue() {
    if (this.queue.length > 0 && !this.currentNotification) {
      const { message, config } = this.queue.shift();
      this._displayNotification(message, config);
    }
  }
  
  /**
   * Ajoute les event listeners à une notification
   * @private
   * @param {HTMLElement} notification - Élément de notification
   */
  static _addNotificationListeners(notification) {
    // Permettre de fermer en cliquant sur la notification
    notification.addEventListener('click', () => {
      this.dismiss();
    });
    
    // Support du clavier
    notification.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        this.dismiss();
      }
    });
    
    // Rendre focusable pour l'accessibilité
    notification.setAttribute('tabindex', '-1');
    notification.focus();
  }
  
  /**
   * Ferme manuellement la notification courante
   */
  static dismiss() {
    if (this.currentNotification) {
      this._fadeOutNotification(this.currentNotification);
    }
  }
  
  /**
   * Ferme toutes les notifications et vide la queue
   */
  static dismissAll() {
    this.dismiss();
    this.queue = [];
  }
  
  /**
   * Affiche une notification de succès
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  static success(message, options = {}) {
    this.show(message, { ...options, type: 'success' });
  }
  
  /**
   * Affiche une notification d'erreur
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  static error(message, options = {}) {
    this.show(message, { ...options, type: 'error' });
  }
  
  /**
   * Affiche une notification d'avertissement
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  static warning(message, options = {}) {
    this.show(message, { ...options, type: 'warning' });
  }
  
  /**
   * Affiche une notification d'information
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  static info(message, options = {}) {
    this.show(message, { ...options, type: 'info' });
  }
  
  /**
   * Retourne le nombre de notifications en attente
   * @returns {number} Nombre de notifications dans la queue
   */
  static getQueueLength() {
    return this.queue.length;
  }
  
  /**
   * Vérifie si une notification est actuellement affichée
   * @returns {boolean} True si une notification est affichée
   */
  static isDisplaying() {
    return this.currentNotification !== null;
  }
  
  /**
   * Méthode de nettoyage pour éviter les fuites mémoire
   */
  static cleanup() {
    this.dismissAll();
    this.currentNotification = null;
    this.queue = [];
  }
  
  /**
   * Valide le système de notifications
   * @returns {Object} Résultat de la validation
   */
  static validate() {
    return {
      isValid: true,
      currentNotification: !!this.currentNotification,
      queueLength: this.queue.length,
      timestamp: Date.now()
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  static getDebugInfo() {
    return {
      currentNotification: !!this.currentNotification,
      queueLength: this.queue.length,
      queue: this.queue.map(item => ({ type: item.config.type, messageLength: item.message.length })),
      validation: this.validate()
    };
  }
}

// Méthodes utilitaires pour les cas d'usage courants
export const notify = {
  /**
   * Raccourci pour afficher une notification simple
   */
  show: (message, options) => NotificationManager.show(message, options),
  
  /**
   * Raccourci pour une notification de succès
   */
  success: (message, options) => NotificationManager.success(message, options),
  
  /**
   * Raccourci pour une notification d'erreur
   */
  error: (message, options) => NotificationManager.error(message, options),
  
  /**
   * Raccourci pour une notification d'avertissement
   */
  warning: (message, options) => NotificationManager.warning(message, options),
  
  /**
   * Raccourci pour une notification d'information
   */
  info: (message, options) => NotificationManager.info(message, options),
  
  /**
   * Raccourci pour fermer les notifications
   */
  dismiss: () => NotificationManager.dismiss(),
  
  /**
   * Raccourci pour fermer toutes les notifications
   */
  dismissAll: () => NotificationManager.dismissAll()
};

// Export par défaut de la classe principale
export default NotificationManager;
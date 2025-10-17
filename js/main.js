/**
 * Point d'entrée de l'application Générateur de Combinaisons Poétiques
 * Initialise l'application principale et gère les erreurs globales
 */

import { PoeticGenerator } from './PoeticGenerator.js';
import { CONFIG } from './config.js';

/**
 * Initialise l'application une fois le DOM chargé
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Vérification de compatibilité du navigateur
    if (!checkBrowserCompatibility()) {
      showCompatibilityError();
      return;
    }
    
    // Initialiser l'application principale
    const app = new PoeticGenerator();
    
    // Exposer globalement pour le debug si nécessaire
    if (CONFIG.DEBUG.ENABLED) {
      window.poeticApp = app;
      console.log('Application Générateur de Combinaisons Poétiques initialisée');
    }
    
    // Gestionnaire d'erreurs globales
    setupGlobalErrorHandlers(app);
    
  } catch (error) {
    console.error('Erreur fatale lors de l\'initialisation:', error);
    showFatalError(error);
  }
});

/**
 * Vérifie la compatibilité du navigateur
 * @returns {boolean} True si compatible
 */
function checkBrowserCompatibility() {
  const requiredFeatures = [
    'Promise',
    'fetch',
    'localStorage',
    'addEventListener',
    'querySelector',
    'classList'
  ];
  
  const missingFeatures = requiredFeatures.filter(feature => {
    try {
      switch (feature) {
        case 'Promise':
          return typeof Promise === 'undefined';
        case 'fetch':
          return typeof fetch === 'undefined';
        case 'localStorage':
          return typeof localStorage === 'undefined';
        case 'addEventListener':
          return typeof document.addEventListener === 'undefined';
        case 'querySelector':
          return typeof document.querySelector === 'undefined';
        case 'classList':
          return !document.createElement('div').classList;
        default:
          return false;
      }
    } catch (error) {
      return true;
    }
  });
  
  if (missingFeatures.length > 0) {
    console.error('Fonctionnalités manquantes:', missingFeatures);
    return false;
  }
  
  // Vérifier le support des modules ES6
  const supportsModules = 'noModule' in document.createElement('script');
  if (!supportsModules) {
    console.error('Modules ES6 non supportés');
    return false;
  }
  
  return true;
}

/**
 * Affiche une erreur de compatibilité
 */
function showCompatibilityError() {
  const errorMessage = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 10000;
    ">
      <h3>Navigateur non compatible</h3>
      <p>Votre navigateur ne supporte pas toutes les fonctionnalités requises pour cette application.</p>
      <p>Veuillez utiliser une version récente de Chrome, Firefox, Safari ou Edge.</p>
      <small>Fonctionnalités requises : ES6 Modules, Promise, fetch, localStorage</small>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', errorMessage);
}

/**
 * Affiche une erreur fatale
 * @param {Error} error - Erreur survenue
 */
function showFatalError(error) {
  const errorMessage = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 10000;
    ">
      <h3>Erreur de chargement</h3>
      <p>Une erreur est survenue lors du chargement de l'application.</p>
      <p>Veuillez recharger la page ou vérifier votre connexion.</p>
      ${CONFIG.DEBUG.ENABLED ? `<details style="margin-top: 15px; text-align: left;"><summary>Détails de l'erreur</summary><pre style="font-size: 12px; overflow: auto; max-height: 150px;">${error.stack || error.message}</pre></details>` : ''}
      <button onclick="window.location.reload()" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 15px;
      ">Recharger la page</button>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', errorMessage);
}

/**
 * Configure les gestionnaires d'erreurs globales
 * @param {PoeticGenerator} app - Instance de l'application
 */
function setupGlobalErrorHandlers(app) {
  // Erreurs JavaScript non gérées
  window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript non gérée:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Notification à l'utilisateur pour les erreurs critiques
    if (event.error && event.error.name !== 'TypeError') {
      showErrorNotification('Une erreur inattendue est survenue. L\'application peut ne pas fonctionner correctement.');
    }
  });
  
  // Promesses rejetées non gérées
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée non gérée:', event.reason);
    
    // Éviter les erreurs de réseau communes
    if (event.reason && event.reason.name !== 'TypeError' && !event.reason.message?.includes('fetch')) {
      showErrorNotification('Une erreur asynchrone est survenue.');
    }
  });
  
  // Erreurs de chargement de ressources
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      console.error('Erreur de chargement de ressource:', {
        element: event.target.tagName,
        source: event.target.src || event.target.href,
        message: 'Ressource non trouvée ou non accessible'
      });
    }
  }, true);
  
  // Gestion de la fermeture de la page
  window.addEventListener('beforeunload', (event) => {
    try {
      // Nettoyer l'application si possible
      if (app && typeof app.cleanup === 'function') {
        app.cleanup();
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage avant fermeture:', error);
    }
  });
  
  // Gestion de la visibilité de la page (CORRIGÉ)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page cachée - sauvegarder l'état si nécessaire
      try {
        // Vérifier que l'app existe et a les méthodes nécessaires
        if (app && typeof app.isReady === 'function' && app.isReady()) {
          const historyManager = app.getManager('history');
          if (historyManager && typeof historyManager.saveHistory === 'function') {
            historyManager.saveHistory();
          }
        }
      } catch (error) {
        // Ne pas afficher d'erreur pour les problèmes de sauvegarde automatique
        if (CONFIG.DEBUG.ENABLED) {
          console.warn('Avertissement lors de la sauvegarde automatique:', error);
        }
      }
    }
  });
}

/**
 * Affiche une notification d'erreur à l'utilisateur
 * @param {string} message - Message d'erreur
 */
function showErrorNotification(message) {
  // Utiliser le système de notification si disponible
  if (window.NotificationManager && typeof window.NotificationManager.error === 'function') {
    window.NotificationManager.error(message);
    return;
  }
  
  // Fallback avec une notification simple
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Supprimer après 5 secondes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}
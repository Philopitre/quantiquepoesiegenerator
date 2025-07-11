/**
 * Gestionnaire de partage et d'export
 * Gère le partage sur les réseaux sociaux, la copie et la génération d'images
 * @module ShareManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer toutes les fonctionnalités de partage
 */
export class ShareManager {
  
  /**
   * Initialise le gestionnaire de partage
   * @param {CombinationGenerator} combinationGenerator - Instance du générateur de combinaisons
   */
  constructor(combinationGenerator) {
    if (!combinationGenerator) {
      throw new Error('ShareManager: CombinationGenerator requis');
    }
    
    this.combinationGenerator = combinationGenerator;
    this.capabilities = this.detectCapabilities();
    this.shareHistory = [];
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager initialized with capabilities:', this.capabilities);
    }
  }
  
  /**
   * Initialise le gestionnaire
   * @private
   */
  init() {
    this.validateConfiguration();
    this.setupEventListeners();
  }
  
  /**
   * Détecte les capacités du navigateur
   * @returns {Object} Capacités détectées
   * @private
   */
  detectCapabilities() {
    return {
      clipboard: !!navigator.clipboard?.writeText,
      nativeShare: !!navigator.share,
      canvas: !!document.createElement('canvas').getContext,
      download: !!document.createElement('a').download !== undefined,
      popups: this.testPopupCapability(),
      webShare: !!navigator.share && this.isWebShareSupported()
    };
  }
  
  /**
   * Teste la capacité d'ouvrir des popups
   * @returns {boolean} Capacité de popup
   * @private
   */
  testPopupCapability() {
    try {
      // Test simple sans ouvrir réellement une popup
      return typeof window.open === 'function';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Vérifie le support de Web Share API
   * @returns {boolean} Support de Web Share
   * @private
   */
  isWebShareSupported() {
    return 'share' in navigator && 
           'canShare' in navigator &&
           navigator.canShare({ text: 'test' });
  }
  
  /**
   * Valide la configuration du partage
   * @private
   */
  validateConfiguration() {
    // Vérifier les URLs de partage
    Object.entries(CONFIG.SHARE_URLS).forEach(([platform, url]) => {
      try {
        new URL(url + 'test');
      } catch (error) {
        console.warn(`ShareManager: URL invalide pour ${platform}:`, url);
      }
    });
    
    // Avertir sur les limitations
    if (!this.capabilities.clipboard) {
      console.warn('ShareManager: Clipboard API non disponible');
    }
    
    if (!this.capabilities.canvas) {
      console.warn('ShareManager: Canvas non disponible pour la génération d\'images');
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    // Écouter les événements de génération pour réinitialiser l'état de partage
    document.addEventListener(CONFIG.EVENTS.COMBINATION_GENERATED, () => {
      this.onNewCombinationGenerated();
    });
    
    // Écouter les changements de visibilité pour les analytics
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      }
    });
  }
  
  /**
   * Appelée lors de la génération d'une nouvelle combinaison
   * @private
   */
  onNewCombinationGenerated() {
    // Réinitialiser l'historique de partage pour cette combinaison
    this.shareHistory = [];
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager: Nouvelle combinaison, historique de partage réinitialisé');
    }
  }
  
  /**
   * Appelée quand la page devient cachée
   * @private
   */
  onPageHidden() {
    // Optionnel : sauvegarder des analytics de partage
    if (this.shareHistory.length > 0 && CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager: Partages de la session:', this.shareHistory);
    }
  }
  
  /**
   * Copie la combinaison dans le presse-papier
   */
  async copyToClipboard() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    try {
      if (this.capabilities.clipboard) {
        await navigator.clipboard.writeText(combination);
        NotificationManager.success(CONFIG.MESSAGES.COMBINATION_COPIED);
      } else {
        // Fallback pour les navigateurs sans Clipboard API
        this.fallbackCopyToClipboard(combination);
      }
      
      this.recordShareAction('clipboard', combination);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
        console.log('ShareManager: Combinaison copiée:', combination);
      }
      
    } catch (error) {
      console.error('ShareManager: Erreur lors de la copie:', error);
      NotificationManager.error(CONFIG.MESSAGES.COPY_ERROR);
      
      // Tenter le fallback en cas d'erreur
      this.fallbackCopyToClipboard(combination);
    }
  }
  
  /**
   * Méthode de fallback pour la copie
   * @param {string} text - Texte à copier
   * @private
   */
  fallbackCopyToClipboard(text) {
    try {
      // Créer un élément textarea temporaire
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      // Utiliser l'ancienne API
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        NotificationManager.success(CONFIG.MESSAGES.COMBINATION_COPIED);
      } else {
        throw new Error('execCommand failed');
      }
      
    } catch (error) {
      console.error('ShareManager: Fallback copie échoué:', error);
      NotificationManager.error('Impossible de copier. Sélectionnez et copiez manuellement.');
    }
  }
  
  /**
   * Partage sur Twitter
   */
  shareOnTwitter() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'twitter');
    const url = CONFIG.SHARE_URLS.TWITTER + encodeURIComponent(shareText);
    
    this.openShareWindow(url, 'Twitter', 550, 420);
    this.recordShareAction('twitter', combination);
  }
  
  /**
   * Partage sur WhatsApp
   */
  shareOnWhatsApp() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'whatsapp');
    const url = CONFIG.SHARE_URLS.WHATSAPP + encodeURIComponent(shareText);
    
    // WhatsApp peut utiliser l'app native sur mobile
    if (this.isMobileDevice()) {
      window.location.href = url;
    } else {
      this.openShareWindow(url, 'WhatsApp', 600, 500);
    }
    
    this.recordShareAction('whatsapp', combination);
  }
  
  /**
   * Partage sur Facebook
   */
  shareOnFacebook() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'facebook');
    const url = CONFIG.SHARE_URLS.FACEBOOK + encodeURIComponent(shareText);
    
    this.openShareWindow(url, 'Facebook', 600, 400);
    this.recordShareAction('facebook', combination);
  }
  
  /**
   * Partage par email
   */
  shareByEmail() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const subject = 'Ma combinaison poétique';
    const body = this.formatCombinationForEmail(combination);
    const url = `${CONFIG.SHARE_URLS.EMAIL}${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      window.location.href = url;
      this.recordShareAction('email', combination);
    } catch (error) {
      console.error('ShareManager: Erreur lors du partage email:', error);
      NotificationManager.error('Erreur lors de l\'ouverture du client email');
    }
  }
  
  /**
   * Génère une image de la combinaison
   */
  generateImage() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    if (!this.capabilities.canvas) {
      NotificationManager.error('Génération d\'image non supportée sur ce navigateur');
      return;
    }
    
    try {
      const canvas = this.createCombinationCanvas(combination);
      this.downloadCanvasAsImage(canvas, CONFIG.EXPORT_FILE_NAMES.IMAGE);
      
      NotificationManager.success('Image générée et téléchargée avec succès');
      this.recordShareAction('image', combination);
      
      if (CONFIG.DEBUG.ENABLED) {
        console.log('ShareManager: Image générée avec succès');
      }
      
    } catch (error) {
      console.error('ShareManager: Erreur lors de la génération d\'image:', error);
      NotificationManager.error(CONFIG.MESSAGES.IMAGE_GENERATION_ERROR);
    }
  }
  
  /**
   * Crée un canvas avec la combinaison
   * @param {string} combination - Combinaison à dessiner
   * @returns {HTMLCanvasElement} Canvas créé
   * @private
   */
  createCombinationCanvas(combination) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error(CONFIG.MESSAGES.CANVAS_ERROR);
    }
    
    // Configuration du canvas
    canvas.width = CONFIG.IMAGE_CONFIG.WIDTH;
    canvas.height = CONFIG.IMAGE_CONFIG.HEIGHT;
    
    // Fond
    this.drawBackground(context, canvas);
    
    // Texte principal
    this.drawCombinationText(context, canvas, combination);
    
    // Signature/watermark
    this.drawWatermark(context, canvas);
    
    return canvas;
  }
  
  /**
   * Dessine le fond du canvas
   * @param {CanvasRenderingContext2D} context - Contexte du canvas
   * @param {HTMLCanvasElement} canvas - Canvas
   * @private
   */
  drawBackground(context, canvas) {
    // Dégradé de fond
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Bordure décorative
    context.strokeStyle = '#dee2e6';
    context.lineWidth = 8;
    context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  }
  
  /**
   * Dessine le texte de la combinaison
   * @param {CanvasRenderingContext2D} context - Contexte du canvas
   * @param {HTMLCanvasElement} canvas - Canvas
   * @param {string} combination - Combinaison à dessiner
   * @private
   */
  drawCombinationText(context, canvas, combination) {
    context.fillStyle = CONFIG.IMAGE_CONFIG.TEXT_COLOR;
    context.font = CONFIG.IMAGE_CONFIG.FONT_FAMILY;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Découper le texte en lignes
    const words = combination.split(' ');
    const lines = this.wrapText(context, words, canvas.width - CONFIG.IMAGE_CONFIG.PADDING * 2);
    
    // Dessiner chaque ligne
    const lineHeight = CONFIG.IMAGE_CONFIG.LINE_HEIGHT;
    const startY = (canvas.height - lines.length * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      context.fillText(line, canvas.width / 2, y);
    });
  }
  
  /**
   * Découpe le texte en lignes pour le canvas
   * @param {CanvasRenderingContext2D} context - Contexte du canvas
   * @param {string[]} words - Mots à disposer
   * @param {number} maxWidth - Largeur maximale
   * @returns {string[]} Lignes de texte
   * @private
   */
  wrapText(context, words, maxWidth) {
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }
  
  /**
   * Dessine le watermark/signature
   * @param {CanvasRenderingContext2D} context - Contexte du canvas
   * @param {HTMLCanvasElement} canvas - Canvas
   * @private
   */
  drawWatermark(context, canvas) {
    context.font = '24px Arial';
    context.fillStyle = '#6c757d';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    
    const watermarkText = '© Les éditions augmentées Provoq\'émois';
    context.fillText(watermarkText, canvas.width / 2, canvas.height - 60);
  }
  
  /**
   * Télécharge un canvas en tant qu'image
   * @param {HTMLCanvasElement} canvas - Canvas à télécharger
   * @param {string} filename - Nom du fichier
   * @private
   */
  downloadCanvasAsImage(canvas, filename) {
    if (!this.capabilities.download) {
      NotificationManager.error('Téléchargement non supporté sur ce navigateur');
      return;
    }
    
    // Convertir en blob pour un meilleur support
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Impossible de créer l\'image');
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    }, 'image/png', 0.95);
  }
  
  /**
   * Ouvre une fenêtre de partage
   * @param {string} url - URL à ouvrir
   * @param {string} name - Nom de la fenêtre
   * @param {number} width - Largeur de la fenêtre
   * @param {number} height - Hauteur de la fenêtre
   * @private
   */
  openShareWindow(url, name, width = 600, height = 400) {
    if (!this.capabilities.popups) {
      // Fallback : ouvrir dans un nouvel onglet
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    try {
      // Centrer la fenêtre popup
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no'
      ].join(',');
      
      const popup = window.open(url, `share_${name}`, features);
      
      if (!popup) {
        // Popup bloquée - fallback vers nouvel onglet
        window.open(url, '_blank', 'noopener,noreferrer');
        NotificationManager.warning('Popup bloquée. Ouverture dans un nouvel onglet.');
      }
      
    } catch (error) {
      console.error('ShareManager: Erreur lors de l\'ouverture de la popup:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
  
  /**
   * Récupère la combinaison pour le partage
   * @returns {string|null} Combinaison ou null si non disponible
   * @private
   */
  getCombinationForSharing() {
    const combination = this.combinationGenerator.getCurrentCombination();
    
    if (!combination || !this.combinationGenerator.isCombinationReady()) {
      NotificationManager.warning(CONFIG.MESSAGES.GENERATE_FIRST);
      return null;
    }
    
    return combination;
  }
  
  /**
   * Formate une combinaison pour les réseaux sociaux
   * @param {string} combination - Combinaison à formater
   * @param {string} platform - Plateforme cible
   * @returns {string} Texte formaté
   * @private
   */
  formatCombinationForSocial(combination, platform) {
    const baseText = `"${combination}"`;
    
    switch (platform) {
      case 'twitter':
        return `${baseText} ✨ Généré avec le Générateur de Combinaisons Poétiques 🎭 #PoésieQuantique #EditionsProvoqémois`;
        
      case 'facebook':
        return `${baseText}\n\n✨ Découvrez le Générateur de Combinaisons Poétiques !\n🎭 Une création des éditions Provoq'émois`;
        
      case 'whatsapp':
        return `${baseText}\n\n🌟 Généré avec le Générateur de Combinaisons Poétiques\n© Les éditions augmentées Provoq'émois`;
        
      default:
        return baseText;
    }
  }
  
  /**
   * Formate une combinaison pour l'email
   * @param {string} combination - Combinaison à formater
   * @returns {string} Corps de l'email
   * @private
   */
  formatCombinationForEmail(combination) {
    return `Bonjour,

Je souhaite partager avec vous cette combinaison poétique que j'ai générée :

"${combination}"

Cette création a été réalisée avec le Générateur de Combinaisons Poétiques des éditions augmentées Provoq'émois.

Bonne découverte !

---
Généré sur ${window.location.href}`;
  }
  
  /**
   * Détecte si l'utilisateur est sur un appareil mobile
   * @returns {boolean} True si mobile
   * @private
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  }
  
  /**
   * Enregistre une action de partage pour les analytics
   * @param {string} platform - Plateforme utilisée
   * @param {string} combination - Combinaison partagée
   * @private
   */
  recordShareAction(platform, combination) {
    const shareAction = {
      platform,
      combination: combination.substring(0, 50) + '...', // Tronquer pour la vie privée
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100), // Tronquer
      isMobile: this.isMobileDevice()
    };
    
    this.shareHistory.push(shareAction);
    
    // Limiter l'historique de session
    if (this.shareHistory.length > 50) {
      this.shareHistory.shift();
    }
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('ShareManager: Action de partage enregistrée:', shareAction);
    }
  }
  
  /**
   * Retourne les statistiques de partage
   * @returns {Object} Statistiques de partage
   */
  getShareStatistics() {
    const platformCounts = {};
    let totalShares = 0;
    
    this.shareHistory.forEach(action => {
      platformCounts[action.platform] = (platformCounts[action.platform] || 0) + 1;
      totalShares++;
    });
    
    return {
      totalShares,
      platformCounts,
      capabilities: this.capabilities,
      recentShares: this.shareHistory.slice(-5),
      sessionStarted: this.shareHistory.length > 0 ? this.shareHistory[0].timestamp : null
    };
  }
  
  /**
   * Valide le gestionnaire de partage
   * @returns {Object} Résultat de la validation
   */
  validate() {
    return {
      isValid: !!this.combinationGenerator,
      capabilities: this.capabilities,
      shareHistoryLength: this.shareHistory.length,
      timestamp: Date.now()
    };
  }
  
  /**
   * Retourne les informations de debug
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      capabilities: this.capabilities,
      shareHistory: this.shareHistory.length,
      recentShares: this.shareHistory.slice(-3),
      statistics: this.getShareStatistics(),
      combinationGenerator: !!this.combinationGenerator,
      currentCombination: this.combinationGenerator?.getCurrentCombination() || null,
      isReady: this.combinationGenerator?.isCombinationReady() || false,
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources
   */
  cleanup() {
    // Nettoyer l'historique de partage
    this.shareHistory = [];
    
    // Supprimer les event listeners
    document.removeEventListener(CONFIG.EVENTS.COMBINATION_GENERATED, () => {});
    document.removeEventListener('visibilitychange', () => {});
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager: Nettoyage effectué');
    }
  }
}

export default ShareManager;
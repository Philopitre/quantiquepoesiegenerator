/**
 * SHAREMANAGER.JS - VERSION OPTIMISÉE
 * Gestionnaire de partage et d'export
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class ShareManager {
  constructor(combinationGenerator) {
    if (!combinationGenerator) throw new Error('CombinationGenerator requis');
    
    this.combinationGenerator = combinationGenerator;
    this.capabilities = this.detectCapabilities();
    this.shareHistory = [];
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager initialized:', this.capabilities);
    }
  }
  
  init() {
    this.validateConfiguration();
    this.setupEventListeners();
  }
  
  detectCapabilities() {
    return {
      clipboard: !!navigator.clipboard?.writeText,
      nativeShare: !!navigator.share,
      canvas: !!document.createElement('canvas').getContext,
      download: !!document.createElement('a').download !== undefined,
      popups: typeof window.open === 'function'
    };
  }
  
  validateConfiguration() {
    Object.entries(CONFIG.SHARE_URLS).forEach(([platform, url]) => {
      try {
        new URL(url + 'test');
      } catch (error) {
        console.warn(`URL invalide pour ${platform}:`, url);
      }
    });
  }
  
  setupEventListeners() {
    document.addEventListener(CONFIG.EVENTS.COMBINATION_GENERATED, () => {
      this.shareHistory = [];
    });
  }
  
  async copyToClipboard() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    try {
      if (this.capabilities.clipboard) {
        await navigator.clipboard.writeText(combination);
        NotificationManager.success(CONFIG.MESSAGES.COMBINATION_COPIED);
      } else {
        this.fallbackCopyToClipboard(combination);
      }
      this.recordShareAction('clipboard', combination);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      NotificationManager.error(CONFIG.MESSAGES.COPY_ERROR);
      this.fallbackCopyToClipboard(combination);
    }
  }
  
  fallbackCopyToClipboard(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        NotificationManager.success(CONFIG.MESSAGES.COMBINATION_COPIED);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error('Fallback copie échoué:', error);
      NotificationManager.error('Impossible de copier. Sélectionnez et copiez manuellement.');
    }
  }
  
  shareOnTwitter() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'twitter');
    const url = CONFIG.SHARE_URLS.TWITTER + encodeURIComponent(shareText);
    this.openShareWindow(url, 'Twitter', 550, 420);
    this.recordShareAction('twitter', combination);
  }
  
  shareOnWhatsApp() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'whatsapp');
    const url = CONFIG.SHARE_URLS.WHATSAPP + encodeURIComponent(shareText);
    
    if (this.isMobileDevice()) {
      window.location.href = url;
    } else {
      this.openShareWindow(url, 'WhatsApp', 600, 500);
    }
    this.recordShareAction('whatsapp', combination);
  }
  
  shareOnFacebook() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const shareText = this.formatCombinationForSocial(combination, 'facebook');
    const url = CONFIG.SHARE_URLS.FACEBOOK + encodeURIComponent(shareText);
    this.openShareWindow(url, 'Facebook', 600, 400);
    this.recordShareAction('facebook', combination);
  }
  
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
      console.error('Erreur lors du partage email:', error);
      NotificationManager.error('Erreur lors de l\'ouverture du client email');
    }
  }
  
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
    } catch (error) {
      console.error('Erreur lors de la génération d\'image:', error);
      NotificationManager.error(CONFIG.MESSAGES.IMAGE_GENERATION_ERROR);
    }
  }
  
  createCombinationCanvas(combination) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error(CONFIG.MESSAGES.CANVAS_ERROR);
    
    canvas.width = CONFIG.IMAGE_CONFIG.WIDTH;
    canvas.height = CONFIG.IMAGE_CONFIG.HEIGHT;
    
    this.drawBackground(context, canvas);
    this.drawCombinationText(context, canvas, combination);
    this.drawWatermark(context, canvas);
    
    return canvas;
  }
  
  drawBackground(context, canvas) {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.strokeStyle = '#dee2e6';
    context.lineWidth = 8;
    context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  }
  
  drawCombinationText(context, canvas, combination) {
    context.fillStyle = CONFIG.IMAGE_CONFIG.TEXT_COLOR;
    context.font = CONFIG.IMAGE_CONFIG.FONT_FAMILY;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    const words = combination.split(' ');
    const lines = this.wrapText(context, words, canvas.width - CONFIG.IMAGE_CONFIG.PADDING * 2);
    const lineHeight = CONFIG.IMAGE_CONFIG.LINE_HEIGHT;
    const startY = (canvas.height - lines.length * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
  }
  
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
    
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  }
  
  drawWatermark(context, canvas) {
    context.font = '24px Arial';
    context.fillStyle = '#6c757d';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    context.fillText('© Les éditions Philopitre', canvas.width / 2, canvas.height - 60);
  }
  
  downloadCanvasAsImage(canvas, filename) {
    if (!this.capabilities.download) {
      NotificationManager.error('Téléchargement non supporté sur ce navigateur');
      return;
    }
    
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Impossible de créer l\'image');
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png', 0.95);
  }
  
  openShareWindow(url, name, width = 600, height = 400) {
    if (!this.capabilities.popups) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    try {
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;
      
      const popup = window.open(url, `share_${name}`, features);
      if (!popup) {
        window.open(url, '_blank', 'noopener,noreferrer');
        NotificationManager.warning('Popup bloquée. Ouverture dans un nouvel onglet.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
  
  getCombinationForSharing() {
    const combination = this.combinationGenerator.getCurrentCombination();
    if (!combination || !this.combinationGenerator.isCombinationReady()) {
      NotificationManager.warning(CONFIG.MESSAGES.GENERATE_FIRST);
      return null;
    }
    return combination;
  }
  
  formatCombinationForSocial(combination, platform) {
    const baseText = `"${combination}"`;
    
    const formats = {
      twitter: `${baseText} ✨ Généré avec le Générateur de Combinaisons Poétiques 🎭 #PoésieQuantique #EditionsPhilopitre`,
      facebook: `${baseText}\n\n✨ Découvrez le Générateur de Combinaisons Poétiques !\n🎭 Une création des éditions Philopitre`,
      whatsapp: `${baseText}\n\n🌟 Généré avec le Générateur de Combinaisons Poétiques\n© Les éditions Philopitre`
    };
    
    return formats[platform] || baseText;
  }
  
  formatCombinationForEmail(combination) {
    return `Bonjour,

Je souhaite partager avec vous cette combinaison poétique :

"${combination}"

Créée avec le Générateur de Combinaisons Poétiques des éditions Philopitre.

Bonne découverte !

---
Généré sur ${window.location.href}`;
  }
  
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  }
  
  recordShareAction(platform, combination) {
    this.shareHistory.push({
      platform,
      combination: combination.substring(0, 50) + '...',
      timestamp: Date.now(),
      isMobile: this.isMobileDevice()
    });
    
    if (this.shareHistory.length > 50) this.shareHistory.shift();
  }
  
  validate() {
    return {
      isValid: !!this.combinationGenerator,
      capabilities: this.capabilities,
      shareHistoryLength: this.shareHistory.length
    };
  }
  
  getDebugInfo() {
    return {
      capabilities: this.capabilities,
      shareHistory: this.shareHistory.length,
      validation: this.validate()
    };
  }
  
  cleanup() {
    this.shareHistory = [];
    if (CONFIG.DEBUG.ENABLED) console.log('ShareManager: Nettoyage effectué');
  }
}

/**
 * ORDINATIONMANAGER.JS - VERSION OPTIMISÉE
 * Gestionnaire d'ordination des mots
 */

export class OrdinationManager {
  constructor(audioManager) {
    if (!audioManager) throw new Error('AudioManager requis');
    
    this.audioManager = audioManager;
    this.currentOrdination = 'original';
    this.wordListElement = null;
    this.toggleButton = null;
    
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
          { text: "professionnel", group: 1 },
          { text: "dans", group: 1 },
          { text: "l'erreur", group: 1 },
          { text: "en", group: 1 },
          { text: "tout", group: 1 },
          { text: "genre", group: 1 },
          { text: "proscrite", group: 1 },
          { text: "la", group: 1 },
          { text: "souveraine", group: 1 },
          { text: "intelligence", group: 1 },
          { text: "Rêveur", group: 2, dataWord: "rêveur" },
          { text: "mon", group: 2 },
          { text: "métier", group: 2 },
          { text: "exceptionnel", group: 2 },
          { text: "est", group: 2 },
          { text: "pour", group: 2 },
          { text: "moi-même", group: 2 },
          { text: "grandissant", group: 2 }
        ]
      }
    };
    
    this.init();
    if (CONFIG.DEBUG.ENABLED) console.log('OrdinationManager initialized');
  }
  
  init() {
    this.setupDOMReferences();
    this.createToggleButton();
    this.setupEventListeners();
    this.loadSavedOrdination();
  }
  
  setupDOMReferences() {
    this.wordListElement = document.getElementById(CONFIG.DOM_ELEMENTS.WORD_LIST);
    if (!this.wordListElement) console.error('Liste de mots non trouvée');
  }
  
  createToggleButton() {
    const controlsTop = document.querySelector('.controls-top');
    if (!controlsTop) {
      console.error('Conteneur de contrôles non trouvé');
      return;
    }
    
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'toggleOrdination';
    this.toggleButton.className = 'secondary';
    this.toggleButton.innerHTML = '🔄 Permuter l\'ordre';
    this.toggleButton.setAttribute('aria-label', 'Permuter entre les deux ordinations des mots');
    controlsTop.appendChild(this.toggleButton);
  }
  
  setupEventListeners() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleOrdination();
      });
    }
  }
  
  loadSavedOrdination() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE.ORDINATION_KEY || 'poeticOrdination');
      if (saved && ['original', 'alternative'].includes(saved)) {
        this.currentOrdination = saved;
      }
      this.applyOrdination(this.currentOrdination, false);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }
  
  saveOrdination() {
    try {
      localStorage.setItem(CONFIG.STORAGE.ORDINATION_KEY || 'poeticOrdination', this.currentOrdination);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }
  
  toggleOrdination() {
    const newOrdination = this.currentOrdination === 'original' ? 'alternative' : 'original';
    this.addTransitionEffect();
    
    setTimeout(() => {
      this.applyOrdination(newOrdination, true);
      this.currentOrdination = newOrdination;
      this.saveOrdination();
      this.updateButtonDisplay();
      this.playToggleSound();
      NotificationManager.show(`Basculé vers : ${this.ordinations[newOrdination].name}`);
    }, 150);
  }
  
  applyOrdination(ordinationType, animate = false) {
    if (!this.ordinations[ordinationType]) {
      console.error('Ordination inconnue:', ordinationType);
      return;
    }
    
    const ordination = this.ordinations[ordinationType];
    const wordsHTML = this.generateWordsHTML(ordination.words);
    
    if (animate) {
      this.wordListElement.style.opacity = '0';
      setTimeout(() => {
        this.updateWordListContent(wordsHTML);
        this.wordListElement.style.opacity = '1';
      }, 150);
    } else {
      this.updateWordListContent(wordsHTML);
    }
  }
  
  generateWordsHTML(words) {
    const wordsSpans = words.map(word => {
      const groupClass = `word-group-${word.group}`;
      const dataWordValue = word.dataWord || word.text;
      return `<span class="${groupClass}" data-word="${dataWordValue}" role="checkbox" aria-checked="true" tabindex="0">${word.text}</span>`;
    }).join('\n          ');
    
    return `<span class="word-list-label">Mots disponibles :</span>\n          ${wordsSpans}`;
  }
  
  updateWordListContent(htmlContent) {
    this.wordListElement.innerHTML = htmlContent;
    this.dispatchOrdinationChangeEvent();
  }
  
  addTransitionEffect() {
    if (this.wordListElement) {
      this.wordListElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      this.wordListElement.style.transform = 'scale(0.98)';
      setTimeout(() => this.wordListElement.style.transform = 'scale(1)', 300);
    }
  }
  
  updateButtonDisplay() {
    if (!this.toggleButton) return;
    
    const nextOrdination = this.currentOrdination === 'original' ? 'alternative' : 'original';
    const nextName = this.ordinations[nextOrdination].name;
    this.toggleButton.innerHTML = `🔄 Vers ${nextName.replace('Ordination ', '')}`;
  }
  
  playToggleSound() {
    if (this.audioManager && this.audioManager.isSoundEnabled()) {
      try {
        this.audioManager.playSound({ volume: 0.2, playbackRate: 1.5 });
      } catch (error) {
        if (CONFIG.DEBUG.ENABLED) console.warn('Erreur lors de la lecture du son:', error);
      }
    }
  }
  
  dispatchOrdinationChangeEvent() {
    document.dispatchEvent(new CustomEvent('ordinationChanged', {
      detail: {
        currentOrdination: this.currentOrdination,
        ordinationName: this.ordinations[this.currentOrdination].name,
        timestamp: Date.now()
      }
    }));
  }
  
  getCurrentOrdination() {
    return this.currentOrdination;
  }
  
  validate() {
    const issues = [];
    if (!this.wordListElement) issues.push('Liste de mots manquante');
    if (!this.toggleButton) issues.push('Bouton de basculement manquant');
    return { isValid: issues.length === 0, issues };
  }
  
  getDebugInfo() {
    return {
      currentOrdination: this.currentOrdination,
      validation: this.validate()
    };
  }
  
  cleanup() {
    if (this.toggleButton) this.toggleButton.removeEventListener('click', () => {});
    if (CONFIG.DEBUG.ENABLED) console.log('OrdinationManager: Nettoyage effectué');
  }
}

export default { ShareManager, OrdinationManager };
/**
 * Gestionnaire de partage et d'export (VERSION CORRIGÉE)
 * Gère le partage sur les réseaux sociaux et la génération d'images
 * @module ShareManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class ShareManager {
  constructor() {
    this.capabilities = this.detectCapabilities();
    this.shareActions = [];
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    if (CONFIG.DEBUG.ENABLED) {
      console.log('ShareManager initialisé', this.capabilities);
    }
  }
  
  detectCapabilities() {
    return {
      canvas: typeof HTMLCanvasElement !== 'undefined',
      clipboard: typeof navigator.clipboard !== 'undefined',
      share: typeof navigator.share !== 'undefined'
    };
  }
  
  setupEventListeners() {
    const shareButtons = {
      [CONFIG.DOM_ELEMENTS.SHARE_TWITTER]: () => this.shareOnTwitter(),
      [CONFIG.DOM_ELEMENTS.SHARE_WHATSAPP]: () => this.shareOnWhatsApp(),
      [CONFIG.DOM_ELEMENTS.SHARE_FACEBOOK]: () => this.shareOnFacebook(),
      [CONFIG.DOM_ELEMENTS.SHARE_EMAIL]: () => this.shareByEmail(),
      [CONFIG.DOM_ELEMENTS.GENERATE_IMAGE]: () => this.generateImage()
    };
    
    Object.entries(shareButtons).forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', handler);
      }
    });
  }
  
  getCombinationForSharing() {
    const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
    if (!resultElement || !resultElement.textContent.trim()) {
      NotificationManager.error(CONFIG.MESSAGES.GENERATE_FIRST);
      return null;
    }
    return resultElement.textContent.trim();
  }
  
  getCurrentRating() {
    const ratingInput = document.querySelector(CONFIG.DOM_ELEMENTS.RATING_CHECKED);
    return ratingInput ? parseInt(ratingInput.value, 10) : null;
  }
  
  getFormattedDateTime() {
    return new Date().toLocaleDateString(
      CONFIG.DATE_FORMAT.LOCALE, 
      CONFIG.DATE_FORMAT.OPTIONS
    );
  }
  
  formatCombinationForSocial(combination, rating, platform) {
    const ratingText = rating !== null ? ` (Note: ${rating}/10)` : '';
    const baseText = `${combination}${ratingText}`;
    
    const hashtags = platform === 'twitter' ? ' #PoésieQuantique #LesÉditionsPhilopitre' : 
                     platform === 'whatsapp' ? '\n\n Poésie Quantique - Les Éditions Philopitre' :
                     '\n\n📚 Découvrez la Poésie Quantique avec Les Éditions Philopitre';
    
    return baseText + hashtags;
  }
  
  formatCombinationForEmail(combination, rating) {
    const ratingText = rating !== null ? `Note attribuée : ${rating}/10\n\n` : '';
    return `Voici ma combinaison poétique générée :\n\n"${combination}"\n\n${ratingText}Découvrez la Poésie Quantique sur notre site !\n\n📚 Les Éditions Philopitre`;
  }
  
  openShareWindow(url, title, width, height) {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`;
    window.open(url, title, features);
  }
  
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  recordShareAction(platform, combination) {
    this.shareActions.push({
      platform,
      combination,
      timestamp: Date.now()
    });
    
    if (CONFIG.DEBUG.ENABLED) {
      console.log('Action de partage enregistrée:', platform);
    }
  }
  
  copyToClipboard(text) {
    if (!this.capabilities.clipboard) {
      NotificationManager.error('Copie non supportée. Sélectionnez et copiez manuellement.');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => NotificationManager.success(CONFIG.MESSAGES.COMBINATION_COPIED))
      .catch(() => NotificationManager.error(CONFIG.MESSAGES.COPY_ERROR));
  }
  
  shareOnTwitter() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const rating = this.getCurrentRating();
    const shareText = this.formatCombinationForSocial(combination, rating, 'twitter');
    const url = CONFIG.SHARE_URLS.TWITTER + encodeURIComponent(shareText);
    this.openShareWindow(url, 'Twitter', 550, 420);
    this.recordShareAction('twitter', combination);
  }
  
  shareOnWhatsApp() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const rating = this.getCurrentRating();
    const shareText = this.formatCombinationForSocial(combination, rating, 'whatsapp');
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
    
    const rating = this.getCurrentRating();
    const shareText = this.formatCombinationForSocial(combination, rating, 'facebook');
    const url = CONFIG.SHARE_URLS.FACEBOOK + encodeURIComponent(shareText);
    this.openShareWindow(url, 'Facebook', 600, 400);
    this.recordShareAction('facebook', combination);
  }
  
  shareByEmail() {
    const combination = this.getCombinationForSharing();
    if (!combination) return;
    
    const rating = this.getCurrentRating();
    const subject = 'Ma combinaison poétique';
    const body = this.formatCombinationForEmail(combination, rating);
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
      const rating = this.getCurrentRating();
      const dateTime = this.getFormattedDateTime();
      
      console.log('🖼️ ShareManager - Génération image:', {
        combination,
        rating,
        ratingType: typeof rating,
        dateTime,
        hasRating: rating !== null && rating !== undefined
      });
      
      const canvas = this.createCombinationCanvas(combination, rating, dateTime);
      this.downloadCanvasAsImage(canvas, CONFIG.EXPORT_FILE_NAMES.IMAGE);
      NotificationManager.success('Image générée et téléchargée avec succès');
      this.recordShareAction('image', combination);
    } catch (error) {
      console.error('Erreur lors de la génération d\'image:', error);
      NotificationManager.error(CONFIG.MESSAGES.IMAGE_GENERATION_ERROR);
    }
  }
  
  createCombinationCanvas(combination, rating, dateTime) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error(CONFIG.MESSAGES.CANVAS_ERROR);
    
    canvas.width = CONFIG.IMAGE_CONFIG.WIDTH;
    canvas.height = CONFIG.IMAGE_CONFIG.HEIGHT;
    
    // Dessiner tous les éléments
    this.drawEnhancedBackground(context, canvas);
    this.drawCombinationText(context, canvas, combination);
    
    // TOUJOURS afficher la note si elle existe (même si 0)
    if (rating !== null && rating !== undefined) {
      console.log(`✅ Appel de drawEnhancedRating avec rating = ${rating}`);
      this.drawEnhancedRating(context, canvas, rating);
    } else {
      console.warn('⚠️ Pas de note à afficher (rating est null ou undefined)');
    }
    
    this.drawEnhancedDateTime(context, canvas, dateTime);
    this.drawEnhancedWatermark(context, canvas);
    
    return canvas;
  }
  
 drawEnhancedBackground(context, canvas) {
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#FAF3E0');
  gradient.addColorStop(0.5, '#FFF8E7');
  gradient.addColorStop(1, '#F5E6D3');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const borderGradient = context.createLinearGradient(0, 0, canvas.width, 0);
  borderGradient.addColorStop(0, '#7A9E7E');
  borderGradient.addColorStop(0.5, '#52796F');
  borderGradient.addColorStop(1, '#84A98C');
  
  context.strokeStyle = borderGradient;
  context.lineWidth = 12;
  context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  
  context.strokeStyle = '#B5C99A';
  context.lineWidth = 3;
  context.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
}
  
  drawCombinationText(context, canvas, combination) {
  context.fillStyle = '#4A4A3A';
  context.font = 'italic 52px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  const words = combination.split(' ');
  const lines = this.wrapText(context, words, canvas.width - 200);
  const lineHeight = 70;
  const totalHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalHeight) / 2 - 50;
  
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    
    context.shadowColor = 'rgba(0, 0, 0, 0.1)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    context.fillText(line, canvas.width / 2, y);
    
    context.shadowColor = 'transparent';
  });
}
  
  drawEnhancedRating(context, canvas, rating) {
  console.log('🎨 drawEnhancedRating appelée avec rating =', rating);
  
  // Calculer la position SOUS la combinaison
  const words = this.getCurrentCombination().split(' ');
  const lines = this.wrapText(context, words, canvas.width - 200);
  const lineHeight = 70;
  const totalHeight = lines.length * lineHeight;
  const combinationEndY = ((canvas.height - totalHeight) / 2 - 50) + (lines.length * lineHeight);
  
  // Positionner la note 2-3 lignes sous la combinaison
  const centerX = canvas.width / 2;
  const y = combinationEndY + 150; // 2 lignes d'espacement
  
  // Créer un NOUVEAU contexte propre
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.globalAlpha = 1.0;
  context.filter = 'none';
  
  // Texte de la note simple et centré
  context.font = 'bold 48px Georgia, serif';
  context.fillStyle = '#4A4A3A';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  const noteText = `Note : ${rating}/10`;
  
  // Ombre légère pour relief
  context.shadowColor = 'rgba(0, 0, 0, 0.1)';
  context.shadowBlur = 4;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  
  context.fillText(noteText, centerX, y);
  
  context.restore();
  console.log('✅ Note affichée à y =', y);
  }
  
  wrapText(context, words, maxWidth) {
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

getCurrentCombination() {
  const resultElement = document.getElementById(CONFIG.DOM_ELEMENTS.RESULT);
  return resultElement ? resultElement.textContent.trim() : '';
}
  
  drawEnhancedDateTime(context, canvas, dateTime) {
  const centerX = canvas.width / 2;
  const y = canvas.height - 220; // Monté plus haut (était à -180)
  
  const boxWidth = 400;
  const boxHeight = 70;
  const boxX = centerX - boxWidth / 2;
  const boxY = y - boxHeight / 2;
  
  const boxGradient = context.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
  boxGradient.addColorStop(0, '#4A90E2');
  boxGradient.addColorStop(1, '#357ABD');
  
  context.save();
  context.fillStyle = boxGradient;
  context.shadowColor = 'rgba(0, 0, 0, 0.2)';
  context.shadowBlur = 15;
  context.shadowOffsetY = 5;
  this.roundRect(context, boxX, boxY, boxWidth, boxHeight, 20, true, false);
  context.restore();
  
  context.save();
  context.strokeStyle = '#fff';
  context.lineWidth = 3;
  this.roundRect(context, boxX, boxY, boxWidth, boxHeight, 20, false, true);
  context.restore();
  
  context.save();
  context.font = 'bold 22px Arial';
  context.fillStyle = '#FFFFFF';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(dateTime, centerX, y);
  context.restore();
}
  
  drawEnhancedWatermark(context, canvas) {
  const centerX = canvas.width / 2;
  const y = canvas.height - 100; // Monté plus haut (était à -80)
  
  context.save();
  context.font = 'bold 28px Georgia, serif';
  context.fillStyle = '#8B4513';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('© Les Éditions Philopitre', centerX, y);
  context.restore();  // "Poésie Quantique" retiré pour ne pas être caché par la ligne bleue
}
  
  roundRect(context, x, y, width, height, radius, fill, stroke) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    
    if (fill) context.fill();
    if (stroke) context.stroke();
  }
  
  downloadCanvasAsImage(canvas, filename) {
    canvas.toBlob(blob => {
      if (!blob) {
        NotificationManager.error('Erreur lors de la conversion en image');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
}
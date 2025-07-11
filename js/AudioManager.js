/**
 * Gestionnaire audio pour l'application (VERSION CORRIGÉE)
 * Gère les préférences sonores, la lecture des sons et l'interface de contrôle
 * @module AudioManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

/**
 * Classe pour gérer tous les aspects audio de l'application
 */
export class AudioManager {
  
  /**
   * Initialise le gestionnaire audio
   */
  constructor() {
    this.soundEnabled = this.loadSoundPreference();
    this.audioContext = null;
    this.gainNode = null;
    this.fallbackAudio = null;
    this.volume = 1.0;
    this.isInitialized = false;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
      console.log('AudioManager initialized:', {
        soundEnabled: this.soundEnabled,
        volume: this.volume
      });
    }
  }
  
  /**
   * Initialise le gestionnaire audio
   * @private
   */
  init() {
    this.initializeWebAudio();
    this.updateButtonDisplay();
    this.setupEventListeners();
    this.isInitialized = true;
  }
  
  /**
   * Initialise Web Audio API avec fallback
   * @private
   */
  initializeWebAudio() {
    try {
      // Créer le contexte audio avec gestion des autoplay policies
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Créer le nœud de gain pour contrôler le volume
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.1; // Volume faible par défaut
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
        console.log('AudioManager: Web Audio API initialisé avec succès');
      }
    } catch (error) {
      console.warn('AudioManager: Web Audio API non disponible, utilisation du fallback:', error);
      this.createFallbackAudio();
    }
  }
  
  /**
   * Crée un audio de fallback pour les navigateurs sans Web Audio API
   * @private
   */
  createFallbackAudio() {
    try {
      // Créer un élément audio avec un son synthétique simple
      this.fallbackAudio = document.createElement('audio');
      this.fallbackAudio.volume = 0.1;
      
      // Son de machine à écrire en base64 (courte note)
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1O2+dSEELYXR8d2CNwYYZrHl2J1VEAFP';
      this.fallbackAudio.src = audioData;
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
        console.log('AudioManager: Fallback audio créé');
      }
    } catch (error) {
      console.error('AudioManager: Impossible de créer le fallback audio:', error);
    }
  }
  
  /**
   * Configure les event listeners
   * @private
   */
  setupEventListeners() {
    // Écouter les changements de visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllSounds();
      }
    });
    
    // Écouter les événements de focus/blur de la fenêtre
    window.addEventListener('blur', () => {
      this.pauseAllSounds();
    });
    
    // Gérer l'interaction utilisateur pour débloquer l'audio
    document.addEventListener('click', () => {
      this.resumeAudioContext();
    }, { once: true });
  }
  
  /**
   * Reprend le contexte audio si suspendu (pour les politiques autoplay)
   * @private
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
          console.log('AudioManager: Contexte audio repris');
        }
      } catch (error) {
        console.warn('AudioManager: Impossible de reprendre le contexte audio:', error);
      }
    }
  }
  
  /**
   * Charge les préférences sonores depuis le localStorage
   * @returns {boolean} État du son (activé/désactivé)
   * @private
   */
  loadSoundPreference() {
    try {
      const saved = localStorage.getItem(CONFIG.SOUND_STORAGE_KEY);
      const preference = saved !== null ? JSON.parse(saved) : true;
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('AudioManager: Préférences chargées:', { preference, raw: saved });
      }
      
      return preference;
    } catch (error) {
      console.error('AudioManager: Erreur lors du chargement des préférences:', error);
      return true; // Valeur par défaut
    }
  }
  
  /**
   * Sauvegarde les préférences sonores dans le localStorage
   * @private
   */
  saveSoundPreference() {
    try {
      localStorage.setItem(CONFIG.SOUND_STORAGE_KEY, JSON.stringify(this.soundEnabled));
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('AudioManager: Préférences sauvegardées:', this.soundEnabled);
      }
    } catch (error) {
      console.error('AudioManager: Erreur lors de la sauvegarde des préférences audio:', error);
    }
  }
  
  /**
   * Bascule l'état du son (activé/désactivé)
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSoundPreference();
    this.updateButtonDisplay();
    
    // Arrêter tous les sons en cours si désactivé
    if (!this.soundEnabled) {
      this.pauseAllSounds();
    } else {
      // Test sonore lors de l'activation
      setTimeout(() => this.playSound(), 100);
    }
    
    // Notification à l'utilisateur
    const message = this.soundEnabled ? CONFIG.MESSAGES.SOUND_ENABLED : CONFIG.MESSAGES.SOUND_DISABLED;
    NotificationManager.show(message);
    
    // Émettre un événement personnalisé
    this.dispatchSoundToggleEvent();
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_EVENTS) {
      console.log('AudioManager: Son basculé:', this.soundEnabled);
    }
  }
  
  /**
   * Met à jour l'affichage du bouton de contrôle du son
   * @private
   */
  updateButtonDisplay() {
    const button = document.getElementById(CONFIG.DOM_ELEMENTS.TOGGLE_SOUND);
    if (!button) {
      console.warn('AudioManager: Bouton de contrôle du son non trouvé');
      return;
    }
    
    if (this.soundEnabled) {
      button.textContent = '🔊 Son activé';
      button.className = `secondary ${CONFIG.CSS_CLASSES.SOUND_ENABLED}`;
      button.setAttribute('aria-label', 'Désactiver le son');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.textContent = '🔇 Son désactivé';
      button.className = `secondary ${CONFIG.CSS_CLASSES.SOUND_DISABLED}`;
      button.setAttribute('aria-label', 'Activer le son');
      button.setAttribute('aria-pressed', 'false');
    }
  }
  
  /**
   * Joue le son de la machine à écrire
   * @param {Object} options - Options de lecture
   * @param {number} options.volume - Volume spécifique (0-1)
   * @param {number} options.playbackRate - Vitesse de lecture (0.25-4)
   */
  playSound(options = {}) {
    if (!this.soundEnabled) {
      return;
    }
    
    // Reprendre le contexte audio si nécessaire
    this.resumeAudioContext();
    
    // Tenter Web Audio API en premier
    if (this.audioContext && this.audioContext.state === 'running') {
      this.playWebAudioSound(options);
    } else if (this.fallbackAudio) {
      this.playFallbackSound(options);
    }
  }
  
  /**
   * Joue un son via Web Audio API
   * @param {Object} options - Options de lecture
   * @private
   */
  playWebAudioSound(options = {}) {
    try {
      // Créer un oscillateur pour chaque son (les oscillateurs ne peuvent être utilisés qu'une fois)
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Configurer le son (fréquence variable pour plus de réalisme)
      const baseFrequency = 800;
      const frequencyVariation = Math.random() * 200; // Variation aléatoire
      oscillator.frequency.value = baseFrequency + frequencyVariation;
      oscillator.type = 'square'; // Son caractéristique de machine à écrire
      
      // Configurer l'enveloppe du son (attack, decay)
      const now = this.audioContext.currentTime;
      const attackTime = 0.01;
      const decayTime = 0.1;
      const volume = options.volume !== undefined ? options.volume : 0.1;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime);
      
      // Jouer le son
      oscillator.start(now);
      oscillator.stop(now + attackTime + decayTime);
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
        console.log('AudioManager: Son Web Audio joué');
      }
      
    } catch (error) {
      console.warn('AudioManager: Erreur lors de la lecture Web Audio:', error);
      // Fallback vers l'audio traditionnel
      this.playFallbackSound(options);
    }
  }
  
  /**
   * Joue un son via l'élément audio traditionnel
   * @param {Object} options - Options de lecture
   * @private
   */
  playFallbackSound(options = {}) {
    try {
      if (!this.fallbackAudio) {
        this.createFallbackAudio();
      }
      
      if (this.fallbackAudio) {
        // Appliquer les options
        if (options.volume !== undefined) {
          this.fallbackAudio.volume = Math.max(0, Math.min(1, options.volume));
        } else {
          this.fallbackAudio.volume = this.volume * 0.1;
        }
        
        if (options.playbackRate !== undefined) {
          this.fallbackAudio.playbackRate = Math.max(0.25, Math.min(4, options.playbackRate));
        }
        
        // Réinitialiser la position et jouer
        this.fallbackAudio.currentTime = 0;
        const playPromise = this.fallbackAudio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
              console.log('AudioManager: Lecture automatique bloquée par le navigateur:', error);
            }
          });
        }
        
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
          console.log('AudioManager: Son fallback joué');
        }
      }
    } catch (error) {
      console.error('AudioManager: Erreur lors de la lecture fallback:', error);
    }
  }
  
  /**
   * Arrête tous les sons en cours
   */
  pauseAllSounds() {
    // Arrêter l'audio fallback
    if (this.fallbackAudio && !this.fallbackAudio.paused) {
      this.fallbackAudio.pause();
    }
  }
  
  /**
   * Vérifie si le son est activé
   * @returns {boolean} État du son
   */
  isSoundEnabled() {
    return this.soundEnabled;
  }
  
  /**
   * Vérifie si l'audio est prêt à être joué
   * @returns {boolean} État de préparation
   */
  isReady() {
    return this.isInitialized && (
      (this.audioContext && this.audioContext.state !== 'closed') || 
      this.fallbackAudio
    );
  }
  
  /**
   * Émmet un événement personnalisé lors du basculement du son
   * @private
   */
  dispatchSoundToggleEvent() {
    const event = new CustomEvent(CONFIG.EVENTS.SOUND_TOGGLED, {
      detail: {
        soundEnabled: this.soundEnabled,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Valide le gestionnaire audio
   * @returns {Object} Résultat de la validation
   */
  validate() {
    return {
      isValid: this.isInitialized && this.isReady(),
      soundEnabled: this.soundEnabled,
      volume: this.volume,
      isReady: this.isReady(),
      hasWebAudio: !!this.audioContext,
      hasFallback: !!this.fallbackAudio,
      audioContextState: this.audioContext?.state,
      timestamp: Date.now()
    };
  }
  
  /**
   * Retourne les informations de debug sur l'état audio
   * @returns {Object} Informations de debug
   */
  getDebugInfo() {
    return {
      soundEnabled: this.soundEnabled,
      volume: this.volume,
      isInitialized: this.isInitialized,
      isReady: this.isReady(),
      webAudio: {
        hasContext: !!this.audioContext,
        state: this.audioContext?.state,
        sampleRate: this.audioContext?.sampleRate,
        hasGainNode: !!this.gainNode
      },
      fallback: {
        hasAudio: !!this.fallbackAudio,
        volume: this.fallbackAudio?.volume,
        readyState: this.fallbackAudio?.readyState
      },
      validation: this.validate()
    };
  }
  
  /**
   * Nettoie les ressources et event listeners
   */
  cleanup() {
    this.pauseAllSounds();
    
    // Fermer le contexte audio
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // Nettoyer l'audio fallback
    if (this.fallbackAudio) {
      this.fallbackAudio.src = '';
      this.fallbackAudio = null;
    }
    
    // Supprimer les event listeners
    document.removeEventListener('visibilitychange', () => {});
    window.removeEventListener('blur', () => {});
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
      console.log('AudioManager: Nettoyage effectué');
    }
  }
}

export default AudioManager;
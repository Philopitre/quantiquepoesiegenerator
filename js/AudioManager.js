/**
 * Gestionnaire audio pour l'application (VERSION OPTIMISÉE)
 * Gère les préférences sonores, la lecture des sons et l'interface de contrôle
 * @module AudioManager
 */

import { CONFIG } from './config.js';
import { NotificationManager } from './NotificationManager.js';

export class AudioManager {
  constructor() {
    this.soundEnabled = this.loadSoundPreference();
    this.audioContext = null;
    this.gainNode = null;
    this.fallbackAudio = null;
    this.volume = CONFIG.AUDIO.DEFAULT_VOLUME;
    this.isInitialized = false;
    
    this.init();
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
      console.log('AudioManager initialized:', { soundEnabled: this.soundEnabled, volume: this.volume });
    }
  }
  
  init() {
    this.initializeWebAudio();
    this.updateButtonDisplay();
    this.setupEventListeners();
    this.isInitialized = true;
  }
  
  initializeWebAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
        console.log('Web Audio API initialisé');
      }
    } catch (error) {
      console.warn('Web Audio API non disponible:', error);
      this.createFallbackAudio();
    }
  }
  
  createFallbackAudio() {
    try {
      this.fallbackAudio = document.createElement('audio');
      this.fallbackAudio.volume = this.volume;
      this.fallbackAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1O2+dSEELYXR8d2CNwYYZrHl2J1VEAFP';
      
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
        console.log('Fallback audio créé');
      }
    } catch (error) {
      console.error('Impossible de créer le fallback audio:', error);
    }
  }
  
  setupEventListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pauseAllSounds();
    });
    
    window.addEventListener('blur', () => this.pauseAllSounds());
    
    document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
  }
  
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
          console.log('Contexte audio repris');
        }
      } catch (error) {
        console.warn('Impossible de reprendre le contexte audio:', error);
      }
    }
  }
  
  loadSoundPreference() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE.SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      return true;
    }
  }
  
  saveSoundPreference() {
    try {
      localStorage.setItem(CONFIG.STORAGE.SOUND_KEY, JSON.stringify(this.soundEnabled));
      if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_STORAGE) {
        console.log('Préférences sauvegardées:', this.soundEnabled);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSoundPreference();
    this.updateButtonDisplay();
    
    if (!this.soundEnabled) {
      this.pauseAllSounds();
    } else {
      setTimeout(() => this.playSound(), 100);
    }
    
    NotificationManager.show(this.soundEnabled ? CONFIG.MESSAGES.SOUND_ENABLED : CONFIG.MESSAGES.SOUND_DISABLED);
    this.dispatchSoundToggleEvent();
  }
  
  updateButtonDisplay() {
    const button = document.getElementById(CONFIG.DOM_ELEMENTS.TOGGLE_SOUND);
    if (!button) return;
    
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
  
  playSound(options = {}) {
    if (!this.soundEnabled) return;
    
    this.resumeAudioContext();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      this.playWebAudioSound(options);
    } else if (this.fallbackAudio) {
      this.playFallbackSound(options);
    }
  }
  
  playWebAudioSound(options = {}) {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const frequency = CONFIG.AUDIO.BASE_FREQUENCY + (Math.random() * CONFIG.AUDIO.FREQUENCY_VARIATION);
      oscillator.frequency.value = frequency;
      oscillator.type = CONFIG.AUDIO.OSCILLATOR_TYPE;
      
      const now = this.audioContext.currentTime;
      const volume = options.volume !== undefined ? options.volume : this.volume;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + CONFIG.AUDIO.ATTACK_TIME);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + CONFIG.AUDIO.ATTACK_TIME + CONFIG.AUDIO.DECAY_TIME);
      
      oscillator.start(now);
      oscillator.stop(now + CONFIG.AUDIO.ATTACK_TIME + CONFIG.AUDIO.DECAY_TIME);
      
    } catch (error) {
      console.warn('Erreur lors de la lecture Web Audio:', error);
      this.playFallbackSound(options);
    }
  }
  
  playFallbackSound(options = {}) {
    try {
      if (!this.fallbackAudio) this.createFallbackAudio();
      
      if (this.fallbackAudio) {
        this.fallbackAudio.volume = options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : this.volume;
        if (options.playbackRate !== undefined) {
          this.fallbackAudio.playbackRate = Math.max(0.25, Math.min(4, options.playbackRate));
        }
        
        this.fallbackAudio.currentTime = 0;
        const playPromise = this.fallbackAudio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
              console.log('Lecture automatique bloquée:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la lecture fallback:', error);
    }
  }
  
  pauseAllSounds() {
    if (this.fallbackAudio && !this.fallbackAudio.paused) {
      this.fallbackAudio.pause();
    }
  }
  
  isSoundEnabled() {
    return this.soundEnabled;
  }
  
  isReady() {
    return this.isInitialized && ((this.audioContext && this.audioContext.state !== 'closed') || this.fallbackAudio);
  }
  
  dispatchSoundToggleEvent() {
    document.dispatchEvent(new CustomEvent(CONFIG.EVENTS.SOUND_TOGGLED, {
      detail: { soundEnabled: this.soundEnabled, timestamp: Date.now() }
    }));
  }
  
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
  
  getDebugInfo() {
    return {
      soundEnabled: this.soundEnabled,
      volume: this.volume,
      isInitialized: this.isInitialized,
      isReady: this.isReady(),
      webAudio: {
        hasContext: !!this.audioContext,
        state: this.audioContext?.state,
        sampleRate: this.audioContext?.sampleRate
      },
      fallback: {
        hasAudio: !!this.fallbackAudio,
        volume: this.fallbackAudio?.volume
      },
      validation: this.validate()
    };
  }
  
  cleanup() {
    this.pauseAllSounds();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    if (this.fallbackAudio) {
      this.fallbackAudio.src = '';
      this.fallbackAudio = null;
    }
    
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_AUDIO) {
      console.log('AudioManager: Nettoyage effectué');
    }
  }
}

export default AudioManager;
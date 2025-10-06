/**
 * Configuration globale de l'application (VERSION OPTIMISÉE)
 * Contient toutes les constantes, paramètres et configurations centralisées
 * @module Config
 */

const BASE_CONFIG = {
  // Mots disponibles pour les combinaisons poétiques
  WORDS: [
    "Je", "suis", "rêveur", "professionnel", "dans", "mon", "métier",
    "exceptionnel", "l'erreur", "en", "tout", "genre", "est", "proscrite",
    "la", "souveraine", "intelligence", "pour", "moi-même", "grandissant"
  ],

  // Paramètres d'animation
  ANIMATION: {
    DELAY: 80,
    CURSOR_BLINK_DURATION: 1000,
    WORD_TOGGLE_DURATION: 150,
    WORD_RESET_STAGGER: 100,
    STATISTICS_DURATION: 300
  },

  // Paramètres de notification
  NOTIFICATION: {
    DURATION: 3000,
    FADE_DURATION: 500
  },

  // Clés de stockage localStorage
  STORAGE: {
    HISTORY_KEY: 'poeticHistory',
    SOUND_KEY: 'poeticSoundEnabled',
    PREFERENCES_KEY: 'poeticUserPreferences',
    ORDINATION_KEY: 'poeticOrdination'
  },

  // Noms de fichiers d'export
  EXPORT_FILE_NAMES: {
    TXT: 'historique_combinaisons.txt',
    PDF: 'historique_combinaisons.pdf',
    CSV: 'historique_combinaisons.csv',
    JSON: 'historique_combinaisons.json',
    XML: 'historique_combinaisons.xml',
    IMAGE: 'combinaison.png'
  },

  // Configuration de l'image générée
  IMAGE_CONFIG: {
    WIDTH: 1080,
    HEIGHT: 1080,
    FONT_SIZE: 48,
    FONT_FAMILY: 'bold 48px Arial',
    TEXT_COLOR: '#333333',
    BACKGROUND_COLOR: '#ffffff',
    PADDING: 100,
    LINE_HEIGHT: 60
  },

  // URLs de partage sur les réseaux sociaux
  SHARE_URLS: {
    TWITTER: 'https://twitter.com/intent/tweet?text=',
    WHATSAPP: 'https://api.whatsapp.com/send?text=',
    FACEBOOK: 'https://www.facebook.com/sharer/sharer.php?u=&quote=',
    EMAIL: 'mailto:?subject=Ma combinaison poétique&body='
  },

  // Configuration PDF
  PDF_CONFIG: {
    MARGIN_LEFT: 10,
    MARGIN_TOP: 20,
    MAX_WIDTH: 180,
    LINE_HEIGHT: 8,
    HEADER_Y: 20,
    CONTENT_START_Y: 40,
    PAGE_BREAK_Y: 280,
    FONT_SIZE: 12,
    FONT_FAMILY: 'helvetica'
  },

  // Messages de feedback pour les notes
  RATING_FEEDBACK: {
    LOW: "Une combinaison farfelue, non ? Essayons encore...",
    MEDIUM: "Intrigant ! Pas tout à fait clair, mais intéressant.",
    HIGH: "De la belle matière poétique ici !",
    EXCELLENT: "Très réaliste, une combinaison crédible et inspirante !"
  },

  // Seuils pour les notes
  RATING_THRESHOLDS: {
    LOW: 3,
    MEDIUM: 6,
    HIGH: 8
  },

  // Configuration des éléments DOM
  DOM_ELEMENTS: {
    WORD_LIST: 'fullWordList',
    RESULT: 'result',
    FEEDBACK: 'feedback',
    STATISTICS: 'statistics',
    HISTORY: 'history',
    WORD_COUNT_SELECT: 'wordCount',
    SELECTED_WORDS_COUNTER: 'selectedWordsCount',
    RESET_ALL_WORDS: 'resetAllWords',
    TOGGLE_SOUND: 'toggleSound',
    GENERATE_BTN: 'generateBtn',
    GENERATE_SELECTED_BTN: 'generateSelectedBtn',
    NEW_COMBINATION_BTN: 'newCombinationBtn',
    COPY_BTN: 'copyBtn',
    SUBMIT_RATING: 'submitRating',
    SHARE_TWITTER: 'shareTwitter',
    SHARE_WHATSAPP: 'shareWhatsApp',
    SHARE_FACEBOOK: 'shareFacebook',
    SHARE_EMAIL: 'shareEmail',
    GENERATE_IMAGE: 'generateImage',
    SORT_UP: 'sortUp',
    SORT_DOWN: 'sortDown',
    RANDOM_SORT: 'randomSort',
    EXPORT_TXT: 'exportTXT',
    EXPORT_PDF: 'exportPDF',
    RESET_CACHE: 'resetCache',
    TOTAL_COMBINATIONS: 'totalCombinations',
    AVERAGE_NOTE: 'averageNote',
    BEST_NOTE: 'bestNote',
    WORST_NOTE: 'worstNote',
    TYPEWRITER_SOUND: 'typewriterSound',
    RATING_INPUTS: '.rating input[type="radio"]',
    RATING_CHECKED: '.rating input[type="radio"]:checked',
    RATING_CONTAINER: '.rating-container'
  },

  // Classes CSS importantes
  CSS_CLASSES: {
    WORD_HIDDEN: 'word-hidden',
    WORD_TOGGLING: 'word-toggling',
    CURSOR: 'cursor',
    CURSOR_BLINK: 'blink',
    NOTIFICATION: 'notification',
    NOTIFICATION_FADE: 'fade-out',
    HISTORY_ENTRY: 'history-entry',
    HISTORY_CONTROLS: 'history-controls',
    ANIMATE: 'animate',
    LOADING: 'loading',
    SOUND_ENABLED: 'sound-enabled',
    SOUND_DISABLED: 'sound-disabled'
  },

  // Sélecteurs CSS
  SELECTORS: {
    WORD_ELEMENTS: '[data-word]',
    HIDDEN_WORDS: '.word-hidden',
    WORD_GROUP_1: '.word-group-1',
    WORD_GROUP_2: '.word-group-2',
    EXISTING_NOTIFICATION: '.notification',
    HISTORY_ENTRIES_NOT_CONTROLS: 'div:not(.history-controls)'
  },

  // Messages utilisateur
  MESSAGES: {
    NO_WORDS_AVAILABLE: "Aucun mot n'est disponible !",
    NO_WORDS_SELECTED: "Aucun mot n'est sélectionné ! Cliquez sur les mots grisés pour les activer.",
    ALL_WORDS_RESET: "Tous les mots ont été réinitialisés !",
    SOUND_ENABLED: "Son activé ! 🔊",
    SOUND_DISABLED: "Son désactivé 🔇",
    GENERATION_NOT_COMPLETE: "Attends que la génération soit complètement terminée avant de noter !",
    GENERATION_NOT_FINISHED: "La génération n'est pas encore terminée !",
    CHOOSE_RATING: "Merci de choisir une note avant d'envoyer.",
    RATING_SUBMITTED: "Merci pour ta contribution !",
    COMBINATION_COPIED: "Combinaison copiée dans le presse-papier !",
    COPY_ERROR: "Erreur lors de la copie. Essayez à nouveau.",
    GENERATE_FIRST: "Génère d'abord une combinaison !",
    HISTORY_EMPTY: "L'historique est vide.",
    PDF_LIBRARY_ERROR: "La bibliothèque jsPDF n'est pas chargée correctement.",
    PDF_GENERATION_ERROR: "Erreur lors de la génération du PDF.",
    IMAGE_GENERATION_ERROR: "Erreur lors de la génération de l'image.",
    CANVAS_ERROR: "Impossible de créer le contexte du canvas",
    CACHE_RESET_CONFIRM: "Veux-tu vraiment réinitialiser le cache ? Cela effacera toutes les données enregistrées.",
    CACHE_RESET_SUCCESS: "Le cache a été réinitialisé avec succès!",
    SELECTED_WORDS_GENERATION: "Combinaison générée avec tous les {count} mots sélectionnés."
  },

  // Limites et contraintes
  LIMITS: {
    MAX_HISTORY_ENTRIES: 1000,
    MIN_RATING: 1,
    MAX_RATING: 10,
    MAX_NOTIFICATION_LENGTH: 200,
    MAX_COMBINATION_LENGTH: 500,
    MIN_WORDS_FOR_GENERATION: 1,
    MAX_RECENT_COMBINATIONS: 10
  },

  // Configuration des événements
  EVENTS: {
    WORD_TOGGLED: 'wordToggled',
    COMBINATION_GENERATED: 'combinationGenerated',
    COMBINATION_RATED: 'combinationRated',
    HISTORY_UPDATED: 'historyUpdated',
    STATISTICS_UPDATED: 'statisticsUpdated',
    SOUND_TOGGLED: 'soundToggled',
    APP_INITIALIZED: 'appInitialized',
    APP_ERROR: 'appError',
    AUDIO_CONTEXT_CHANGED: 'audioContextChanged',
    ORDINATION_CHANGED: 'ordinationChanged'
  },

  // Configuration audio
  AUDIO: {
    DEFAULT_VOLUME: 0.1,
    OSCILLATOR_TYPE: 'square',
    BASE_FREQUENCY: 800,
    FREQUENCY_VARIATION: 200,
    ATTACK_TIME: 0.01,
    DECAY_TIME: 0.1,
    FALLBACK_VOLUME: 0.1
  },

  // Format de date/heure
  DATE_FORMAT: {
    LOCALE: 'fr-FR',
    OPTIONS: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  },

  // Configuration de performance
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    MAX_CONCURRENT_ANIMATIONS: 3,
    CLEANUP_INTERVAL: 30000
  },

  // Configuration du développement/debug
  DEBUG: {
    ENABLED: false,
    LOG_EVENTS: false,
    LOG_STORAGE: false,
    LOG_AUDIO: false
  },

  // Rétrocompatibilité
  get ANIMATION_DELAY() { return this.ANIMATION.DELAY; },
  get CURSOR_BLINK_DURATION() { return this.ANIMATION.CURSOR_BLINK_DURATION; },
  get WORD_TOGGLE_DURATION() { return this.ANIMATION.WORD_TOGGLE_DURATION; },
  get WORD_RESET_STAGGER() { return this.ANIMATION.WORD_RESET_STAGGER; },
  get STATISTICS_ANIMATION_DURATION() { return this.ANIMATION.STATISTICS_DURATION; },
  get NOTIFICATION_DURATION() { return this.NOTIFICATION.DURATION; },
  get NOTIFICATION_FADE_DURATION() { return this.NOTIFICATION.FADE_DURATION; },
  get STORAGE_KEY() { return this.STORAGE.HISTORY_KEY; },
  get SOUND_STORAGE_KEY() { return this.STORAGE.SOUND_KEY; },
  get USER_PREFERENCES_KEY() { return this.STORAGE.PREFERENCES_KEY; }
};

// Validation de la configuration
const validateConfig = (config) => {
  const errors = [];
  const warnings = [];

  if (!config.WORDS || !Array.isArray(config.WORDS) || config.WORDS.length === 0) {
    errors.push('WORDS doit être un tableau non vide');
  }

  if (config.ANIMATION.DELAY < 10) {
    warnings.push('ANIMATION_DELAY très bas, peut causer des problèmes de performance');
  }

  if (config.LIMITS.MIN_RATING >= config.LIMITS.MAX_RATING) {
    errors.push('MIN_RATING doit être inférieur à MAX_RATING');
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

// Configuration finale avec validation
let CONFIG;

try {
  let userConfig = {};
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('poeticConfig');
      if (stored) userConfig = JSON.parse(stored);
    } catch (error) {
      console.warn('Impossible de charger la configuration utilisateur:', error);
    }
  }

  CONFIG = Object.assign({}, BASE_CONFIG, userConfig);

  const validation = validateConfig(CONFIG);
  
  if (!validation.isValid) {
    console.error('Erreurs de configuration:', validation.errors);
    throw new Error(`Configuration invalide: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('Avertissements de configuration:', validation.warnings);
  }

} catch (error) {
  console.error('Erreur lors de l\'initialisation de la configuration:', error);
  CONFIG = BASE_CONFIG;
}

// Fonction pour sauvegarder la configuration utilisateur
CONFIG.saveUserConfig = function(userConfig) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem('poeticConfig', JSON.stringify(userConfig));
    return true;
  } catch (error) {
    console.error('Impossible de sauvegarder la configuration:', error);
    return false;
  }
};

// Fonction pour réinitialiser la configuration
CONFIG.resetConfig = function() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('poeticConfig');
  }
  window.location.reload();
};

// Freeze de l'objet CONFIG
Object.freeze(CONFIG);

export { CONFIG };
export default CONFIG;
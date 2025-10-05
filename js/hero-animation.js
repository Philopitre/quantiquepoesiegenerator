/**
 * Animation du titre héro avec le poème de l'ordination originale
 * Page d'accueil - Les éditions Philopitre
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Hero animation: Initialization started');

  // Poème original avec les groupes exacts
  const heroWords = [
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
  ];

  const animatedTextElement = document.getElementById('heroAnimatedText');
  
  if (!animatedTextElement) {
    console.warn('Hero animation: Element #heroAnimatedText not found');
    return;
  }

  // Configuration de l'animation
  const WORD_DELAY = 300; // Délai entre chaque mot (en ms) - réduit pour 20 mots
  const CURSOR_DURATION = 3000; // Durée d'affichage du curseur final (en ms)
  const CURSOR_FADE_DURATION = 500; // Durée de disparition du curseur (en ms)

  /**
   * Crée un élément span pour un mot
   * @param {Object} wordData - Données du mot {text, group}
   * @returns {HTMLElement} Element span créé
   */
  function createWordElement(wordData) {
    const wordSpan = document.createElement('span');
    wordSpan.className = `hero-word group-${wordData.group}`;
    wordSpan.textContent = wordData.text;
    wordSpan.setAttribute('aria-hidden', 'true'); // Le texte complet est dans aria-label du parent
    return wordSpan;
  }

  /**
   * Crée un élément curseur clignotant
   * @returns {HTMLElement} Element curseur
   */
  function createCursorElement() {
    const cursor = document.createElement('span');
    cursor.className = 'hero-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '|';
    return cursor;
  }

  /**
   * Anime l'apparition des mots un par un
   */
  function animateWords() {
    let currentDelay = 0;
    
    heroWords.forEach((wordData, index) => {
      setTimeout(() => {
        // Créer et ajouter le mot
        const wordElement = createWordElement(wordData);
        animatedTextElement.appendChild(wordElement);
        
        // Ajouter un espace après le mot (sauf pour le dernier)
        if (index < heroWords.length - 1) {
          animatedTextElement.appendChild(document.createTextNode(' '));
        } else {
          // Ajouter un point final après le dernier mot
          const period = document.createElement('span');
          period.className = `hero-word group-${wordData.group}`;
          period.textContent = '.';
          period.setAttribute('aria-hidden', 'true');
          animatedTextElement.appendChild(period);
        }
        
        // Si c'est le dernier mot, ajouter le curseur après un court délai
        if (index === heroWords.length - 1) {
          setTimeout(() => {
            addFinalCursor();
          }, 600); // Attendre la fin de l'animation du dernier mot
        }
        
        // Log pour debug
        if (index === 0) {
          console.log('Hero animation: First word displayed');
        } else if (index === heroWords.length - 1) {
          console.log('Hero animation: Last word displayed');
        }
        
      }, currentDelay);
      
      currentDelay += WORD_DELAY;
    });
  }

  /**
   * Ajoute le curseur final et gère sa disparition
   */
  function addFinalCursor() {
    const cursor = createCursorElement();
    animatedTextElement.appendChild(cursor);
    
    console.log('Hero animation: Cursor added');
    
    // Faire disparaître le curseur après la durée définie
    setTimeout(() => {
      cursor.style.opacity = '0';
      cursor.style.transition = `opacity ${CURSOR_FADE_DURATION}ms ease`;
      
      console.log('Hero animation: Complete');
      
      // Supprimer le curseur du DOM après la disparition
      setTimeout(() => {
        if (cursor.parentNode) {
          cursor.parentNode.removeChild(cursor);
        }
      }, CURSOR_FADE_DURATION);
      
    }, CURSOR_DURATION);
  }

  /**
   * Réinitialise l'animation (utile pour le debug)
   */
  function resetAnimation() {
    animatedTextElement.innerHTML = '';
    animateWords();
  }

  // Démarrer l'animation
  animateWords();

  // Exposer la fonction de reset pour le debug (uniquement en mode développement)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.resetHeroAnimation = resetAnimation;
    console.log('Hero animation: Debug mode - Use window.resetHeroAnimation() to restart');
  }

  // Log de confirmation
  console.log('Hero animation: Initialized with', heroWords.length, 'words');
});
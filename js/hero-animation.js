/**
 * Animation du titre héro avec le poème original et sauts de ligne exacts
 */

console.log('Script hero-animation.js chargé');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM chargé - Démarrage animation');
  
  // Les 20 mots du poème avec les sauts de ligne aux bons endroits
  const heroWords = [
    { text: "Je", group: 1 },
    { text: "suis", group: 1 },
    { text: "rêveur", group: 2 },
    { text: "professionnel", group: 1, lineBreak: true },   // SAUT après "professionnel"
    { text: "dans", group: 1 },
    { text: "mon", group: 2 },
    { text: "métier", group: 2 },
    { text: "exceptionnel", group: 2, lineBreak: true },    // SAUT après "exceptionnel"
    { text: "l'erreur", group: 1 },
    { text: "en", group: 1 },
    { text: "tout", group: 1 },
    { text: "genre", group: 1 },
    { text: "est", group: 2 },
    { text: "proscrite", group: 1, lineBreak: true },       // SAUT après "proscrite"
    { text: "la", group: 1 },
    { text: "souveraine", group: 1 },
    { text: "intelligence", group: 1, lineBreak: true },    // SAUT après "intelligence"
    { text: "pour", group: 2 },
    { text: "moi-même", group: 2 },
    { text: "grandissant", group: 2 }                        // Dernier mot
  ];

  const animatedTextElement = document.getElementById('heroAnimatedText');
  
  if (!animatedTextElement) {
    console.error('❌ Element #heroAnimatedText non trouvé !');
    return;
  }

  console.log('✅ Element trouvé, démarrage de l\'animation...');

  const WORD_DELAY = 300; // Délai entre chaque mot (ms)
  const CURSOR_DURATION = 3000; // Durée du curseur (ms)

  // Fonction pour créer un mot
  function createWord(wordData) {
    const span = document.createElement('span');
    span.className = 'hero-word group-' + wordData.group;
    span.textContent = wordData.text;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  // Fonction pour créer le curseur
  function createCursor() {
    const cursor = document.createElement('span');
    cursor.className = 'hero-cursor';
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    return cursor;
  }

  // Animation des mots
  let delay = 0;
  
  heroWords.forEach(function(wordData, index) {
    setTimeout(function() {
      // Créer et ajouter le mot
      const wordElement = createWord(wordData);
      animatedTextElement.appendChild(wordElement);
      
      // Ajouter un saut de ligne si nécessaire
      if (wordData.lineBreak) {
        animatedTextElement.appendChild(document.createElement('br'));
      }
      // Sinon, ajouter un espace (sauf après le dernier mot)
      else if (index < heroWords.length - 1) {
        animatedTextElement.appendChild(document.createTextNode(' '));
      }
      
      // Si c'est le dernier mot, ajouter le point final
      if (index === heroWords.length - 1) {
        const period = document.createElement('span');
        period.className = 'hero-word group-' + wordData.group;
        period.textContent = '.';
        period.setAttribute('aria-hidden', 'true');
        animatedTextElement.appendChild(period);
      }
      
      console.log('Mot affiché:', wordData.text);
      
      // Si c'est le dernier mot, ajouter le curseur
      if (index === heroWords.length - 1) {
        setTimeout(function() {
          const cursor = createCursor();
          animatedTextElement.appendChild(cursor);
          console.log('✅ Animation terminée - Curseur ajouté');
          
          // Faire disparaître le curseur après 3 secondes
          setTimeout(function() {
            cursor.style.opacity = '0';
            cursor.style.transition = 'opacity 0.5s ease';
            
            // Supprimer le curseur après disparition
            setTimeout(function() {
              if (cursor.parentNode) {
                cursor.parentNode.removeChild(cursor);
              }
            }, 500);
          }, CURSOR_DURATION);
        }, 600);
      }
    }, delay);
    
    delay += WORD_DELAY;
  });
});
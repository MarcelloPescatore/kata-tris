// recupero elementi dal dom
const celle = document.querySelectorAll('.cell');
const restart = document.getElementById('restartBtn');

const btnVsComputer = document.getElementById('vsComputer');
const btnVsPlayer = document.getElementById('vsPlayer');

// creo griglia logica
const griglia = Array(9).fill(null);

// simboli 
const home = "x";
const away = "o";

// stato partita
let vincitore = "";
let gameOver = false;
let vittorieHome = 0;
let vittorieAway = 0;
let draw = 0;
let turnoCorrente = home;
let vsComputer = true;

//combinazioni vincenti partita
const combinazioniVincenti = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// controllo vittoria
function controllaVittoria() {
  return combinazioniVincenti.find(([a, b, c]) => (
    griglia[a] && griglia[a] === griglia[b] && griglia[a] === griglia[c]
  ));
}

// aggiorna risultato
function aggiornaScore() {
  document.getElementById('homeScore').textContent = vittorieHome;
  document.getElementById('awayScore').textContent = vittorieAway;
  document.getElementById('drawScore').textContent = draw;
}

// mossa del player
function faiMossa(indice, simbolo) {
  if (gameOver || griglia[indice] !== null) return false;

  griglia[indice] = simbolo;
  const cella = celle[indice];
  const icona = cella.querySelector('.symbol i');
  icona.className = 'fa-regular';

  if (simbolo === home) {
    icona.classList.add('fa-x');
  } else {
    icona.classList.add('fa-circle');
  }

  return true;
}

// mossa del computer
function mossaComputer() {
  if (gameOver) return;

  const libere = griglia.map((val, idx) => val === null ? idx : null).filter(i => i !== null);
  if (libere.length === 0) return;

  const scelta = libere[Math.floor(Math.random() * libere.length)];
  faiMossa(scelta, away);

  const combinazioneVincente = controllaVittoria();
  if (combinazioneVincente) {
    combinazioneVincente.forEach(i => celle[i].classList.add('vincente'));
    gameOver = true;
    vincitore = "away";
    vittorieAway++;
    aggiornaScore();
    restart.classList.remove('hidden');
    return;
  }

  if (!griglia.includes(null)) {
    vincitore = 'nessuno';
    gameOver = true;
    restart.classList.remove('hidden');
    return;
  }

  turnoCorrente = home;
}

// reset game
function resetGame() {
  // ripulisco la griglia
  for (let i = 0; i < griglia.length; i++) {
    griglia[i] = null;
  }

  // sistemo la grafica della griglia
  celle.forEach(cella => {
    const icona = cella.querySelector('.symbol i');
    icona.className = 'fa-regular';
    cella.classList.remove('vincente');
  });

  // imposto lo stato iniziale
  turnoCorrente = home;
  vincitore = "";
  gameOver = false;
  restart.classList.add('hidden');
  aggiornaInterazioneCelle();
};

// cursore
function aggiornaInterazioneCelle() {
  if (vsComputer && turnoCorrente === away) {
    celle.forEach(cella => {
      cella.classList.remove('able');
      cella.classList.add('not-able');
    });
  } else {
    celle.forEach(cella => {
      cella.classList.add('able');
      cella.classList.remove('not-able');
    });
  }
}

// listner celle
celle.forEach(cella => {
  cella.addEventListener('click', () => {
    if (gameOver) {
      return;
    }

    if (vsComputer && turnoCorrente === away) {
      return;
    }

    // recupero l'indice della cella cliccata
    const indice = parseInt(cella.dataset.index);

    // faccio eseguire e ne condiziono il risultato
    if (!faiMossa(indice, turnoCorrente)) {
      return;
    }

    // controllo dopo ogni mossa se c'è un vincitore
    const combinazioneVincente = controllaVittoria();
    if (combinazioneVincente) {
      combinazioneVincente.forEach(i => celle[i].classList.add('vincente'));
      gameOver = true;

      vincitore = turnoCorrente === home ? 'home' : 'away';

      if (vincitore === 'home') {
        vittorieHome++;
      } else {
        vittorieAway++;
      }

      aggiornaScore();

      restart.classList.remove('hidden');

      return;
    }

    // controllo se non c'è un vincitore se è finita in parità
    if (!griglia.includes(null)) {
      vincitore = 'nessuno';
      gameOver = true;
      draw++;
      aggiornaScore();
      restart.classList.remove('hidden');
      return;
    }

    // Cambio turno
    if (vsComputer) {
      turnoCorrente = away;
      aggiornaInterazioneCelle();

      // eseguo mossa computer
      setTimeout(() => {
        mossaComputer();
        aggiornaInterazioneCelle();
      }, 1000);
    } else {

      //cambio turno a player 2
      turnoCorrente = turnoCorrente === home ? away : home;
      aggiornaInterazioneCelle();

    }
  });
});

// listner sul tasto restart
restart.addEventListener('click', resetGame);

// Modalità di gioco
const gameButtons = document.querySelectorAll('#game-mode button');

btnVsComputer.addEventListener('click', () => {
  vsComputer = true;
  resetGame();
});

btnVsPlayer.addEventListener('click', () => {
  vsComputer = false;
  resetGame();
});



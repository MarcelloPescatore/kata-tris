const modal = document.getElementById('modalConferma');
const modalTesto = document.getElementById('modalTesto');
const btnConferma = document.getElementById('modalConfermaBtn');
const btnAnnulla = document.getElementById('modalAnnullaBtn');

let nuovaModalita = ''; 

// recupero elementi dal dom
const celle = document.querySelectorAll('.cell');
const restart = document.querySelector('.restartBtn');

const btnVsComputer = document.getElementById('vsComputer');
const btnVsPlayer = document.getElementById('vsPlayer');

// Audio feedback
const suonoClick = new Audio('assets/sounds/click.mp3');
const suonoErrore = new Audio('assets/sounds/errore.wav');
const suonoVittoria = new Audio('assets/sounds/vittoria.wav');
const suonoSconfitta = new Audio('assets/sounds/sconfitta.wav');

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
btnVsComputer.classList.add('modalita-attiva');

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

// aggiorna turno
function aggiornaIndicatoreTurno() {
  const spanTurno = document.querySelector('#turnoAttuale span');
  if (!spanTurno) return;

  if (turnoCorrente === home) {
    spanTurno.textContent = 'Home (X)';
  } else {
    spanTurno.textContent = vsComputer ? 'Computer (O)' : 'Away (O)';
  }
}

//stop suoni
function stopAllSounds() {
  [suonoClick, suonoErrore, suonoVittoria, suonoSconfitta].forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

const suoni = [suonoClick, suonoErrore, suonoVittoria, suonoSconfitta];

// Imposta volume iniziale dal valore dello slider
const volumeControl = document.getElementById('volumeControl');
if (volumeControl) {
  const initialVolume = parseFloat(volumeControl.value);
  if (Number.isFinite(initialVolume) && initialVolume >= 0 && initialVolume <= 1) {
    suoni.forEach(audio => audio.volume = initialVolume);
  } else {
    suoni.forEach(audio => audio.volume = 0.2);
  }

  volumeControl.addEventListener('input', (e) => {
    const newVolumeValue = parseFloat(e.target.value);
    if (Number.isFinite(newVolumeValue) && newVolumeValue >= 0 && newVolumeValue <= 1) {
      suoni.forEach(audio => {
        audio.volume = newVolumeValue;
      });
    } else {
      console.warn('Valore volume non valido:', e.target.value);
    }
  });
}


// messaggio esito partita
function mostraMessaggioFineGioco() {
  const msg = document.getElementById('esitoGame');
  msg.classList.remove('hidden');
  if (vincitore === 'home') {
    msg.textContent = 'Ha vinto (Home)!';
  } else if (vincitore === 'away') {
    msg.textContent = vsComputer ? 'Ha vinto il computer!' : 'Ha vinto il giocatore 2 (Away)!';
  } else {
    msg.textContent = 'Pareggio!';
  }
}

// mossa
function faiMossa(indice, simbolo) {
  const cella = celle[indice];
  if (gameOver) return false;

  if (griglia[indice] !== null) {

    // Casella occupata: sfondo rosso per 0.5s
    cella.classList.add('occupied');
    setTimeout(() => {
      cella.classList.remove('occupied');
    }, 1100);

    stopAllSounds();
    suonoErrore.currentTime = 0;
    suonoErrore.play();

    setTimeout(() => {
      suonoErrore.pause();
      suonoErrore.currentTime = 0;
    }, 800);
    return false;
  }

  griglia[indice] = simbolo;
  const icona = cella.querySelector('.symbol i');
  icona.className = 'fa-regular';

  if (simbolo === home) {
    icona.classList.add('fa-x');
  } else {
    icona.classList.add('fa-circle');
  }

  stopAllSounds();
  suonoClick.currentTime = 0;
  suonoClick.play();

  setTimeout(() => {
    suonoClick.pause();
    suonoClick.currentTime = 0;
  }, 500);

  return true;
}

// funzione per mosse pc
function minimax(board, isMaximizing) {
  const winner = controllaVittoria();
  if (winner) {
    return winner === 'home' ? -1 : 1;
  }
  if (!board.includes(null)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = away;
        const score = minimax(board, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = home;
        const score = minimax(board, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}


// mossa del computer
function mossaComputer() {
  if (gameOver) return;

  let bestScore = -Infinity;
  let mossaMigliore = null;

  for (let i = 0; i < griglia.length; i++) {
    if (griglia[i] === null) {
      griglia[i] = away;
      const punteggio = minimax(griglia, false);
      griglia[i] = null;

      if (punteggio > bestScore) {
        bestScore = punteggio;
        mossaMigliore = i;
      }
    }
  }

  if (mossaMigliore !== null) {
    faiMossa(mossaMigliore, away);

    const combinazioneVincente = controllaVittoria();
    if (combinazioneVincente) {
      combinazioneVincente.forEach(i => celle[i].classList.add('vincente'));
      gameOver = true;
      vincitore = "away";
      vittorieAway++;
      stopAllSounds();
      suonoSconfitta.currentTime = 0;
      suonoSconfitta.play();
      setTimeout(() => {
        suonoSconfitta.pause();
        suonoSconfitta.currentTime = 0;
      }, 10000);
      aggiornaScore();
      restart.classList.remove('hidden');
      return;
    }

    if (!griglia.includes(null)) {
      vincitore = 'nessuno';
      gameOver = true;
      mostraMessaggioFineGioco();
      restart.classList.remove('hidden');
      return;
    }

    turnoCorrente = home;
    aggiornaIndicatoreTurno();
  }
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
  aggiornaIndicatoreTurno();
  stopAllSounds();
  document.getElementById('esitoGame').classList.add('hidden');

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
    if (isNaN(indice) || indice < 0 || indice > 8) {
      return;
    }

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

        stopAllSounds();
        suonoVittoria.currentTime = 0;
        suonoVittoria.play();

        setTimeout(() => {
          suonoVittoria.pause();
          suonoVittoria.currentTime = 0;
        }, 10000);

      } else {
        vittorieAway++;

        stopAllSounds();
        suonoVittoria.currentTime = 0;
        suonoVittoria.play();

        setTimeout(() => {
          suonoVittoria.pause();
          suonoVittoria.currentTime = 0;
        }, 10000);
      }

      aggiornaScore();
      mostraMessaggioFineGioco();

      restart.classList.remove('hidden');

      return;
    }

    // controllo se non c'è un vincitore se è finita in parità
    if (!griglia.includes(null)) {
      vincitore = 'nessuno';
      gameOver = true;
      draw++;
      aggiornaScore();
      mostraMessaggioFineGioco();
      restart.classList.remove('hidden');
      return;
    }

    // Cambio turno
    if (vsComputer) {
      turnoCorrente = away;
      aggiornaIndicatoreTurno();
      aggiornaInterazioneCelle();

      // eseguo mossa computer
      setTimeout(() => {
        mossaComputer();
        aggiornaInterazioneCelle();
      }, 2000);
    } else {

      //cambio turno a player 2
      turnoCorrente = turnoCorrente === home ? away : home;
      aggiornaIndicatoreTurno();
      aggiornaInterazioneCelle();
    }

  });
});

// listner sul tasto restart
restart.addEventListener('click', resetGame);

// Modalità di gioco
const gameButtons = document.querySelectorAll('#game-mode button');

btnVsComputer.addEventListener('click', () => {
  nuovaModalita = 'computer';
  modalTesto.textContent = "Sei sicuro di voler giocare contro il Computer?";
  modal.classList.remove('hidden');
});

btnVsPlayer.addEventListener('click', () => {
  nuovaModalita = 'player';
  modalTesto.textContent = "Sei sicuro di voler giocare contro un altro Giocatore?";
  modal.classList.remove('hidden');
});

btnConferma.addEventListener('click', () => {
  if (nuovaModalita === 'computer') {
    vsComputer = true;
    btnVsComputer.classList.add('modalita-attiva');
    btnVsPlayer.classList.remove('modalita-attiva');
  } else if (nuovaModalita === 'player') {
    vsComputer = false;
    btnVsPlayer.classList.add('modalita-attiva');
    btnVsComputer.classList.remove('modalita-attiva');
  }
  resetGame();
  modal.classList.add('hidden');
  nuovaModalita = null;
});

btnAnnulla.addEventListener('click', () => {
  modal.classList.add('hidden');
  nuovaModalita = null;
})

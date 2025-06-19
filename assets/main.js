// recupero elementi dal dom
const celle = document.querySelectorAll('.cell');
const restart = document.querySelector('.restartBtn');
const btnVsComputer = document.getElementById('vsComputer');
const btnVsPlayer = document.getElementById('vsPlayer');
const modal = document.getElementById('modalConferma');
const modalTesto = document.getElementById('modalTesto');
const btnConferma = document.getElementById('modalConfermaBtn');
const btnAnnulla = document.getElementById('modalAnnullaBtn');
const difficoltaContainer = document.getElementById('difficolta-container')
const facileBtn = document.getElementById('facileBtn');
const medioBtn = document.getElementById('medioBtn');
const difficileBtn = document.getElementById('difficileBtn');

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
let computerMoveTimeout = null;
btnVsComputer.classList.add('modalita-attiva');

let nuovaModalita = '';
let difficolta = 'difficile';
difficileBtn.classList.add('modalita-attiva');


//combinazioni vincenti partita
const combinazioniVincenti = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// controllo vittoria
function controllaVittoria(board = griglia) {
  for (const combo of combinazioniVincenti) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;  // ritorna la combinazione vincente
    }
  }
  return null; // nessun vincitore
}

// funzione per ottenere simbolo vincitore da combinazione
function simboloVincitore(board = griglia) {
  const combo = controllaVittoria(board);
  if (combo) {
    return board[combo[0]];
  }
  return null;
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
function minimax(board, depth, isMaximizing, alpha, beta) {
  const combo = controllaVittoria(board);
  if (combo) {
    const simbolo = board[combo[0]];
    if (simbolo === home) return { score: -10 + depth };
    if (simbolo === away) return { score: 10 - depth };
  }

  if (!board.includes(null)) {
    return { score: 0 };
  }

  let best;
  if (isMaximizing) {
    best = { score: -Infinity };
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = away;
        const result = minimax(board, depth + 1, false, alpha, beta);
        board[i] = null;

        if (result.score > best.score) {
          best = { score: result.score, index: i };
        }
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break;
      }
    }
  } else {
    best = { score: Infinity };
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = home;
        const result = minimax(board, depth + 1, true, alpha, beta);
        board[i] = null;

        if (result.score < best.score) {
          best = { score: result.score, index: i };
        }
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }
    }
  }
  return best;
}

// mosse del computer
function mossaComputerImbattibile() {
  if (gameOver) return;

  let bestScore = -Infinity;
  let mosseMigliori = [];

  for (let i = 0; i < griglia.length; i++) {
    if (griglia[i] === null) {
      griglia[i] = away;
      const { score } = minimax(griglia, 0, false, -Infinity, Infinity);
      griglia[i] = null;

      if (score > bestScore) {
        bestScore = score;
        mosseMigliori = [i];
      } else if (score === bestScore) {
        mosseMigliori.push(i);
      }
    }
  }

  // Scegli una mossa casuale tra le migliori
  const mossaScelta = mosseMigliori[Math.floor(Math.random() * mosseMigliori.length)];

  if (mossaScelta !== undefined) {
    faiMossa(mossaScelta, away);

    const combinazioneVincente = controllaVittoria();
    if (combinazioneVincente) {
      combinazioneVincente.forEach(i => celle[i].classList.add('vincente'));
      gameOver = true;

      const simbolo = simboloVincitore();
      vincitore = simbolo === home ? 'home' : 'away';

      if (vincitore === 'away') {
        vittorieAway++;
        stopAllSounds();
        suonoSconfitta.currentTime = 0;
        suonoSconfitta.play();
        setTimeout(() => {
          suonoSconfitta.pause();
          suonoSconfitta.currentTime = 0;
        }, 10000);
      }

      aggiornaScore();
      mostraMessaggioFineGioco();
      restart.classList.remove('hidden');
      return;
    }

    if (!griglia.includes(null)) {
      vincitore = 'nessuno';
      gameOver = true;
      draw++;
      aggiornaScore();
      mostraMessaggioFineGioco();
      restart.classList.remove('hidden');
      return;
    }

    turnoCorrente = home;
    aggiornaIndicatoreTurno();
  }
}

function mossaComputerConDifficolta() {
  if (difficolta === 'facile') {
    mossaCasuale();
  } else if (difficolta === 'medio') {
    const usaMinimax = Math.random() < 0.5;
    if (usaMinimax) {
      mossaComputerImbattibile();
    } else {
      mossaCasuale();
    }
  } else {
    mossaComputerImbattibile();
  }
}

function mossaCasuale() {
  if (gameOver) return;

  const libere = griglia
    .map((val, idx) => val === null ? idx : null)
    .filter(val => val !== null);

  if (libere.length === 0) return;

  const mossaScelta = libere[Math.floor(Math.random() * libere.length)];
  faiMossa(mossaScelta, away);

  const combinazioneVincente = controllaVittoria();
  if (combinazioneVincente) {
    combinazioneVincente.forEach(i => celle[i].classList.add('vincente'));
    gameOver = true;

    vincitore = 'away';
    vittorieAway++;
    aggiornaScore();
    mostraMessaggioFineGioco();
    stopAllSounds();
    suonoSconfitta.play();
    restart.classList.remove('hidden');
    return;
  }

  if (!griglia.includes(null)) {
    vincitore = 'nessuno';
    draw++;
    gameOver = true;
    aggiornaScore();
    mostraMessaggioFineGioco();
    restart.classList.remove('hidden');
    return;
  }

  turnoCorrente = home;
  aggiornaIndicatoreTurno();
}

function aggiornaUIBottoniDifficolta() {
  [facileBtn, medioBtn, difficileBtn].forEach(btn => btn.classList.remove('modalita-attiva'));

  if (difficolta === 'facile') facileBtn.classList.add('modalita-attiva');
  else if (difficolta === 'medio') medioBtn.classList.add('modalita-attiva');
  else if (difficolta === 'difficile') difficileBtn.classList.add('modalita-attiva');
}

// reset game
function resetGame() {
  // cancello timeout computer
  if (computerMoveTimeout !== null) {
    clearTimeout(computerMoveTimeout);
    computerMoveTimeout = null;
  }

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

      const simbolo = simboloVincitore();
      vincitore = simbolo === home ? 'home' : 'away';

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
      computerMoveTimeout = setTimeout(() => {
        mossaComputerConDifficolta();
        aggiornaInterazioneCelle();
        computerMoveTimeout = null; 
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
    difficoltaContainer.classList.remove('hidden');
  } else if (nuovaModalita === 'player') {
    vsComputer = false;
    difficoltaContainer.classList.add('hidden');
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

// difficoltà gioco
facileBtn.addEventListener('click', () => {
  difficolta = 'facile';
  resetGame();
  aggiornaUIBottoniDifficolta();
  facileBtn.classList.add('modalita-attiva');
});

medioBtn.addEventListener('click', () => {
  difficolta = 'medio';
  resetGame();
  aggiornaUIBottoniDifficolta();
  medioBtn.classList.add('modalita-attiva');
});

difficileBtn.addEventListener('click', () => {
  difficolta = 'difficile';
  resetGame();
  aggiornaUIBottoniDifficolta();
  difficileBtn.classList.add('modalita-attiva');
});
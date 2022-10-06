function addEventListeners() {
  CANVAS.addEventListener("mousedown", onMouseDown);
  CANVAS.addEventListener("mousemove", onMouseMove);
  CANVAS.addEventListener("mouseup", onMouseUp);
  CANVAS.addEventListener("touchstart", onTouchStart);
  CANVAS.addEventListener("touchmove", onTouchMove);
  CANVAS.addEventListener("touchend", onTouchEnd);
}

function onTouchStart(evt) {
  let loc = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
  onMouseDown(loc);
}
function onTouchMove(evt) {
  let loc = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
  onMouseMove(loc);
}
function onTouchEnd() {
  onMouseUp();
}

function getPressedPiece(loc) {
  // ? Iterate in reverse in order to focus on topmost piece when selecting
  for (let i = PIECES.length - 1; i >= 0; i--) {
    // ? check if the click location is within the bounds of any of the pieces
    if (
      loc.x > PIECES[i].x &&
      loc.x < PIECES[i].x + PIECES[i].width &&
      loc.y > PIECES[i].y &&
      loc.y < PIECES[i].y + PIECES[i].height
    ) {
      return PIECES[i];
    }
  }
  return null; // ? nothing was pressed
}
function getPressedPieceByColor(loc, color) {
  // ? Iterate in reverse in order to focus on topmost piece when selecting
  for (let i = PIECES.length - 1; i >= 0; i--) {
    if (PIECES[i].color == color) {
      return PIECES[i];
    }
  }
  return null; // ? nothing was pressed
}

function onMouseDown(evt) {
  const imgData = HELPER_CONTEXT.getImageData(evt.x, evt.y, 1, 1);
  if (imgData.data[3] === 0) return; // ? transparent, so we are not clicking on anything

  const clickedColor = `rgb(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]})`;

  SELECTED_PIECE = getPressedPieceByColor(evt, clickedColor);

  // SELECTED_PIECE = getPressedPiece(evt);
  if (SELECTED_PIECE != null) {
    const index = PIECES.indexOf(SELECTED_PIECE);
    if (index > -1) {
      // ? if its NOT missing
      PIECES.splice(index, 1); // ? remove it from whereever it is in the PIECES array
      PIECES.push(SELECTED_PIECE); // ? and place it at the end (to get it drawn first)
      // ? This is used to draw a selected piece ontop of all other pieces
    }
    SELECTED_PIECE.offset = {
      x: evt.x - SELECTED_PIECE.x,
      y: evt.y - SELECTED_PIECE.y,
    };
    SELECTED_PIECE.correct = false;
  }
}
function onMouseMove(evt) {
  if (SELECTED_PIECE != null) {
    SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x;
    SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y;
  }
}
function onMouseUp() {
  if (SELECTED_PIECE && SELECTED_PIECE.isClose()) {
    SELECTED_PIECE.snap();
    if (isComplete() && END_TIME == null) {
      let now = new Date().getTime();
      END_TIME = now;
      setTimeout(playCompleteMelody, 300);
      document.getElementById("menuItems").style.display = "block";
    }
  }
  SELECTED_PIECE = null;
}
function playNote(key, duration) {
  let osc = AUDIO_CONTEXT.createOscillator();
  osc.frequency.value = key;
  osc.start(AUDIO_CONTEXT.currentTime);
  osc.stop(AUDIO_CONTEXT.currentTime + duration / 1000);

  let envelope = AUDIO_CONTEXT.createGain();
  osc.connect(envelope);
  osc.type = "triangle";
  envelope.connect(AUDIO_CONTEXT.destination);
  envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
  envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1);
  envelope.gain.linearRampToValueAtTime(0, AUDIO_CONTEXT.currentTime + duration / 1000);
  setTimeout(() => {
    osc.disconnect();
  }, duration);
}

function playSnapMelody() {
  playNote(frequencyKeys.da, 100);

  setTimeout(() => {
    playNote(frequencyKeys.do, 100);
  }, 100);
}

function playCompleteMelody() {
  playNote(frequencyKeys.DO, 300);
  setTimeout(() => {
    playNote(frequencyKeys.DO, 175);
  }, 300);
  setTimeout(() => {
    playNote(frequencyKeys.RE, 150);
  }, 475);
  setTimeout(() => {
    playNote(frequencyKeys.MI, 600);
  }, 565);
}

// ? Not supposed to be in here, but I was fedup seeing it in index.js
function handleResize() {
  // ? Resize and scale video capture width/height for responsiveness
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;
  HELPER_CANVAS.width = window.innerWidth;
  HELPER_CANVAS.height = window.innerHeight;

  let resizer =
    SCALER * Math.min(window.innerWidth / VIDEO.videoWidth, window.innerHeight / VIDEO.videoHeight);
  SIZE.width = resizer * VIDEO.videoWidth;
  SIZE.height = resizer * VIDEO.videoHeight;
  SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
  SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}

let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;
let HELPER_CANVAS = null;
let HELPER_CONTEXT = null;
let SELECTED_PIECE = null;
let SCALER = 0.8; // how much of screen space will be used by the image
let SIZE = {
  x: 100,
  y: 100,
  width: window.innerWidth - 200 || 0,
  height: window.innerHeight - 200 || 0,
  rows: 3,
  columns: 3,
};
let PIECES = [];
let IMAGE = new Image();
let START_TIME = null;
let END_TIME = null;
let AUDIO_CONTEXT = new (AudioContext || webkitAudioContext || window.webkitAudioContext)();
let frequencyKeys = {
  DO: 261.6,
  RE: 293.7,
  MI: 329.6,
  da: 400,
  do: 550,
};

function main() {
  CANVAS = document.getElementById("myCanvas");
  CONTEXT = CANVAS.getContext("2d");
  HELPER_CANVAS = document.getElementById("helperCanvas");
  HELPER_CONTEXT = HELPER_CANVAS.getContext("2d");
  addEventListeners();

  // ? Get user camera (& permission)
  let promise = navigator.mediaDevices.getUserMedia({ video: true });
  promise
    .then((signal) => {
      VIDEO = document.createElement("video");
      VIDEO.srcObject = signal;
      VIDEO.play();

      VIDEO.onloadeddata = () => {
        handleResize();
        initializePieces(SIZE.rows, SIZE.columns);
        updateGame();
      };
    })
    .catch((e) => {
      console.error("Camera Error", e);
      console.error("Using Backup Image!");

      CANVAS.width = window.innerWidth;
      CANVAS.height = window.innerHeight;
      HELPER_CANVAS.width = window.innerWidth;
      HELPER_CANVAS.height = window.innerHeight;
      VIDEO = false;

      const imgArr = ["img1.jpg", "img2.png", "img3.jpg"];
      const rand = Math.floor(Math.floor(Math.random() * imgArr.length));

      IMAGE.onload = () => {
        if (IMAGE.width > window.innerWidth - 200) {
          let ratio = IMAGE.naturalWidth / IMAGE.naturalHeight;
          let width = IMAGE.width > 1500 && CANVAS.width > 1500 ? 1500 : CANVAS.width - 300
          let height = width / ratio;
          SIZE.width = width;
          SIZE.height = height;
        } else if (IMAGE.width < 300) {
          let ratio = IMAGE.naturalWidth / IMAGE.naturalHeight;
          let height = IMAGE.height > 700 && CANVAS.height > 700 ? 700 : CANVAS.height - 200;
          let width = height * ratio;
          SIZE.width = width;
          SIZE.height = height;
        } else {
          SIZE.width = IMAGE.width;
          SIZE.height = IMAGE.height;
        }

        SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
        SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
        initializePieces(SIZE.rows, SIZE.columns);
        updateGame();
      };
      IMAGE.src = "https://picsum.photos/1200/800?random=1";
      // IMAGE.src = "/images/"+imgArr[rand];
    });
  // ? Pretty sure this is run before updateCanvas()
}

function updateGame() {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
  HELPER_CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);

  // ? Will create base "completed" puzzle layer with lowered opacity
  CONTEXT.globalAlpha = 0.5;
  CONTEXT.drawImage(VIDEO || IMAGE, SIZE.x, SIZE.y, SIZE.width, SIZE.height);

  // ? Layer will be ontop of "completed" layer with full opacity
  // ? to illustrate how to place the puzzle pieces on the snap grid
  CONTEXT.globalAlpha = 1;
  for (let i = 0; i < PIECES.length; i++) {
    PIECES[i].draw(CONTEXT);
    PIECES[i].draw(HELPER_CONTEXT, false);
  }
  updateTime();
  window.requestAnimationFrame(updateGame);
}

function getRandomColor() {
  const red = Math.floor(Math.random() * 255);
  const green = Math.floor(Math.random() * 255);
  const blue = Math.floor(Math.random() * 255);
  return `rgb(${red},${green},${blue})`;
}

function initializePieces(rows, cols) {
  // ? creates a grid on the image
  SIZE.rows = rows;
  SIZE.columns = cols;

  PIECES = [];
  const uniqueRandomColors = [];
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      let color = getRandomColor();
      // ? check if a color was used before and regenerate it
      while (uniqueRandomColors.includes(color)) {
        color = getRandomColor();
      }
      PIECES.push(new Piece(i, j, color));
    }
  }
  let count = 0;
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      const piece = PIECES[count];

      //?if on last row, we dont have any bottom "tabs"
      if (i == SIZE.rows - 1) piece.bottom = null;
      else {
        const sign = Math.random() - 0.5 < 0 ? -1 : 1;
        // ? bottom tab between 30% and 70% of total width of piece
        piece.bottom = sign * (Math.random() * 0.4 + 0.3);
      }

      //?if on last column, we dont have any right "tabs"
      if (j == SIZE.columns - 1) piece.right = null;
      else {
        const sign = Math.random() - 0.5 < 0 ? -1 : 1;
        // ? right tab between 30% and 70% of total width of piece
        piece.right = sign * (Math.random() * 0.4 + 0.3);
      }

      if (i == 0) piece.top = null;
      else {
        // ? top tabs need to connect with pieces from above
        piece.top = -PIECES[count - SIZE.columns].bottom;
      }

      if (j == 0) piece.left = null;
      else {
        // ? left tabs need to connect with pieces from right
        piece.left = -PIECES[count - 1].right;
      }

      count++;
    }
  }
}

function randomizePieces() {
  for (let i = 0; i < PIECES.length; i++) {
    let loc = {
      x: Math.random() * (CANVAS.width - PIECES[i].width),
      y: Math.random() * (CANVAS.height - PIECES[i].height),
    };
    PIECES[i].x = loc.x;
    PIECES[i].y = loc.y;
    PIECES[i].correct = false;
  }
}

function setDifficulty() {
  let diff = document.getElementById("difficulty").value;
  switch (diff) {
    case "easy":
      initializePieces(3, 3);
      break;
    case "medium":
      initializePieces(5, 5);
      break;
    case "hard":
      initializePieces(10, 10);
      break;
    case "insane":
      initializePieces(40, 25);
      break;
    default:
      break;
  }
}

function restart() {
  START_TIME = new Date().getTime();
  END_TIME = null;
  randomizePieces();
  document.getElementById("menuItems").style.display = "none";
  document.getElementById("showMenuBtn").style.display = "block";
}

function updateTime() {
  let now = new Date().getTime();
  if (START_TIME != null) {
    if (END_TIME != null) {
      document.getElementById("time").innerHTML = formatTime(END_TIME - START_TIME);
    } else {
      document.getElementById("time").innerHTML = formatTime(now - START_TIME);
    }
  }
}

function formatTime(ms) {
  let seconds = Math.floor(ms / 1000);
  let s = Math.floor(seconds % 60);
  let m = Math.floor((seconds % (60 * 60)) / 60);
  let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));

  let formattedTime = h.toString().padStart(2, "0");
  formattedTime += ":";
  formattedTime += m.toString().padStart(2, "0");
  formattedTime += ":";
  formattedTime += s.toString().padStart(2, "0");

  return formattedTime;
}

function isComplete() {
  for (let i = 0; i < PIECES.length; i++) {
    if (PIECES[i].correct == false) return false;
  }
  return true;
}

function showMenu() {
  let menuItem = document.getElementById("menuItems");
  if (menuItem.style.display === "block") {
    menuItem.style.display = "none";
  } else {
    menuItem.style.display = "block";
  }
}

class Piece {
  // ? This is run before randomizePieces()
  constructor(rowIndex, colIndex, color) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.color = color;
    this.width = SIZE.width / SIZE.columns;
    this.height = SIZE.height / SIZE.rows;
    this.x = SIZE.x + this.width * this.colIndex; // ? 100 + (window.innerWidth[EX: 2400] / 5) * n
    this.y = SIZE.y + this.height * this.rowIndex;
    this.xCorrect = this.x;
    this.yCorrect = this.y;
    this.correct = true;
  }

  draw(context, useCam = true) {
    context.beginPath();

    // ? Create a rect
    // context.rect(this.x, this.y, this.width, this.height);

    // ? minimum length of piece
    const sz = Math.min(this.width, this.height);
    const neck = 0.05 * sz;
    const tabWidth = 0.3 * sz;
    const tabHeight = 0.3 * sz;

    // this.diagonals(context, tabHeight);
    this.tabs(context, tabHeight, neck, tabWidth);

    context.save();
    context.clip();
    const scaledTabHeight = VIDEO
      ? (Math.min(VIDEO.videoWidth / SIZE.columns, VIDEO.videoHeight / SIZE.rows) * tabHeight) / sz
      : (Math.min(IMAGE.width / SIZE.columns, IMAGE.height / SIZE.rows) * tabHeight) / sz;

    if (!useCam) {
      context.fillStyle = this.color;
      context.fillRect(
        this.x - tabHeight,
        this.y - tabHeight,
        this.width + tabHeight * 2,
        this.height * tabHeight * 2
      );
    } else if (!VIDEO) {
      context.drawImage(
        IMAGE,
        (this.colIndex * IMAGE.width) / SIZE.columns - scaledTabHeight,
        (this.rowIndex * IMAGE.height) / SIZE.rows - scaledTabHeight,
        IMAGE.width / SIZE.columns + scaledTabHeight * 2,
        IMAGE.height / SIZE.rows + scaledTabHeight * 2,
        this.x - tabHeight,
        this.y - tabHeight,
        this.width + tabHeight * 2,
        this.height + tabHeight * 2
      );
    } else {
      context.drawImage(
        VIDEO,
        (this.colIndex * VIDEO.videoWidth) / SIZE.columns - scaledTabHeight,
        (this.rowIndex * VIDEO.videoHeight) / SIZE.rows - scaledTabHeight,
        VIDEO.videoWidth / SIZE.columns + scaledTabHeight * 2,
        VIDEO.videoHeight / SIZE.rows + scaledTabHeight * 2,
        this.x - tabHeight,
        this.y - tabHeight,
        this.width + tabHeight * 2,
        this.height + tabHeight * 2
      );
    }
    context.restore();
    context.stroke();
  }

  tabs(context, tabHeight, neck, tabWidth) {
    // ? from top left
    context.moveTo(this.x, this.y);

    // ? to top right
    if (this.top) {
      context.lineTo(this.x + this.width * Math.abs(this.top) - neck, this.y);
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) - neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) - tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top),
        this.y - tabHeight * Math.sign(this.top)
      );

      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) + tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top) + neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) + neck,
        this.y
      );
    }
    context.lineTo(this.x + this.width, this.y);

    // ? to bottom right
    if (this.right) {
      context.lineTo(this.x + this.width, this.y + this.height * Math.abs(this.right) - neck);
      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) - neck,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) - tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right)
      );

      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) + tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) + neck,

        this.x + this.width,
        this.y + this.height * Math.abs(this.right) + neck
      );
    }
    context.lineTo(this.x + this.width, this.y + this.height);

    // ? to bottom left
    if (this.bottom) {
      context.lineTo(this.x + this.width * Math.abs(this.bottom) + neck, this.y + this.height);
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) + neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) + tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom),
        this.y + this.height + tabHeight * Math.sign(this.bottom)
      );
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) - tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height
      );
    }
    context.lineTo(this.x, this.y + this.height);

    // ? to top left
    if (this.left) {
      context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck);
      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) + neck,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) + tabWidth,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left)
      );

      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) - tabWidth,

        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) - neck,

        this.x,
        this.y + this.height * Math.abs(this.left) - neck
      );
    }
    context.lineTo(this.x, this.y);
  }

  diagonals(context, tabHeight) {
    // ? if you want to use diagonals instead of tabs on the pieces

    // ? from top left
    context.moveTo(this.x, this.y);
    // ? to top right
    context.lineTo(this.x + this.width * Math.abs(this.top), this.y - tabHeight * Math.sign(this.top));
    context.lineTo(this.x + this.width, this.y);
    // ? to bottom right
    context.lineTo(
      this.x + this.width - tabHeight * Math.sign(this.right),
      this.y + this.height * Math.abs(this.right)
    );
    context.lineTo(this.x + this.width, this.y + this.height);
    // ? to bottom left
    context.lineTo(
      this.x + this.width * Math.abs(this.bottom),
      this.y + this.height + tabHeight * Math.sign(this.bottom)
    );
    context.lineTo(this.x, this.y + this.height);
    // ? to top left
    context.lineTo(this.x + tabHeight * Math.sign(this.left), this.y + this.height * Math.abs(this.left));
    context.lineTo(this.x, this.y);

    context.stroke();
  }

  isClose() {
    // ? is the selected piece within 33% of the "completed" puzzle piece (to allow it to snap tp place?)
    // ? only works if the selected piece is in the place of the "completed" puzzle piece
    if (distance({ x: this.x, y: this.y }, { x: this.xCorrect, y: this.yCorrect }) < this.width / 3) {
      // ? this.width / 3 as in 33%
      return true;
    }
    return false;
  }

  snap() {
    this.x = this.xCorrect;
    this.y = this.yCorrect;
    this.correct = true;
    playSnapMelody();
  }
}

function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

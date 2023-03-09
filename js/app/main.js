// The main logic for your project goes in this file.

/**
 * The {@link Player} object; an {@link Actor} controlled by user input.
 */
var player;

var FLOOR_HEIGHT = 120;
var PARALLAX = 0.2;
var WORLD_DENSITY = 0.1; //0.005
var RANDOM_CHALLENGE_P = 0.001;

var secondsPerScreen = 4;
var gameLengthSeconds = 60*60; // session never longer than 1hr

var END_POINT = -1000;

var scores = {
  music: 0
};

alertify.defaults.notifier.position = "bottom-center";

// var socket = io();
var SOCKETS_URL = "http://localhost:8080";
socket = io(SOCKETS_URL, { forceNew: true });
socket.on("connect", () => {
    console.log("socket connected");
    socket.emit("student", {nickname: 'Demo student'});
});
socket.on('ack!', function(msg) {
  console.log('ACKED!');
  console.log(msg);
});
socket.on('message', function(data) {
  console.log(data);
  alertify.success(data.message);
});
socket.on('walk', () => {console.log('WALK!'); autorun(true)});
socket.on('stop', () => {console.log('STOP!'); autorun(false)});
socket.on('success', () => {
  console.log('SUCCESS!'); 
  // presskey(49)
  player.processInput("space");
});
socket.on('end', () => {console.log('END!'); prepareEnding()});
socket.on('challenge', () => {console.log('CHALLENGE!'); poseChallenge()});

/**
 * Keys used for various directions.
 *
 * The property names of this object indicate actions, and the values are lists
 * of keyboard keys or key combinations that will invoke these actions. Valid
 * keys include anything that {@link jQuery.hotkeys} accepts. The up, down,
 * left, and right properties are required if the `keys` variable exists; if
 * you don't want to use them, just set them to an empty array. {@link Actor}s
 * can have their own {@link Actor#keys keys} which will override the global
 * set.
 */
var keys = {
  up: ['space'],
  down: [],
  left: [],
  right: ['right'],
  shoot: ['z'],
};

var bullets = new Collection();

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
  '/Users/james/Documents/Github/practice-run/img/bg.png',
  '/Users/james/Documents/Github/practice-run/img/fg.png',
  '/Users/james/Documents/Github/practice-run/img/ross-sprite.png',
  '/Users/james/Documents/Github/practice-run/img/teacher.png',

  '/Users/james/Documents/Github/practice-run/img/e.png',
  '/Users/james/Documents/Github/practice-run/img/t.png',
  '/Users/james/Documents/Github/practice-run/img/tl.png',
  '/Users/james/Documents/Github/practice-run/img/tr.png',

  '/Users/james/Documents/Github/practice-run/img/tree1.png',
  '/Users/james/Documents/Github/practice-run/img/tree2.png',
  '/Users/james/Documents/Github/practice-run/img/dog.png',
  '/Users/james/Documents/Github/practice-run/img/sheet-music.png',
  '/Users/james/Documents/Github/practice-run/img/bin.png'
];

/**
 * The Bullet class.
 */
var Bullet = Actor.extend({
  // Override Actor default properties.
  MOVEAMOUNT: 800, // Bullet velocity in pixels per second
  GRAVITY: false, // Just keep going rather than falling down
  CONTINUOUS_MOVEMENT: true, // Keep going in the last specified direction
  STAY_IN_WORLD: false, // Let our bullets leave the world (we'll destroy them when they do)
  DEFAULT_WIDTH: 80,
  DEFAULT_HEIGHT: 80,
  /**
   * Initialize a Bullet.
   *
   * @param direction
   *   An array of keys representing the Bullet's initial direction.
   * @param x
   *   The x-coordinate of the top-left corner of the Bullet.
   * @param y
   *   The y-coordinate of the top-left corner of the Bullet.
   */
  init: function(direction, x, y) {
    // Invoke the parent's init() function, Actor.prototype.init().
    this._super(x, y);
    // Store the direction we want the bullet to go. The CONTINUOUS_MOVEMENT
    // setting uses this property to keep going in the specified direction.
    this.lastLooked = direction;
  },
  /**
   * Override drawDefault() to draw a bullet when there isn't an image associated with it (src === null).
   */
  drawDefault: function(ctx, x, y, w, h) {
    // This draws a circle onto the graphics context (i.e. the canvas).
    // Parameters are x-coordinate of center, y-coordinate of center, radius, fill color, border color
    ctx.circle(x + w/2, y + w/2, (w + h) / 4, 'orange', 'black');
  },
});

/**
 * The minimum number of milliseconds that must pass between firing bullets.
 *
 * Set to 0 (zero) for no limit.
 */
Bullet.fireRate = 250;

/**
 * Bind to the "shoot" key(s) and create a new bullet.
 *
 * Change keyup to keydown to be able to hold down the shoot key.
 */
jQuery(document).keyup(keys.shoot.join(' '), function() {
  var now = Date.now();
  // Throttle bullet firing.
  if (now > (player._lastFired || 0) + Bullet.fireRate && isAnimating()) {
    player._lastFired = now;
    // Shoot in the direction the player looked last (default to right).
    var direction = player.lastLooked.length ? player.lastLooked : keys.right;
    // Center on the player.
    var x = player.x + player.width * 0.5,
        y = player.y + player.height * 0.5 - 10;
    // Add the new bullet to our Collection.
    var b = new Bullet(direction, x, y);
    b.src = new SpriteMap('/Users/james/Documents/Github/practice-run/img/drum-stick.png', {
      stand: [0, 0, 0, 7],
      fall: [0, 4, 0, 4, true],
      left: [0, 0, 0, 7],
      right: [0, 0, 0, 7],
      lookLeft: [0, 2, 0, 2],
      lookRight: [0, 2, 0, 2],
      jumpLeft: [0, 4, 0, 4],
      jumpRight: [0, 4, 0, 4],
    }, 
    {
      frameW: 80,
      frameH: 80,
      interval: 50,
      useTimer: false,
    });
    b.width = 60;
    b.height = 60;
    bullets.add(b);
  }
});

function endGame() {
  App.gameOver("Well done!!");
  var results = document.getElementById('results-holder');
  results.style.display = "block";

}

function prepareEnding() {
  var schoolPos = world.xOffset + canvas.width + 200;
  school.x = schoolPos;
  END_POINT = schoolPos + 200;
  world.resize(schoolPos + school.width, canvas.height);
  world.centerViewportAround(player.x + player.width/2 + canvas.width/2 - canvas.width*(1-player.MOVEWORLD), player.y);
  console.log('resize to ', schoolPos + school.width);
  console.log('added school at', school.x);
  console.log('endpoint', END_POINT);
  console.log('currently', player.x);
  console.log('currently', world.xOffset);

  boss.stoodOn();
  solid = null; // clear terrain
  
  if(tree1.x > world.xOffset + canvas.width) {
    tree1.x = -1000;
  }
  if(tree2.x > world.xOffset + canvas.width) {
    tree2.x = -1000;
  }
  if(dog.x > world.xOffset + canvas.width) {
    dog.x = -1000;
  }
  if(bin.x > world.xOffset + canvas.width) {
    bin.x = -1000;
  }
  if(sheetmusic.x > world.xOffset + canvas.width) {
    sheetmusic.x = -1000;
  }
}

function poseChallenge() {
  var r = Math.random();
  var targetPos = world.xOffset + canvas.width + 0;

  if(r < 0.5) {
    boss.STAY_IN_WORLD = true;
    boss.x = targetPos;
    boss.update();
    console.log('Boss moved to', targetPos);
  } else {

     // Add terrain.
    var grid =  "                         CBBD            \n" +
                "                      CBBAAAABD          \n" +
                "                     CAAAAAAAAAD         ";
    solid = new TileMap(grid, {
      A: '/Users/james/Documents/Github/practice-run/img/e.png',
      B: '/Users/james/Documents/Github/practice-run/img/t.png',
      C: '/Users/james/Documents/Github/practice-run/img/tl.png',
      D: '/Users/james/Documents/Github/practice-run/img/tr.png',
      }, {
      cellSize: [40,40],
      startCoords: [targetPos, world.height - 120]
    });

    console.log('Terrain moved to', targetPos);
  }
}

/**
 * A magic-named function where all updates should occur.
 */
function update() {

  // move
  player.update();
  boss.update();
  // enforce collision
  if(solid) player.collideSolid(solid);
  player.collideSolid(boss);

  if(END_POINT > 0 && player.x > END_POINT) {
    endGame();
  }

  // The forEach() method runs the specified function on every item in the
  // Collection. forEach() can also take a string, which is interpreted as a
  // method name; for example, bullets.forEach('update') would execute each
  // bullet's "update" method.
  // TileMaps have a forEach() method as well that works the same way.
  // console.log(bullets)
  bullets.forEach(function(bullet) {
    console.log('update bullet', bullet.x, bullet.y)
    bullet.update();
    // Returning true removes the bullet from the collection.
    // Destroy the bullet if it hits a solid or goes out of the world.
    if(bullet.collides(boss)) {
      console.log('BULLET DESTROYED BOSS');
      boss.stoodOn();
      return true;
    }

    if(bullet.collides(dog)) {
      dog.destroy();
      return true;
    }
    if(bullet.collides(bin)) {
      bin.destroy();
      return true;
    }

    var destroy = (
      bullet.x > world.xOffset + canvas.width
      || bullet.x < world.xOffset - bullet.width
      || !world.isInWorld(bullet, true)
    );

    if(destroy) console.log('BULLET DESTROYED');
    return destroy;

  });

  if(player.collides(sheetmusic)) {
    sheetmusic.destroy();
    console.log('COLLIDE')
  }

  if(Math.random() < RANDOM_CHALLENGE_P && boss.x < world.xOffset && END_POINT < 0) {
    var targetPos = world.xOffset + canvas.width + 0;
    boss.STAY_IN_WORLD = true;
    boss.x = targetPos;
    boss.update();
  }

  if(Math.random() < WORLD_DENSITY && END_POINT < 0) {
    var targetPos = world.xOffset + canvas.width + 100 + Math.random()*2000;
    if(Math.random() < 0.2) {
      if(tree1.x + tree1.width < world.xOffset) {
        console.log('set tree1 to', targetPos);
        tree1.x = targetPos;
      }
    } else if(Math.random() < 0.4) {
      if(tree2.x + tree2.width < world.xOffset) {
        console.log('set tree2 to', targetPos);
        tree2.x = targetPos;
      }
    } else if(Math.random() < 0.6) {
      if(sheetmusic.x + sheetmusic.width < world.xOffset) {
        console.log('set sheetmusic to', targetPos);
        sheetmusic.x = targetPos;
      }
    } else if(Math.random() < 0.8) {
      if(bin.x + bin.width < world.xOffset) {
        console.log('set bin to', targetPos);
        bin.x = targetPos;
      }
    } else {
      if(dog.x + dog.width < world.xOffset) {
        console.log('set dog to', targetPos);
        dog.x = targetPos;
      }
    }
  }

  // BACKGROUND
  // if(bkgd2.x < 0) {
  //   console.log('shift bg1');
  //   bkgd1.x = world.xOffset + (bkgd1.width / PARALLAX);
  // }
  // if(world.xOffset > bkgd2.x + (bkgd2.width / PARALLAX)) {
  //   console.log('shift bg2');
  //   bkgd2.x = world.xOffset + (bkgd2.width / PARALLAX);
  // }

  // FLOOR
  if(world.xOffset > foreground1.x + foreground1.width) {
    foreground1.x = foreground2.x + foreground2.width;
  }
  if(world.xOffset > foreground2.x + foreground2.width) {
    foreground2.x = foreground1.x + foreground1.width;
  }

  bkgd1.x = (PARALLAX * -1 * world.xOffset) % bkgd1.width;
  bkgd2.x = (bkgd1.x < 0 ? bkgd1.x + bkgd1.width : bkgd1.x - bkgd1.width); // + (PARALLAX * -1 * world.xOffset) % bkgd1.width;
  // bkgd2.x = 10000;//PARALLAX * -world.xOffset + (bkgd1.width / PARALLAX);
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {

  // Draw a background. This is just for illustration so we can see scrolling.
  // context.drawCheckered(80, -200, 0, world.width + canvas.width, world.height);

  // solid.draw();
  // console.log(world.xOffset)

  bkgd1.draw();
  bkgd2.draw();
  foreground1.draw();
  foreground2.draw();

  bullets.draw();

  home.draw();
  school.draw();

  tree1.draw();
  tree2.draw();
  dog.draw();
  bin.draw();
  sheetmusic.draw();

  if(solid) solid.draw();
  player.draw();
  boss.draw();

  // hud.draw();

  document.getElementById("score-el-1").textContent = ("Score: " + Math.round(world.xOffset / 10));
  document.getElementById("score-el-2").textContent = ("Music: " + scores.music + " page" + (scores.music !== 1 ? "s" : ""));
}

function autorun(run) {
  if(run) {
    player.lastLooked = ['right'];
    player.CONTINUOUS_MOVEMENT = true;
    // presskey(39);
  } else {
    player.CONTINUOUS_MOVEMENT = false;
    // presskey(40);
  }
}

function presskey(key) {
  var keyboardEvent = document.createEvent('KeyboardEvent');
    var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';

    keyboardEvent[initMethod](
      'keydown', // event type: keydown, keyup, keypress
      true, // bubbles
      true, // cancelable
      window, // view: should be window
      false, // ctrlKey
      false, // altKey
      false, // shiftKey
      false, // metaKey
      key, // keyCode: unsigned long - the virtual key code, else 0
      0, // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
    );
    document.dispatchEvent(keyboardEvent);
  }

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  // Change the size of the playable area. Do this before placing items!
  world.resize(canvas.width * (gameLengthSeconds/secondsPerScreen), canvas.height);
  world.yOffset = -FLOOR_HEIGHT;
  
  var checkbox = document.getElementById('start-stop');
  checkbox.addEventListener('change', (event) => {
    autorun(event.currentTarget.checked);
  });

  document.getElementById('btn-message').addEventListener('click', event => {
    alertify.success("Try that passage again, a little slower!");
  });
  document.getElementById('btn-challenge').addEventListener('click', event => {
    poseChallenge();
  });
  document.getElementById('btn-end').addEventListener('click', event => {
    prepareEnding();
  });

  // Switch from side view to top-down.
  // Actor.prototype.GRAVITY = true;
  
  // Initialize the player.
  player = new Player(200, world.height - 160);
  player.width = 132;
  player.height = 160;

  // player.src = '/Users/james/Documents/Github/practice-run/player.webp';
  player.MOVEWORLD = 0.8;
  player.lastLooked = ['right'];
  player.CONTINUOUS_MOVEMENT = false;

  player.G_CONST = 21; // gravity
  player.JUMP_VEL = 500; // jump power
  player.AIR_CONTROL = 1; //0.25;
  player.MULTI_JUMP = 2; //0
  player.JUMP_RELEASE = false;

  // player.MOVEAMOUNT = 10000;


  player.src = new SpriteMap('/Users/james/Documents/Github/practice-run/img/ross-sprite.png', {
    stand: [1, 0, 1, 17],
    fall: [0, 4, 0, 4, true],
    left: [0, 0, 0, 7],
    right: [0, 0, 0, 7],
    lookLeft: [0, 2, 0, 2],
    lookRight: [0, 2, 0, 2],
    jumpLeft: [0, 4, 0, 4],
    jumpRight: [0, 4, 0, 4],
  }, {
    frameW: 132,
    frameH: 160,
    interval: 100,
    useTimer: false,
  });

  home = new Box(-150, world.height - 451);
  home.width = 663;
  home.height = 451;
  home.src = '/Users/james/Documents/Github/practice-run/img/home.png';

  school = new Box(-1000, world.height - 305);
  school.width = 554;
  school.height = 305;
  school.src = '/Users/james/Documents/Github/practice-run/img/school.png';

  tree1 = new Box(-1000, world.height - 207);
  tree1.width = 116;
  tree1.height = 207;
  tree1.src = '/Users/james/Documents/Github/practice-run/img/tree1.png';
  tree2 = new Box(-1000, world.height - 282);
  tree2.width = 164;
  tree2.height = 282;
  tree2.src = '/Users/james/Documents/Github/practice-run/img/tree2.png';
  dog = new Box(-1000, world.height - 70);
  dog.width = 85;
  dog.height = 70;
  dog.src = '/Users/james/Documents/Github/practice-run/img/dog.png';
  dog.destroy = function() {
    this.x = -1000;
  }
  bin = new Box(-1000, world.height - 103);
  bin.width = 79;
  bin.height = 103;
  bin.src = '/Users/james/Documents/Github/practice-run/img/bin.png';
  bin.destroy = function() {
    this.x = -1000;
  }
  sheetmusic = new Box(-1000, world.height - 42);
  sheetmusic.width = 97;
  sheetmusic.height = 42;
  sheetmusic.src = '/Users/james/Documents/Github/practice-run/img/sheet-music.png';
  sheetmusic.destroy = function() {
    this.x = -1000;
    scores.music++;
  }

  boss = new Actor(-1000, 200);
  boss.STAY_IN_WORLD = false;
  boss.width = 160;
  boss.height = 160;
  boss.src = new SpriteMap('/Users/james/Documents/Github/practice-run/img/teacher.png', {
    stand: [0, 0, 0, 7],
    fall: [0, 4, 0, 4, true],
    left: [0, 0, 0, 7],
    right: [0, 0, 0, 7],
    lookLeft: [0, 2, 0, 2],
    lookRight: [0, 2, 0, 2],
    jumpLeft: [0, 4, 0, 4],
    jumpRight: [0, 4, 0, 4],
  }, {
    frameW: 160,
    frameH: 160,
    interval: 100,
    useTimer: false,
  });
  boss.stoodOn = function() {
    if(this.height === 160) {
      console.log('STOOD ON');
      this.height = 40;
      this.y += 120;
      setTimeout(() => {
        this.x = -1000;
        this.y -= 120;
        this.height = 160;
      }, 500);
    }
  }

  // Add terrain.
  var grid =  "                    \n" +
              "                    \n" +
              "                     ";
  solid = new TileMap(grid, {
    A: '/Users/james/Documents/Github/practice-run/img/e.png',
    B: '/Users/james/Documents/Github/practice-run/img/t.png',
    C: '/Users/james/Documents/Github/practice-run/img/tl.png',
    D: '/Users/james/Documents/Github/practice-run/img/tr.png',
  }, {
    cellSize: [40,40]
  });

  // Set up the static background layer.
  // By default, layers scroll with the world.
  bkgd1 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/img/bg.png',
    width: canvas.height * (8183/1163),
    height: canvas.height,
    relative: 'canvas',
  });
  bkgd2 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/img/bg.png',
    width: canvas.height * (8183/1163),
    height: canvas.height,
    x: 8183,
    relative: 'canvas',
  });
 
  // solid.draw(bkgd.context);

  foreground1 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/img/fg.png',
    width: 2000,
    height: FLOOR_HEIGHT,
    y: canvas.height,
  });
  foreground2 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/img/fg.png',
    width: 2000,
    height: FLOOR_HEIGHT,
    x: 2000,
    y: canvas.height,
  });

  // Set up the Heads-Up Display layer.
  // This layer will stay in place even while the world scrolls.
  hud = new Layer({relative: 'canvas'});
  hud.context.font = '30px Arial';
  hud.context.textAlign = 'right';
  hud.context.textBaseline = 'top';
  hud.context.fillStyle = 'black';
  hud.context.strokeStyle = 'rgba(211, 211, 211, 0.5)';
  hud.context.lineWidth = 3;
  // hud.context.strokeText('Score: 0', canvas.width - 15, 15);
  // hud.context.fillText('Score: 0', canvas.width - 15, 15);

  if(typeof socket !== undefined) {
    console.log('sending to socket');
    socket.emit('game setup complete', '');
  } else {
    console.log('socket not ready');
  }
}

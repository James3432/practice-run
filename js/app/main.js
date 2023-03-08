// The main logic for your project goes in this file.

/**
 * The {@link Player} object; an {@link Actor} controlled by user input.
 */
var player;

var secondsPerScreen = 4;
var gameLengthSeconds = 60*60; // session never longer than 1hr

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
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
  '/Users/james/Documents/Github/practice-run/bg.png',
  '/Users/james/Documents/Github/practice-run/box.jpg',
  '/Users/james/Documents/Github/practice-run/player.webp',
];

/**
 * A magic-named function where all updates should occur.
 */
function update() {

  // move
  player.update();
  // enforce collision
  player.collideSolid(solid);

  // if(player.x > 300) {
  // player.x = world.xOffset + 200;
  // }

  if(world.xOffset > bkgd1.x + bkgd1.width) {
    bkgd1.x = world.xOffset + canvas.width;
  }
  if(world.xOffset > bkgd2.x + bkgd2.width) {
    bkgd2.x = world.xOffset + canvas.width;
  }
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
  solid.draw();
  player.draw();
  // bullets.draw();
  // hud.draw();

  document.getElementById("score-el").textContent = ("Score: " + Math.round(world.xOffset / 10));
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
  world.resize(canvas.width*(gameLengthSeconds/secondsPerScreen) , canvas.height);
  
  // Switch from side view to top-down.
  // Actor.prototype.GRAVITY = true;
  
  // Initialize the player.
  player = new Player(200, 200);

  player.src = '/Users/james/Documents/Github/practice-run/player.webp';
  player.MOVEWORLD = 0.8;
  player.CONTINUOUS_MOVEMENT = true;

  // solid = new Box(1000, world.height - Box.prototype.DEFAULT_HEIGHT);
  // solid.src = '/Users/james/Documents/Github/practice-run/box.jpg';


  // Add terrain.
  var grid =  "                         B      BB        \n" +
              "                              BBBBBB      \n" +
              "                      BB    BBBBBBBBBB  BB";
  solid = new TileMap(grid, {B: '/Users/james/Documents/Github/practice-run/box.jpg'});


  // Set up the static background layer.
  // By default, layers scroll with the world.
  bkgd1 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/bg.png',
    width: canvas.width,
    height: canvas.width * (500/1024)
  });
  bkgd2 = new Layer({
    src: '/Users/james/Documents/Github/practice-run/bg.png',
    width: canvas.width,
    height: canvas.width * (500/1024),
    x: canvas.width
  });
  // solid.draw(bkgd.context);

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
}

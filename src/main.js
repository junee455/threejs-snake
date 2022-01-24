import { Game } from "./snake";

toggleSettings.settingsHiddent = true;

export function setWidth(value) {
  gameSettings.width = Number(value);
}

export function setHeight(value) {
  gameSettings.height = Number(value);
}

/** @type {Game} */
var currentGame = undefined;

export function startGame() {
  if (currentGame) {
    currentGame.gameOver();
  }
  currentGame = new Game({ ...gameSettings });
}

/**
 * Sets snakes color
 * @param {'r' | 'g' | 'b'} component
 * @param {number} value
 */
export function setColor(component, value) {
  gameSettings.color[component] = Number(value) / 100;

  currentGame.setColor(gameSettings.color);
}

/**
 * Changes snake direction. Possible directions: Left, Right, Up, Down
 * @param {string} direction
 * */
export function changeDirection(direction) {
  direction = "Arrow" + direction;
  currentGame.changeDirection({ key: direction });
}

export function toggleTeleports(value) {
  gameSettings.teleportEnabled = !!value;
}

export function setGameSpeed(val) {
  gameSettings.movementSpeed = 10 / val;
  currentGame.setMovementSpeed(gameSettings.movementSpeed);
}

export var gameSettings = {
  width: 10,
  height: 10,
  teleportEnabled: true,
  /**
   * how many seconds it takes to move to the next cell
   * the less the value the faster the game
   */
  movementSpeed: 0.3,
  color: {
    r: 0.1,
    g: 0.1,
    b: 0.1,
  },
};

export function toggleSettings() {
  let self = toggleSettings;
  const el = document.querySelector("#settings-block");
  el.classList = [self.settingsHiddent ? "shown" : "hidden"];
  self.settingsHiddent = !self.settingsHiddent;
}

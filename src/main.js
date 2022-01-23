import { main } from './snake';


toggleSettings.settingsHiddent = true;

export function setWidth(value) {
    gameSettings.width = Number(value);
}

export function setHeight(value) {
    gameSettings.height = Number(value);
}

var currentGame = undefined;

export function startGame() {
    if(currentGame) {
        currentGame.gameOver()
    }
    // main({...fieldSize});
    currentGame = new main({...gameSettings});
    console.log("started");
}

/**
 * Changes snake direction. Possible directions: Left, Right, Up, Down
 * @param {string} direction
 * */ 
export function changeDirection(direction) {
    direction = "Arrow" + direction;
    currentGame.changeDirection({key: direction});
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
    // how many seconds it takes to move to the next cell
    // the less the value the faster the game
    movementSpeed: 0.3
}

export function toggleSettings() {
    let self = toggleSettings;
    const el = document.querySelector('#settings-block');
    el.classList = [
        self.settingsHiddent ? 'shown' : 'hidden'];
    self.settingsHiddent = !self.settingsHiddent;
};



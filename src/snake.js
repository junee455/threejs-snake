/** @module Snake */

import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

/**
 * generates a field of little squares
 *
 * @param {number} width width in cells
 * @param {number} height height in cells
 * @param {number} cellSize cell size in OpenGL units
 * @returns {THREE.Mesh}
 *  */

function generateFieldGeometry(width, height, cellSize) {
  let basicSquare = new THREE.PlaneGeometry(cellSize * 0.93, cellSize * 0.93);
  let fieldGeometry = basicSquare.clone();
  for (let i = 1; i < width; i++) {
    fieldGeometry.translate(cellSize, 0, 0);
    fieldGeometry = mergeBufferGeometries([fieldGeometry, basicSquare]);
  }
  basicSquare = fieldGeometry.clone();
  for (let i = 1; i < height; i++) {
    fieldGeometry.translate(0, cellSize, 0);
    fieldGeometry = mergeBufferGeometries([fieldGeometry, basicSquare]);
  }

  fieldGeometry.computeBoundingBox();
  fieldGeometry.center();

  const material = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const plane = new THREE.Mesh(fieldGeometry, material);
  plane.translateZ = -1;

  return plane;
}

/**
 *
 * @param {string} selector selector for canvas element
 * @returns
 */

function setupRender(selector) {
  const canvas = document.querySelector(selector);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.autoClear = false;

  const fov = 75;

  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.z = 2;
  camera.position.y = -1;
  camera.rotateX(0.5);

  const scene = new THREE.Scene();

  updateCamera();

  // on resize
  function updateCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", updateCamera);

  const light = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(light);

  const pointLight = new THREE.PointLight(0xffffff, 1, 0);
  pointLight.position.set(0, 0, 0.5);
  scene.add(pointLight);

  return {
    canvas,
    scene,
    camera,
    renderer,
  };
}

// game constants
const Direction = {
  right: 1,
  down: 2,
  left: 3,
  up: 4,
};

const Apple = 5;

const snakeMaterial = new THREE.MeshLambertMaterial({ color: 0x44aa55 });

const appleMaterial = new THREE.MeshBasicMaterial({ color: 0xff5555 });


/**
 * The snake game
 * @constructor
 * @param {{
 *  width: number,
 *  height: number,
 *  teleportEnabled: boolean
 * }} gameSettings
 */
export function Game(gameSettings) {
  this.isGameOver = false;
  document.querySelector("#score").innerHTML = "0";

  // size of the field cell
  const cellSize = 0.2;

  // move snake every N seconds
  let currentTime = 0;

  this.movementSpeed = gameSettings.movementSpeed;
  
  this.setMovementSpeed = (speed) => {
    movesPast = currentTime / (speed * 1000);
    this.movementSpeed = speed;
  };


  const snakeRenderer = setupRender("#canvas");

  const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);

  const appleMesh = new THREE.Mesh(geometry, appleMaterial);

  const snakeSegments = new THREE.InstancedMesh(
    geometry,
    snakeMaterial,
    gameSettings.width * gameSettings.height
  );

  const fieldGeometry = generateFieldGeometry(
    gameSettings.width,
    gameSettings.height,
    cellSize
  );
  snakeRenderer.scene.add(fieldGeometry);
  snakeRenderer.scene.add(snakeSegments);
  snakeRenderer.scene.add(appleMesh);

  const dummy = new THREE.Object3D();

  this.teleportEnabled = !!gameSettings.teleportEnabled;

  let snakeLength = 3;

  let score = 0;

  let movesPast = 0;
  
  let preHeadSegment = [];

  /**
   *  array representing the game state
   * @type {Array<Direction | Apple | undefined>}
   */
  this.field = [];

  for (let i = 0; i < gameSettings.height; i++) {
    this.field.push([]);
    for (let j = 0; j < gameSettings.width; j++) {
      this.field[i].push(undefined);
    }
  }

  let tailSegment = [
    Math.floor(gameSettings.height / 2),
    Math.floor(gameSettings.width / 2) - 1,
  ];
  let headSegment = [
    Math.floor(gameSettings.height / 2),
    Math.floor(gameSettings.width / 2) + 1,
  ];

  this.field[Math.floor(gameSettings.height / 2)][
    Math.floor(gameSettings.width / 2) - 1
  ] = Direction.right;
  this.field[Math.floor(gameSettings.height / 2)][
    Math.floor(gameSettings.width / 2)
  ] = Direction.right;
  this.field[Math.floor(gameSettings.height / 2)][
    Math.floor(gameSettings.width / 2) + 1
  ] = Direction.right;
  let currentHeadDirection = Direction.right;

  /**
   * returns coords of the next segment depending on its direction
   * @method
   * @param {[number, number]} segment - the segment to move
   * @param {boolean} teleportEnabled - are teleports enabled
   * @param {boolean} removePortal - remove portal when segment traverses it
   * @returns {[number, number]}
   */
  this.nextSegment = (segment, teleportEnabled, removePortal = false) => {
    /**
     * @type {[number, number]}
     */
    let result = [...segment];
    switch (this.field[segment[0]][segment[1]]) {
      case Direction.right:
        result[1]++;
        break;
      case Direction.down:
        result[0]--;
        break;
      case Direction.left:
        result[1]--;
        break;
      case Direction.up:
        result[0]++;
        break;
    }

    if (teleportEnabled) {
      // teleportation happens

      /**
       * 
       * @param {number} segmentPosition
       * @param {number} portalPosiction 
       * @param {number} size 
       * @param {number[]} toPush 
       */
      function managePortals(segmentPosition, portalPosiction, size, toPush) {
        if (segmentPosition < 0 || segmentPosition === size) {
          const portalIndex = toPush.indexOf(portalPosiction);
          const portalExists =  (portalIndex === -1) ? false : true;

          if (removePortal && portalExists) {
            toPush.splice(portalIndex, 1);
          } else {
            if (!portalExists) toPush.push(portalPosiction);
          }
        }
      }

      managePortals(result[1], result[0], gameSettings.width, this.portals.horizontal);
      managePortals(result[0], result[1], gameSettings.height, this.portals.vertical);
      
      result[0] = (result[0] + gameSettings.height) % gameSettings.height;
      result[1] = (result[1] + gameSettings.width) % gameSettings.width;
    } else {
      // snake hits the wall
      if (
        result[0] === gameSettings.height ||
        result[0] < 0 ||
        result[1] === gameSettings.width ||
        result[1] < 0
      ) {
        this.gameOver();
      }
    }

    return result;
  };

  /**
   * Returns [X,Y] coords in 3D space
   * @param {[number, number]} segment 
   * @returns {[number, number]}
   */
  function getSegmentCoords(segment) {
    return [
      segment[1] * cellSize -
        (gameSettings.width / 2) * cellSize +
        cellSize * 0.5,
      segment[0] * cellSize -
        (gameSettings.height / 2) * cellSize +
        cellSize * 0.5,
    ];
  }

  /**
   * adds squares to places where portals should be opened\
   * used only for stencil testing
   * @type {{
   *  horizontal: number[],
   *  vertical: number[]
   * }} portals
   */
  this.portals = {
    horizontal: [],
    vertical: [],
  };

  this.renderPortals = () => {
    const firstInstance = snakeSegments.count;

    dummy.scale.set(1, 1, 1);
    dummy.position.set(0, 0, 0);
    dummy.updateMatrix();

    snakeSegments.count +=
      this.portals.horizontal.length * 2 + this.portals.vertical.length;
    dummy.scale.set(0.01, 1.5, 4);
    dummy.updateMatrix();
    // rendering horizontal portals
    for (let i = 0; i < this.portals.horizontal.length; i++) {
      const yPosition =
        (this.portals.horizontal[i] - gameSettings.height / 2 + 0.5) * cellSize;
      dummy.position.set((-gameSettings.width / 2) * cellSize, yPosition, 0);
      dummy.updateMatrix();
      snakeSegments.setMatrixAt(firstInstance + i * 2, dummy.matrix);

      dummy.position.set((gameSettings.width / 2) * cellSize, yPosition, 0);
      dummy.updateMatrix();
      snakeSegments.setMatrixAt(firstInstance + i * 2 + 1, dummy.matrix);
    }

    dummy.scale.set(1.5, 0.01, 4);
    dummy.updateMatrix();

    for (let i = 0; i < this.portals.vertical.length; i++) {
      const xPosition =
        (this.portals.vertical[i] - gameSettings.width / 2 + 0.5) * cellSize;
      dummy.position.set(xPosition, (gameSettings.height / 2) * cellSize, 0);
      dummy.updateMatrix();
      snakeSegments.setMatrixAt(
        firstInstance + this.portals.horizontal.length * 2 + i,
        dummy.matrix
      );
    }
  };

  this.renderSnake = () => {

    // smoothly moves tail and head
    const animateHeadAndTail = (time) => {

      let computeSegmentAnimation = (segment, time) => {
        let delta = [0, 0];
        switch (this.getCellValue(segment)) {
          case Direction.right:
            delta[0] = cellSize;
            break;
          case Direction.down:
            delta[1] = -cellSize;
            break;
          case Direction.left:
            delta[0] = -cellSize;
            break;
          case Direction.up:
            delta[1] = cellSize;
        }
        const timeDelta =
          (time - movesPast * this.movementSpeed * 1000) /
          (this.movementSpeed * 1000);
        let segmentCoords = getSegmentCoords(segment);
        segmentCoords[0] += delta[0] * timeDelta;
        segmentCoords[1] += delta[1] * timeDelta;
        dummy.position.set(...segmentCoords, cellSize / 2);
        dummy.updateMatrix();
      }
      
      
      computeSegmentAnimation(tailSegment, time);
      snakeSegments.setMatrixAt(0, dummy.matrix);
      
      computeSegmentAnimation(preHeadSegment, time);
      snakeSegments.count += 1;
      snakeSegments.setMatrixAt(snakeSegments.count - 1, dummy.matrix);
  
    }
    
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    snakeSegments.count += snakeLength - 1;
    let currentSegment = [...tailSegment];
    for (let i = 0; i < snakeLength - 1; i++) {
      let coords = getSegmentCoords(currentSegment);
      dummy.position.set(...coords, cellSize / 2);
      dummy.updateMatrix();
      snakeSegments.setMatrixAt(i, dummy.matrix);
      if (i === snakeLength - 2) {
        preHeadSegment = currentSegment;
      }
      currentSegment = this.nextSegment(currentSegment, this.teleportEnabled);
    }

    animateHeadAndTail(currentTime);
  };

  this.getCellValue = (segment) => {
    return this.field[segment[0]][segment[1]];
  };

  this.setCellValue = (segment, value) => {
    this.field[segment[0]][segment[1]] = value;
  };

  this.nextTurn = () => {
    const headDirection = this.getCellValue(headSegment);
    currentHeadDirection = headDirection;
    headSegment = this.nextSegment(headSegment, this.teleportEnabled);
    let dropNewApple = false;
    // if the apple is eaten the tail segment stays on its current position
    if (this.getCellValue(headSegment) === Apple) {
      snakeLength++;
      score++;
      document.querySelector("#score").innerHTML = String(score);
      this.setCellValue(headSegment, undefined);
      dropNewApple = true;
      // else move tail
    } else {
      const toDelete = [...tailSegment];
      tailSegment = this.nextSegment(tailSegment, this.teleportEnabled, true);
      this.setCellValue(toDelete, undefined);
    }

    if (this.getCellValue(headSegment)) {
      this.gameOver();
      return;
    }
    this.setCellValue(headSegment, headDirection);
    if (dropNewApple) {
      this.dropApple();
    }
  };

  this.dropApple = () => {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
    const newApple = [
      getRandomInt(gameSettings.height),
      getRandomInt(gameSettings.width),
    ];
    // if the segment is occupied try generate a new one;
    if (this.getCellValue(newApple)) {
      this.dropApple();
    } else {
      appleMesh.position.set(...getSegmentCoords(newApple), cellSize / 2);
      this.setCellValue(newApple, Apple);
    }
  };

  this.dropApple();

  this.changeDirection = (event) => {
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    switch (event.key) {
      case "ArrowLeft":
        if (currentHeadDirection !== Direction.right) {
          this.setCellValue(headSegment, Direction.left);
        }
        break;
      case "ArrowRight":
        if (currentHeadDirection !== Direction.left) {
          this.setCellValue(headSegment, Direction.right);
        }
        break;
      case "ArrowDown":
        if (currentHeadDirection !== Direction.up) {
          this.setCellValue(headSegment, Direction.down);
        }
        break;
      case "ArrowUp":
        if (currentHeadDirection !== Direction.down) {
          this.setCellValue(headSegment, Direction.up);
        }
        break;
    }
  };
  
  window.removeEventListener("keydown", this.changeDirection);
  window.addEventListener("keydown", this.changeDirection);
  

  requestAnimationFrame((time) => {
    movesPast = time / (this.movementSpeed * 1000);
  });

  this.gameOver = () => {
    this.isGameOver = true;
    document.querySelector("#score").innerHTML =
      "Game Over\nTotal: " + String(score);
  };  
  
  this.render = (time) => {
    
    
    currentTime = time;

    if (
      time - movesPast * this.movementSpeed * 1000 >
      this.movementSpeed * 1000
    ) {
      movesPast++;
      if (!this.isGameOver) {
        this.nextTurn();
      } else {
        return;
      }
    }

    snakeSegments.count = 0;
    const scene = snakeRenderer.scene;
    const renderer = snakeRenderer.renderer;
    renderer.clear();

    if (this.teleportEnabled) {
      var gl = renderer.getContext();

      // enable stencil test
      gl.enable(gl.STENCIL_TEST);

      // config the stencil buffer to collect data for testing
      gl.stencilFunc(gl.ALWAYS, 1, 0xff);
      gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

      // render shape for stencil test
      this.renderSnake();
      this.renderPortals();

      snakeSegments.instanceMatrix.needsUpdate = true;

      gl.colorMask(false, false, false, false);
      gl.depthMask(false);

      renderer.render(scene, snakeRenderer.camera);

      gl.depthMask(true);
      gl.colorMask(true, true, true, true);

      // set stencil buffer for testing

      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.stencilFunc(gl.EQUAL, 1, 0xff);
    }

    // render actual scene

    snakeSegments.count = 0;
    this.renderSnake();
    snakeSegments.instanceMatrix.needsUpdate = true;
    renderer.render(scene, snakeRenderer.camera);

    if (this.teleportEnabled) {
      scene.position.set(-gameSettings.width * cellSize, 0, 0);
      renderer.render(scene, snakeRenderer.camera);

      scene.position.set(gameSettings.width * cellSize, 0, 0);
      renderer.render(scene, snakeRenderer.camera);

      scene.position.set(0, gameSettings.height * cellSize, 0);
      renderer.render(scene, snakeRenderer.camera);

      scene.position.set(0, 0, 0);

      // disable stencil test
      gl.disable(gl.STENCIL_TEST);
    }

    requestAnimationFrame(this.render);
  };
  requestAnimationFrame(this.render);
}

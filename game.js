/*
Game from DeepLizard.com
https://deeplizard.com/learn/video/qhRNvCVVJaA

Game Rules
  Lizard can move: LEFT, RIGHT, UP, DOWN
  Reward when landing on field with 1 cricket: +1
  Reward when landing on an empty field: -1
  Reward when landing on field with bird: -10
  Reward when landing on field with 5 crickets: +10

  The Game ends after
    - the lizard lands on the field with the bird or with 5 crickets:
    - max steps is reached
*/

const root = document.querySelector(":root");
const QTable = document.querySelector("tbody");
const startTrainingBtn = document.querySelector("#startTraining");
const showResultBtn = document.querySelector("#showResult");

const LEARNING_RATE = 0.7;
const MAX_STEPS = 100;
const EPISODES = 100;
const REWARDS = [
  [+1, -1, -1],
  [-1, -10, -1],
  [-1, -1, +10],
];

const TERMINATE_CELLS = [
  [1, 1],
  [2, 2],
];

const ANIMATION_SPEED = 5;

class Lizard {
  constructor() {
    this.x = 0;
    this.y = 2;

    this.cumulativeReward = 0;
    this.stepCount = 0;

    this.discountRate = 0.99;
    this.explorationRate = 1;

    this.QTable = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  }

  left() {
    if (this.x === 0) return false;
    this.x--;
    this.cumulativeReward += REWARDS[this.y][this.x];
    this.updateQTable(this.y * 3 + this.x + 1, 0);
  }
  right() {
    if (this.x === 2) return false;
    this.x++;
    this.cumulativeReward += REWARDS[this.y][this.x];
    this.updateQTable(this.y * 3 + this.x - 1, 1);
  }
  up() {
    if (this.y === 0) return false;
    this.y--;
    this.cumulativeReward += REWARDS[this.y][this.x];
    this.updateQTable((this.y + 1) * 3 + this.x, 2);
  }
  down() {
    if (this.y === 2) return false;
    this.y++;
    this.cumulativeReward += REWARDS[this.y][this.x];
    this.updateQTable((this.y - 1) * 3 + this.x, 3);
  }

  display() {
    // update lizard
    root.style.setProperty("--x", this.x);
    root.style.setProperty("--y", this.y);

    // update table
    for (let [rowIdx, row] of this.QTable.entries()) {
      for (let [colIdx, col] of row.entries()) {
        QTable.children[rowIdx + 1].children[colIdx + 1].innerHTML =
          +col.toFixed(2);
      }
    }
  }

  updateQTable(prevPosIdx, actionIdx) {
    const newPosIdx = this.y * 3 + this.x;

    const prevQValue = this.QTable[prevPosIdx][actionIdx];
    const maxQValueForNewState = Math.max(...this.QTable[newPosIdx]);

    const newQValue =
      (1 - LEARNING_RATE) * prevQValue +
      LEARNING_RATE *
        (this.cumulativeReward + this.discountRate * maxQValueForNewState);

    this.QTable[prevPosIdx][actionIdx] = newQValue;
  }

  step() {
    // Epsilon Greedy Strategy
    const shouldExplore = Math.random() <= this.explorationRate;

    let actionIdx;

    if (shouldExplore) {
      // random number between 0 and 3 => choose random action
      actionIdx = Math.floor(Math.random() * 4);
    } else {
      // choose action with highest Q-Value
      const posIdx = this.y * 3 + this.x;
      const actionQValues = this.QTable[posIdx];
      actionIdx = actionQValues.indexOf(Math.max(...actionQValues));
    }

    if (actionIdx === 0) this.left();
    else if (actionIdx === 1) this.right();
    else if (actionIdx === 2) this.up();
    else this.down();

    this.stepCount++;
    if (this.explorationRate > 0.2) {
      this.explorationRate -= 0.005;
    }
    this.display();
  }

  resetPosition() {
    this.x = 0;
    this.y = 2;
    this.steps = 0;
    this.cumulativeReward = 0;

    this.display();
  }

  startEpisode() {
    return new Promise((resolve) => {
      const stepInterval = setInterval(() => {
        if (
          this.stepCount < MAX_STEPS &&
          !TERMINATE_CELLS.find((pos) => pos[0] === this.x && pos[1] === this.y)
        ) {
          this.step();
        } else {
          clearInterval(stepInterval);
          this.resetPosition();
          resolve();
        }
      }, ANIMATION_SPEED);
    });
  }

  showResult() {
    this.resetPosition();
    const resultInterval = setInterval(() => {
      if (TERMINATE_CELLS.find((pos) => pos[0] === this.x && pos[1] === this.y))
        return clearInterval(resultInterval);

      // choose action with highest Q-Value
      const posIdx = this.y * 3 + this.x;
      const actionQValues = this.QTable[posIdx];
      const actionIdx = actionQValues.indexOf(Math.max(...actionQValues));

      let action = [
        [-1, 0],
        [+1, 0],
        [0, -1],
        [0, +1],
      ][actionIdx];

      // eliminate impossible moves by artificially making their Q-Values bad
      // otherwise if they are 0, it would keep trying to make that move resulting in an infinite loop and a still standing lizard
      if (
        this.x + action[0] < 0 ||
        this.x + action[0] > 2 ||
        this.y + action[1] < 0 ||
        this.y + action[1] > 2
      ) {
        this.QTable[posIdx] -= 100;
      } else {
        this.x += action[0];
        this.y += action[1];
      }

      this.display();
    }, 500);
  }
}

let lizard;
async function startTraining() {
  lizard = new Lizard();

  for (let i = 0; i < EPISODES; i++) {
    await lizard.startEpisode();
  }
}

startTrainingBtn.addEventListener("click", () => startTraining());
showResultBtn.addEventListener("click", () => lizard.showResult());

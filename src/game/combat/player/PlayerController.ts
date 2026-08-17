import * as Phaser from 'phaser';

type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

const DEFAULT_SPEED = 220;

export class PlayerController {
  private readonly keys: MoveKeys | null;

  constructor(
    scene: Phaser.Scene,
    private readonly body: Phaser.Physics.Arcade.Body,
    private readonly speed: number = DEFAULT_SPEED
  ) {
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      this.keys = null;
      return;
    }

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
    ]);

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MoveKeys;
  }

  update(): void {
    if (!this.keys) {
      this.body.setVelocity(0, 0);
      return;
    }

    const x = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const y = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    if (x === 0 && y === 0) {
      this.body.setVelocity(0, 0);
      return;
    }

    this.body.setVelocity(x, y);
    this.body.velocity.normalize().scale(this.speed);
  }
}

import * as Phaser from 'phaser';
import { PlayerController } from '../player/PlayerController';

const PLAYER_SIZE = 32;

export class CombatScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private controller?: PlayerController;

  constructor() {
    super('CombatScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1612');
    this.syncWorldBounds();

    const player = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      PLAYER_SIZE,
      PLAYER_SIZE,
      0xc4a574
    );
    this.physics.add.existing(player);

    const body = player.body as Phaser.Physics.Arcade.Body;
    this.player = player;
    this.controller = new PlayerController(this, body);

    this.add.text(16, 16, 'WASD 이동', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#9a8f7d',
    });

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();
  }

  update(): void {
    this.controller?.update();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.syncWorldBounds();
    this.clampPlayerToBounds();
  }

  private syncWorldBounds(): void {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private clampPlayerToBounds(): void {
    if (!this.player) {
      return;
    }

    const half = PLAYER_SIZE / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, half, this.scale.width - half);
    this.player.y = Phaser.Math.Clamp(this.player.y, half, this.scale.height - half);
  }
}

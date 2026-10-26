import * as Phaser from 'phaser';
import { isCombatDebugEnabled } from '../../debug/debug-flags';
import type { BossController } from '../boss/BossController';
import { formatBossDebug } from '../boss/boss-debug';

function resourceBar(current: number, max: number, width: number): string {
  const filled = max <= 0 ? 0 : Math.round((current / max) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`;
}

export class BossHud {
  private readonly nameLabel: Phaser.GameObjects.Text;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private readonly hpValue: Phaser.GameObjects.Text;
  private readonly phaseLabel: Phaser.GameObjects.Text;
  private readonly debugLabel: Phaser.GameObjects.Text;
  private readonly barWidth = 320;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boss: BossController
  ) {
    const centerX = scene.scale.width / 2;
    this.nameLabel = scene.add.text(centerX, 10, boss.name.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ece6d9',
    });
    this.nameLabel.setOrigin(0.5, 0);
    this.nameLabel.setDepth(8);

    this.hpBarBg = scene.add.rectangle(centerX, 36, this.barWidth, 12, 0x3a2a24);
    this.hpBarBg.setDepth(8);
    this.hpBarFill = scene.add.rectangle(centerX - this.barWidth / 2, 36, this.barWidth, 12, 0xb45c9a);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9);

    this.hpValue = scene.add.text(centerX, 48, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ece6d9',
    });
    this.hpValue.setOrigin(0.5, 0);
    this.hpValue.setDepth(8);

    this.phaseLabel = scene.add.text(centerX, 64, 'PHASE 1', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#c4a574',
    });
    this.nameLabel.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
    this.hpValue.setVisible(false);
    this.phaseLabel.setVisible(false);

    this.debugLabel = scene.add.text(scene.scale.width - 16, scene.scale.height - 16, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#9a8f7d',
      align: 'right',
    });
    this.debugLabel.setOrigin(1, 1);
    this.debugLabel.setDepth(8);
    this.debugLabel.setVisible(isCombatDebugEnabled());

    scene.scale.on('resize', this.handleResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off('resize', this.handleResize, this);
    });
  }

  update(): void {
    const hpRatio = this.boss.maxHp <= 0 ? 0 : this.boss.currentHp / this.boss.maxHp;
    this.hpBarFill.displayWidth = this.barWidth * hpRatio;
    this.hpValue.setText(
      `${resourceBar(this.boss.currentHp, this.boss.maxHp, 12)}  ${this.boss.currentHp} / ${this.boss.maxHp}`
    );
    this.phaseLabel.setText(`PHASE ${this.boss.currentPhase}`);
    if (this.debugLabel.visible) {
      const debug = this.boss.debugSnapshot();
      this.debugLabel.setText(formatBossDebug(debug));
    }
  }

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const centerX = gameSize.width / 2;
    this.nameLabel.setPosition(centerX, 10);
    this.hpBarBg.setPosition(centerX, 36);
    this.hpBarFill.setPosition(centerX - this.barWidth / 2, 36);
    this.hpValue.setPosition(centerX, 48);
    this.phaseLabel.setPosition(centerX, 64);
    this.debugLabel.setPosition(gameSize.width - 16, gameSize.height - 16);
  };
}


import * as Phaser from 'phaser';
import type { CombatStatus } from '../combat-state';
import { PLAYER_MP_BAR_FILL } from '../CombatConfig';
import type { PlayerHealthController } from '../player/PlayerHealthController';
import type { PlayerSkillController } from '../player/PlayerSkillController';

function resourceBar(current: number, max: number, width: number): string {
  const filled = max <= 0 ? 0 : Math.round((current / max) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`;
}

export class CombatHud {
  private readonly classTitle: Phaser.GameObjects.Text;
  private readonly hpTitle: Phaser.GameObjects.Text;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private readonly hpValue: Phaser.GameObjects.Text;
  private readonly mpTitle: Phaser.GameObjects.Text;
  private readonly mpBarBg: Phaser.GameObjects.Rectangle;
  private readonly mpBarFill: Phaser.GameObjects.Rectangle;
  private readonly mpValue: Phaser.GameObjects.Text;
  private readonly skillQ: Phaser.GameObjects.Text;
  private readonly skillE: Phaser.GameObjects.Text;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly resultTitle: Phaser.GameObjects.Text;
  private readonly resultSubtitle: Phaser.GameObjects.Text;
  private readonly primaryButton: Phaser.GameObjects.Text;
  private readonly secondaryButton: Phaser.GameObjects.Text;
  private resultButtonDelay?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly health: PlayerHealthController,
    _skills?: PlayerSkillController,
    private readonly classLabel = 'PLAYER'
  ) {
    this.classTitle = scene.add.text(16, 44, classLabel, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ece6d9',
    });
    this.hpTitle = scene.add.text(16, 68, 'HP', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#c4a574',
    });
    this.hpBarBg = scene.add.rectangle(16, 88, 180, 10, 0x3a2a24).setOrigin(0, 0.5);
    this.hpBarFill = scene.add.rectangle(16, 88, 180, 10, 0xc4a574).setOrigin(0, 0.5);
    this.hpValue = scene.add.text(16, 100, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ece6d9',
    });

    this.mpTitle = scene.add.text(16, 124, 'MP', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#8aa4d4',
    });
    this.mpBarBg = scene.add.rectangle(16, 148, 180, 10, 0x3a2a24).setOrigin(0, 0.5);
    this.mpBarFill = scene.add.rectangle(16, 148, 180, 10, PLAYER_MP_BAR_FILL).setOrigin(0, 0.5);
    this.mpValue = scene.add.text(16, 160, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ece6d9',
    });

    this.skillQ = scene.add.text(16, 184, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ece6d9',
    });
    this.skillE = scene.add.text(16, 224, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ece6d9',
    });
    this.hpTitle.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
    this.hpValue.setVisible(false);
    this.mpTitle.setVisible(false);
    this.mpBarBg.setVisible(false);
    this.mpBarFill.setVisible(false);
    this.mpValue.setVisible(false);
    this.skillQ.setVisible(false);
    this.skillE.setVisible(false);
    this.classTitle.setVisible(false);

    this.overlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.55);
    this.overlay.setOrigin(0, 0);
    this.overlay.setDepth(20);
    this.overlay.setInteractive();
    this.overlay.setVisible(false);

    this.resultTitle = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 - 48, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      color: '#ece6d9',
    });
    this.resultTitle.setOrigin(0.5);
    this.resultTitle.setDepth(21);
    this.resultTitle.setVisible(false);

    this.resultSubtitle = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 4, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cfc4b0',
    });
    this.resultSubtitle.setOrigin(0.5);
    this.resultSubtitle.setDepth(21);
    this.resultSubtitle.setVisible(false);
    this.resultSubtitle.setAlpha(0);

    this.primaryButton = this.createButton(scene.scale.height / 2 + 44);
    this.secondaryButton = this.createButton(scene.scale.height / 2 + 84);

    scene.scale.on('resize', this.handleResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off('resize', this.handleResize, this);
    });
  }

  update(): void {
    const hpRatio = this.health.maxHp <= 0 ? 0 : this.health.currentHp / this.health.maxHp;
    this.hpBarFill.displayWidth = 180 * hpRatio;
    this.hpValue.setText(
      `${resourceBar(this.health.currentHp, this.health.maxHp, 10)}  ${this.health.currentHp} / ${this.health.maxHp}`
    );

    const mpRatio = this.health.maxMp <= 0 ? 0 : this.health.currentMp / this.health.maxMp;
    this.mpBarFill.displayWidth = 180 * mpRatio;
    this.mpValue.setText(
      `${resourceBar(this.health.currentMp, this.health.maxMp, 10)}  ${this.health.currentMp} / ${this.health.maxMp}`
    );

    this.skillQ.setVisible(false);
    this.skillE.setVisible(false);
    this.skillQ.setText('');
    this.skillE.setText('');
  }

  showResult(
    status: CombatStatus,
    onPrimary: () => void,
    onSecondary?: () => void,
    options?: { boss?: boolean }
  ): void {
    this.resultButtonDelay?.remove(false);
    this.primaryButton.setVisible(false);
    this.secondaryButton.setVisible(false);
    this.resultSubtitle.setVisible(false);
    this.resultSubtitle.setAlpha(0);

    this.overlay.setVisible(true);
    this.overlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: status === 'VICTORY' ? 0.62 : 0.7,
      duration: 320,
    });
    this.resultTitle.setVisible(true);
    this.resultTitle.setAlpha(0);
    this.scene.tweens.add({
      targets: this.resultTitle,
      alpha: 1,
      duration: 280,
    });

    if (status === 'VICTORY') {
      this.resultTitle.setText('전투 승리');
      this.resultTitle.setColor('#c4a574');
      this.resultTitle.setFontSize(options?.boss ? '52px' : '42px');
      this.resultTitle.setShadow(0, 0, '#c4a574', options?.boss ? 22 : 12);
      this.resultSubtitle.setText(
        options?.boss ? '수호자가 쓰러졌다. 바닥에 핵이 남았다.' : '전투에서 승리했다'
      );
      this.resultSubtitle.setVisible(true);
      this.scene.tweens.add({
        targets: this.resultSubtitle,
        alpha: 1,
        duration: 360,
        delay: 220,
      });
      void onPrimary;
      return;
    }

    if (status === 'DEFEAT') {
      this.resultTitle.setText('전투 패배');
      this.resultTitle.setColor('#e88a7a');
      this.resultTitle.setFontSize('42px');
      this.resultTitle.setShadow(0, 0, '#e88a7a', 10);
      this.resultSubtitle.setText('쓰러졌습니다');
      this.resultSubtitle.setVisible(true);
      this.scene.tweens.add({
        targets: this.resultSubtitle,
        alpha: 1,
        duration: 300,
        delay: 160,
      });
    }
    void onPrimary;
    void onSecondary;
  }

  private createButton(y: number): Phaser.GameObjects.Text {
    const button = this.scene.add.text(this.scene.scale.width / 2, y, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#c4a574',
    });
    button.setOrigin(0.5);
    button.setDepth(21);
    button.setVisible(false);
    button.setInteractive({ useHandCursor: true });
    return button;
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.overlay.setSize(gameSize.width, gameSize.height);
    this.overlay.setInteractive();
    this.resultTitle.setPosition(gameSize.width / 2, gameSize.height / 2 - 48);
    this.resultSubtitle.setPosition(gameSize.width / 2, gameSize.height / 2 + 4);
    this.primaryButton.setPosition(gameSize.width / 2, gameSize.height / 2 + 44);
    this.secondaryButton.setPosition(gameSize.width / 2, gameSize.height / 2 + 84);
  }
}

import * as Phaser from 'phaser';
import type { PlayerClassId } from '../../player/classes/class-types';
import { SkillController, type SkillAim, type SkillHudSlotView, type SkillVitals } from '../skills/SkillController';
import type { SkillExecutor } from '../skills/skill-executors';
import type { SkillSlot, SkillUseResult } from '../skills/skill-types';

export class PlayerSkillController {
  private readonly qKey: Phaser.Input.Keyboard.Key | null;
  private readonly eKey: Phaser.Input.Keyboard.Key | null;
  private readonly controller: SkillController;

  constructor(
    scene: Phaser.Scene | null,
    options: {
      classId: PlayerClassId;
      vitals: SkillVitals;
      aim: SkillAim;
      executors?: Readonly<Record<string, SkillExecutor>>;
    }
  ) {
    this.controller = new SkillController(options);

    const keyboard = scene?.input.keyboard;
    if (!keyboard) {
      this.qKey = null;
      this.eKey = null;
      return;
    }

    keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.Q, Phaser.Input.Keyboard.KeyCodes.E]);
    this.qKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  tryUse(slot: SkillSlot): SkillUseResult {
    return this.controller.tryUse(slot);
  }

  getHudSlots(): SkillHudSlotView[] {
    return this.controller.getHudSlots();
  }

  getLastExecutedSkillId(): string | null {
    return this.controller.getLastExecutedSkillId();
  }

  getLastUseResult(): SkillUseResult | null {
    return this.controller.getLastUseResult();
  }

  update(deltaMs: number): void {
    this.controller.update(deltaMs);
    this.pollInput();
  }

  private pollInput(): void {
    if (this.qKey && Phaser.Input.Keyboard.JustDown(this.qKey)) {
      this.controller.tryUse('Q');
    }
    if (this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.controller.tryUse('E');
    }
  }
}

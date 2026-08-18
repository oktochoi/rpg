const DEFAULT_MELEE_SLOTS = 2;

export class AttackTokenBoard {
  private readonly holders = new Set<string>();

  constructor(private readonly meleeSlots = DEFAULT_MELEE_SLOTS) {}

  tryAcquireMelee(id: string): boolean {
    if (this.holders.has(id)) {
      return true;
    }
    if (this.holders.size >= this.meleeSlots) {
      return false;
    }
    this.holders.add(id);
    return true;
  }

  canGrantMelee(id: string): boolean {
    return this.holders.has(id) || this.holders.size < this.meleeSlots;
  }

  release(id: string): void {
    this.holders.delete(id);
  }

  isHeld(id: string): boolean {
    return this.holders.has(id);
  }

  get activeCount(): number {
    return this.holders.size;
  }

  get maxSlots(): number {
    return this.meleeSlots;
  }

  reset(): void {
    this.holders.clear();
  }
}

export function canGrantMeleeToken(activeCount: number, maxSlots = DEFAULT_MELEE_SLOTS): boolean {
  return activeCount < maxSlots;
}

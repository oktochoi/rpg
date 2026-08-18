const warned = new Set<string>();

export function warnMissingAsset(id: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(id)) {
    return;
  }
  warned.add(id);
  console.warn(`[Asset missing: ${id}]`);
}

export function resetMissingAssetWarnings(): void {
  warned.clear();
}

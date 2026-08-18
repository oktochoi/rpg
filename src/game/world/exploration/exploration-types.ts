export interface ExplorationPointDefinition {
  id: string;
  locationId: string;
  name: string;
  description: string;
  aliases: readonly string[];
  discoverableFactId?: string;
  oneTime: boolean;
}

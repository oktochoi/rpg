export interface ActionParserContext {
  currentLocationId: string;
  currentNpcIds: string[];
  currentSceneId?: string;
  playerJob?: string;
  knownEntityIds?: string[];
  knownLocationIds?: string[];
  knownExplorationIds?: string[];
  allowedActionTypes?: readonly string[];
}

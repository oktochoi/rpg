import type { ActionParserContext } from '../../game/actions/parser-context';
import type { ParsedAction } from '../../game/actions/action-types';

export interface ActionParser {
  parse(input: string, context: ActionParserContext): Promise<ParsedAction>;
}

export type { ActionParserContext, ParsedAction };

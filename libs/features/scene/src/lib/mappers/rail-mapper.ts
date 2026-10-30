import type { Tool, ToolId } from '@dotln-angular/models';

import type { RailGroup, RailGroupId } from '../models/scene-view-model';
import {
  patternsOf,
  patternToolId,
  railGroupOf,
  railGroupOrder,
  type SceneTool,
} from './tool-mapper';

export const workColour = (tool: Tool) => `var(--dotln-work-${tool.work})`;

export interface RailInput {
  readonly tools: readonly SceneTool[];
  readonly chosenId: ToolId | null;
  readonly params: Readonly<Record<string, number>>;
  readonly groupLabel: (group: RailGroupId) => string;
  readonly patternLabel: (name: string) => string;
}

/** Groups the tools by what they do, leaving out a group with nothing in it. */
export function mapRailGroups(input: RailInput): readonly RailGroup[] {
  const { tools, chosenId, params, groupLabel, patternLabel } = input;
  return railGroupOrder.flatMap((id) => {
    const members = tools.filter((tool) => railGroupOf(tool) === id);
    if (members.length === 0) return [];
    return [
      {
        id,
        label: groupLabel(id),
        tools: members.map((tool) => {
          const chosen = tool.id === chosenId;
          return {
            id: tool.id,
            title: tool.title,
            colour: workColour(tool),
            chosen,
            patterns:
              tool.id === patternToolId
                ? patternsOf(tool).map(({ value, name }) => ({
                    value,
                    label: patternLabel(name),
                    chosen: chosen && params['pattern'] === value,
                  }))
                : [],
          };
        }),
      },
    ];
  });
}

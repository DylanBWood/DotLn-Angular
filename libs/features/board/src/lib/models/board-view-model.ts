import type { BoardDocument, PanelId } from '@dotln-angular/models';
import type { TabItem } from '@dotln-angular/ui';

export type BoardInput = Omit<BoardDocument, 'viewModelVersion'> & {
  readonly viewModelVersion: string;
};
export interface BoardViewModel {
  readonly document: BoardInput;
  readonly compatible: boolean;
  readonly selectedPanel: PanelId;
  readonly tabs: readonly TabItem[];
  readonly availableSources: number;
  readonly unavailableSources: number;
  readonly targets: ReadonlyMap<string, PanelId | null>;
}

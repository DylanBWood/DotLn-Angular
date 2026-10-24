import type { AppError, BoardResponse, PanelId } from '@dotln-angular/models';
import type { TabItem } from '@dotln-angular/ui';

export type BoardInput = BoardResponse;

export interface BoardViewModel {
  readonly document: BoardInput;
  readonly compatible: boolean;
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly apiBaseUrl: string;
  readonly sourcesFooter: boolean;
  readonly selectedPanel: PanelId;
  readonly tabs: readonly TabItem[];
  readonly availableSources: number;
  readonly unavailableSources: number;
  readonly targets: ReadonlyMap<string, PanelId | null>;
}

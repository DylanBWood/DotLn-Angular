import type { CellStatus } from '@dotln-angular/models';

export type ButtonLoadingVariant = 'replace' | 'trailing' | 'overlay';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface MenuOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface KeyValueItem {
  readonly key: string;
  readonly label: string;
}

export interface KeyValueContext<T extends KeyValueItem> {
  readonly $implicit: T;
  readonly scope: string;
}

export interface PageHeaderStatus {
  readonly state: CellStatus;
  readonly label: string;
}

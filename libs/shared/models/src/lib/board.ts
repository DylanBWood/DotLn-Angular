/** The pinned uifa-board-v1 projection contract; it grants no command authority. */
export type CellScalar = string | number | boolean;
export type CellValue = CellScalar | readonly CellScalar[] | null;
export type CellStatus = 'known' | 'unknown' | 'unavailable';
export type Availability = 'available' | 'unavailable';
export type PanelId = 'actors' | 'builds' | 'mechanisms' | 'work' | 'blueprint';
export type Role = 'product-lead' | 'showrunner' | 'engineer' | 'tester' | 'devops';

export type Cell = {
  readonly key: string;
  readonly label: string;
  readonly evidence: readonly string[];
} & (
  | {
      readonly status: 'known';
      readonly value: Exclude<CellValue, null>;
      readonly explanation: string | null;
    }
  | {
      readonly status: 'unknown' | 'unavailable';
      readonly value: null;
      readonly explanation: string;
    }
);

export interface Link {
  readonly label: string;
  readonly target: string;
}

export interface Row {
  readonly id: string;
  readonly title: string;
  readonly cells: readonly Cell[];
  readonly links: readonly Link[];
}

export interface Section {
  readonly id: string;
  readonly title: string;
  readonly status: Availability;
  readonly explanation: string | null;
  readonly rows: readonly Row[];
}

export interface Panel {
  readonly id: PanelId;
  readonly title: string;
  readonly roles: readonly Role[];
  readonly question: string;
  readonly sections: readonly Section[];
}

export interface RoleAnswer {
  readonly role: Role;
  readonly question: string;
  readonly target: string;
  readonly cell: string;
  readonly source: string;
}

export interface Source {
  readonly ref: string;
  readonly status: Availability;
  readonly explanation: string | null;
}

export interface Evidence {
  readonly id: string;
  readonly source: string;
  readonly record: string;
}

export interface BoardDocument {
  readonly viewModelVersion: 'uifa-board-v1';
  readonly fidelity: 'lossy-read-only';
  readonly panels: readonly Panel[];
  readonly roleAnswers: readonly RoleAnswer[];
  readonly sources: readonly Source[];
  readonly evidence: readonly Evidence[];
}

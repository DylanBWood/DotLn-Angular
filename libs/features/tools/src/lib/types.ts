import type { ParamSpec, Tool, ToolId } from '@dotln-angular/models';

export interface ArriveState {
  readonly position: number;
  readonly velocity: number;
}

export interface ArriveStep {
  readonly distance: number;
  readonly desired: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly settled: boolean;
  readonly next: ArriveState;
}

export interface ArriveCalculationView {
  readonly step: number;
  readonly settled: boolean;
  readonly withinRadius: boolean;
  readonly motion: 'accelerating' | 'braking' | 'steady';
  readonly values: Readonly<Record<string, string>>;
}

export interface ArriveLimitExampleView {
  readonly cases: readonly {
    readonly id: 'normal' | 'late';
    readonly points: string;
    readonly peakX: number;
    readonly peakY: number;
  }[];
  /** Axis labels and lines placed with the same scales as the plotted runs. */
  readonly positionTicks: readonly { readonly label: string; readonly y: number }[];
  readonly timeTicks: readonly { readonly label: string; readonly x: number }[];
  readonly gridPath: string;
  readonly targetPath: string;
  readonly axisPath: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface ArriveStudyView {
  readonly currentCalculation: ArriveCalculationView | null;
  readonly limitExample: ArriveLimitExampleView | null;
  readonly activeView: 'motion' | 'velocity';
  readonly streamView: StudyStreamView;
  readonly expanded: readonly StudySection[];
  readonly step: number;
  readonly steps: number;
  readonly seconds: string;
  readonly distance: string;
  readonly speed: string;
  readonly desired: string;
  readonly x: number;
  readonly actualEnd: number;
  readonly desiredEnd: number;
  readonly phase: 'start' | 'cruise' | 'slow' | 'settled';
  readonly trail: readonly number[];
  readonly velocityPlot: {
    readonly origin: number;
    readonly actual: string;
    readonly desired: string;
    readonly cursorX: number;
    readonly actualY: number;
    readonly desiredY: number;
    readonly maxSpeed: number;
    readonly seconds: number;
  };
}

export type StudySection = 'algorithm' | 'reactive' | 'limits' | 'references';
export type StudyStreamView = 'flow' | 'timeline';

export interface ReadingView {
  readonly tool: Tool;
  readonly place: string;
  readonly faces: {
    readonly scenes: string;
    readonly target: string;
    readonly minimum: number;
    readonly maximum: number | null;
    readonly transform: string;
    readonly observable: string;
    readonly metrics: string;
    readonly params: readonly ParamSpec[];
  } | null;
  readonly hooks: readonly { readonly domain: string; readonly clauses: readonly string[] }[];
  readonly relations: readonly { readonly title: string; readonly id: ToolId | null }[];
  readonly sceneTool: boolean;
}

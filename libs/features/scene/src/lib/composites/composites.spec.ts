import { TestBed } from '@angular/core/testing';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

import en from '../../../testing/src/lib/scene-en.json';
import type {
  InstrumentView,
  LogView,
  TransportView,
  UnitRowView,
} from '../models/scene-view-model';
import { InstrumentStrip } from './instrument-strip/instrument-strip';
import { ToolLog } from './tool-log/tool-log';
import { ToolboxRail } from './toolbox-rail/toolbox-rail';
import { UnitInspector } from './unit-inspector/unit-inspector';
import { UnitList } from './unit-list/unit-list';

function render<T>(component: new () => T, inputs: Record<string, unknown>) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [...provideDotlnI18nTestKit({ langs: { en } }).providers],
  });
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    element: fixture.nativeElement as HTMLElement,
    instance: fixture.componentInstance,
  };
}

const row: UnitRowView = {
  id: 'unit-01',
  label: 'executor',
  colour: 'var(--dotln-role-executor)',
  position: 'north',
  speed: 'still',
  activity: 'idle',
  selected: false,
};

const transport: TransportView = {
  seed: 7,
  frameNo: 12,
  playing: false,
  feel: false,
  selected: 0,
  units: 20,
  labelSet: 'lifecycle',
  canSave: false,
  canCompare: false,
};

const reading: InstrumentView = {
  id: 'cohesionRadius',
  label: 'Cohesion radius',
  value: '12.0',
  unit: 'distance',
  known: true,
  points: '0,0 1,1',
};

const log: LogView = { steps: [], compositions: [], kept: 0, exported: null, canSave: false };

describe('the unit list', () => {
  it('reads a unit by role, state and id, and reports a toggle', () => {
    const { element, instance } = render(UnitList, { rows: [row] });
    const toggled: string[] = [];
    instance.toggled.subscribe((id) => toggled.push(id));
    expect(element.querySelector('li')?.textContent).toContain('executor');
    expect(element.querySelector('li')?.textContent).toContain('north · still · idle');
    element.querySelector('input')?.click();
    expect(toggled).toEqual(['unit-01']);
  });

  it('offers nine keyboard places for the objective and says where it stands', () => {
    const point = { x: 1, y: 2 };
    const { element, instance } = render(UnitList, {
      rows: [],
      objective: 'centre',
      regions: [{ id: 'centre', label: 'centre', point }],
    });
    const placed: unknown[] = [];
    instance.objectivePlaced.subscribe((value) => placed.push(value));
    expect(element.querySelector('legend')?.textContent).toContain('Objective: centre');
    element.querySelector<HTMLButtonElement>('fieldset button')?.click();
    expect(placed).toEqual([point]);
  });
});

describe('the instrument strip', () => {
  it('shows the transport and each figure', () => {
    const { element } = render(InstrumentStrip, { instruments: [reading], transport });
    expect(element.textContent).toContain('Frame 12');
    expect(element.textContent).toContain('Seed 7');
    expect(element.textContent).toContain('All 20 units');
    expect(element.querySelector('[data-metric="cohesionRadius"] .figure')?.textContent).toBe(
      '12.0',
    );
    expect(element.querySelector('polyline')?.getAttribute('points')).toBe('0,0 1,1');
  });

  it('offers Pause while playing and keeps Step out of the way', () => {
    const { element } = render(InstrumentStrip, {
      instruments: [],
      transport: { ...transport, playing: true },
    });
    expect(element.querySelector('[data-transport="pause"]')).not.toBeNull();
    expect(element.querySelector('[data-transport="play"]')).toBeNull();
    expect(
      element.querySelector<HTMLButtonElement>('[data-transport="step"] button')?.disabled,
    ).toBe(true);
  });
});

describe('the toolbox rail', () => {
  it('says when the catalog cannot be read, and offers another go', () => {
    const { element, instance } = render(ToolboxRail, { rail: { status: 'failed', groups: [] } });
    let retried = 0;
    instance.retried.subscribe(() => (retried += 1));
    expect(element.textContent).toContain('could not be read');
    element.querySelector<HTMLButtonElement>('button')?.click();
    expect(retried).toBe(1);
  });

  it('reports the tool and pattern pressed', () => {
    const tool = {
      id: 'aifg-a:177' as const,
      title: 'Two-level',
      colour: 'var(--dotln-work-aifg)',
      chosen: false,
      patterns: [{ value: 2, label: 'Column', chosen: false }],
    };
    const { element, instance } = render(ToolboxRail, {
      rail: { status: 'ready', groups: [{ id: 'form', label: 'Form', tools: [tool] }] },
    });
    const chosen: unknown[] = [];
    instance.chosen.subscribe((choice) => chosen.push(choice));
    element.querySelector<HTMLButtonElement>('[data-tool-id]')?.click();
    element.querySelector<HTMLButtonElement>('[data-pattern]')?.click();
    expect(chosen).toEqual([{ id: tool.id }, { id: tool.id, pattern: 2 }]);
  });
});

describe('the inspector', () => {
  it('prompts for the next move when no tool is chosen', () => {
    const empty = render(UnitInspector, { tool: null });
    expect(empty.element.textContent).toContain('Drag round some units');
  });

  it('names a refusal and its kind', () => {
    const { element } = render(UnitInspector, {
      tool: null,
      refusal: { code: 'uninterpreted', kind: 'ground.influence', reason: 'x' },
    });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('ground.influence');
  });
});

describe('the tool log', () => {
  it('invites a first step, and offers Clear once there is one', () => {
    const empty = render(ToolLog, { log });
    expect(empty.element.textContent).toContain('No steps yet');
    expect(empty.element.querySelector('.clear')).toBeNull();
    empty.fixture.componentRef.setInput('log', {
      ...log,
      canSave: true,
      steps: [{ at: 3, title: 'Flocking', units: 12, repeats: 1, afterFork: true }],
    });
    empty.fixture.detectChanges();
    expect(empty.element.querySelector('.clear')).not.toBeNull();
    expect(empty.element.textContent).toContain('forked here');
    expect(empty.element.textContent).toContain('frame 3 · 12 units');
  });

  it('opens a saved composition', () => {
    const { element, instance } = render(ToolLog, {
      log: {
        ...log,
        compositions: [{ id: 'c1', title: 'Flocking', steps: 1, trials: 0, note: 'kept' }],
      },
    });
    const opened: string[] = [];
    instance.opened.subscribe((id) => opened.push(id));
    element.querySelector<HTMLButtonElement>('[data-composition-id] button')?.click();
    expect(opened).toEqual(['c1']);
    expect(element.textContent).toContain('kept');
  });
});

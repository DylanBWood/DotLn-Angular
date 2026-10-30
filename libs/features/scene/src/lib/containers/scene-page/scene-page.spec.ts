import { TestBed } from '@angular/core/testing';

import { createCatalogLoader } from '@dotln-angular/catalog';
import type { Tool } from '@dotln-angular/models';

import { provideSceneFacadeTestKit } from '../../../../testing/src';
import { SceneFacade } from '../../facades/scene.facade';
import { ScenePage } from './scene-page';

let bundled: readonly Tool[];
beforeAll(async () => {
  bundled = await createCatalogLoader().load('aifg');
});

async function setUp(reducedMotion = true) {
  const kit = provideSceneFacadeTestKit({ tools: bundled, reducedMotion });
  TestBed.configureTestingModule({ imports: [ScenePage], providers: [...kit.providers] });
  const fixture = TestBed.createComponent(ScenePage);
  const facade = TestBed.inject(SceneFacade);
  await vi.waitFor(() => expect(facade.vm().rail.status).toBe('ready'));
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  return { kit, fixture, facade, element };
}

describe('the scene page', () => {
  it('takes the field skin and names itself', async () => {
    const { element } = await setUp();
    expect(element.getAttribute('data-skin')).toBe('field');
    expect(element.querySelector('h1')?.textContent).toBe('The soldier scene');
  });

  it('shows twenty rows in the text layer', async () => {
    const { element } = await setUp();
    expect(element.querySelectorAll('scene-unit-list li')).toHaveLength(20);
  });

  it('lists the five instruments with an honest unknown', async () => {
    const { element } = await setUp();
    expect(element.querySelectorAll('[data-metric]')).toHaveLength(5);
    expect(element.querySelector('[data-metric="timeToObjective"] .figure')?.textContent).toContain(
      'unknown',
    );
  });

  it('renders no label-value list', async () => {
    const { element } = await setUp();
    expect(element.querySelector('dl')).toBeNull();
  });

  it('a Space on a text-layer row toggles the unit', async () => {
    const { element, facade, fixture } = await setUp();
    element.querySelector<HTMLInputElement>('[data-unit-id="unit-02"] input')?.click();
    await fixture.whenStable();
    expect(facade.vm().selection).toEqual(['unit-02']);
  });

  it('Escape clears the selection from anywhere on the page', async () => {
    const { element, facade } = await setUp();
    facade.select('unit-01');
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(facade.vm().selection).toEqual([]);
  });

  it('a Tab opens the text layer for a keyboard user', async () => {
    const { element, fixture } = await setUp(false);
    expect(element.querySelector('scene-unit-list details')?.hasAttribute('open')).toBe(false);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await fixture.whenStable();
    expect(element.querySelector('scene-unit-list details')?.hasAttribute('open')).toBe(true);
  });

  it('opens the text layer under reduced motion', async () => {
    const { element } = await setUp();
    expect(element.querySelector('scene-unit-list details')?.hasAttribute('open')).toBe(true);
  });

  it('a chosen tool fills the inspector, with its name the largest thing in it', async () => {
    const { element, facade, fixture } = await setUp();
    facade.chooseTool('aifg-a:145');
    await fixture.whenStable();
    expect(element.querySelector('scene-unit-inspector h2')?.textContent).toBe('Flocking');
    expect(element.querySelectorAll('scene-unit-inspector input[type="range"]')).toHaveLength(3);
  });

  it('coaches the first move', async () => {
    const { element } = await setUp();
    expect(element.querySelector('scene-coach-mapper')?.textContent).toContain(
      'Drag round some units.',
    );
  });

  it('puts the comparison in the instruments’ place while it is open', async () => {
    const { element, facade, fixture } = await setUp();
    facade.select('unit-01');
    facade.select('unit-02', true);
    facade.chooseTool('aifg-a:145');
    facade.equip();
    facade.compare();
    await fixture.whenStable();
    expect(element.querySelector('[data-divergence]')?.textContent).toContain('frame 1');
    expect(element.querySelector('[data-metric]')).toBeNull();
    facade.closeTrial();
    await fixture.whenStable();
    expect(element.querySelector('[data-metric]')).not.toBeNull();
  });

  it('stops the scene when the operator leaves it', async () => {
    const { facade, fixture } = await setUp(false);
    facade.play();
    fixture.destroy();
    expect(facade.vm().transport.playing).toBe(false);
  });
});

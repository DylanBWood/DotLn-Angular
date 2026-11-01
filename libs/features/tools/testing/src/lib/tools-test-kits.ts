import { provideRouter } from '@angular/router';

import { createCatalogLoader } from '@dotln-angular/catalog';
import { catalogFixture, provideCatalogTestKit } from '@dotln-angular/catalog/testing';
import { provideStorageTokenTestKit } from '@dotln-angular/data-access/testing';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import type {
  ConceptStudy,
  StudyExecutable,
  StudyVisual,
  Tool,
  ToolId,
} from '@dotln-angular/models';
import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import { ToolsFacade } from '../../../src/lib/facades/tools.facade';
import { ToolsHomeFacade } from '../../../src/lib/facades/tools-home.facade';
import en from './tools-en.json';

const provideToolsBase = (tools: readonly Tool[], studies?: readonly ConceptStudy[]) => {
  const catalog = provideCatalogTestKit(tools, studies);
  const storage = provideStorageTokenTestKit();
  return {
    catalog,
    storage,
    providers: [
      ...provideDotlnStateTestKit().providers,
      ...storage.providers,
      ...catalog.providers,
      ...provideDotlnI18nTestKit({ langs: { en } }).providers,
      provideRouter([]),
      provideDotlnUi(),
    ],
  };
};

export function provideToolsFacadeTestKit(
  tools: readonly Tool[] = catalogFixture,
  studies?: readonly ConceptStudy[],
) {
  const base = provideToolsBase(tools, studies);
  return { ...base, providers: [...base.providers, ToolsFacade] };
}

export function provideToolsHomeFacadeTestKit(
  tools: readonly Tool[] = catalogFixture,
  studies?: readonly ConceptStudy[],
) {
  const base = provideToolsBase(tools, studies);
  return { ...base, providers: [...base.providers, ToolsHomeFacade] };
}

export function provideToolsTestKit(
  tools: readonly Tool[] = catalogFixture,
  studies?: readonly ConceptStudy[],
) {
  return provideToolsFacadeTestKit(tools, studies);
}

/** A study with a drawing and a model that runs it, as a model's spec reads it. */
export type DrawnStudy = ConceptStudy & {
  readonly visual: StudyVisual;
  readonly pseudocode: ConceptStudy['pseudocode'] & { readonly executable: StudyExecutable };
};

/** A bundled study, for a spec that checks a model against the record it runs from. */
export async function loadStudy(id: ToolId): Promise<DrawnStudy> {
  const study = await createCatalogLoader().study(id);
  if (!study?.visual || !study.pseudocode.executable) throw new Error(`No drawn study of ${id}.`);
  return study as DrawnStudy;
}

/** A study drawn as a flow, whether or not its example also runs as marbles. */
export type FlowStudy = ConceptStudy & {
  readonly visual: StudyVisual & { readonly family: 'flow'; readonly model: string };
};

/** A bundled flow study, for a spec that checks a flow module against the record it runs from. */
export async function loadFlowStudy(id: ToolId): Promise<FlowStudy> {
  const study = await createCatalogLoader().study(id);
  if (study?.visual?.family !== 'flow' || !study.visual.model)
    throw new Error(`No flow study of ${id}.`);
  return study as FlowStudy;
}

import { provideRouter } from '@angular/router';

import { createCatalogLoader } from '@dotln-angular/catalog';
import {
  catalogFixture,
  provideCatalogTestKit,
  studyFixture,
} from '@dotln-angular/catalog/testing';
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
import { translateStudy } from '../../../src/lib/studies/study-record';
import { studyMessages, studyTranslate } from './study-translations';
import en from './tools-en.json';

const provideToolsBase = (tools: readonly Tool[], studies?: readonly ConceptStudy[]) => {
  const fixtureMessages: Record<string, string> = {};
  const localized = (studies ?? [studyFixture]).map((record) =>
    translateStudy(record, (text) => {
      if (text.startsWith('study')) return text;
      const key = `item${Object.keys(fixtureMessages).length}`;
      fixtureMessages[key] = text;
      return `studyAifg.fixture.${key}`;
    }),
  );
  const catalog = provideCatalogTestKit(tools, localized);
  const titles = Object.fromEntries(tools.map(({ id, title }) => [id, title]));
  const scopes = {
    ...studyMessages,
    studyAifg: {
      ...studyMessages.studyAifg,
      fixture: fixtureMessages,
      titles: { ...studyMessages.studyAifg.titles, ...titles },
    },
  };
  const langs = {
    en,
    ...Object.fromEntries(
      Object.entries(scopes).map(([scope, messages]) => [`${scope}/en`, messages]),
    ),
  };
  const storage = provideStorageTokenTestKit();
  return {
    catalog,
    storage,
    providers: [
      ...provideDotlnStateTestKit().providers,
      ...storage.providers,
      ...catalog.providers,
      ...provideDotlnI18nTestKit({ langs }).providers,
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
  return translateStudy(study, studyTranslate) as DrawnStudy;
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
  return translateStudy(study, studyTranslate) as FlowStudy;
}

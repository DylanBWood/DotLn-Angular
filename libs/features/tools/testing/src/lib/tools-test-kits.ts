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
  VisualFamily,
} from '@dotln-angular/models';
import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import { ToolsFacade } from '../../../src/lib/facades/tools.facade';
import { ToolsHomeFacade } from '../../../src/lib/facades/tools-home.facade';
import type { StatesModel } from '../../../src/lib/studies/study-model';
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

/**
 * A study whose drawing a model module produces, drawn by the given family: a flow, whether or not
 * its example also runs as marbles, or a states register over a simulation that runs.
 */
export type ModelStudy<Family extends VisualFamily> = ConceptStudy & {
  readonly visual: StudyVisual & { readonly family: Family; readonly model: string };
};

/**
 * A bundled study drawn by `family` from the model module its record names, for a spec that
 * drives that model through the record it runs from. It refuses a study drawn by another family
 * or by no model, so a spec cannot read the wrong record.
 */
export async function loadModelStudy<Family extends VisualFamily>(
  id: ToolId,
  family: Family,
): Promise<ModelStudy<Family>> {
  const study = await createCatalogLoader().study(id);
  if (study?.visual?.family !== family || !study.visual.model)
    throw new Error(`No ${family} study of ${id}.`);
  return translateStudy(study, studyTranslate) as ModelStudy<Family>;
}

/** The token letter of each object a states drawing tracks, by object id. */
export function tokensOf(states: StatesModel): Readonly<Record<string, string>> {
  return Object.fromEntries(states.objects.map(({ id, key }) => [id, key]));
}

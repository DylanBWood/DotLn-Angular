import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createCatalogLoader } from '@dotln-angular/catalog';
import { catalogFixture } from '@dotln-angular/catalog/testing';
import { MessageCatalog, type TranslateMessage } from '@dotln-angular/i18n';

import { provideToolsFacadeTestKit, studyTranslate } from '../../../testing/src';
import { ToolsFacade } from './tools.facade';

it('keeps the latest language when an earlier message load finishes last', async () => {
  const record = await createCatalogLoader().study('aifg-a:112');
  if (!record) throw new Error('The Arrive record is missing.');
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: record.id }], [record]);
  const language = signal('en');
  let finishEnglish: (translate: TranslateMessage) => void = () => undefined;
  const english = new Promise<TranslateMessage>((resolve) => {
    finishEnglish = resolve;
  });
  const french: TranslateMessage = (key, parameters) => `FR ${studyTranslate(key, parameters)}`;
  const translator = vi.fn((_scopes: readonly string[], selected: string) =>
    selected === 'en' ? english : Promise.resolve(french),
  );
  TestBed.configureTestingModule({
    providers: [...kit.providers, { provide: MessageCatalog, useValue: { language, translator } }],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  expect(translator).not.toHaveBeenCalled();
  facade.open(record.id);
  await vi.waitFor(() =>
    expect(translator).toHaveBeenCalledWith(['studyCommon', 'studyAifg'], 'en'),
  );
  language.set('fr');
  await vi.waitFor(() => expect(facade.vm().study?.example.name).toBe(french(record.example.name)));
  finishEnglish(studyTranslate);
  await english;
  await Promise.resolve();
  TestBed.tick();
  expect(facade.vm().study?.example.name).toBe(french(record.example.name));
  expect(facade.vm().study?.visual?.caption).toMatch(/^FR /);
});

it('ignores a pending message failure after the reader leaves its study', async () => {
  const record = await createCatalogLoader().study('aifg-a:112');
  if (!record) throw new Error('The Arrive record is missing.');
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: record.id }], [record]);
  let failLoad: (error: Error) => void = () => undefined;
  const pending = new Promise<TranslateMessage>((_resolve, reject) => {
    failLoad = reject;
  });
  const translator = vi.fn(() => pending);
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      { provide: MessageCatalog, useValue: { language: signal('en'), translator } },
    ],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open(record.id);
  await vi.waitFor(() => expect(translator).toHaveBeenCalled());
  facade.arrive(undefined);
  TestBed.tick();
  failLoad(new Error('Unavailable'));
  await pending.catch(() => undefined);
  await Promise.resolve();
  TestBed.tick();
  expect(facade.vm().studyStatus).toBe('none');
  expect(facade.vm().study).toBeNull();
});

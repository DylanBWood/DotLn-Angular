/** Presentation receives messages explicitly; a simulation never depends on a language. */
export type StudyTranslate = (
  key: string,
  parameters?: Readonly<Record<string, string | number>>,
) => string;

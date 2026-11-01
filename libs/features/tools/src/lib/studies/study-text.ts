const placeholder = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/** The value names a piece of prose reads. */
export const placeholdersIn = (text: string) =>
  [...text.matchAll(placeholder)].map(([, name]) => name);

/** Puts a moment's values into a record's prose; a name it lacks stays visible as written. */
export const fillValues = (text: string, values: Readonly<Record<string, string>>) =>
  text.replace(placeholder, (written, name: string) => values[name] ?? written);

/** The blank-line-separated blocks of pseudocode; the check keeps one for each mechanism step. */
export const codeBlocks = (code: string) =>
  code
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

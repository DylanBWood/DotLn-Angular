export function provideUtilsTestKit() {
  return {
    providers: [],
    words: ['home', '', 'settings'] as const,
    nonEmptyWords: ['home', 'settings'] as const,
  };
}

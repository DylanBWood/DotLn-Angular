import { BasePaths, buildRoute, ChildPaths } from './routes';

it('builds a route from its base, child and extra segments', () => {
  expect(buildRoute(BasePaths.Tools).commands).toEqual(['/', 'tools']);
  expect(buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog }).commands).toEqual([
    '/',
    'tools',
    'catalog',
  ]);
});

it('fills a child path’s parameters and refuses one with no value', () => {
  expect(
    buildRoute(BasePaths.Tools, {
      child: ChildPaths.Reading,
      params: { toolId: 'aifg-a:186' },
    }).commands,
  ).toEqual(['/', 'tools', 'catalog', 'aifg-a:186']);
  expect(() => buildRoute(BasePaths.Tools, { child: ChildPaths.Reading })).toThrow(':toolId');
});

it('carries query parameters beside the commands', () => {
  expect(buildRoute(BasePaths.Scene, { query: { tool: 'aifg-a:112' } }).queryParams).toEqual({
    tool: 'aifg-a:112',
  });
});

import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { fillValues } from '../study-text';
import { model } from './conways-law.model';
import { conwayRun, readParameters } from './conways-law.simulation';

const record = await loadModelStudy('tt1:92', 'relations');
const parameters = record.example.parameters;

it('preserves which teams and components are joined in the checkout example', () => {
  const graph = readParameters(parameters);
  expect(graph.contacts).toEqual([
    { id: 'checkout-stock', from: 'checkout', to: 'stock' },
    { id: 'checkout-billing', from: 'checkout', to: 'billing' },
  ]);
  expect(conwayRun(graph)).toEqual({
    assignments: [
      { team: 'stock', component: 'inventory' },
      { team: 'checkout', component: 'order-entry' },
      { team: 'billing', component: 'payments' },
    ],
    connections: [
      {
        contact: { id: 'checkout-stock', from: 'checkout', to: 'stock' },
        dependency: { from: 'order-entry', to: 'inventory' },
      },
      {
        contact: { id: 'checkout-billing', from: 'checkout', to: 'billing' },
        dependency: { from: 'order-entry', to: 'payments' },
      },
    ],
  });
});

it('draws aligned ownership pairs and reads a contact and its software counterpart', () => {
  const { relations, moments } = model(parameters, studyTranslate);
  expect(relations.nodes.map(({ x, y, label }) => [x, y, label])).toEqual([
    [92, 38, 'Stock team'],
    [308, 38, 'Inventory'],
    [92, 124, 'Checkout team'],
    [308, 124, 'Order entry'],
    [92, 210, 'Billing team'],
    [308, 210, 'Payment processing'],
  ]);
  expect(relations.edges.find(({ id }) => id === 'owns-checkout')).toMatchObject({
    from: 'team-checkout',
    to: 'component-order-entry',
    label: 'owns',
  });
  expect(fillValues(record.visual.textEquivalent, relations.frames[3].values)).toBe(
    'Step 3. Checkout team starts design talks with Stock team. On the right, this contact becomes a dependency from Order entry to Inventory.',
  );
  expect(relations.frames[4].focus).toEqual({
    relation: 'dependency-checkout-stock',
  });
  expect(relations.frames[4].values['focus']).toBe('Order entry depends on Inventory');
  expect(moments.map(({ label, step }) => [label, step])).toEqual([
    ['Pair the owners', 0],
    ['Follow a contact', 3],
    ['Read both graphs', 7],
  ]);
});

it('moves the stock dependency when Billing takes over the stock contact', () => {
  const changed = {
    ...parameters,
    checkoutContactsStock: 0,
    billingContactsStock: 1,
  };
  expect(
    conwayRun(readParameters(changed)).connections.map(({ dependency }) => dependency),
  ).toEqual([
    { from: 'order-entry', to: 'payments' },
    { from: 'payments', to: 'inventory' },
  ]);

  const { relations } = model(changed, studyTranslate);
  expect(relations.edges.some(({ id }) => id === 'dependency-checkout-stock')).toBe(false);
  expect(relations.edges.find(({ id }) => id === 'dependency-billing-stock')).toMatchObject({
    from: 'component-payments',
    to: 'component-inventory',
    label: 'depends on',
  });
  expect(relations.frames[5].values['focus']).toBe(
    'Billing team starts design talks with Stock team',
  );
  expect(relations.frames[6].values['focus']).toBe('Payment processing depends on Inventory');
});

it('keeps isolated ownership pairs when the graph has no contacts', () => {
  const isolated = {
    ...parameters,
    checkoutContactsStock: 0,
    checkoutContactsBilling: 0,
  };
  expect(conwayRun(readParameters(isolated)).connections).toEqual([]);
  const { relations, moments } = model(isolated, studyTranslate);
  expect(relations.edges.map(({ id }) => id)).toEqual([
    'owns-stock',
    'owns-checkout',
    'owns-billing',
  ]);
  expect(relations.frames).toHaveLength(4);
  expect(relations.frames[3].note).toBe(
    'Only ownership pairs remain. A design contact in the input would give this sketch a dependency on the right.',
  );
  expect(moments.map(({ label }) => label)).toEqual(['Pair the owners', 'Read both graphs']);
});

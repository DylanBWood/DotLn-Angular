import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnTabList } from './tab-list';
import { DotlnTabPanel } from './tab-panel';
import { DotlnTabs } from './tabs';

const meta: Meta = { title: 'UI/tabs', component: DotlnTabs };
export default meta;
export const Default: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [DotlnTabList, DotlnTabPanel] },
    props: {
      items: [
        { id: 'actors', label: 'Actors' },
        { id: 'builds', label: 'Builds' },
        { id: 'disabled', label: 'Unavailable panel', disabled: true },
      ],
      selected: 'actors',
      label: 'Example panels',
    },
    template:
      '<dotln-tabs><dotln-tab-list [items]="items" [label]="label" [(selected)]="selected" />@for (item of items; track item.id) { <ng-template #content><p>{{ item.label }}</p></ng-template><dotln-tab-panel [value]="item.id" [content]="content" /> }</dotln-tabs>',
  }),
};

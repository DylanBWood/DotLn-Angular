import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnKeyValueList } from './key-value-list';

const meta: Meta = { title: 'UI/key-value-list', component: DotlnKeyValueList };
export default meta;
export const Default: StoryObj = {
  render: () => ({
    props: {
      items: [
        { key: 'identity', label: 'Identity', value: 'Repo Gardener' },
        { key: 'episodes', label: 'Recorded episodes', value: 0 },
      ],
    },
    template:
      '<ng-template #value let-item><span>{{ item.value }}</span></ng-template><dotln-key-value-list [items]="items" scope="story-record" [valueTemplate]="value" />',
  }),
};

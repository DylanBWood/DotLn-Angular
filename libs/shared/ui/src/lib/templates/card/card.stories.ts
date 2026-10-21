import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnButton } from '../button/button';
import { DotlnCard } from './card';

const meta: Meta<DotlnCard> = { title: 'UI/card', component: DotlnCard };
export default meta;
export const Default: StoryObj<DotlnCard> = {
  render: () => ({
    moduleMetadata: { imports: [DotlnButton] },
    props: {
      title: 'Saved actor definition',
      body: 'A recorded identity and role. A saved build does not imply a running episode.',
      action: 'Inspect evidence',
    },
    template:
      '<dotln-card><h2 card-header>{{ title }}</h2><p card-body>{{ body }}</p><dotln-button card-actions>{{ action }}</dotln-button></dotln-card>',
  }),
};

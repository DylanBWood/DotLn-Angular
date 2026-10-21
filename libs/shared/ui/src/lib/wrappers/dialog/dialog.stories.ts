import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnButton } from '../../templates/button/button';
import { DotlnDialog } from './dialog';

const meta: Meta = { title: 'UI/dialog', component: DotlnDialog };
export default meta;
export const Default: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [DotlnButton] },
    props: {
      open: false,
      title: 'Evidence details',
      description: 'This is a recorded source. No live activity is implied.',
      action: 'Open details',
    },
    template:
      '<dotln-button (pressed)="open = true">{{ action }}</dotln-button><dotln-dialog [label]="title" [(open)]="open"><h2>{{ title }}</h2><p>{{ description }}</p><a href="#record">{{ title }}</a></dotln-dialog>',
  }),
};

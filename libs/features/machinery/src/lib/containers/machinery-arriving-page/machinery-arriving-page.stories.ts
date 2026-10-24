import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { MachineryArrivingPage } from './machinery-arriving-page';

const meta: Meta<MachineryArrivingPage> = {
  title: 'Machinery/arriving-page',
  component: MachineryArrivingPage,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
};
export default meta;
export const Default: StoryObj<MachineryArrivingPage> = {};

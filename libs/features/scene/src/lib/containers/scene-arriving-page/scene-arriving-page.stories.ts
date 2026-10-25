import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { SceneArrivingPage } from './scene-arriving-page';

const meta: Meta<SceneArrivingPage> = {
  title: 'Scene/arriving-page',
  component: SceneArrivingPage,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
};
export default meta;
export const Default: StoryObj<SceneArrivingPage> = {};

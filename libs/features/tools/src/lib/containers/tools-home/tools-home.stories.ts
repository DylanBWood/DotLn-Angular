import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../testing/src';
import { ToolsHome } from './tools-home';

const meta: Meta<ToolsHome> = {
  title: 'Tools/home',
  component: ToolsHome,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
};
export default meta;
export const Default: StoryObj<ToolsHome> = {};

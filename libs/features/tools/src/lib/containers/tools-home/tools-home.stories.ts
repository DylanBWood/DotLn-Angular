import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsHomeFacadeTestKit } from '../../../../testing/src';
import { ToolsHome } from './tools-home';

const meta: Meta<ToolsHome> = {
  title: 'Tools/home',
  component: ToolsHome,
  decorators: [applicationConfig({ providers: [...provideToolsHomeFacadeTestKit().providers] })],
};
export default meta;
export const Default: StoryObj<ToolsHome> = {};

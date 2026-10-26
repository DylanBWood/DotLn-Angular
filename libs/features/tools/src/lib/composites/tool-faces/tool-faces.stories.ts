import type { Meta, StoryObj } from '@storybook/angular-vite';

import { catalogFixture } from '@dotln-angular/catalog/testing';

import { ToolFaces } from './tool-faces';

const meta: Meta<ToolFaces> = {
  title: 'Tools/tool-faces',
  component: ToolFaces,
  args: { tool: catalogFixture[0] },
};
export default meta;
export const Typed: StoryObj<ToolFaces> = {};
export const Untyped: StoryObj<ToolFaces> = { args: { tool: catalogFixture[1] } };
export const Background: StoryObj<ToolFaces> = { args: { tool: catalogFixture[2] } };

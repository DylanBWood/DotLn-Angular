import type { Meta, StoryObj } from '@storybook/angular-vite';

import unavailableBoard from '../../../testing/fixtures/unavailable-board.json';
import type { BoardInput } from '../../models/board-view-model';
import { provideBoardFeature } from '../../providers/provide-board-feature';
import { BoardPage } from './board-page';

const meta: Meta<BoardPage> = {
  title: 'Board/page',
  component: BoardPage,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<BoardPage>;
export const Recorded: Story = {
  render: () => ({ applicationConfig: { providers: [provideBoardFeature()] } }),
};
export const Unavailable: Story = {
  render: () => ({
    applicationConfig: { providers: [provideBoardFeature(unavailableBoard as BoardInput)] },
  }),
};
export const UnsupportedVersion: Story = {
  render: () => ({
    applicationConfig: {
      providers: [
        provideBoardFeature({
          viewModelVersion: 'uifa-board-v99',
        } as BoardInput),
      ],
    },
  }),
};

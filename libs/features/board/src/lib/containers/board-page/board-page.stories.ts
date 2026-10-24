import type { Meta, StoryObj } from '@storybook/angular-vite';

import { provideBoardFacadeTestKit } from '@dotln-angular/board/testing';
import { unavailableBoard } from '@dotln-angular/board-data-access/testing';

import type { BoardInput } from '../../models/board-view-model';
import { BoardPage } from './board-page';

const meta: Meta<BoardPage> = {
  title: 'Board/page',
  component: BoardPage,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<BoardPage>;

export const Recorded: Story = {
  render: () => ({ applicationConfig: { providers: [...provideBoardFacadeTestKit().providers] } }),
};

export const Unavailable: Story = {
  render: () => ({
    applicationConfig: {
      providers: [...provideBoardFacadeTestKit(unavailableBoard as BoardInput).providers],
    },
  }),
};

export const UnsupportedVersion: Story = {
  render: () => ({
    applicationConfig: {
      providers: [
        ...provideBoardFacadeTestKit({
          viewModelVersion: 'uifa-board-v99',
        } as BoardInput).providers,
      ],
    },
  }),
};

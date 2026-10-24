import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular-vite';

import { TPipe } from '@dotln-angular/i18n';

import { DotlnSubAppMenu } from './sub-app-menu';
import { DotlnSubAppMenuGroup } from './sub-app-menu-group';

const meta: Meta<DotlnSubAppMenu> = {
  title: 'Shell/sub-app-menu',
  component: DotlnSubAppMenu,
  decorators: [moduleMetadata({ imports: [DotlnSubAppMenuGroup, TPipe] })],
};
export default meta;

const renderMenu = (withTools: boolean) => ({
  props: { catalog: 'Catalog' },
  template: `
    <dotln-sub-app-menu>
      <dotln-sub-app-menu-group>
        <span menu-heading>{{ 'shell.menu.scene' | t }}</span>
        <li menu-item><a href="#scene">{{ 'shell.menu.scene' | t }}</a></li>
      </dotln-sub-app-menu-group>
      <dotln-sub-app-menu-group>
        <span menu-heading>{{ 'shell.menu.machinery' | t }}</span>
        <li menu-item><a href="#board">{{ 'shell.board' | t }}</a></li>
        <li menu-item><a href="#machinery">{{ 'shell.menu.machinery' | t }}</a></li>
      </dotln-sub-app-menu-group>
      <dotln-sub-app-menu-group [emptyMessage]="'shell.menu.toolsEmpty' | t">
        <span menu-heading>{{ 'shell.menu.tools' | t }}</span>
        ${withTools ? '<li menu-item><a href="#catalog">{{ catalog }}</a></li>' : ''}
      </dotln-sub-app-menu-group>
    </dotln-sub-app-menu>
  `,
});

export const Default: StoryObj<DotlnSubAppMenu> = { render: () => renderMenu(false) };
export const WithTools: StoryObj<DotlnSubAppMenu> = { render: () => renderMenu(true) };

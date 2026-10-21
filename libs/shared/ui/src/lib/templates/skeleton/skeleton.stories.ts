import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnSkeleton } from './skeleton';

const meta: Meta<DotlnSkeleton> = { title: 'UI/skeleton', component: DotlnSkeleton, args: {} };
export default meta;
type SkeletonStory = StoryObj<DotlnSkeleton>;
export const Default: SkeletonStory = {};

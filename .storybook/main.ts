import type { StorybookConfig } from '@storybook/react-vite';
import { resolve } from 'path';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../'),
    };

    // Polyfill process.env for Storybook
    config.define = {
      ...config.define,
      'process.env': {},
    };

    // Add plugins to handle problematic packages
    config.plugins = config.plugins || [];
    config.plugins.push(
      replace({
        preventAssignment: true,
        'import pkg from \'../../package.json\' with { type: \'json\' };': 'import pkg from \'../../package.json\';',
      }),
      nodeResolve({
        extensions: ['.js', '.json'],
      }),
      commonjs()
    );

    return config;
  },
};

export default config;

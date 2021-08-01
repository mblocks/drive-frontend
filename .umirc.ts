import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  locale: {},
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: {},
  dva: {
    immer: false,
    hmr: false,
  },
});

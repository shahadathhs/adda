import { defineConfig, InputTransformerFn } from 'orval';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const apiClientSrc = resolve(root, 'packages', 'api-client', 'src');

const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = 'Api';
  return config;
};

export default defineConfig({
  'api-client': {
    input: {
      target: './openapi.yaml',
      override: {
        transformer: titleTransformer,
      },
    },
    output: {
      workspace: apiClientSrc,
      target: 'generated',
      client: 'react-query',
      mode: 'split',
      baseUrl: '/api',
      clean: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: resolve(apiClientSrc, 'custom-fetch.ts'),
          name: 'customFetch',
        },
      },
    },
  },
});

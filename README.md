# Drive Frontend

Mblocks Drive Frontend

## Features

- Upload Files/Dir
- Create Dir
- Move/Copy/Delete/Download/Rename
- View: List/Icons
- Language: English/Chinese


## Dev

### Install dependencies

```bash
$ yarn
```

### Start the dev server

```bash
$ yarn start
```

### Local Dev

Create `.umirc.local.ts` as below

```js
//more detail
//https://umijs.org/docs/config#local-configuration
import { defineConfig } from 'umi';

export default defineConfig({
  layout: {},
  proxy: {
    '/api/driver/': {
      'target': 'http://127.0.0.1:8000',
      bypass: function (req, res, proxyOptions) {
        req.headers = { ...req.headers, 'x-consumer-id': '1', 'x-consumer-third': 'mblocks', 'x-consumer-third-user-id': '1' };
      },
      'changeOrigin': true,
      'pathRewrite': { '^/api/driver/': '/' },
    },
    '/api/services/minio/': {
      'target': 'http://minio.local.com',
      'changeOrigin': true,
      'pathRewrite': { '^/api/services/minio/': '/' },
    },
  },
});


```


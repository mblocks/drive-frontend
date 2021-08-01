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
  layout:{},
});


```


<!--
 Copyright (c) 2024 Anthony Mugendi

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# SVGO-Dir

```javascript
const Optimizer = require('svgo-dirs');

// paths to watch and optimize svgs
const staticDirs = [path.join(__dirname, './www/static')];

// init class
const optimizer = new Optimizer();

// optimize & watch directories on developnent mode
// Default watchDirs=false
optimizer.optimize(staticDirs, {
  watchDirs: process.env.NODE_ENV == 'development',
});
```

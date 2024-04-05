/**
 * Copyright (c) 2024 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Copyright (c) 2024 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const findUp = require('find-up');

//
const { optimize } = require('svgo');
const logger = require('debug-symbols')('SVGOptimizer');

// // Initialize watcher.

// // Add event listeners.
//

class Optimizer {
  optimize(dirNames, { watchDirs = false } = {}) {
    this.configFiles = {};
    this.svgsBeingOptimized = {};
    this.dirNames = arrify(dirNames);

    for (let dir of dirNames) {
      if (typeof dir !== 'string' || !fs.existsSync(dir)) {
        throw new Error(`The Directory ${dir} does not exist!`);
      }
    }

    // make chokidar patterns to watch
    const patterns = this.dirNames.map((v) => `${v}/**/*.svg`);

    // start watching
    const watcher = chokidar.watch(patterns, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: watchDirs,
    });

    watcher.on('all', this.optimizeSVG.bind(this));
  }

  async optimizeSVG(event, filePath) {
    if (event !== 'change' && event !== 'add') return;

    const backupFile = path.join(
      path.dirname(filePath),
      path.basename(filePath) + '.back'
    );

    // do not optimize if already done
    if (event == 'add' && fs.existsSync(backupFile)) return;

    const cwd = path.dirname(filePath);
    const configFiles = ['svgo.config.js', 'svgo.config.json'];

    // only find config file once per
    if (cwd in this.configFiles === false) {
      this.configFiles[cwd] = findUp(
        async (directory) => {
          const foundConfigs = configFiles
            .map((file) => path.join(directory, file))
            .filter((file) => fs.existsSync(file));

          //   console.log('here', cwd, this.configFiles[cwd]);

          // stop once we get to folders being watched
          if (this.dirNames.indexOf(directory) > -1) {
            return findUp.stop;
          }

          // return first config found
          if (foundConfigs.length) {
            return foundConfigs[0];
          }
        },
        { cwd, type: 'file' }
      ).then((confFile) => {
        return confFile ? require(confFile) : confFile;
      });
    }

    // use found config or default
    const svgoConfig = (await this.configFiles[cwd]) || {};

    //   if file is being optimized
    if (filePath in this.svgsBeingOptimized) return;
    this.svgsBeingOptimized[filePath] = 1;

    // delay a little to ensure file is fully saved
    await delay(500);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    const result = optimize(svgContent, svgoConfig);
    const newSvgContent = result.data.trim();

    //   save backup
    fs.writeFileSync(backupFile, svgContent);

    //   save optimized
    fs.writeFileSync(filePath, newSvgContent);

    logger.success(
      'Optimized SVG ' +
        path.basename(filePath) +
        ' ' +
        newSvgContent.length / svgContent.length / 100 +
        '% saved'
    );

    await delay(500);
    delete this.svgsBeingOptimized[filePath];
  }
}

function arrify(v) {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function delay(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = Optimizer;

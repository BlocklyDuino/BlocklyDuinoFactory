/**
 * BlocklyDuinoFactory Preview module
 *
 * Copyright 2015 BlocklyDuino https://github.com/BlocklyDuino
 *
 * Based on the Block Factory Blockly demo Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for BlocklyDuinoFactory block preview module.
 */
'use strict';

/**
 * Create a namespace nested in the BlocklyDuinoFactory application.
 */
var Bdf = Bdf || {};
Bdf.Preview = Bdf.Preview || {};

/**
 * Workspace for user to generate the block code.
 * @type {Blockly.Workspace}
 */
Bdf.Preview.workspace = null;

/**
 * Update the preview display.
 */
Bdf.Preview.updatePreview = function() {
  // Toggle between LTR/RTL if needed (also used in first display).
  var newDir = document.getElementById('direction').value;
  if (Bdf.oldDir != newDir) {
    if (Bdf.Preview.workspace) {
      Bdf.Preview.workspace.dispose();
    }
    var rtl = newDir == 'rtl';
    Bdf.Preview.workspace = Blockly.inject('preview',
        {rtl: rtl,
         media: 'blockly/media/',
         scrollbars: true});
    Bdf.oldDir = newDir;
  }
  Bdf.Preview.workspace.clear();

  // Fetch the code and determine its format (JSON or JavaScript).
  var format = document.getElementById('format').value;
  if (format == 'Manual') {
    var code = document.getElementById('languageTA').value;
    // If the code is JSON, it will parse, otherwise treat as JS.
    try {
      JSON.parse(code);
      format = 'JSON';
    } catch (e) {
      format = 'JavaScript';
    }
  } else {
    var code = document.getElementById('languagePre').textContent;
  }
  if (!code.trim()) {
    // Nothing to render.  Happens while cloud storage is loading.
    return;
  }

  // Backup Blockly.Blocks object so that main workspace and preview don't
  // collide if user creates a 'factory_base' block, for instance.
  var backupBlocks = Blockly.Blocks;
  try {
    // Make a shallow copy.
    Blockly.Blocks = {};
    for (var prop in backupBlocks) {
      Blockly.Blocks[prop] = backupBlocks[prop];
    }

    if (format == 'JSON') {
      var json = JSON.parse(code);
      Blockly.Blocks[json.id || UNNAMED] = {
        init: function() {
          this.jsonInit(json);
        }
      };
    } else if (format == 'JavaScript') {
      eval(code);
    } else {
      throw 'Unknown format: ' + format;
    }

    // Look for a block on Blockly.Blocks that does not match the backup.
    var blockType = null;
    for (var type in Blockly.Blocks) {
      if (typeof Blockly.Blocks[type].init == 'function' &&
          Blockly.Blocks[type] != backupBlocks[type]) {
        blockType = type;
        break;
      }
    }
    if (!blockType) {
      return;
    }

    // Create the preview block.
    var previewBlock = Blockly.Block.obtain(Bdf.Preview.workspace, blockType);
    previewBlock.initSvg();
    previewBlock.render();
    previewBlock.setMovable(false);
    previewBlock.setDeletable(false);
    previewBlock.moveBy(15, 10);

    Bdf.Generator.updateGenerator(previewBlock);
  } finally {
    Blockly.Blocks = backupBlocks;
  }
};
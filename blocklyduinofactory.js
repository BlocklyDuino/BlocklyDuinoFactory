/**
 * BlocklyDuinoFactory Application
 *
 * Copyright 2015 BlocklyDuino https://github.com/BlocklyDuino
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
 * @fileoverview JavaScript for BlocklyDuinoFactory application.
 */
'use strict';

/**
 * Create a namespace for the BlocklyDuinoFactory application.
 */
var Bdf = Bdf || {};

/**
 * Name of block if not named.
 */
Bdf.UNNAMED = 'unnamed';

/**
 * Change the block definition code language format.
 */
Bdf.definitionFormatChange = function() {
  var mask = document.getElementById('blocklyMask');
  var languagePre = document.getElementById('languagePre');
  var languageTA = document.getElementById('languageTA');
  if (document.getElementById('format').value == 'Manual') {
    Blockly.hideChaff();
    mask.style.display = 'block';
    languagePre.style.display = 'none';
    languageTA.style.display = 'block';
    var code = languagePre.textContent.trim();
    languageTA.value = code;
    languageTA.focus();
    Bdf.updatePreview();
  } else {
    mask.style.display = 'none';
    languageTA.style.display = 'none';
    languagePre.style.display = 'block';
    Bdf.updateDefinitionCode();
  }
};

/**
 * Update the block definition code based on constructs made in the block
 * definition workspace.
 */
Bdf.updateDefinitionCode = function() {
  switch (document.getElementById('format').value) {
    case 'JSON':
      var code = Bdf.Factory.formatJson();
      break;
    case 'JavaScript':
      var code = Bdf.Factory.formatJavaScript();
      break;
  }
  Bdf.injectCode(code, 'languagePre');
  Bdf.updatePreview();
};

/**
 * Update the preview workspace with the new block, which code has been
 * generated and injected the HTLM DOM.
 * @return {Blocly.Block} Block generated in the Preview workspace.
 */
Bdf.updatePreview = function() {
  // Fetch the direction
  var newDir = document.getElementById('direction').value;
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
  var previewBlock = Bdf.Preview.update(newDir, format, code);
  return previewBlock;
};

/**
 * Update the all block related activities: Generates the block definition code
 * from the definition workspace, updates the preview workspace with the code,
 * and generates the JavaScript code for the Blockly Arduino Generator.
 */
Bdf.updateBlock = function() {
  Bdf.updateDefinitionCode();
  var previewBlock = Bdf.updatePreview();
  if (previewBlock) {
    var generatorCode = Bdf.Generator.updateGenerator(previewBlock);
    Bdf.injectCode(generatorCode, 'generatorPre');
  }
};

/**
 * Inject code into a pre tag, with syntax highlighting.
 * Safe from HTML/script injection.
 * @param {string} code Lines of code.
 * @param {string} id ID of <pre> element to inject into.
 */
Bdf.injectCode = function(code, id) {
  Blockly.removeAllRanges();
  var pre = document.getElementById(id);
  pre.textContent = code;
  code = pre.innerHTML;
  code = prettyPrintOne(code, 'js');
  pre.innerHTML = code;
};

/**
 * Initialise Blockly and layout. Called on page load.
 */
Bdf.init = function() {
  document.getElementById('helpButton').addEventListener('click',
    function() {
      open('https://developers.google.com/blockly/custom-blocks/block-factory',
           'BlockFactoryHelp');
    });

  var expandList = [
    document.getElementById('blockly'),
    document.getElementById('blocklyMask'),
    document.getElementById('preview'),
    document.getElementById('languagePre'),
    document.getElementById('languageTA'),
    document.getElementById('generatorPre')
  ];
  var onresize = function(e) {
    for (var i = 0, expand; expand = expandList[i]; i++) {
      expand.style.width = (expand.parentNode.offsetWidth - 2) + 'px';
      expand.style.height = (expand.parentNode.offsetHeight - 2) + 'px';
    }
  };
  onresize();
  window.addEventListener('resize', onresize);

  Bdf.Factory.injectBlockly('blockly', document.getElementById('toolbox'));

  Bdf.Factory.workspace.addChangeListener(Bdf.updateBlock);
  document.getElementById('direction')
      .addEventListener('change', Bdf.updatePreview);
  document.getElementById('languageTA')
      .addEventListener('change', Bdf.updatePreview);
  document.getElementById('languageTA')
      .addEventListener('keyup', Bdf.updatePreview);
  document.getElementById('format')
      .addEventListener('change', Bdf.definitionFormatChange);
};

/**
 * Bind the initialisation function to the page load event.
 */
window.addEventListener('load', function load(event) {
  window.removeEventListener('load', load, false);
  Bdf.init();
});

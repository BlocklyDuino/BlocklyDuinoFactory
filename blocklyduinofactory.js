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
 * Change the language code format.
 */
Bdf.formatChange = function() {
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
    Bdf.Preview.updatePreview();
  } else {
    mask.style.display = 'none';
    languageTA.style.display = 'none';
    languagePre.style.display = 'block';
    Bdf.updateLanguage();
  }
  Bdf.disableEnableLink();
};

/**
 * Update the language code based on constructs made in Blockly.
 */
Bdf.updateLanguage = function() {
  var rootBlock = Bdf.Factory.getRootBlock();
  if (!rootBlock) {
    return;
  }
  var blockType = rootBlock.getFieldValue('NAME').trim().toLowerCase();
  if (!blockType) {
    blockType = UNNAMED;
  }
  blockType = blockType.replace(/\W/g, '_').replace(/^(\d)/, '_\\1');
  switch (document.getElementById('format').value) {
    case 'JSON':
      var code = Bdf.Factory.formatJson_(blockType, rootBlock);
      break;
    case 'JavaScript':
      var code = Bdf.Factory.formatJavaScript_(
          blockType, rootBlock);
      break;
  }
  Bdf.Generator.injectCode(code, 'languagePre');
  Bdf.Preview.updatePreview();
};

/**
 * Escape a string.
 * @param {string} string String to escape.
 * @return {string} Escaped string surrounded by quotes.
 */
Bdf.escapeString = function(string) {
  return JSON.stringify(string);
};

/**
 * Disable the link button if the format is 'Manual', enable otherwise.
 */
Bdf.disableEnableLink = function() {
  var linkButton = document.getElementById('linkButton');
  linkButton.disabled = document.getElementById('format').value == 'Manual';
};

/**
 * Existing direction ('ltr' vs 'rtl') of preview.
 */
Bdf.oldDir = null;

/**
 * Initialize Blockly and layout.  Called on page load.
 */
Bdf.init = function() {
  if ('BlocklyStorage' in window) {
    BlocklyStorage.HTTPREQUEST_ERROR =
        'There was a problem with the request.\n';
    BlocklyStorage.LINK_ALERT =
        'Share your blocks with this link:\n\n%1';
    BlocklyStorage.HASH_ERROR =
        'Sorry, "%1" doesn\'t correspond with any saved Blockly file.';
    BlocklyStorage.XML_ERROR = 'Could not load your saved file.\n' +
        'Perhaps it was created with a different version of Blockly?';
    var linkButton = document.getElementById('linkButton');
    linkButton.style.display = 'inline-block';
    linkButton.addEventListener('click',
        function() {BlocklyStorage.link(Bdf.Factory.workspace);});
    Bdf.disableEnableLink();
  }

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

  var toolbox = document.getElementById('toolbox');
  Bdf.Factory.workspace = Blockly.inject('blockly',
      {toolbox: toolbox, media: 'blockly/media/'});

  // Create the root block.
  if ('BlocklyStorage' in window && window.location.hash.length > 1) {
    BlocklyStorage.retrieveXml(window.location.hash.substring(1),
                               Bdf.Factory.workspace);
  } else {
    var rootBlock = Blockly.Block.obtain(Bdf.Factory.workspace, 'factory_base');
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.setMovable(false);
    rootBlock.setDeletable(false);
  }

  Bdf.Factory.workspace.addChangeListener(Bdf.updateLanguage);
  document.getElementById('direction')
      .addEventListener('change', Bdf.Preview.updatePreview);
  document.getElementById('languageTA')
      .addEventListener('change', Bdf.Preview.updatePreview);
  document.getElementById('languageTA')
      .addEventListener('keyup', Bdf.Preview.updatePreview);
  document.getElementById('format')
      .addEventListener('change', Bdf.formatChange);
}

window.addEventListener('load', function load(event) {
  window.removeEventListener('load', load, false);
  Bdf.init();
});

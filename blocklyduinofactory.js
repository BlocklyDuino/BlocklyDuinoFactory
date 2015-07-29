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
  var maskFactory = document.getElementById('blocklyFactoryMask');
  var maskGenerator = document.getElementById('blocklyGeneratorMask');
  var languagePre = document.getElementById('languagePre');
  var languageTA = document.getElementById('languageTA');
  if (document.getElementById('format').value == 'Manual') {
    Blockly.hideChaff();
    maskFactory.style.display = 'block';
    maskGenerator.style.display = 'block';
    languagePre.style.display = 'none';
    languageTA.style.display = 'block';
    var code = languagePre.textContent.trim();
    languageTA.value = code;
    languageTA.focus();
    Bdf.updatePreview();
  } else {
    maskFactory.style.display = 'none';
    maskGenerator.style.display = 'none';
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
 * Creates an XML file with the blocks from the Factory workspace for the user
 * to download.
 */
Bdf.saveXmlFactory = function() {
  var xmlData = Bdf.Factory.getXmlString();
  var blob = new Blob([xmlData], {type: 'text/xml'});
  saveAs(blob, 'blockduinofactory_factory.xml');
};

/**
 * Loads an XML file from the user filesystem and injects the blocks into the
 * Factory workspace.
 */
Bdf.openXmlFactory = function() {
  function openXmlFactoryFile(xmlString) {
    try {
      var xml = Blockly.Xml.textToDom(xmlString);
    } catch (e) {
      alert('Error parsing XML:\n' + e);
      return;
    }
    Bdf.Factory.loadXml(xml);
  }
  // Edit the hiddent file open button listener to the XML read function 
  Bdf.openUserFile(openXmlFactoryFile);
};

/**
 * This function is used as a placeholder for the event listener associated to
 * the hidden open button, this function reference is  changed based on required
 * functionality.
 */
Bdf.loadFileEventHolder = function(e) {};

/**
 * Triggers the open file dialog to the user and reads the selected file. It
 * returns the data to a callback as a string.
 * @param {!function} callback Callback function that takes an argument with the
 *     text file contents in a string format.
 */
Bdf.openUserFile = function(callback) {
  var fileOpenerWithCallback = function(e) {
    var files = event.target.files;
    // Only allow uploading one file.
    if (files.length != 1) { 
      alert('Can only read one file at a time.');
      return;
    }
    var reader = new FileReader();
    reader.onloadend = function(event) {
      var target = event.target;
      // 2 == FileReader.DONE
      if (target.readyState == 2) {
        callback(target.result);
      }
      // Reset value of input after loading because Chrome will not fire
      // a 'change' event if the same file is loaded again.
      document.getElementById('loadFileButton').value = '';
    };
    reader.readAsText(files[0]);
  };
  Bdf.loadFileEventHolder = fileOpenerWithCallback;
  document.getElementById('loadFileButton').click();
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
  document.getElementById('loadFileButton').addEventListener(
      'change', function(e) { Bdf.loadFileEventHolder(e); }, false);
  document.getElementById('loadXmlFactoryButton').addEventListener(
      'click', Bdf.openXmlFactory);
  document.getElementById('saveXmlFactoryButton').addEventListener(
      'click', Bdf.saveXmlFactory);
  
  var expandList = [
    document.getElementById('blocklyFactory'),
    document.getElementById('blocklyFactoryMask'),
    document.getElementById('blocklyGenerator'),
    document.getElementById('blocklyGeneratorMask'),
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

  Bdf.Factory.injectBlockly('blocklyFactory',
                            document.getElementById('toolboxFactory'));
  Bdf.Generator.injectBlockly('blocklyGenerator',
                            document.getElementById('toolboxGenerator'));

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

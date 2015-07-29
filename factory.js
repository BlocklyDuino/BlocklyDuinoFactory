/**
 * BlocklyDuinoFactory Factory module
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
 * @fileoverview JavaScript for BlocklyDuinoFactory block factory module.
 */
'use strict';

/**
 * Create a namespace nested in the BlocklyDuinoFactory application.
 */
var Bdf = Bdf || {};
Bdf.Factory = Bdf.Factory || {};

/**
 * Workspace for user to build block.
 * @type {Blockly.Workspace}
 */
Bdf.Factory.workspace = null;

/**
 * Inject Blockly into the given element and creates the Root block.
 * @param {!string|!Element} element HTML element name or Element to inject the
 *     factory Blockly workspace.
 * @param {!Element} toolbox XML element with the Blockly toolbox.
 */
Bdf.Factory.injectBlockly = function(element, toolbox) {
  Bdf.Factory.workspace = Blockly.inject(element,
      {toolbox: toolbox,
       media: 'blockly/media/' });
  Bdf.Factory.createRootBlock_();
};

/**
 * Update the language code as JSON.
 * @return {string} Generated language code.
 */
Bdf.Factory.formatJson = function() {
  var rootBlock = Bdf.Factory.getRootBlock_();
  var JS = {};
  // ID is not used by Blockly, but may be used by a loader.
  JS.id = Bdf.Factory.getBlockName_();
  // Generate inputs.
  var message = [];
  var args = [];
  var contentsBlock = rootBlock.getInputTargetBlock('INPUTS');
  var lastInput = null;
  while (contentsBlock) {
    if (!contentsBlock.disabled && !contentsBlock.getInheritedDisabled()) {
      var fields = Bdf.Factory.getFieldsJson_(
          contentsBlock.getInputTargetBlock('FIELDS'));
      for (var i = 0; i < fields.length; i++) {
        if (typeof fields[i] == 'string') {
          message.push(fields[i].replace(/%/g, '%%'));
        } else {
          args.push(fields[i]);
          message.push('%' + args.length);
        }
      }

      var input = {type: contentsBlock.type};
      // Dummy inputs don't have names.  Other inputs do.
      if (contentsBlock.type != 'input_dummy') {
        input.name = contentsBlock.getFieldValue('INPUTNAME');
      }
      var check = JSON.parse(Bdf.Factory.getOptTypesFrom_(
          contentsBlock, 'TYPE') || 'null');
      if (check) {
        input.check = check;
      }
      var align = contentsBlock.getFieldValue('ALIGN');
      if (align != 'LEFT') {
        input.align = align;
      }
      args.push(input);
      message.push('%' + args.length);
      lastInput = contentsBlock;
    }
    contentsBlock = contentsBlock.nextConnection &&
        contentsBlock.nextConnection.targetBlock();
  }
  // Remove last input if dummy and not empty.
  if (lastInput && lastInput.type == 'input_dummy') {
    var fields = lastInput.getInputTargetBlock('FIELDS');
    if (fields && Bdf.Factory.getFieldsJson_(fields).join('').trim() != '') {
      var align = lastInput.getFieldValue('ALIGN');
      if (align != 'LEFT') {
        JS.lastDummyAlign0 = align;
      }
      args.pop();
      message.pop();
    }
  }
  JS.message0 = message.join(' ');
  JS.args0 = args;
  // Generate inline/external switch.
  if (rootBlock.getFieldValue('INLINE') == 'EXT') {
    JS.inputsInline = false;
  } else if (rootBlock.getFieldValue('INLINE') == 'INT') {
    JS.inputsInline = true;
  }
  // Generate output, or next/previous connections.
  switch (rootBlock.getFieldValue('CONNECTIONS')) {
    case 'LEFT':
      JS.output = JSON.parse(
          Bdf.Factory.getOptTypesFrom_(rootBlock, 'OUTPUTTYPE') || 'null');
      break;
    case 'BOTH':
      JS.previousStatement =
          JSON.parse(
              Bdf.Factory.getOptTypesFrom_(rootBlock, 'TOPTYPE') || 'null');
      JS.nextStatement =
          JSON.parse(
              Bdf.Factory.getOptTypesFrom_(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
    case 'TOP':
      JS.previousStatement =
          JSON.parse(
              Bdf.Factory.getOptTypesFrom_(rootBlock, 'TOPTYPE') || 'null');
      break;
    case 'BOTTOM':
      JS.nextStatement =
          JSON.parse(
              Bdf.Factory.getOptTypesFrom_(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
  }
  // Generate colour.
  var colourBlock = rootBlock.getInputTargetBlock('COLOUR');
  if (colourBlock && !colourBlock.disabled) {
    var hue = parseInt(colourBlock.getFieldValue('HUE'), 10);
    JS.colour = hue;
  }
  JS.tooltip = '';
  JS.helpUrl = 'http://www.example.com/';
  return JSON.stringify(JS, null, '  ');
};

/**
 * Update the language code as JavaScript.
 * @return {string} Generated language code.
 */
Bdf.Factory.formatJavaScript = function() {
  var rootBlock = Bdf.Factory.getRootBlock_();
  var code = [];
  code.push("Blockly.Blocks['" + Bdf.Factory.getBlockName_() + "'] = {");
  code.push('  init: function() {');
  // Generate inputs.
  var TYPES = {'input_value': 'appendValueInput',
               'input_statement': 'appendStatementInput',
               'input_dummy': 'appendDummyInput'};
  var contentsBlock = rootBlock.getInputTargetBlock('INPUTS');
  while (contentsBlock) {
    if (!contentsBlock.disabled && !contentsBlock.getInheritedDisabled()) {
      var name = '';
      // Dummy inputs don't have names.  Other inputs do.
      if (contentsBlock.type != 'input_dummy') {
        name = Bdf.Factory.escapeString_(
            contentsBlock.getFieldValue('INPUTNAME'));
      }
      code.push('    this.' + TYPES[contentsBlock.type] + '(' + name + ')');
      var check = Bdf.Factory.getOptTypesFrom_(contentsBlock, 'TYPE');
      if (check) {
        code.push('        .setCheck(' + check + ')');
      }
      var align = contentsBlock.getFieldValue('ALIGN');
      if (align != 'LEFT') {
        code.push('        .setAlign(Blockly.ALIGN_' + align + ')');
      }
      var fields = Bdf.Factory.getFieldsJs_(
          contentsBlock.getInputTargetBlock('FIELDS'));
      for (var i = 0; i < fields.length; i++) {
        code.push('        .appendField(' + fields[i] + ')');
      }
      // Add semicolon to last line to finish the statement.
      code[code.length - 1] += ';';
    }
    contentsBlock = contentsBlock.nextConnection &&
        contentsBlock.nextConnection.targetBlock();
  }
  // Generate inline/external switch.
  if (rootBlock.getFieldValue('INLINE') == 'EXT') {
    code.push('    this.setInputsInline(false);');
  } else if (rootBlock.getFieldValue('INLINE') == 'INT') {
    code.push('    this.setInputsInline(true);');
  }
  // Generate output, or next/previous connections.
  switch (rootBlock.getFieldValue('CONNECTIONS')) {
    case 'LEFT':
      code.push(Bdf.Factory.connectionLineJs_('setOutput', 'OUTPUTTYPE'));
      break;
    case 'BOTH':
      code.push(Bdf.Factory.connectionLineJs_(
          'setPreviousStatement', 'TOPTYPE'));
      code.push(Bdf.Factory.connectionLineJs_(
          'setNextStatement', 'BOTTOMTYPE'));
      break;
    case 'TOP':
      code.push(Bdf.Factory.connectionLineJs_(
          'setPreviousStatement', 'TOPTYPE'));
      break;
    case 'BOTTOM':
      code.push(Bdf.Factory.connectionLineJs_(
          'setNextStatement', 'BOTTOMTYPE'));
      break;
  }
  // Generate colour.
  var colourBlock = rootBlock.getInputTargetBlock('COLOUR');
  if (colourBlock && !colourBlock.disabled) {
    var hue = parseInt(colourBlock.getFieldValue('HUE'), 10);
    code.push('    this.setColour(' + hue + ');');
  }
  code.push("    this.setTooltip('');");
  code.push("    this.setHelpUrl('http://www.example.com/');");
  code.push('  }');
  code.push('};');
  return code.join('\n');
};

/**
 * Clears the workspace and loads the input XML into the Factory workspace.
 * @param {Element} XML DOM to load into the workspace
 */
Bdf.Factory.loadXml = function(xmlDom) { 
  Bdf.Factory.workspace.clear();
  Blockly.Xml.domToWorkspace(Bdf.Factory.workspace, xmlDom);
};

/**
 * Returns the XML for the Factory workspace blocks.
 * @return {Element} XML DOM from the workspace blocks.
 */
Bdf.Factory.getXml = function(xmlDom) {
  return Blockly.Xml.workspaceToDom(Bdf.Factory.workspace);
};

/**
 * Returns the XML for the Factory workspace blocks.
 * @return {string} XML of the workspace blocks in string format.
 */
Bdf.Factory.getXmlString = function() {
  return Blockly.Xml.domToText(
      Blockly.Xml.workspaceToDom(Bdf.Factory.workspace));
};

/**
 * Create JS code required to create a top, bottom, or value connection.
 * @param {string} functionName JavaScript function name.
 * @param {string} typeName Name of type input.
 * @return {string} Line of JavaScript code to create connection.
 * @private
 */
Bdf.Factory.connectionLineJs_ = function(functionName, typeName) {
  var type = Bdf.Factory.getOptTypesFrom_(
      Bdf.Factory.getRootBlock_(), typeName);
  if (type) {
    type = ', ' + type;
  } else {
    type = '';
  }
  return '    this.' + functionName + '(true' + type + ');';
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array.<string>} Field strings.
 * @private
 */
Bdf.Factory.getFieldsJs_ = function(block) {
  var fields = [];
  while (block) {
    if (!block.disabled && !block.getInheritedDisabled()) {
      switch (block.type) {
        case 'field_static':
          // Result: 'hello'
          fields.push(Bdf.Factory.escapeString_(block.getFieldValue('TEXT')));
          break;
        case 'field_input':
          // Result: new Blockly.FieldTextInput('Hello'), 'GREET'
          fields.push('new Blockly.FieldTextInput(' +
              Bdf.Factory.escapeString_(block.getFieldValue('TEXT')) + '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_angle':
          // Result: new Blockly.FieldAngle(90), 'ANGLE'
          fields.push('new Blockly.FieldAngle(' +
              Bdf.Factory.escapeString_(block.getFieldValue('ANGLE')) + '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_checkbox':
          // Result: new Blockly.FieldCheckbox('TRUE'), 'CHECK'
          fields.push('new Blockly.FieldCheckbox(' +
              Bdf.Factory.escapeString_(block.getFieldValue('CHECKED')) +
              '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_colour':
          // Result: new Blockly.FieldColour('#ff0000'), 'COLOUR'
          fields.push('new Blockly.FieldColour(' +
              Bdf.Factory.escapeString_(block.getFieldValue('COLOUR')) + '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_date':
          // Result: new Blockly.FieldDate('2015-02-04'), 'DATE'
          fields.push('new Blockly.FieldDate(' +
              Bdf.Factory.escapeString_(block.getFieldValue('DATE')) + '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_variable':
          // Result: new Blockly.FieldVariable('item'), 'VAR'
          var varname = Bdf.Factory.escapeString_(
              block.getFieldValue('TEXT') || null);
          fields.push('new Blockly.FieldVariable(' + varname + '), ' +
              Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_dropdown':
          // Result:
          // new Blockly.FieldDropdown([['yes', '1'], ['no', '0']]), 'TOGGLE'
          var options = [];
          for (var i = 0; i < block.optionCount_; i++) {
            options[i] = '[' + Bdf.Factory.escapeString_(
                block.getFieldValue('USER' + i)) + ', ' +
                Bdf.Factory.escapeString_(block.getFieldValue('CPU' + i)) + ']';
          }
          if (options.length) {
            fields.push('new Blockly.FieldDropdown([' +
                options.join(', ') + ']), ' +
                Bdf.Factory.escapeString_(block.getFieldValue('FIELDNAME')));
          }
          break;
        case 'field_image':
          // Result: new Blockly.FieldImage('http://...', 80, 60)
          var src = Bdf.Factory.escapeString_(block.getFieldValue('SRC'));
          var width = Number(block.getFieldValue('WIDTH'));
          var height = Number(block.getFieldValue('HEIGHT'));
          var alt = Bdf.Factory.escapeString_(block.getFieldValue('ALT'));
          fields.push('new Blockly.FieldImage(' +
              src + ', ' + width + ', ' + height + ', ' + alt + ')');
          break;
      }
    }
    block = block.nextConnection && block.nextConnection.targetBlock();
  }
  return fields;
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array.<string|!Object>} Array of static text and field configs.
 * @private
 */
Bdf.Factory.getFieldsJson_ = function(block) {
  var fields = [];
  while (block) {
    if (!block.disabled && !block.getInheritedDisabled()) {
      switch (block.type) {
        case 'field_static':
          // Result: 'hello'
          fields.push(block.getFieldValue('TEXT'));
          break;
        case 'field_input':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            text: block.getFieldValue('TEXT')
          });
          break;
        case 'field_angle':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            angle: Number(block.getFieldValue('ANGLE'))
          });
          break;
        case 'field_checkbox':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            checked: block.getFieldValue('CHECKED') == 'TRUE'
          });
          break;
        case 'field_colour':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            colour: block.getFieldValue('COLOUR')
          });
          break;
        case 'field_date':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            date: block.getFieldValue('DATE')
          });
          break;
        case 'field_variable':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            variable: block.getFieldValue('TEXT') || null
          });
          break;
        case 'field_dropdown':
          var options = [];
          for (var i = 0; i < block.optionCount_; i++) {
            options[i] = [block.getFieldValue('USER' + i),
                block.getFieldValue('CPU' + i)];
          }
          if (options.length) {
            fields.push({
              type: block.type,
              name: block.getFieldValue('FIELDNAME'),
              options: options
            });
          }
          break;
        case 'field_image':
          fields.push({
            type: block.type,
            src: block.getFieldValue('SRC'),
            width: Number(block.getFieldValue('WIDTH')),
            height: Number(block.getFieldValue('HEIGHT')),
            alt: block.getFieldValue('ALT')
          });
          break;
      }
    }
    block = block.nextConnection && block.nextConnection.targetBlock();
  }
  return fields;
};

/**
 * Fetch the type(s) defined in the given input.
 * Format as a string for appending to the generated code.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {?string} String defining the types.
 * @private
 */
Bdf.Factory.getOptTypesFrom_ = function(block, name) {
  var types = Bdf.Factory.getTypesFrom_(block, name);
  if (types.length == 0) {
    return undefined;
  } else if (types.indexOf('null') != -1) {
    return 'null';
  } else if (types.length == 1) {
    return types[0];
  } else {
    return '[' + types.join(', ') + ']';
  }
};

/**
 * Fetch the type(s) defined in the given input.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {!Array.<string>} List of types.
 * @private
 */
Bdf.Factory.getTypesFrom_ = function(block, name) {
  var typeBlock = block.getInputTargetBlock(name);
  var types;
  if (!typeBlock || typeBlock.disabled) {
    types = [];
  } else if (typeBlock.type == 'type_other') {
    types = [Bdf.Factory.escapeString_(typeBlock.getFieldValue('TYPE'))];
  } else if (typeBlock.type == 'type_group') {
    types = [];
    for (var n = 0; n < typeBlock.typeCount_; n++) {
      types = types.concat(Bdf.Factory.getTypesFrom_(typeBlock, 'TYPE' + n));
    }
    // Remove duplicates.
    var hash = Object.create(null);
    for (var n = types.length - 1; n >= 0; n--) {
      if (hash[types[n]]) {
        types.splice(n, 1);
      }
      hash[types[n]] = true;
    }
  } else {
    types = [Bdf.Factory.escapeString_(typeBlock.valueType)];
  }
  return types;
};

/**
 * Create the uneditable container block that everything else attaches to.
 * @private
 */
Bdf.Factory.createRootBlock_ = function() {
  var rootBlock = Blockly.Block.obtain(Bdf.Factory.workspace, 'factory_base');
  rootBlock.initSvg();
  rootBlock.render();
  rootBlock.setMovable(false);
  rootBlock.setDeletable(false);
};

/**
 * Return the uneditable container block that everything else attaches to.
 * @return {Blockly.Block}
 * @private
 */
Bdf.Factory.getRootBlock_ = function() {
  var blocks = Bdf.Factory.workspace.getTopBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    if (block.type == 'factory_base') {
      return block;
    }
  }
  return null;
};

/**
 * Return the block name defined in the factory Root Block.
 * @return {!string} Name of the generated block.
 * @private
 */
Bdf.Factory.getBlockName_ = function() {
  var rootBlock = Bdf.Factory.getRootBlock_();
  if (!rootBlock) {
    return;
  }
  var blockType = rootBlock.getFieldValue('NAME').trim().toLowerCase();
  if (!blockType) {
    blockType = Bdf.UNNAMED;
  }
  return blockType.replace(/\W/g, '_').replace(/^(\d)/, '_\\1');
};

/**
 * Escape a string.
 * @param {string} string String to escape.
 * @return {string} Escaped string surrounded by quotes.
 * @private
 */
Bdf.Factory.escapeString_ = function(string) {
  return JSON.stringify(string);
};

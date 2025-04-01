/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

import classes from './Canvas.module.scss';
import highlightClasses from './CodeHighlight.module.scss';

function onError(error: Error) {
  console.error(error);
}

const THEME_CODEBLOCK = {
  codeHighlight: {
    atrule: highlightClasses.tokenAttr,
    attr: highlightClasses.tokenAttr,
    boolean: highlightClasses.tokenProperty,
    builtin: highlightClasses.tokenSelector,
    cdata: highlightClasses.tokenComment,
    char: highlightClasses.tokenSelector,
    class: highlightClasses.tokenFunction,
    'class-name': highlightClasses.tokenFunction,
    comment: highlightClasses.tokenComment,
    constant: highlightClasses.tokenProperty,
    deleted: highlightClasses.tokenProperty,
    doctype: highlightClasses.tokenComment,
    entity: highlightClasses.tokenOperator,
    function: highlightClasses.tokenFunction,
    important: highlightClasses.tokenVariable,
    inserted: highlightClasses.tokenSelector,
    keyword: highlightClasses.tokenAttr,
    namespace: highlightClasses.tokenVariable,
    number: highlightClasses.tokenProperty,
    operator: highlightClasses.tokenOperator,
    prolog: highlightClasses.tokenComment,
    doctyp: highlightClasses.tokenComment,
    property: highlightClasses.tokenProperty,
    punctuation: highlightClasses.tokenPunctuation,
    regex: highlightClasses.tokenVariable,
    selector: highlightClasses.tokenSelector,
    string: highlightClasses.tokenSelector,
    symbol: highlightClasses.tokenProperty,
    tag: highlightClasses.tokenVariable,
    url: highlightClasses.tokenOperator,
    variable: highlightClasses.tokenVariable,
    'attr-name': classes.attrName,
  },
};

export const CANVAS_CONFIG = {
  namespace: 'bee-canvas',
  onError,
  theme: {
    text: {
      bold: classes.textBold,
      italic: classes.textItalic,
    },
    ...THEME_CODEBLOCK,
  },
  nodes: [
    LinkNode,
    AutoLinkNode,
    ListNode,
    ListItemNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    HorizontalRuleNode,
    CodeNode,
    CodeHighlightNode,
    HeadingNode,
    LinkNode,
    ListNode,
    ListItemNode,
    QuoteNode,
  ],
};

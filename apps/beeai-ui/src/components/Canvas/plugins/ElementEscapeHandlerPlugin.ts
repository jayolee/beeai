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

import { useEffect } from 'react';
import type { ElementNode, TextNode } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
  $createTextNode,
  KEY_BACKSPACE_COMMAND,
  $isTextNode,
} from 'lexical';
import { $isListNode, $isListItemNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $isTableCellNode, $isTableNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getTargetNode } from '../utils';

export function ElementEscapeHandlerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => {
          //remove list style when backspacing from an empty list
          editor.update(() => {
            const selection = $getSelection();
            if (selection && $isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();

              // Whether the focus is inside of an empty list item
              if ($isListItemNode(anchorNode) && anchorNode.getTextContent().trim() === '') {
                const listNode = anchorNode.getParent();

                if ($isListNode(listNode)) {
                  const paragraphNode = $createParagraphNode();
                  anchorNode.remove();
                  listNode.insertAfter(paragraphNode);
                  paragraphNode.select();

                  return true;
                }
              }

              //remove empty table
              //TODO: remove entire table with the content from outsize
              const tableNode = anchorNode.getParent()?.getPreviousSibling();
              if (tableNode && !tableNode.getTextContent()) {
                tableNode.remove();
              }
            }
          });

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        () => {
          //remove current text-node level formatting when hitting right arrow
          //escape from table when hitting right arrow at the end of the table
          editor.update(() => {
            const selection = $getSelection();
            const addNewElement = (
              anchorNode: ElementNode | TextNode,
              elementCreator: (text?: string) => ElementNode | TextNode,
            ) => {
              const spanNode = elementCreator(' ');
              if ($isTextNode(spanNode)) spanNode.setFormat(0);
              anchorNode.insertAfter(spanNode);
              spanNode.select(0);
            };

            if ($isRangeSelection(selection) && selection.isCollapsed()) {
              const anchorNode = selection.anchor.getNode();
              const newPosition = anchorNode.getNextSibling();
              if (newPosition) return false;

              const cellNode = getTargetNode(anchorNode, $isTableCellNode);
              if (cellNode) {
                const cellNode = $isTableCellNode(anchorNode.getParent())
                  ? anchorNode.getParent()
                  : anchorNode.getParent()?.getParent();

                if (cellNode && cellNode.getNextSibling() === null) {
                  const table = getTargetNode(cellNode, $isTableNode);
                  if (table) addNewElement(table, $createParagraphNode);
                  return true;
                }
              }

              const format = anchorNode.getFormat();
              if (!!format || $isCodeNode(anchorNode)) {
                addNewElement(anchorNode, $createTextNode);
              }

              return true;
            }
          });
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}

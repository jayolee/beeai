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

import type { LexicalNode, RangeSelection } from 'lexical';
import { $getRoot, $isBlockElementNode, $isRootNode, createEditor, type LexicalEditor } from 'lexical';
import { MARKDOWN_TRANSFORMERS } from '../../utils';
import { $convertToMarkdownString } from '@lexical/markdown';
import { CANVAS_CONFIG } from '#components/Canvas/canvasConfig.ts';
import { $isCodeHighlightNode } from '@lexical/code';

export function getMarkdownContentUptoTarget(editor: LexicalEditor, key: string) {
  // Get the markdown content up to the selected node by deleting other nodes from the cloned editor
  const originalState = editor.getEditorState().clone();
  const tempEditor = createEditor(CANVAS_CONFIG);
  let markdown = '';

  tempEditor.update(() => {
    tempEditor.setEditorState(originalState);
  });

  tempEditor.update(() => {
    let shouldDelete = false;

    function traverseAndDelete(node: LexicalNode) {
      if (shouldDelete) {
        node.remove();
        return;
      }

      if (node.__key === key) {
        shouldDelete = true;
      }

      if ($isRootNode(node) || $isBlockElementNode(node)) node.getChildren().forEach((node) => traverseAndDelete(node));
    }

    traverseAndDelete($getRoot());
  });

  tempEditor.read(() => {
    markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
  });

  return markdown;
}

export function getSelectedMarkdownContent(editor: LexicalEditor, selection: RangeSelection) {
  // Get the markdown content of the selected node by deleting other nodes from the cloned editor, and find the seleceted portion using selection's anchor and focus offset
  let markdown = '';
  const selectedNodes = selection.getNodes();
  if (!selectedNodes?.length) return '';

  const [startNode, endNode] = [selectedNodes[0], selectedNodes.pop()];
  const [startKey, endKey] = [startNode.getKey(), endNode!.getKey()];
  const [startOffset, endOffset] = selection.isBackward()
    ? [selection.focus.offset, selection.anchor.offset]
    : [selection.anchor.offset, selection.focus.offset];
  const [prefixHandler, postfixHandler] = [
    startNode.getTextContent().slice(startOffset),
    endNode!.getTextContent().slice(0, endOffset),
  ];
  if (!startKey && !endKey) return '';

  const originalState = editor.getEditorState().clone();
  const tempEditor = createEditor(CANVAS_CONFIG);

  tempEditor.update(() => {
    tempEditor.setEditorState(originalState);
  });

  tempEditor.update(() => {
    //delete all nodes after the last selection
    let shouldDelete = false;
    function traverseAndDelete(node: LexicalNode) {
      if (shouldDelete) {
        node.remove();
        return;
      }

      if (node.__key === endKey) {
        shouldDelete = true;
      }

      if ($isRootNode(node) || $isBlockElementNode(node)) node.getChildren().forEach((node) => traverseAndDelete(node));
    }
    traverseAndDelete($getRoot());
  });

  tempEditor.update(() => {
    //delete all nodes after the last selection
    let shouldDelete = false;

    function traverseAndDeleteReverse(node: LexicalNode) {
      if (shouldDelete) {
        node.remove();
        return;
      }

      if (node.__key === startKey) {
        shouldDelete = true;
      }

      if ($isRootNode(node) || $isBlockElementNode(node))
        node
          .getChildren()
          .reverse()
          .forEach((node) => traverseAndDeleteReverse(node));
    }

    traverseAndDeleteReverse($getRoot());
  });

  tempEditor.read(() => {
    markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);

    markdown = prefixHandler + markdown.split(prefixHandler).slice(1).join(prefixHandler);
    if (startKey !== endKey)
      markdown = markdown.split(postfixHandler).slice(0, -1).join(postfixHandler) + postfixHandler;
    if ($isCodeHighlightNode(endNode) && markdown.slice(-4) === '\n```') markdown = markdown.slice(0, -4); //strip additional ``` in the end
  });

  return markdown;
}

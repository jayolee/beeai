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

import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import type { ElementNode } from 'lexical';
import { $createParagraphNode, $isBlockElementNode, $isTextNode, type LexicalNode, type TextFormatType } from 'lexical';
import { TABLETRANSFORMER } from './MarkdownTableTransformer';
import { $isCodeHighlightNode, $isCodeNode } from '@lexical/code';

export const MARKDOWN_TRANSFORMERS = [...TRANSFORMERS, TABLETRANSFORMER];
//list of formats in string
//There is no systemic way to get number mapping from the text
const createWhiteSpace = (length: number) => ' '.repeat(length);

const getWhiteSpaces = (content: string) => {
  const startTrimmed = content.trimStart().length;
  const endTrimmed = content.trimEnd().length;
  const contentLength = content.length;
  return [contentLength - startTrimmed, contentLength - endTrimmed];
};

export const applyMarkdownFormat = (node: LexicalNode) => {
  const formats: TextFormatType[] = ['bold', 'italic', 'code'];
  const content = node.getTextContent();

  const [spaceStart, spaceEnd] = getWhiteSpaces(content);
  const trimmed = content.trim();

  if ($isTextNode(node)) {
    if ($isCodeHighlightNode(node)) {
      return '```';
    }
    const appliedFormats = formats.filter((d: TextFormatType) => node.hasFormat(d as TextFormatType));
    const markdownSyntax = appliedFormats
      .map((d) => {
        switch (d) {
          case 'bold':
            return `**`;
          case 'italic':
            return `*`;
          case 'code':
            return '`';
          default:
            return '';
        }
      })
      .join('');
    return `${createWhiteSpace(spaceStart)}${markdownSyntax}${trimmed}${markdownSyntax}${createWhiteSpace(spaceEnd)}`;
  }

  return node.getTextContent();
};

export function getMarkdownContent(nodes: LexicalNode[]) {
  if (!nodes.length) return '';
  if (!nodes.find((node) => $isBlockElementNode(node))) {
    //no block level node == all text nodes that cannot use markdown parser

    if (!nodes.find((node) => !$isCodeHighlightNode(node))) {
      // selection within a code nodes
      const parentNode = nodes[0].getParent();
      const prefix = $isCodeNode(parentNode) ? parentNode.getLanguage() + '\n' : '';

      const tempRoot = $createParagraphNode();
      nodes.forEach((node) => tempRoot.append(node));

      const markdown = '```' + prefix + tempRoot.getTextContent();
      return markdown;
    }
    const content = nodes.map((node) => applyMarkdownFormat(node));
    return content.join('');
  } else {
    const tempRoot = $createParagraphNode();
    nodes.forEach((node) => tempRoot.append(node));
    const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS, tempRoot);
    return markdown;
  }
}

export function getTargetNode(node: LexicalNode, nodeChecker: (node: LexicalNode) => boolean): null | ElementNode {
  const parent = node.getParent();
  return parent === null ? null : nodeChecker(parent) ? parent : getTargetNode(parent, nodeChecker);
}

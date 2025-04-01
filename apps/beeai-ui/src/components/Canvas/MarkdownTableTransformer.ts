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

import { $convertFromMarkdownString, $convertToMarkdownString, type ElementTransformer } from '@lexical/markdown';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $isLineBreakNode, $isParagraphNode, type LexicalNode } from 'lexical';
import { getMarkdownContent, MARKDOWN_TRANSFORMERS } from './utils';

const TABLE_ROW_REG_EXP = /^(?:\|)\s*(.+?)\s*(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\|\s?:?-*:?\s?)+\|\s?$/;

export const TABLETRANSFORMER: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const rows = node.getChildren();
    const rowMarkdown: string[] = rows.map((row) => {
      if (!$isTableRowNode(row)) {
        return '';
      }

      const cells = row.getChildren();
      const cellMarkdown = cells.map((cell) => {
        if (!$isTableCellNode(cell)) {
          return '';
        }
        const content = $convertToMarkdownString(MARKDOWN_TRANSFORMERS, cell);
        return content;
      });

      const content = '| ' + cellMarkdown.join(' | ') + ' |';
      if (cells.find((cell) => $isTableCellNode(cell) && cell.__headerState === TableCellHeaderStates.ROW)) {
        return content + '\n| ' + cells.map(() => '--- |').join('');
      }
      return content;
    });
    return rowMarkdown.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _childrenNodes, match) => {
    //if divider is provided
    if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
      const table = parentNode.getPreviousSibling();
      if (table) {
        handleDivider(table);
        parentNode.remove();
        return;
      }
    }

    const matchCells = mapToTableCells(match[0]);

    if (matchCells == null) {
      return;
    }

    const previousRows = parentNode.getPreviousSibling();
    const reversedRows = [matchCells];
    if (previousRows) reversedRows.push(...updatePrevSibling(previousRows));

    const table = $createTableNode();
    const maxRowLen = Math.max(...reversedRows.map((row) => row.length));

    for (const row of reversedRows.reverse()) {
      const tableRow = $createTableRowNode();

      for (let i = 0; i < maxRowLen; i++) {
        tableRow.append(i < row.length ? row[i] : createTableCell(''));
      }

      table.append(tableRow);
    }

    if (_childrenNodes?.length) {
      const [nextSiblingsRows, hasHeader] = updateSiblingChildren(_childrenNodes);
      if (hasHeader) {
        handleDivider(table);
      }
      for (const row of nextSiblingsRows) {
        const tableRow = $createTableRowNode();

        for (let i = 0; i < maxRowLen; i++) {
          tableRow.append(i < row.length ? row[i] : createTableCell(''));
        }

        table.append(tableRow);
      }
    }

    const previousSibling = parentNode.getPreviousSibling();

    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxRowLen) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};

const updatePrevSibling = (node: LexicalNode): TableCellNode[][] => {
  const nodes = [];
  if (!$isParagraphNode(node)) {
    return [];
  }

  const firstChild = node.getFirstChild();

  if (!firstChild) {
    return [];
  }

  const cells = mapToTableCells(getMarkdownContent([firstChild]));
  if (cells == null) {
    return [];
  }

  node.remove();
  nodes.push(cells);

  const previousSibling = node.getPreviousSibling();
  if (previousSibling) nodes.push(...updatePrevSibling(previousSibling));
  return nodes;
};

const updateSiblingChildren = (nodes: LexicalNode[]): [TableCellNode[][], boolean] => {
  // transform the remaining text with new lines from the same paragraph node
  const tableRows: TableCellNode[][] = [];

  let line = [];
  let nodesIdxToDelete: null | number = null;
  let hasHeader = false;
  for (const nodeIdx in nodes) {
    const node = nodes[nodeIdx];

    if ($isLineBreakNode(node)) {
      if (line?.length) {
        if (!tableRows.length && line.join('')?.trim().match(TABLE_ROW_DIVIDER_REG_EXP)) {
          hasHeader = true;
          line = [];
          continue;
        }

        const cells = mapToTableCells(line.join(''));
        if (cells === null) break;

        line = [];
        nodesIdxToDelete = Number(nodeIdx);
        tableRows.push(cells);
        continue;
      }
    }

    const content = getMarkdownContent([node]);
    line.push(content);
  }
  if (line?.length) {
    const cells = mapToTableCells(line.join(''));
    if (cells !== null) {
      tableRows.push(cells);
      nodesIdxToDelete = nodes.length;
    }
  }
  if (nodesIdxToDelete !== null) {
    for (let i = 0; i < nodesIdxToDelete; i++) {
      if (nodes[i]) nodes[i].remove();
    }
  }
  return [tableRows, hasHeader];
};

function handleDivider(table: LexicalNode) {
  if (!table || !$isTableNode(table)) {
    return;
  }

  const rows = table.getChildren();
  const lastRow = rows[rows.length - 1];
  if (!lastRow || !$isTableRowNode(lastRow)) {
    return;
  }

  lastRow.getChildren().forEach((cell) => {
    if (!$isTableCellNode(cell)) {
      return;
    }
    cell.toggleHeaderStyle(TableCellHeaderStates.ROW);
  });

  return;
}

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const createTableCell = (textContent: string): TableCellNode => {
  const cell = $createTableCellNode();
  $convertFromMarkdownString(textContent, MARKDOWN_TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split('|').map((text) => createTableCell(text.trim()));
};

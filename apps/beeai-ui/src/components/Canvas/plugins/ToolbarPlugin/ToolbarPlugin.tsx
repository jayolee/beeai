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

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button, IconButton } from '@carbon/react';
import { TextBold, TextItalic } from '@carbon/icons-react';

import type { RangeSelection, TextFormatType } from 'lexical';
import { $getSelection, $isRangeSelection, $setSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';

import BeeOutline from '#svgs/BeeOutline.svg';
import classes from './ToolbarPlugin.module.scss';
import { BeeQuestioningInput } from './BeeQuestioningInput';
import { getMarkdownContentUptoTarget, getSelectedMarkdownContent } from './utils';

export function ToolbarPlugin({ sendMessage }: { sendMessage: ({ input }: { input: string }) => void }) {
  const [editor] = useLexicalComposerContext();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ [key: string]: number | null }>({ top: 0, left: 0, right: null });

  const [isQuestioning, setIsQuestioning] = useState<boolean>(false);

  const savedSelection = useRef<RangeSelection | null>(null);
  const selectionCopy = useRef<RangeSelection | null>(null);
  const selectionDebounce = useRef<ReturnType<typeof setTimeout>>(null);

  const selectionState = useMemo(
    () => ({
      container: (() => {
        const container = document.createElement('div');
        container.classList.add(classes.highlight);
        return container;
      })(),
      elements: [],
    }),
    [],
  );

  const getToolbarPosition = useCallback(() => {
    const style: { [key: string]: string } = {
      top: `${(position.top || 0) - (isQuestioning ? 20 : 0)}px`,
      display: isVisible ? 'flex' : 'none',
    };
    if (position.right !== null) style.right = `${position.right}px`;
    else style.left = `${position.left}px`;

    return style;
  }, [position, isVisible, isQuestioning]);

  const $updateToolbar = useCallback(() => {
    setIsQuestioning(false);
    const selection = window.getSelection();
    if (selectionDebounce.current) clearTimeout(selectionDebounce.current);

    if (selection && !selection.isCollapsed) {
      //if text selected, display and position toolbar
      const range = selection.getRangeAt(0);

      selectionDebounce.current = setTimeout(() => {
        if (toolbarRef.current) {
          const toolbarHeight = 32;

          // For multi-line selections, position at the start of the selection to avoid positioned in the middle of empty line
          const startContainer = range.startContainer;
          const startOffset = range.startOffset;
          const startRange = document.createRange();
          startRange.setStart(startContainer, startOffset);
          startRange.setEnd(startContainer, startOffset);

          const startRect = startRange.getBoundingClientRect();
          const left = startRect.left + startRect.width / 2;
          const isAlignLeft = left < document.body.clientWidth - 381;

          setPosition({
            top: startRect.top - toolbarHeight - 8, // 8px gap
            left: isAlignLeft ? left : null,
            right: isAlignLeft ? null : Math.max(document.body.clientWidth - (left + 214), 16),
          });
          setIsVisible(true);
        }
      }, 300);
    } else {
      selectionDebounce.current = null;
      setIsVisible(false);
    }
  }, [setIsVisible]);

  const cloneSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        savedSelection.current = selection;
      } else {
        savedSelection.current = null;
      }
    });
  };

  const handleTextFormatting = (kind: TextFormatType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.toggleFormat(kind);
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, kind);
      }
    });
  };

  const updateHighlightLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionCopy.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
        if (range !== null) {
          const { left, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft = selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: HTMLSpanElement[] = selectionState.elements;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            const element: HTMLSpanElement = elements[i] ?? document.createElement('span');
            if (elements[i] === undefined) {
              elements[i] = element;
              container.appendChild(element);
            }

            element.style.cssText = `position:absolute;top:${
              selectionRect.top + (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${selectionRect.width}px`;
          }
        }
      }
    });
  }, [editor, selectionState]);

  const removeHighlight = useCallback(() => {
    selectionCopy.current = null;

    const { container } = selectionState;
    const elements: Array<HTMLSpanElement> = selectionState.elements;
    const elementsLength = elements.length;

    for (let i = elementsLength - 1; i >= 0; i--) {
      const elem = elements[i];
      container.removeChild(elem);
      elements.pop();
    }
  }, [selectionState]);

  const send = (input: string) => {
    const selectionClone = selectionCopy.current;

    if (selectionClone) {
      editor.update(() => {
        const inputQuoteInfo = {
          selectedTextOffset: 0,
          selectedTextLength: 0,
        };
        const oldselection = selectionClone.clone();
        if (oldselection) $setSelection(oldselection);

        const selection = $getSelection();
        const selectedNodes = selection?.getNodes();

        if (!selection || !selectedNodes) return reset();

        if ($isRangeSelection(selection)) {
          const startNode = selectedNodes[0];
          const startKey = startNode.getKey();
          const startNodeSelectedContent = startNode
            .getTextContent()
            .slice(selection.isBackward() ? selection.focus.offset : selection.anchor.offset);

          const selectedText = getSelectedMarkdownContent(editor, selection);
          inputQuoteInfo.selectedTextLength = selectedText.length;

          const prevText = getMarkdownContentUptoTarget(editor, startKey);
          const prevTextWOSelected = prevText
            .split(startNodeSelectedContent)
            .slice(0, -1)
            .join(startNodeSelectedContent);
          inputQuoteInfo.selectedTextOffset = prevTextWOSelected.length;

          reset(); //update the artifact to the latest before sending it
          sendMessage({ input, ...inputQuoteInfo });
          reset();
        }
      });
    }
  };

  const reset = useCallback(() => {
    editor.blur();
    removeHighlight();
    setIsVisible(false);
    setIsQuestioning(false);
  }, [editor, removeHighlight, setIsVisible, setIsQuestioning]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        $updateToolbar();
      });
    });
  }, [editor, $updateToolbar]);

  useLayoutEffect(() => {
    updateHighlightLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateHighlightLocation]);

  return (
    <>
      {createPortal(
        <div className={classes.toolbar} ref={toolbarRef} style={getToolbarPosition()}>
          {isQuestioning ? (
            <BeeQuestioningInput send={send} cancel={reset} />
          ) : (
            <>
              <Button
                onClick={() => {
                  cloneSelection();
                  updateHighlightLocation();
                  setIsQuestioning(true);
                }}
                size="sm"
                renderIcon={BeeOutline}
                iconDescription="Ask Bee"
              >
                Ask Bee
              </Button>
              {FORMAT_ACTIONS.map((format) => (
                <Fragment key={`canvas-toolbar-${format.label}`}>
                  <IconButton
                    onClick={() => handleTextFormatting(format.label as TextFormatType)}
                    size="sm"
                    label={`Format ${format.label}`}
                  >
                    {format.icon}
                  </IconButton>
                </Fragment>
              ))}
              {/* Temporary until having overflow menu */}
              <div className={classes.spacing} />
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

const FORMAT_ACTIONS = [
  {
    label: 'bold',
    icon: <TextBold />,
  },
  {
    label: 'italic',
    icon: <TextItalic />,
  },
];

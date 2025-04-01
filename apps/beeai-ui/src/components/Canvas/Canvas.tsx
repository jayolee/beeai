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

import { memo } from 'react';
import { clsx } from 'clsx';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import { ToolbarPlugin } from './plugins/ToolbarPlugin/ToolbarPlugin';
import { CopyPlugin } from './plugins/CopyPlugin';
import { DefaultContentPlugin } from './plugins/DefaultContentPlugin';
import { OnChangePlugin } from './plugins/OnChangePlugin';
import { OnBlurPlugin } from './plugins/OnBlurPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { TabInsertPlugin } from './plugins/TabInsertPlugin';
import { ElementEscapeHandlerPlugin } from './plugins/ElementEscapeHandlerPlugin';

import { CANVAS_CONFIG } from './canvasConfig';

import classes from './Canvas.module.scss';
import { MARKDOWN_TRANSFORMERS } from './utils';

export const Canvas = memo(function Canvas({
  artifact,
  updateArtifact,
  sendMessage,
}: {
  artifact: string;
  updateArtifact: (newValue: string) => void;
  sendMessage: ({ input }: { input: string }) => void;
}) {
  //avoid one source of artifact causing UI glitches
  const artifactCopy = artifact;

  return (
    <div className={classes.canvasContainer}>
      <LexicalComposer initialConfig={CANVAS_CONFIG}>
        <RichTextPlugin
          contentEditable={<ContentEditable className={clsx(classes.container, 'canvas-container')} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ToolbarPlugin sendMessage={sendMessage} />
        <HistoryPlugin />
        <CodeHighlightPlugin />
        <ElementEscapeHandlerPlugin />
        <TabInsertPlugin />
        <CopyPlugin />
        <OnChangePlugin updateArtifact={updateArtifact} />
        <OnBlurPlugin updateArtifact={updateArtifact} />
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <DefaultContentPlugin content={artifactCopy} />
      </LexicalComposer>
    </div>
  );
});

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

import { useState } from 'react';
import { IconButton } from '@carbon/react';
import { Checkmark, Copy } from '@carbon/react/icons';
import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import classes from '../Canvas.module.scss';
import { MARKDOWN_TRANSFORMERS } from '../utils';

export function CopyPlugin() {
  const [editor] = useLexicalComposerContext();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (editor) {
      editor.read(() => {
        const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
        handleCopyClick(markdown);
      });
    }
  };

  const handleCopyClick = (snippet: string) => {
    navigator.clipboard.writeText(snippet);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className={classes.copyBtn}>
      <IconButton label="Copy" kind="ghost" size="md" onClick={copy} disabled={copied} align="bottom">
        {copied ? <Checkmark /> : <Copy />}
      </IconButton>
    </div>
  );
}

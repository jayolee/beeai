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

import { $convertToMarkdownString } from '@lexical/markdown';
import { OnChangePlugin as LexicalOnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import { useRef } from 'react';
import { MARKDOWN_TRANSFORMERS } from '../utils';

interface Props {
  updateArtifact: (newValue: string) => void;
}

export function OnChangePlugin({ updateArtifact }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (_editorState: EditorState, editor: LexicalEditor) => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = setTimeout(() => {
      editor.read(() => {
        const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
        updateArtifact(markdown);
      });
    }, 300);
  };
  return <LexicalOnChangePlugin onChange={handleChange} />;
}

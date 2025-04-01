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

import type { FormEvent, KeyboardEvent, FocusEvent } from 'react';
import { useRef } from 'react';
import classes from './ToolbarPlugin.module.scss';
import { IconButton, TextInput } from '@carbon/react';
import { Send } from '@carbon/react/icons';

interface Props {
  send: (input: string) => void;
  cancel: () => void;
}

export function BeeQuestioningInput({ send, cancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Escape') cancel();
  };

  return (
    <form
      className={classes.beeQuestionInput}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        const container = e.target;
        if (container) {
          const input = (container as HTMLElement).querySelector('#toolbar-bee-question-input');
          if (input) {
            send((input as HTMLInputElement).value);
            cancel();
          }
        }
      }}
      onBlur={(e: FocusEvent<HTMLFormElement>) => {
        if (e.relatedTarget?.getAttribute('type') !== 'submit') cancel();
      }}
      ref={formRef}
    >
      <TextInput
        labelText="Ask Bee"
        hideLabel
        placeholder="How do you want to change it?"
        id="toolbar-bee-question-input"
        autoFocus
        onKeyDown={handleChange}
      />
      <div className={classes.action}>
        <IconButton size="sm" type="submit" label="Submit">
          <Send />
        </IconButton>
      </div>
    </form>
  );
}

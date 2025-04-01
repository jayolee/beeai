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

import { useArtifact } from '../contexts/canvas';
import classes from './Canvas.module.scss';
import { Chat } from './Chat';
import { InteractiveView } from './InteractiveView';
import { SplitPanesView } from '#components/SplitPanesView/SplitPanesView.tsx';

export function Canvas() {
  const { selectedArtifactKey } = useArtifact();

  return (
    <div className={classes.root}>
      <SplitPanesView
        leftPane={<ChatHolder />}
        rightPane={<InteractiveView />}
        isSplit={!!selectedArtifactKey}
        spacing="md"
        noLeftScroll
      />
    </div>
  );
}

function ChatHolder() {
  return (
    <div className={classes.content}>
      <div className={classes.chatRoot}>
        <div className={classes.chatHolder}>
          <Chat />
        </div>
      </div>
    </div>
  );
}

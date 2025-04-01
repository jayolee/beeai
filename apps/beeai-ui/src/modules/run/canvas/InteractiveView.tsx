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

import { Canvas } from '#components/Canvas/Canvas.tsx';
import { useMemo } from 'react';
import { useArtifact, useChat } from '../contexts/canvas';
import classes from './InteractiveView.module.scss';

export function InteractiveView() {
  const { selectedArtifactKey, getArtifact, updateArtifact } = useArtifact();
  const { sendMessage } = useChat();
  const defaultValue = useMemo(
    () => (selectedArtifactKey ? getArtifact(selectedArtifactKey) : null),
    [selectedArtifactKey, getArtifact],
  );

  return (
    <div className={classes.root}>
      <div className={classes.canvasHolder}>
        <Canvas
          artifact={defaultValue?.artifact ?? ''}
          updateArtifact={(newValue: string) => {
            if (selectedArtifactKey) updateArtifact(selectedArtifactKey, newValue);
            //TODO err handling
          }}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}

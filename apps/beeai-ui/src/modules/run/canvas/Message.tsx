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

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';
import { Spinner } from '#components/Spinner/Spinner.tsx';
import clsx from 'clsx';
import { AgentIcon } from '../components/AgentIcon';
import { useArtifact, useChat } from '../contexts/canvas';
import classes from './Message.module.scss';
import type { ChatMessage, ClientMessage, AgentMessage } from './types';
import { UserIcon } from '../chat/UserIcon';
import { ArtifactThumnail } from './ArtifactThumbnail.tsx';
import { useMemo } from 'react';
import { LineClampText } from '#components/LineClampText/LineClampText.tsx';

interface Props {
  message: ChatMessage;
}

interface AgentMsgProps {
  message: AgentMessage;
}

interface ClientMsgProps {
  message: ClientMessage;
}

export function Message({ message }: Props) {
  const { agent } = useChat();

  const isUserMessage = message.role === 'user';

  return (
    <li className={clsx(classes.root, isUserMessage ? classes.user : classes.agent)}>
      <div className={classes.sender}>
        <div className={classes.senderIcon}>{isUserMessage ? <UserIcon /> : <AgentIcon />}</div>
        <div className={classes.senderName}>{isUserMessage ? 'User' : agent.name}</div>
      </div>

      <div className={classes.body}>
        {!isUserMessage && message.status === 'pending' && !message.content ? (
          <Spinner />
        ) : !isUserMessage && message.error && message.status === 'error' ? (
          <ErrorMessage title="Failed to generate a response message" subtitle={message.error.message} />
        ) : (
          <div className={classes.content}>
            {isUserMessage ? <ClientMessageContent message={message} /> : <AgentMessageContent message={message} />}
          </div>
        )}
      </div>
    </li>
  );
}

function ClientMessageContent({ message }: ClientMsgProps) {
  return (
    <>
      {!!message.quotedArtifact && (
        <LineClampText lines={3} className={classes.quotedArtifact}>
          {message.quotedArtifact.artifact}
        </LineClampText>
      )}
      {message.content || <span className={classes.empty}>Message has no content</span>}
    </>
  );
}

function AgentMessageContent({ message }: AgentMsgProps) {
  const { getArtifact, selectedArtifactKey, setSelectedArtifactKey } = useArtifact();

  const { hasArtifact } = message;
  const artifact = useMemo(
    () => (hasArtifact ? getArtifact(message.key) : null),
    [getArtifact, hasArtifact, message.key],
  );

  return (
    <>
      {message.content || <span className={classes.empty}>Message has no content</span>}
      {hasArtifact && artifact && (
        <button
          className={clsx(classes.thumbnailButton, selectedArtifactKey === message.key ? classes.selected : '')}
          onClick={() => {
            setSelectedArtifactKey(selectedArtifactKey === artifact.messageKey ? null : artifact.messageKey);
          }}
        >
          <ArtifactThumnail artifact={artifact.artifact} />
        </button>
      )}
    </>
  );
}

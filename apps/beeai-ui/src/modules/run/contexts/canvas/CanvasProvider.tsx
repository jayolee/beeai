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

import { useImmerWithGetter } from '#hooks/useImmerWithGetter.ts';
import type { Agent } from '#modules/agents/api/types.ts';
import { useRunAgent } from '#modules/run/api/mutations/useRunAgent.tsx';
import type { MessagesNotificationSchema, MessagesResult } from '#modules/run/api/types.ts';
import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { ArtifactContext, ChatContext, ChatMessagesContext } from './canvas-context';
import type {
  Artifact,
  AgentMessage,
  ChatMessage,
  SendMessageParams,
  ClientMessage,
  ArtifactMessageInput,
} from '#modules/run/canvas/types.ts';

interface Props {
  agent: Agent;
}

export function CanvasProvider({ agent, children }: PropsWithChildren<Props>) {
  const [messages, getMessages, setMessages] = useImmerWithGetter<ChatMessage[]>([]);
  const [selectedArtifactKey, getSelectedArtifactKey, setSelectedArtifactKey] = useImmerWithGetter<string | null>(null);
  const artifacts = useRef<Artifact[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateLastAgentMessage = useCallback(
    (updater: (message: AgentMessage) => void) => {
      setMessages((messages) => {
        const lastMessage = messages.at(-1);
        if (lastMessage?.role === 'assistant') {
          updater(lastMessage);
        }
      });
    },
    [setMessages],
  );

  const { runAgent, isPending } = useRunAgent<ArtifactMessageInput, MessagesNotificationSchema>({
    notifications: {
      handler: (notification) => {
        const text = String(notification.params.delta.messages.at(-1)?.content);
        updateLastAgentMessage((message) => {
          message.content += text;
        });
      },
    },
  });

  const getInputMessages = useCallback(() => {
    return getMessages()
      .slice(0, -1)
      .map(({ role, content }) => ({ role, content }));
  }, [getMessages]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    artifacts.current = [];
    setSelectedArtifactKey(null);
    handleCancel();
  }, [handleCancel, setMessages, setSelectedArtifactKey]);

  const updateArtifact = useCallback((key: string, artifact: string) => {
    const target = artifacts.current.find((artifact) => artifact.messageKey === key);
    if (target) {
      target.artifact = artifact;
    } // TODO error handling
  }, []);

  const getArtifact = useCallback((key: string) => {
    return artifacts.current?.find((artifact) => artifact.messageKey === key);
  }, []);

  const sendMessage = useCallback(
    async ({ input, config, selectedTextOffset, selectedTextLength }: SendMessageParams) => {
      const userMessage: ClientMessage = {
        key: uuid(),
        role: 'user',
        content: input,
      };

      const selectedArtifact = getSelectedArtifactKey();
      const latestArtifact = getArtifact(selectedArtifact || '');
      if (selectedTextOffset !== undefined && selectedTextLength !== undefined && selectedArtifact && latestArtifact) {
        userMessage.quotedArtifact = {
          messageKey: selectedArtifact,
          selectedTextLength,
          selectedTextOffset,
          artifact: latestArtifact.artifact.slice(selectedTextOffset, selectedTextOffset + selectedTextLength),
        };
      }

      const agentMessage: AgentMessage = {
        key: uuid(),
        role: 'assistant',
        content: '',
        status: 'pending',
      };

      setMessages((messages) => {
        messages.push({ ...userMessage, content: input });
        messages.push(agentMessage);
      });

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const input = {
          messages: getInputMessages(),
          artifact: latestArtifact?.artifact,
          selectedTextLength,
          selectedTextOffset,
          config,
        };

        const response = (await runAgent({
          agent,
          input: input,
          abortController,
        })) as MessagesResult;

        const artifact = response.output.artifact;

        updateLastAgentMessage((message) => {
          message.content = String(response.output.messages.at(-1)?.content);
          message.status = 'success';
          message.hasArtifact = !!artifact;
        });

        if (artifact) {
          const newArtifact: Artifact = {
            messageKey: agentMessage.key,
            artifact: artifact as string,
          };
          artifacts.current.push(newArtifact);
          setSelectedArtifactKey(() => newArtifact.messageKey);
        }
      } catch (error) {
        console.error(error);

        updateLastAgentMessage((message) => {
          message.error = error as Error;
          message.status = abortControllerRef.current?.signal.aborted ? 'aborted' : 'error';
        });
      }
    },
    [
      agent,
      getInputMessages,
      runAgent,
      setMessages,
      updateLastAgentMessage,
      getSelectedArtifactKey,
      setSelectedArtifactKey,
      getArtifact,
    ],
  );

  const contextValue = useMemo(
    () => ({
      agent,
      isPending,
      onCancel: handleCancel,
      getMessages,
      setMessages,
      onClear: handleClear,
      sendMessage,
    }),
    [agent, getMessages, handleCancel, handleClear, isPending, sendMessage, setMessages],
  );

  const artifactContextValue = useMemo(
    () => ({
      selectedArtifactKey,
      setSelectedArtifactKey,
      getSelectedArtifactKey,
      updateArtifact,
      getArtifact,
    }),
    [selectedArtifactKey, setSelectedArtifactKey, getSelectedArtifactKey, updateArtifact, getArtifact],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <ArtifactContext.Provider value={artifactContextValue}>
        <ChatMessagesContext.Provider value={messages}>{children}</ChatMessagesContext.Provider>
      </ArtifactContext.Provider>
    </ChatContext.Provider>
  );
}

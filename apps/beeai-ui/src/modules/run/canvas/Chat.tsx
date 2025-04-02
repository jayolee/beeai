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

import { ArrowDown } from '@carbon/icons-react';
import { IconButton } from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentHeader } from '../components/AgentHeader';
import { useChat, useChatMessages } from '../contexts/canvas';
import classes from './Chat.module.scss';
import { ChatInput } from './ChatInput';
import { Message } from './Message';

export function Chat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { agent, onClear } = useChat();
  const messages = useChatMessages();

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
    });

    setIsScrolled(false);
  }, []);

  useEffect(() => {
    const bottomElement = bottomRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { root: scrollRef.current },
    );

    if (bottomElement) {
      observer.observe(bottomElement);
    }

    return () => {
      if (bottomElement) {
        observer.unobserve(bottomElement);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom(); //scrolling for canvas questioning
  }, [messages.length, scrollToBottom]);

  return (
    <>
      <AgentHeader agent={agent} className={classes.header} onNewSessionClick={onClear} />

      <div className={classes.content} ref={scrollRef}>
        <div className={classes.scrollRef} ref={bottomRef} />

        <ol className={classes.messages} aria-label="messages">
          {messages.map((message) => (
            <Message key={message.key} message={message} />
          ))}
        </ol>
      </div>

      <div className={classes.bottom}>
        {isScrolled && (
          <IconButton
            label="Scroll to bottom"
            kind="secondary"
            size="sm"
            wrapperClasses={classes.toBottomButton}
            onClick={scrollToBottom}
            autoAlign
          >
            <ArrowDown />
          </IconButton>
        )}

        <ChatInput
          onMessageSubmit={() => {
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }}
        />
      </div>
    </>
  );
}

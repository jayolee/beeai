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

import { Send, StopOutlineFilled } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { memo, useCallback, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { InputBarFormHandle } from '../components/InputBar';
import { InputBar } from '../components/InputBar';
import { useChat } from '../contexts/canvas';

interface Props {
  onMessageSubmit?: () => void;
}

export const ChatInput = memo(function ChatInput({ onMessageSubmit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<InputBarFormHandle>(null);

  const { sendMessage, onCancel, isPending } = useChat();

  const form = useForm<ChatFormValues>({
    mode: 'onChange',
  });

  const {
    register,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const resetForm = useCallback(() => {
    formRef.current?.resetForm();
  }, []);

  const isPendingSubmission = isSubmitting;
  const inputValue = watch('input');

  const isSubmitDisabled = isPendingSubmission || isPending || !inputValue;

  return (
    <FormProvider {...form}>
      <div ref={containerRef}>
        <InputBar
          onSubmit={() => {
            handleSubmit(async ({ input }) => {
              onMessageSubmit?.();
              resetForm();

              await sendMessage({ input });
            })();
          }}
          isSubmitDisabled={isSubmitDisabled}
          formRef={formRef}
          inputProps={{
            placeholder: 'Ask a question…',
            ...register('input', { required: true }),
          }}
        >
          {!(isPending || isPendingSubmission) ? (
            <Button
              type="submit"
              renderIcon={Send}
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Send"
              disabled={isSubmitDisabled}
            />
          ) : (
            <Button
              renderIcon={StopOutlineFilled}
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Cancel"
              onClick={(e) => {
                onCancel();
                e.preventDefault();
              }}
            />
          )}
        </InputBar>
      </div>
    </FormProvider>
  );
});

export interface ChatFormValues {
  input: string;
  tools?: string[];
}

/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { createContext } from 'react';
import type { UseFieldArrayReturn } from 'react-hook-form';

import type { Agent } from '#modules/agents/api/types.ts';
import type { RunStats } from '#modules/runs/types.ts';

export const ComposeContext = createContext<ComposeContextValue | null>(null);

export enum ComposeStatus {
  Ready = 'ready',
  InProgress = 'in-progress',
  Completed = 'completed',
}
interface ComposeContextValue {
  result?: string;
  status: ComposeStatus;
  stepsFields: UseFieldArrayReturn<SequentialFormValues, 'steps'>;
  onSubmit: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export interface ComposeStep {
  agent: Agent;
  instruction: string;
  result?: string;
  isPending?: boolean;
  logs?: string[];
  stats?: RunStats;
}

export interface SequentialFormValues {
  steps: ComposeStep[];
}

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

import { Container } from '#components/layouts/Container.tsx';
import { MainContent } from '#components/layouts/MainContent.tsx';
import type { MainContentViewProps } from '#components/MainContentView/MainContentView.tsx';
import { useScrollbarWidth } from '#hooks/useScrollbarWidth.ts';
import { createScrollbarStyles } from '#utils/createScrollbarStyles.ts';
import { moderate02 } from '@carbon/motion';
import { AnimatePresence, motion } from 'framer-motion';
import type { PropsWithChildren, ReactNode } from 'react';
import classes from './SplitPanesView.module.scss';
import clsx from 'clsx';

interface Props {
  leftPane: ReactNode;
  rightPane: ReactNode;
  isSplit?: boolean;
  spacing?: MainContentViewProps['spacing'];
  noLeftScroll?: boolean;
}

export function SplitPanesView({ leftPane, rightPane, isSplit, spacing, noLeftScroll }: Props) {
  const { ref: leftPaneRef, scrollbarWidth } = useScrollbarWidth();

  return (
    <AnimatePresence mode="wait">
      {isSplit ? (
        <Wrapper key="split-view" className={classes.splitView} immediateExit>
          <div className={clsx(classes.leftPane, noLeftScroll ? classes.noScroll : '')} ref={leftPaneRef} {...createScrollbarStyles({ width: scrollbarWidth })}>
            <div className={classes.content}>{leftPane}</div>
          </div>

          <div className={classes.rightPane}>
            <div className={classes.content}>{rightPane}</div>
          </div>
        </Wrapper>
      ) : (
        <MainContent spacing={spacing}>
          <Wrapper key="simple-view" className={classes.simpleView}>
            <Container size="sm">{leftPane}</Container>
          </Wrapper>
        </MainContent>
      )}
    </AnimatePresence>
  );
}

interface WrapperProps {
  immediateExit?: boolean;
  className?: string;
}

function Wrapper({ immediateExit, className, children }: PropsWithChildren<WrapperProps>) {
  const duration = parseFloat(moderate02) / 1000;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: immediateExit ? 0 : duration } }}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
}

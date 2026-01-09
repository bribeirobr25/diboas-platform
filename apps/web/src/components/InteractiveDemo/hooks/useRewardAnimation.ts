/**
 * Reward Animation Hook
 *
 * Handles progressive reveal animation for the reward screen
 */

import { useState, useEffect } from 'react';
import { REWARD_ANIMATION_TIMINGS } from '../constants';
import type { DemoScreen } from '../types';

export function useRewardAnimation(currentScreen: DemoScreen) {
  const [rewardStep, setRewardStep] = useState(0);

  useEffect(() => {
    if (currentScreen === 'reward') {
      // Reset animation state
      setRewardStep(0);

      const timeouts: NodeJS.Timeout[] = [];

      REWARD_ANIMATION_TIMINGS.forEach((delay, index) => {
        const timeout = setTimeout(() => {
          setRewardStep(index + 1);
        }, delay);
        timeouts.push(timeout);
      });

      // Cleanup timeouts on screen change or unmount
      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      // Reset when leaving reward screen
      setRewardStep(0);
    }
  }, [currentScreen]);

  return { rewardStep };
}

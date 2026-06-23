/**
 * useFocusTrap DOM Behavior Tests
 *
 * Tests actual focus trapping behavior in a jsdom environment.
 * Validates WCAG 2.4.3 compliance: Tab cycling, Shift+Tab, autoFocus, returnFocus.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef, type RefObject } from 'react';
import { useFocusTrap } from '../useFocusTrap';

// Helper: render the hook with a real DOM container
function setupFocusTrap(
  options: {
    autoFocus?: boolean;
    returnFocus?: boolean;
    initialFocus?: string;
  } = {}
) {
  // Create DOM structure
  const container = document.createElement('div');
  const button1 = document.createElement('button');
  button1.textContent = 'First';
  const input = document.createElement('input');
  input.type = 'text';
  const button2 = document.createElement('button');
  button2.textContent = 'Last';

  container.appendChild(button1);
  container.appendChild(input);
  container.appendChild(button2);
  document.body.appendChild(container);

  // Render the hook
  const { result, rerender } = renderHook(
    ({ isActive }) => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref as RefObject<HTMLElement>, isActive, options);
      return ref;
    },
    { initialProps: { isActive: false } }
  );

  return { container, button1, input, button2, result, rerender };
}

// Mock requestAnimationFrame to execute synchronously
beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

describe('useFocusTrap DOM behavior', () => {
  describe('Tab key cycling', () => {
    it('should cycle focus from last element to first on Tab', () => {
      const { button1, button2, rerender } = setupFocusTrap();

      // Activate the trap
      rerender({ isActive: true });

      // Focus the last button
      button2.focus();
      expect(document.activeElement).toBe(button2);

      // Press Tab on last element → should wrap to first
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(button1);
    });

    it('should cycle focus from first element to last on Shift+Tab', () => {
      const { button1, button2, rerender } = setupFocusTrap();

      rerender({ isActive: true });

      // Focus the first button
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Press Shift+Tab on first element → should wrap to last
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(shiftTabEvent);

      expect(document.activeElement).toBe(button2);
    });

    it('should not interfere with non-Tab keys', () => {
      const { button1, rerender } = setupFocusTrap();

      rerender({ isActive: true });
      button1.focus();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      document.dispatchEvent(enterEvent);

      // Focus should not change
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('autoFocus', () => {
    it('should auto-focus first focusable element when activated', () => {
      const { button1, rerender } = setupFocusTrap({ autoFocus: true });

      rerender({ isActive: true });

      expect(document.activeElement).toBe(button1);
    });

    it('should not auto-focus when autoFocus is false', () => {
      const { button1, rerender } = setupFocusTrap({ autoFocus: false });

      // Focus body first
      document.body.focus();
      rerender({ isActive: true });

      expect(document.activeElement).not.toBe(button1);
    });
  });

  describe('returnFocus', () => {
    it('should return focus to previously active element when deactivated', () => {
      // Create an external button and focus it
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      document.body.appendChild(externalButton);
      externalButton.focus();

      expect(document.activeElement).toBe(externalButton);

      const { rerender } = setupFocusTrap({ returnFocus: true });

      // Activate trap
      rerender({ isActive: true });

      // Deactivate trap
      rerender({ isActive: false });

      expect(document.activeElement).toBe(externalButton);

      document.body.removeChild(externalButton);
    });

    it('should not return focus when returnFocus is false', () => {
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      document.body.appendChild(externalButton);
      externalButton.focus();

      const { rerender } = setupFocusTrap({ returnFocus: false });

      rerender({ isActive: true });
      rerender({ isActive: false });

      // Should NOT return to the external button
      // (focus stays wherever it was)
      expect(document.activeElement).not.toBe(externalButton);

      document.body.removeChild(externalButton);
    });
  });

  describe('initialFocus', () => {
    it('should focus element matching initialFocus selector', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      button.textContent = 'First';
      const specialInput = document.createElement('input');
      specialInput.id = 'special-input';
      specialInput.type = 'text';
      container.appendChild(button);
      container.appendChild(specialInput);
      document.body.appendChild(container);

      renderHook(
        ({ isActive }) => {
          const ref = useRef<HTMLElement>(container);
          useFocusTrap(ref as RefObject<HTMLElement>, isActive, {
            initialFocus: '#special-input',
          });
        },
        { initialProps: { isActive: true } }
      );

      expect(document.activeElement).toBe(specialInput);
    });

    it('should focus element matching initialFocus ref (A11Y-4 D-2)', () => {
      // The WaitingListModal email input has a useId()-generated id, so a static
      // selector matched nothing; a ref is resolved at focus time instead.
      const container = document.createElement('div');
      const button = document.createElement('button');
      button.textContent = 'First';
      const specialInput = document.createElement('input');
      specialInput.type = 'text';
      container.appendChild(button);
      container.appendChild(specialInput);
      document.body.appendChild(container);

      renderHook(
        ({ isActive }) => {
          const ref = useRef<HTMLElement>(container);
          const inputRef = useRef<HTMLElement>(specialInput);
          useFocusTrap(ref as RefObject<HTMLElement>, isActive, {
            initialFocus: inputRef,
          });
        },
        { initialProps: { isActive: true } }
      );

      expect(document.activeElement).toBe(specialInput);
    });
  });

  describe('disabled elements', () => {
    it('should skip disabled elements in focus cycle', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      button1.textContent = 'Active 1';
      const disabledButton = document.createElement('button');
      disabledButton.textContent = 'Disabled';
      disabledButton.disabled = true;
      const button2 = document.createElement('button');
      button2.textContent = 'Active 2';

      container.appendChild(button1);
      container.appendChild(disabledButton);
      container.appendChild(button2);
      document.body.appendChild(container);

      renderHook(
        ({ isActive }) => {
          const ref = useRef<HTMLElement>(container);
          useFocusTrap(ref as RefObject<HTMLElement>, isActive);
        },
        { initialProps: { isActive: true } }
      );

      // Focus last active button
      button2.focus();
      expect(document.activeElement).toBe(button2);

      // Tab → should wrap to button1, skipping disabled
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      );

      expect(document.activeElement).toBe(button1);
    });
  });

  describe('cleanup', () => {
    it('should remove keydown listener when deactivated', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const { rerender } = setupFocusTrap();

      rerender({ isActive: true });
      rerender({ isActive: false });

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

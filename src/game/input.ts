export type InputAction = 'left' | 'right' | 'up' | 'jump' | 'shoot' | 'special' | 'confirm';

export type Input = {
  isDown: (action: InputAction) => boolean;
  wasPressed: (action: InputAction) => boolean;
  endFrame: () => void;
};

const ACTION_BY_KEY_CODE: Record<string, InputAction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  Space: 'jump',
  KeyZ: 'shoot',
  KeyX: 'special',
  Enter: 'confirm',
};

export const createKeyboardInput = (target: Window): Input => {
  const heldActions = new Set<InputAction>();
  const pressedThisFrame = new Set<InputAction>();

  const onKeyDown = (event: KeyboardEvent) => {
    const action = ACTION_BY_KEY_CODE[event.code];
    if (!action) return;

    event.preventDefault();
    if (!heldActions.has(action)) pressedThisFrame.add(action);
    heldActions.add(action);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const action = ACTION_BY_KEY_CODE[event.code];
    if (!action) return;

    heldActions.delete(action);
  };

  const onBlur = () => heldActions.clear();

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return {
    isDown: (action) => heldActions.has(action),
    wasPressed: (action) => pressedThisFrame.has(action),
    endFrame: () => pressedThisFrame.clear(),
  };
};

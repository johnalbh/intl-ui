/**
 * UI state machine for usePhoneInput.
 *
 * This reducer only handles state that is internal to the hook —
 * things like dropdown visibility, focused index, and filter text.
 *
 * Value and country are NOT managed here: they use the
 * useControllableState helper so the parent component can control them
 * via props the same way it controls a native <input>.
 *
 * Keeping UI state in a reducer (instead of scattered useState calls)
 * makes the hook testable: a single pure function + one dispatch means
 * every state transition is explicit and easy to snapshot.
 */

export interface UiState {
  /** Whether the country dropdown is open. */
  isOpen: boolean;
  /** Index of the focused country in the visible list, or -1. */
  focusedIndex: number;
  /** Filter string used for the country search. */
  filter: string;
}

export const initialUiState: UiState = {
  isOpen: false,
  focusedIndex: -1,
  filter: '',
};

export type UiAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'SET_FOCUSED_INDEX'; index: number }
  | { type: 'MOVE_FOCUS'; direction: 'up' | 'down'; listLength: number }
  | { type: 'SET_FILTER'; filter: string }
  | { type: 'RESET_UI' };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'OPEN':
      return state.isOpen ? state : { ...state, isOpen: true };

    case 'CLOSE':
      // Closing clears focus and filter so reopening starts fresh.
      return state.isOpen || state.focusedIndex !== -1 || state.filter !== ''
        ? { ...initialUiState }
        : state;

    case 'TOGGLE':
      if (state.isOpen) {
        return { ...initialUiState };
      }
      return { ...state, isOpen: true };

    case 'SET_FOCUSED_INDEX':
      if (state.focusedIndex === action.index) return state;
      return { ...state, focusedIndex: action.index };

    case 'MOVE_FOCUS': {
      if (action.listLength === 0) {
        return state.focusedIndex === -1
          ? state
          : { ...state, focusedIndex: -1 };
      }
      const current = state.focusedIndex;
      let next: number;
      if (action.direction === 'down') {
        next = current < 0 ? 0 : (current + 1) % action.listLength;
      } else {
        next =
          current <= 0 ? action.listLength - 1 : current - 1;
      }
      return { ...state, focusedIndex: next, isOpen: true };
    }

    case 'SET_FILTER':
      if (state.filter === action.filter) return state;
      // Changing the filter always resets focus to the first item.
      return {
        ...state,
        filter: action.filter,
        focusedIndex: action.filter.length > 0 ? 0 : -1,
      };

    case 'RESET_UI':
      return initialUiState;

    default: {
      // Exhaustiveness check: if a new action is added to UiAction but
      // not handled above, TypeScript flags it at compile time.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

import { useUrlState } from './useUrlState';

export type ChatStateOptions = {
  currentSessionId?: string | null;
  isCodingQuestion?: boolean;
  isNoteQuestion?: boolean;
  selectedView?: 'initial' | 'chat' | 'grid';
};

const defaultChatState: ChatStateOptions = {
  currentSessionId: null,
  isCodingQuestion: false,
  isNoteQuestion: false,
  selectedView: 'initial',
};

/**
 * A hook for managing chat state in the URL
 * @param initialState - Optional overrides for the default chat state values
 * @returns A tuple containing the current chat state and a setter function
 */
export function useChatState(
  initialState: Partial<ChatStateOptions> = {}
): [ChatStateOptions, (state: Partial<ChatStateOptions>) => void] {
  const mergedDefaults = { ...defaultChatState, ...initialState };
  
  const [chatState, setChatStateRaw] = useUrlState<ChatStateOptions>({
    key: 'chat',
    defaultValue: mergedDefaults,
  });

  // Wrapper to allow partial updates
  const setChatState = (newState: Partial<ChatStateOptions>) => {
    setChatStateRaw({ ...chatState, ...newState });
  };

  return [chatState, setChatState];
} 
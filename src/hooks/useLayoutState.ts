import { useUrlState } from './useUrlState';

export type LayoutOptions = {
  sidebarOpen?: boolean;
  filesExpanded?: boolean;
  notesExpanded?: boolean;
  selectedView?: 'chat' | 'notes' | 'files' | 'code';
  selectedNoteId?: string | null;
  panelSizes?: {
    sidebar?: number;
    main?: number;
  };
};

const defaultLayout: LayoutOptions = {
  sidebarOpen: true,
  filesExpanded: false,
  notesExpanded: true,
  selectedView: 'chat',
  selectedNoteId: null,
  panelSizes: {
    sidebar: 250,
    main: 700,
  },
};

/**
 * A hook for managing UI layout state in the URL
 * @param initialLayout - Optional overrides for the default layout values
 * @returns A tuple containing the current layout and a setter function
 */
export function useLayoutState(
  initialLayout: Partial<LayoutOptions> = {}
): [LayoutOptions, (layout: Partial<LayoutOptions>) => void] {
  const mergedDefaults = { ...defaultLayout, ...initialLayout };
  
  const [layout, setLayoutRaw] = useUrlState<LayoutOptions>({
    key: 'layout',
    defaultValue: mergedDefaults,
  });

  // Wrapper to allow partial updates
  const setLayout = (newLayout: Partial<LayoutOptions>) => {
    setLayoutRaw({ ...layout, ...newLayout });
  };

  return [layout, setLayout];
} 
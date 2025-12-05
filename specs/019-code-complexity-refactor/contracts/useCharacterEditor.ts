/**
 * useCharacterEditor Hook Contract
 *
 * Consolidated character editing state management.
 * Replaces 6 separate useState calls in character detail page.
 */

// Input: Character data to initialize editor
interface UseCharacterEditorInput {
  character: Character | null;
  isLoading: boolean;
}

// Output: Editor state and controls
interface UseCharacterEditorReturn {
  // State
  state: CharacterEditorState;
  hasUnsavedChanges: boolean;

  // Setters (consolidated)
  setName: (name: string) => void;
  setStory: (story: string) => void;
  setCoreStats: (stats: Partial<CoreStats>) => void;
  setDerivedStats: (stats: Partial<DerivedStats>) => void;
  setLevelExp: (data: Partial<LevelExperience>) => void;

  // Actions
  reset: () => void;
  markSaved: () => void;
}

// State shape
interface CharacterEditorState {
  name: string;
  story: string;
  coreStats: CoreStats;
  derivedStats: DerivedStats;
  levelExp: LevelExperience;
}

interface CoreStats {
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
}

interface DerivedStats {
  hp: number | null;
  max_hp: number | null;
  ac: number | null;
  speed: number | null;
}

interface LevelExperience {
  level: number | null;
  experience: number | null;
}

// Usage example:
// const { state, hasUnsavedChanges, setName, setCoreStats, reset } = useCharacterEditor({ character, isLoading });

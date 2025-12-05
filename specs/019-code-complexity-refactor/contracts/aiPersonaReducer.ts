/**
 * AI Persona Editor Reducer Contract
 *
 * Replaces 9 individual setter functions with a single reducer.
 * Used with useReducer in useAIPersonaEditor hook.
 */

import type { AICharacter, StyleConfig, ExampleMessage } from '@/types/eliza';

// State shape (unchanged from current implementation)
interface AIPersonaEditorState {
  bio: string[];
  lore: string[];
  topics: string[];
  adjectives: string[];
  style: StyleConfig;
  exampleMessages: ExampleMessage[];
  postExamples: string[];
  systemPrompt: string;
  knowledgeIds: string[];
}

// Action types
type AIPersonaEditorAction =
  | { type: 'SET_BIO'; payload: string[] }
  | { type: 'SET_LORE'; payload: string[] }
  | { type: 'SET_TOPICS'; payload: string[] }
  | { type: 'SET_ADJECTIVES'; payload: string[] }
  | { type: 'SET_STYLE'; payload: StyleConfig }
  | { type: 'SET_EXAMPLE_MESSAGES'; payload: ExampleMessage[] }
  | { type: 'SET_POST_EXAMPLES'; payload: string[] }
  | { type: 'SET_SYSTEM_PROMPT'; payload: string }
  | { type: 'SET_KNOWLEDGE_IDS'; payload: string[] }
  | { type: 'SET_FIELD'; payload: { field: keyof AIPersonaEditorState; value: any } }
  | { type: 'RESET'; payload?: AICharacter | null }
  | { type: 'LOAD_DRAFT'; payload: Partial<AIPersonaEditorState> };

// Reducer function
function aiPersonaEditorReducer(
  state: AIPersonaEditorState,
  action: AIPersonaEditorAction
): AIPersonaEditorState {
  switch (action.type) {
    case 'SET_BIO':
      return { ...state, bio: action.payload };
    case 'SET_LORE':
      return { ...state, lore: action.payload };
    case 'SET_TOPICS':
      return { ...state, topics: action.payload };
    case 'SET_ADJECTIVES':
      return { ...state, adjectives: action.payload };
    case 'SET_STYLE':
      return { ...state, style: action.payload };
    case 'SET_EXAMPLE_MESSAGES':
      return { ...state, exampleMessages: action.payload };
    case 'SET_POST_EXAMPLES':
      return { ...state, postExamples: action.payload };
    case 'SET_SYSTEM_PROMPT':
      return { ...state, systemPrompt: action.payload };
    case 'SET_KNOWLEDGE_IDS':
      return { ...state, knowledgeIds: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'RESET':
      return initializeState(action.payload);
    case 'LOAD_DRAFT':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Helper to initialize state from character
function initializeState(character?: AICharacter | null): AIPersonaEditorState {
  if (!character) {
    return {
      bio: [''],
      lore: [],
      topics: [],
      adjectives: [],
      style: {},
      exampleMessages: [],
      postExamples: [],
      systemPrompt: '',
      knowledgeIds: [],
    };
  }
  return {
    bio: character.bio?.length ? character.bio : [''],
    lore: character.lore || [],
    topics: character.topics || [],
    adjectives: character.adjectives || [],
    style: character.style || {},
    exampleMessages: character.exampleMessages || [],
    postExamples: character.postExamples || [],
    systemPrompt: character.systemPrompt || '',
    knowledgeIds: character.knowledge?.map((k) => k.id) || [],
  };
}

// Usage example:
// const [state, dispatch] = useReducer(aiPersonaEditorReducer, character, initializeState);
//
// // Instead of: setBio(newBio)
// dispatch({ type: 'SET_BIO', payload: newBio });
//
// // Or using generic SET_FIELD:
// dispatch({ type: 'SET_FIELD', payload: { field: 'bio', value: newBio } });

import type { CreateCharacterInput } from '../../types/character.js';
import { FIELD_LIMITS } from '../../characters/validation.js';
export interface CreateCharacterFormValues {
    name: string;
    backstory: string;
    systemPrompt?: string;
    bio?: string[];
    lore?: string[];
    topics?: string[];
    adjectives?: string[];
    postExamples?: string[];
}
export { FIELD_LIMITS };
export declare function toCreateCharacterInput(values: CreateCharacterFormValues): CreateCharacterInput;
export declare function getDefaultFormValues(): CreateCharacterFormValues;

import { z } from 'zod';
/**
 * Field limits for Eliza character fields
 */
export declare const FIELD_LIMITS: {
    readonly name: 100;
    readonly bio: 500;
    readonly maxBioEntries: 10;
    readonly lore: 500;
    readonly maxLoreEntries: 20;
    readonly topic: 50;
    readonly maxTopics: 30;
    readonly adjective: 30;
    readonly maxAdjectives: 20;
    readonly styleRule: 200;
    readonly maxStyleRules: 10;
    readonly postExample: 280;
    readonly maxPostExamples: 20;
    readonly systemPrompt: 4000;
    readonly maxKnowledgeDocs: 5;
    readonly maxKnowledgeSize: 51200;
};
export declare const AgentCharacterSchema: z.ZodObject<{
    name: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type AgentCharacterValidated = z.infer<typeof AgentCharacterSchema>;
export declare const CreateCharacterInputSchema: z.ZodObject<{
    name: z.ZodString;
    personality: z.ZodOptional<z.ZodString>;
    backstory: z.ZodString;
    systemPrompt: z.ZodOptional<z.ZodString>;
    exampleMessages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "assistant";
    }, {
        content: string;
        role: "user" | "assistant";
    }>, "many">>;
    style: z.ZodOptional<z.ZodObject<{
        all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        chat: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        post: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    }, {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    }>>;
    externalId: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lore: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    adjectives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    postExamples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        path: string;
        id: string;
    }, {
        content: string;
        path: string;
        id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    backstory: string;
    bio?: string[] | undefined;
    topics?: string[] | undefined;
    style?: {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    } | undefined;
    knowledge?: {
        content: string;
        path: string;
        id: string;
    }[] | undefined;
    personality?: string | undefined;
    systemPrompt?: string | undefined;
    exampleMessages?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
    externalId?: string | undefined;
    lore?: string[] | undefined;
    adjectives?: string[] | undefined;
    postExamples?: string[] | undefined;
}, {
    name: string;
    backstory: string;
    bio?: string[] | undefined;
    topics?: string[] | undefined;
    style?: {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    } | undefined;
    knowledge?: {
        content: string;
        path: string;
        id: string;
    }[] | undefined;
    personality?: string | undefined;
    systemPrompt?: string | undefined;
    exampleMessages?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
    externalId?: string | undefined;
    lore?: string[] | undefined;
    adjectives?: string[] | undefined;
    postExamples?: string[] | undefined;
}>;
export declare const UpdateCharacterInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    personality: z.ZodOptional<z.ZodString>;
    backstory: z.ZodOptional<z.ZodString>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    exampleMessages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "assistant";
    }, {
        content: string;
        role: "user" | "assistant";
    }>, "many">>;
    style: z.ZodOptional<z.ZodObject<{
        all: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        chat: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        post: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    }, {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    }>>;
    bio: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lore: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    adjectives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    postExamples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        path: string;
        id: string;
    }, {
        content: string;
        path: string;
        id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bio?: string[] | undefined;
    topics?: string[] | undefined;
    style?: {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    } | undefined;
    knowledge?: {
        content: string;
        path: string;
        id: string;
    }[] | undefined;
    personality?: string | undefined;
    backstory?: string | undefined;
    systemPrompt?: string | undefined;
    exampleMessages?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
    lore?: string[] | undefined;
    adjectives?: string[] | undefined;
    postExamples?: string[] | undefined;
}, {
    name?: string | undefined;
    bio?: string[] | undefined;
    topics?: string[] | undefined;
    style?: {
        all?: string[] | undefined;
        chat?: string[] | undefined;
        post?: string[] | undefined;
    } | undefined;
    knowledge?: {
        content: string;
        path: string;
        id: string;
    }[] | undefined;
    personality?: string | undefined;
    backstory?: string | undefined;
    systemPrompt?: string | undefined;
    exampleMessages?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
    lore?: string[] | undefined;
    adjectives?: string[] | undefined;
    postExamples?: string[] | undefined;
}>;
export type CreateCharacterInputValidated = z.infer<typeof CreateCharacterInputSchema>;
export type UpdateCharacterInputValidated = z.infer<typeof UpdateCharacterInputSchema>;
export declare function validateAgentCharacter(input: unknown): AgentCharacterValidated;
export declare function validateCreateCharacter(input: unknown): CreateCharacterInputValidated;
export declare function validateUpdateCharacter(input: unknown): UpdateCharacterInputValidated;

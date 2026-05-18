/**
 * AI Editor Components
 * Export all AI persona editing components
 */

// Main component
export { AIPersonaTab } from './AIPersonaTab'

// Legacy editors (kept for backward compatibility)
export { PersonalityEditor } from './PersonalityEditor'
export { SystemPromptEditor } from './SystemPromptEditor'
export { ExampleMessagesEditor } from './ExampleMessagesEditor'

// New shared components
export { CharacterCounter, ArrayFieldEditor, TabNavigation } from './shared'
export type { Tab } from './shared'

// Assistant components
export { PersonaAssistantPanel } from './assistant'

// New editor components
export { BioEditor } from './editors/BioEditor'
export { LoreEditor } from './editors/LoreEditor'
export { TopicsEditor } from './editors/TopicsEditor'
export { AdjectivesEditor } from './editors/AdjectivesEditor'
export { StyleEditor } from './editors/StyleEditor'
export { PostExamplesEditor } from './editors/PostExamplesEditor'
export { KnowledgeEditor } from './editors/KnowledgeEditor'
export { TemplatesEditor } from './editors/TemplatesEditor'
export { SafeSettingsEditor } from './editors/SafeSettingsEditor'

// Tab containers
export { IdentityTab } from './tabs/IdentityTab'
export { BehaviorTab } from './tabs/BehaviorTab'
export { ExamplesTab } from './tabs/ExamplesTab'
export { AdvancedTab } from './tabs/AdvancedTab'

# Data Model: Code Complexity Refactoring

**Feature**: 019-code-complexity-refactor
**Date**: 2025-12-04

## Overview

This feature introduces internal state models and configuration objects to reduce code complexity. No database changes are required.

## Internal State Models

### 1. CharacterEditorState

Consolidated state object for character editing (replaces 6 separate useState calls).

```
CharacterEditorState
├── name: string                    # Edited character name
├── story: string                   # Edited background story
├── coreStats: CoreStats            # STR, DEX, CON, INT, WIS, CHA
├── derivedStats: DerivedStats      # HP, Max HP, AC, Speed
├── levelExp: LevelExperience       # Level, Experience
└── isDirty: boolean                # Has unsaved changes

CoreStats
├── str: number | null
├── dex: number | null
├── con: number | null
├── int: number | null
├── wis: number | null
└── cha: number | null

DerivedStats
├── hp: number | null
├── max_hp: number | null
├── ac: number | null
└── speed: number | null

LevelExperience
├── level: number | null
└── experience: number | null
```

**Validation Rules**:
- All stat values nullable (character may not have stats assigned)
- Stats when present: 1-30 range for core stats, 0+ for derived stats
- Level: 1-20, Experience: 0+

**State Transitions**:
- `INIT`: Load from character data
- `UPDATE_FIELD`: Update single field, set isDirty=true
- `SAVE_SUCCESS`: Reset isDirty to false
- `RESET`: Restore to original character values

### 2. TransactionState

Generic state for blockchain transaction execution.

```
TransactionState<TResult>
├── status: TransactionStatus       # idle | pending | confirming | success | error
├── hash: string | null             # Transaction hash once submitted
├── error: ContractError | null     # Error details if failed
└── result: TResult | null          # Transaction result if successful

TransactionStatus (enum)
├── IDLE
├── PENDING
├── CONFIRMING
├── SUCCESS
└── ERROR
```

**State Transitions**:
- `IDLE` → `PENDING`: Transaction initiated
- `PENDING` → `CONFIRMING`: Transaction submitted, waiting for confirmation
- `CONFIRMING` → `SUCCESS`: Transaction confirmed
- `CONFIRMING` → `ERROR`: Transaction failed or reverted
- `PENDING` → `ERROR`: Submission failed (wallet rejection, etc.)
- `SUCCESS` → `IDLE`: Reset for next transaction
- `ERROR` → `IDLE`: Reset for retry

### 3. MarkerConfiguration

Configuration object for map marker types.

```
MarkerConfig
├── icon: string                    # Icon asset key (e.g., 'icon_location')
├── scale: number                   # Display scale (e.g., 0.6, 0.8)
├── depth: number                   # Z-index for layering (e.g., 50, 75, 100)
└── visibilityKey: string           # Key in LayerVisibility object

MarkerConfigMap: Record<MarkerType, MarkerConfig>

MarkerType (union type)
├── 'location'
├── 'character'
├── 'burn'
├── 'death'
└── 'fight'
```

**Configuration Values**:
| Type | Icon | Scale | Depth | Visibility Key |
|------|------|-------|-------|----------------|
| location | icon_location | 0.6 | 50 | locations |
| character | icon_youarehere | 0.8 | 100 | characters |
| burn | icon_burn | 0.6 | 75 | burns |
| death | icon_death | 0.6 | 75 | deaths |
| fight | icon_fight | 0.6 | 75 | fights |

### 4. AIPersonaEditorAction

Reducer action types for AI persona editor state.

```
AIPersonaEditorAction (union type)
├── SET_FIELD: { field: keyof State, value: any }
├── SET_MULTIPLE: { updates: Partial<State> }
├── RESET: { character?: AICharacter }
└── LOAD_DRAFT: { draft: DraftAIPersona }

AIPersonaEditorState (unchanged from current)
├── bio: string[]
├── lore: string[]
├── topics: string[]
├── adjectives: string[]
├── style: StyleConfig
├── exampleMessages: ExampleMessage[]
├── postExamples: string[]
├── systemPrompt: string
└── knowledgeIds: string[]
```

## Entity Relationships

```
CharacterDetailPage
├── uses → useCharacterEditor (state management)
├── renders → CharacterStoryTab
├── renders → AIPersonaTab (existing)
├── renders → CharacterEquipmentTab
└── renders → CharacterWalletTab

useSpread
└── uses → useBlockchainTransaction (shared utility)

MapScene
└── uses → MarkerConfigMap (configuration lookup)

AIPersonaTab
└── uses → useAIPersonaEditor (with useReducer)
```

## Migration Notes

### CharacterEditorState Migration
- Current: 6 separate useState calls in page.tsx (lines 77-100)
- Target: Single useCharacterEditor hook returning consolidated state
- No data migration needed; runtime state only

### TransactionState Migration
- Current: Inline state management in useSpread (lines 37-42)
- Target: useBlockchainTransaction returns TransactionState
- No data migration needed; runtime state only

### MarkerConfig Migration
- Current: 4 switch statements in MapScene.ts (lines 467-519)
- Target: Single MARKER_CONFIG constant
- No data migration needed; configuration only

### AIPersonaEditorAction Migration
- Current: 9 separate useCallback setters (lines 168-211)
- Target: Single dispatch function from useReducer
- No data migration needed; runtime state only

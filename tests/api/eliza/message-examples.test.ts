/**
 * @jest-environment node
 */

import {
  agentMessageExamplesToRoleContentPairs,
  fromAgentMessageExamples,
  roleContentPairsToAgentMessageExamples,
  toAgentMessageExamples,
} from '@/lib/eliza/sdkAdapter'

import { toElizaExportMessageExamples, fromElizaExportMessageExamples } from '@/lib/eliza/eliza-export-mapper'

describe('Eliza message example adapters', () => {
  it('round-trips WAGDIE example messages through canonical agent examples', () => {
    const examples = [
      { userMessage: 'Who are you?', assistantMessage: 'I am the ash that remembers.' },
      { userMessage: 'What do you seek?', assistantMessage: 'A crown beneath the grave.' },
    ]

    const agentExamples = toAgentMessageExamples(examples)

    expect(agentExamples).toEqual([
      [
        { name: '{{user1}}', content: { text: 'Who are you?' } },
        { name: '{{char}}', content: { text: 'I am the ash that remembers.' } },
      ],
      [
        { name: '{{user1}}', content: { text: 'What do you seek?' } },
        { name: '{{char}}', content: { text: 'A crown beneath the grave.' } },
      ],
    ])
    expect(fromAgentMessageExamples(agentExamples)).toEqual(examples)
  })

  it('converts flattened role/content pairs into valid conversation examples only', () => {
    const agentExamples = roleContentPairsToAgentMessageExamples([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'well met' },
      { role: 'assistant', content: 'invalid starting role' },
      { role: 'user', content: 'ignored because it is second in pair' },
      { role: 'user', content: 'trailing user is ignored' },
    ])

    expect(agentExamples).toEqual([
      [
        { name: '{{user1}}', content: { text: 'hello' } },
        { name: '{{char}}', content: { text: 'well met' } },
      ],
    ])
  })

  it('flattens canonical agent examples into role/content pairs', () => {
    expect(
      agentMessageExamplesToRoleContentPairs([
        [
          { name: '{{user1}}', content: { text: 'first' } },
          { name: '{{char}}', content: { text: 'second' } },
        ],
        [{ name: '{{user1}}', content: { text: 'solo' } }],
      ])
    ).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'solo' },
    ])
  })

  it('converts canonical agent examples to and from Eliza export examples', () => {
    const canonical = [
      [
        { name: '{{user1}}', content: { text: 'Open the gate.' } },
        { name: '{{char}}', content: { text: 'Only the dead may pass.' } },
      ],
    ]

    const exported = toElizaExportMessageExamples(canonical)

    expect(exported).toEqual([
      [
        { user: '{{user1}}', content: { text: 'Open the gate.' } },
        { user: '{{char}}', content: { text: 'Only the dead may pass.' } },
      ],
    ])
    expect(fromElizaExportMessageExamples(exported)).toEqual(canonical)
  })
})

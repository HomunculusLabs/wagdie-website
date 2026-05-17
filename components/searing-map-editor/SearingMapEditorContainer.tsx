'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { readApiRaw } from '@/lib/api/client-response'
import type { ConcordSearingMap, ConcordSearingVariantKey } from '@/lib/domain/searing'
import { CONCORD_SEARING_VARIANT_KEYS } from '@/lib/domain/searing'

type SearingMapResponse = {
  searingMap?: ConcordSearingMap[]
  error?: string
}

type FormState = {
  concordTokenId: string
  tokenName: string
  location: string
  newTrait: string
  makesBald: boolean
  variants: Record<ConcordSearingVariantKey, string>
}

function createEmptyVariants(): Record<ConcordSearingVariantKey, string> {
  return CONCORD_SEARING_VARIANT_KEYS.reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {} as Record<ConcordSearingVariantKey, string>)
}

function createEmptyForm(): FormState {
  return {
    concordTokenId: '',
    tokenName: '',
    location: '',
    newTrait: '',
    makesBald: false,
    variants: createEmptyVariants(),
  }
}

function stringifyVariant(value: unknown): string {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

function formFromEntry(entry: ConcordSearingMap): FormState {
  return {
    concordTokenId: String(entry.concordTokenId),
    tokenName: entry.token_name,
    location: entry.location,
    newTrait: entry.new_trait,
    makesBald: entry.makesBald,
    variants: CONCORD_SEARING_VARIANT_KEYS.reduce((acc, key) => {
      acc[key] = stringifyVariant(entry[key])
      return acc
    }, {} as Record<ConcordSearingVariantKey, string>),
  }
}

function parseOptionalJson(value: string, label: string): unknown | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed === null) return null
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object or blank`)
    }
    return parsed
  } catch (error) {
    if (error instanceof Error && error.message.includes('must be')) throw error
    throw new Error(`${label} is not valid JSON`)
  }
}

function buildPayload(form: FormState) {
  const concordTokenId = Number(form.concordTokenId)
  if (!Number.isInteger(concordTokenId) || concordTokenId <= 0) {
    throw new Error('Concord token ID must be a positive integer')
  }

  if (!form.tokenName.trim()) throw new Error('Token name is required')
  if (!form.location.trim()) throw new Error('Default location is required')
  if (!form.newTrait.trim()) throw new Error('Default new trait is required')

  const payload: Record<string, unknown> = {
    concordTokenId,
    token_name: form.tokenName.trim(),
    location: form.location.trim(),
    new_trait: form.newTrait.trim(),
    makesBald: form.makesBald,
    raw_data: { source: 'admin-web-editor' },
  }

  for (const key of CONCORD_SEARING_VARIANT_KEYS) {
    payload[key] = parseOptionalJson(form.variants[key], key)
  }

  return payload
}

export function SearingMapEditorContainer() {
  const [entries, setEntries] = useState<ConcordSearingMap[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(() => createEmptyForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.concordTokenId === selectedId) ?? null,
    [entries, selectedId]
  )

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return entries

    return entries.filter((entry) =>
      entry.token_name.toLowerCase().includes(normalized) ||
      String(entry.concordTokenId).includes(normalized) ||
      entry.new_trait.toLowerCase().includes(normalized) ||
      entry.location.toLowerCase().includes(normalized)
    )
  }, [entries, query])

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/concords/searing-map?limit=2000', { cache: 'no-store' })
      const payload = await readApiRaw<SearingMapResponse>(response, 'Failed to load searing map')
      setEntries(payload.searingMap ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load searing map')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const selectEntry = (entry: ConcordSearingMap) => {
    setSelectedId(entry.concordTokenId)
    setForm(formFromEntry(entry))
    setMessage(null)
    setError(null)
  }

  const startNew = () => {
    setSelectedId(null)
    setForm(createEmptyForm())
    setMessage(null)
    setError(null)
  }

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updateVariant = (key: ConcordSearingVariantKey, value: string) => {
    setForm((current) => ({
      ...current,
      variants: { ...current.variants, [key]: value },
    }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const payload = buildPayload(form)
      const concordTokenId = Number(payload.concordTokenId)
      const isEdit = selectedEntry !== null
      const response = await fetch(
        isEdit
          ? `/api/concords/searing-map/${selectedEntry.concordTokenId}`
          : '/api/concords/searing-map',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      await readApiRaw<SearingMapResponse>(response, 'Failed to save searing map')

      await loadEntries()
      setSelectedId(concordTokenId)
      setMessage('Searing map saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save searing map')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEntry) return
    const confirmed = window.confirm(`Delete searing map for ${selectedEntry.token_name}?`)
    if (!confirmed) return

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/concords/searing-map/${selectedEntry.concordTokenId}`, {
        method: 'DELETE',
      })
      await readApiRaw<{ message?: string }>(response, 'Failed to delete searing map')

      startNew()
      await loadEntries()
      setMessage('Searing map deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete searing map')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-abyss text-soul-bone">
      <div className="mx-auto flex max-w-7xl gap-6 p-6">
        <aside className="w-96 shrink-0 rounded-lg border border-soul-accent/20 bg-soul-shadow/70 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-soul-accent">Searing Map Editor</h1>
              <p className="text-sm text-soul-mist/70">Admin-only Concord trait mapping</p>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="rounded border border-soul-accent/50 px-3 py-2 text-sm text-soul-accent hover:bg-soul-accent/10"
            >
              New
            </button>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, token, trait, location"
            className="mb-4 w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 text-soul-bone outline-none focus:border-soul-accent"
          />

          {isLoading ? (
            <p className="text-sm text-soul-mist">Loading searing map…</p>
          ) : (
            <div className="max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.concordTokenId}
                  type="button"
                  onClick={() => selectEntry(entry)}
                  className={`w-full rounded border p-3 text-left transition-colors ${
                    entry.concordTokenId === selectedId
                      ? 'border-soul-accent bg-soul-accent/10'
                      : 'border-soul-accent/20 bg-abyss/70 hover:border-soul-accent/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-soul-bone">#{entry.concordTokenId}</span>
                    <span className="text-xs text-soul-mist/60">{entry.location}</span>
                  </div>
                  <div className="mt-1 text-sm text-soul-accent">{entry.token_name}</div>
                  <div className="text-xs text-soul-mist/70">{entry.new_trait}</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="flex-1 rounded-lg border border-soul-accent/20 bg-soul-shadow/70 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-soul-accent">
                  {selectedEntry ? `Editing #${selectedEntry.concordTokenId}` : 'New searing mapping'}
                </h2>
                <p className="text-sm text-soul-mist/70">
                  Default fields apply unless an alignment-specific alt mapping matches.
                </p>
              </div>
              {selectedEntry && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="rounded border border-soul-ember/60 px-4 py-2 text-soul-ember hover:bg-soul-ember/10 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>

            {error && <div className="rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-soul-ember">{error}</div>}
            {message && <div className="rounded border border-soul-accent/40 bg-soul-accent/10 p-3 text-soul-accent">{message}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-soul-mist">Concord token ID</span>
                <input
                  type="number"
                  min="1"
                  value={form.concordTokenId}
                  onChange={(event) => updateForm('concordTokenId', event.target.value)}
                  disabled={selectedEntry !== null || isSaving}
                  className="w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 text-soul-bone outline-none focus:border-soul-accent disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-soul-mist">Token name</span>
                <input
                  value={form.tokenName}
                  onChange={(event) => updateForm('tokenName', event.target.value)}
                  disabled={isSaving}
                  className="w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 text-soul-bone outline-none focus:border-soul-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-soul-mist">Default location</span>
                <input
                  value={form.location}
                  onChange={(event) => updateForm('location', event.target.value)}
                  disabled={isSaving}
                  placeholder="Mask, Back, Front, Mask+Armor…"
                  className="w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 text-soul-bone outline-none focus:border-soul-accent"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-soul-mist">Default new trait</span>
                <input
                  value={form.newTrait}
                  onChange={(event) => updateForm('newTrait', event.target.value)}
                  disabled={isSaving}
                  className="w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 text-soul-bone outline-none focus:border-soul-accent"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded border border-soul-accent/20 bg-abyss/70 p-3 text-soul-mist">
              <input
                type="checkbox"
                checked={form.makesBald}
                onChange={(event) => updateForm('makesBald', event.target.checked)}
                disabled={isSaving}
              />
              Makes character bald when this mapping is used
            </label>

            <section>
              <h3 className="mb-2 font-display text-lg text-soul-accent">Alignment alternatives</h3>
              <p className="mb-3 text-sm text-soul-mist/70">
                Optional JSON objects. Example: {'{ "traits": [{ "Alignment": "Lawful Good" }], "location": "Mask", "new_trait": "Her Sight", "makesBald": true }'}
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {CONCORD_SEARING_VARIANT_KEYS.map((key) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-sm text-soul-mist">{key}</span>
                    <textarea
                      value={form.variants[key]}
                      onChange={(event) => updateVariant(key, event.target.value)}
                      disabled={isSaving}
                      rows={7}
                      placeholder="Blank = no alternative"
                      className="w-full rounded border border-soul-accent/30 bg-abyss px-3 py-2 font-mono text-sm text-soul-bone outline-none focus:border-soul-accent"
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded bg-soul-accent px-5 py-3 font-display text-abyss hover:bg-soul-accent/80 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save searing map'}
              </button>
              <button
                type="button"
                onClick={startNew}
                disabled={isSaving}
                className="rounded border border-soul-accent/50 px-5 py-3 font-display text-soul-bone hover:bg-soul-accent/10 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

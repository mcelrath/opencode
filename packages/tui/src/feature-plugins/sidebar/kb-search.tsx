import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { createSignal, For, Show } from "solid-js"

const id = "internal:sidebar-kb-search"

const KB_SERVER = "http://localhost:8765"

type KbEntry = {
  id: string
  type: string
  project: string
  tags: string[]
  summary: string
  score?: number
}

function View(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const [query, setQuery] = createSignal("")
  const [results, setResults] = createSignal<KbEntry[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  let debounce: ReturnType<typeof setTimeout> | null = null

  async function search(q: string) {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${KB_SERVER}/kb/search?q=${encodeURIComponent(q)}&limit=10`)
      if (!res.ok) {
        setError(`HTTP ${res.status}`)
        setResults([])
        return
      }
      const data = await res.json()
      setResults(data)
    } catch (_e) {
      setError("kb-server unreachable")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function onInput(value: string) {
    setQuery(value)
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => search(value), 400)
  }

  return (
    <box flexDirection="column">
      <text fg={theme().text}>
        <b>KB Search</b>
      </text>
      <textarea
        width="100%"
        minHeight={1}
        maxHeight={1}
        placeholder="search kb..."
        placeholderColor={theme().textMuted}
        textColor={theme().text}
        onContentChange={(e: any) => onInput(e?.plainText ?? "")}
      />
      <Show when={loading()}>
        <text fg={theme().textMuted}>searching…</text>
      </Show>
      <Show when={error()}>
        <text fg={theme().error}>{error()}</text>
      </Show>
      <Show when={!loading() && !error() && query().trim() && results().length === 0}>
        <text fg={theme().textMuted}>No results</text>
      </Show>
      <For each={results()}>
        {(item) => (
          <box flexDirection="column">
            <text fg={theme().text} wrapMode="word">
              {item.summary || item.id}
            </text>
            <text fg={theme().textMuted}>
              {item.project}
              {item.tags?.length ? "  " + item.tags.join(" ") : ""}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 600,
    slots: {
      sidebar_content() {
        return <View api={api} />
      },
    },
  })
}

const plugin: BuiltinTuiPlugin = {
  id,
  tui,
}

export default plugin

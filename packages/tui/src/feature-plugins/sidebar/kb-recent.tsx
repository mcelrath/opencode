import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { createSignal, createEffect, For, Show, onCleanup } from "solid-js"

const id = "internal:sidebar-kb-recent"

const KB_SERVER = "http://localhost:8765"

type KbEntry = {
  id: string
  type: string
  project: string
  tags: string[]
  summary: string
  created_at: string
}

function View(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const [open, setOpen] = createSignal(true)
  const [items, setItems] = createSignal<KbEntry[]>([])
  const [error, setError] = createSignal<string | null>(null)

  async function fetchRecent() {
    try {
      const res = await fetch(`${KB_SERVER}/kb/recent?limit=10`)
      if (!res.ok) {
        setError(`HTTP ${res.status}`)
        return
      }
      const data = await res.json()
      setItems(data)
      setError(null)
    } catch (e) {
      setError("kb-server unreachable")
    }
  }

  fetchRecent()

  const interval = setInterval(fetchRecent, 30_000)
  onCleanup(() => clearInterval(interval))

  return (
    <box>
      <box flexDirection="row" gap={1} onMouseDown={() => items().length > 2 && setOpen((x) => !x)}>
        <Show when={items().length > 2}>
          <text fg={theme().text}>{open() ? "▼" : "▶"}</text>
        </Show>
        <text fg={theme().text}>
          <b>KB Recent</b>
        </text>
      </box>
      <Show when={error()}>
        <text fg={theme().error}>{error()}</text>
      </Show>
      <Show when={!error() && items().length === 0}>
        <text fg={theme().textMuted}>No entries</text>
      </Show>
      <Show when={items().length <= 2 || open()}>
        <For each={items()}>
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
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 500,
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

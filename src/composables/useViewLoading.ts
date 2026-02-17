import { ref, onMounted } from 'vue'

/**
 * Composable to manage view loading state for editor views.
 *
 * Returns a `ready` ref that starts as `false` and becomes `true` after the
 * component has mounted and the browser has had a chance to paint.
 *
 * Usage in editor views:
 *
 * ```vue
 * const { ready } = useViewLoading()
 *
 * <ViewSpinner v-if="!ready" />
 * <div v-else> ...heavy content... </div>
 * ```
 *
 * This ensures the spinner is visible before the browser starts the
 * (potentially expensive) render of large tables, graphs, etc.
 *
 * The top-level `await` makes the component async so Vue Suspense can
 * show its fallback spinner during code-split chunk loading.
 */
export function useViewLoading() {
  const ready = ref(false)

  onMounted(() => {
    // Double rAF: first frame for the browser to paint the spinner,
    // second frame to ensure the paint is flushed before we render heavy content
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ready.value = true
      })
    })
  })

  return { ready }
}

/**
 * Async version — call with `await` at the top of `<script setup>` to make
 * the component async for Suspense (enables the App.vue fallback spinner
 * during lazy chunk loading).
 */
export async function useViewLoadingAsync(): Promise<void> {
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve())
  })
}

// These labels apply only to Scalar's sidebar. OpenAPI summaries remain available
// in operation headings, search results and document downloads.
const ACTION_LABELS = [
  [/^\S+ for a location using the p parameter$/, 'For a location using p'],
  [/^\S+ for a location using the path \(:id\)$/, 'For a location using :id'],
  [/^\S+ for the closest location$/, 'Closest to a location'],
  [/^\S+ matching a search$/, 'Matching a search'],
  [/^\S+ within an area$/, 'Within an area'],
  [/^\S+ along a route(?: \(POST\))?$/, 'Along a route'],
  [/^\S+ affecting a location$/, 'Affecting a location'],
  [/^\S+ containing a location$/, 'Containing a location'],
  [/^All \S+$/, 'All results'],
  [/^Available models catalog$/, 'Available models'],
]

export function shortOperationLabel(summary) {
  return ACTION_LABELS.find(([pattern]) => pattern.test(summary))?.[1]
}

export function shortenNavigationLabels(root) {
  const sidebarSelector = '.t-doc__sidebar'

  function updateLabels() {
    for (const link of root.querySelectorAll(`${sidebarSelector} a[href]`)) {
      // Only operations have a method badge. Leave tags and other links alone.
      if (!link.querySelector('.sidebar-heading-type')) continue

      const original = link.querySelector(
        ':scope > [class~="group/button-label"]:not([data-navigation-label])',
      )
      if (!original) continue

      const summary = original.textContent.trim()
      const label = shortOperationLabel(summary)
      let display = link.querySelector(':scope > [data-navigation-label]')
      if (!label) {
        if (display) {
          display.remove()
          original.hidden = false
          link.removeAttribute('title')
        }
        continue
      }

      // Keep Vue's original nodes intact so expanding and updating the sidebar
      // still works. The full summary is also available on hover.
      if (!display) {
        display = document.createElement('div')
        display.className = original.className
        display.dataset.navigationLabel = ''
        original.after(display)
      }
      if (display.textContent !== label) display.textContent = label
      original.hidden = true
      link.title = summary
    }
  }

  // Groups render their operations when expanded. The sidebar can also mount
  // again when switching between desktop and mobile navigation.
  const observer = new MutationObserver((records) => {
    if (records.some(({ target, addedNodes }) =>
      (target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement)
        ?.closest(sidebarSelector) ||
      Array.from(addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE &&
        (node.matches(sidebarSelector) || node.querySelector(sidebarSelector))),
    )) updateLabels()
  })
  observer.observe(root, { childList: true, subtree: true, characterData: true })
  updateLabels()
  return () => observer.disconnect()
}

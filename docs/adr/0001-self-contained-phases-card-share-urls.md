# Use self-contained URLs for custom Phases Card sharing

Custom Phases Card share links encode the Phase Set name and ordered phase requirements in the URL instead of relying on server-backed short links. The app is a client-only GitHub Pages SPA with all data in IndexedDB, so self-contained URLs preserve sharing without adding infrastructure; built-in Phase Sets can still use short `/phasescard/$id` links.

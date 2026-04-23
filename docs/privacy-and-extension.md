# Privacy And Extension Notes

## Privacy Considerations

- Email processing happens locally through Ollama.
- The app stores synchronized threads and derived metadata in a local JSON database.
- No external cloud AI provider is required for classification, summarization, action extraction, digest generation, or search.
- Gmail remains the only external integration required for a live demo.
- The architecture can also be tested with seeded local data for offline demonstration.

## Extension Path For Slack Or Teams

The same pipeline can be extended to Slack or Teams by introducing a connector layer that normalizes messages into the thread schema.

### Required additions

- Connector adapters for Slack and Teams APIs
- Channel / DM identifiers mapped into the same local thread model
- Message timestamps and sender metadata normalized for follow-up detection
- Search indexing across email and chat sources
- Source-aware digest sections such as:
  - `Email follow-ups`
  - `Slack threads waiting on you`
  - `Teams approvals pending`

### Why the current design helps

- The digest, task extraction, and smart-search features already operate on local structured data.
- Once external messages are normalized into the same schema, most AI and UI layers can be reused.

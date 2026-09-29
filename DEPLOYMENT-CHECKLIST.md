# Deployment checklist

- [ ] Backend works locally at `/health` and `/docs`.
- [ ] Frontend works locally and can load incidents.
- [ ] Push repository to GitHub.
- [ ] Create a Render Blueprint from the root `render.yaml`.
- [ ] Verify both the Render frontend and API `/health`.
- [ ] Add `OPENAI_API_KEY` to the Render API environment if enabling LLM analysis.
- [ ] Set Render `CORS_ORIGINS` to the exact deployed frontend origin.
- [ ] Verify create → analyze → resolve → analyze-again flow.
- [ ] Confirm persistence: SQLite on Render may reset without a persistent disk; use PostgreSQL for durable deployment.
- [ ] Do not expose API keys or real sensitive production logs.

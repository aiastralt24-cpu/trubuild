# TruBuild search

The `/search?q=...` route unifies the maintained catalogue, editorial guides, application pages and document records. Menu suggestions and catalogue filtering use the same matching engine. Query text stays in the browser and URL; no third-party AI service or key is used.

Current capabilities:
- Weighted title/body matching, product-code prioritisation and conservative typo corrections.
- Maintained English synonyms and common Hindi/Hinglish search phrases. Results/source text remain English; this is not arbitrary multilingual translation.
- Document records include the product's extracted catalogue specifications where available. This is not live full-PDF parsing. Legacy labelled documents remain available if there is no newer record for that product.
- Source-linked editorial excerpts, exact published coverage values and deterministic clarification prompts for common roof/bathroom questions.
- Product/guide/document/application filters, query URL history, document-request flow and comparison shortcut.
- No invented technical recommendations, semantic embeddings or open-ended generated answers. A general conversational layer would require a separately configured retrieval/generation service and a reviewed evaluation set.

Edit `src/searchEngine.mjs` to add reviewed vocabulary and prompt rules. Add regression cases to `tests/search.test.mjs` for typos, numeric variants, language phrases, zero matches and source fidelity. Do not infer suitability from matching words. Published product data and the existing technical advisor remain authoritative for selection.

Production is connected to the GitHub main branch through Vercel. The project hostname is `trubuild-sage.vercel.app`; the corporate canonical hostname remains `www.trubuild.in`. A successful release to the Vercel project does not establish that the corporate domain's DNS has been switched.

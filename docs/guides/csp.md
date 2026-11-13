# Content Security Policy integration

The owner loads the library and bootstrap script from an authorised location. The widget itself initiates no network requests. The Phase 7 fixture uses this restrictive response policy; adapt it to the site's own resources rather than treating it as a universal site policy:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'nonce-RESPONSE_NONCE'; style-src-attr 'none'; img-src data:; frame-src 'self'; connect-src 'none'; base-uri 'none'; object-src 'none'
```

Generate the style nonce in the response and pass that same value to `init({ nonce })` through the owner's authorised bootstrap. `RESPONSE_NONCE` above is documentation text, not a nonce to reuse in production. No inline script permission is required by the widget. The owner remains responsible for authorising its bootstrap script.

The stylesheet manager prefers constructed/adopted stylesheets. The nonce is used on fallback `<style>` elements in the document and widget shadow root. Tests exercise both paths: a strict policy with no supplied nonce and constructed sheets, and a strict policy with constructed-sheet support disabled and the correct nonce. A browser requiring fallback sheets also requires the nonce under this policy. The tests do **not** establish support for a blocked fallback without a nonce, an incorrect nonce, every possible CSP or arbitrary third-party CSP changes.

`img-src data:` permits the inline SVG cursor assets. If the owner forbids data images, the cursor has a native fallback; that policy may also produce a browser CSP diagnostic. No remote image or font is fetched. A custom dyslexia font must already be loaded by the owner; `dyslexiaFontUrl` never causes the widget to download it.

The [CSP regression](../../e2e/qa-csp.spec.ts) checks rendered page styling, actual installed nonces, zero widget/page errors, and closed/open axe audits in all five browser projects. The [audit adapter](../../e2e/helpers/csp-audit.ts) adds the fixture nonce only to stylesheet copies that axe creates in detached documents for CSS analysis. It preserves stylesheet text, keeps the live policy unchanged and restores the audit hook afterwards. No axe rule or console error is suppressed. This adapter is test tooling and is absent from the published library.

The [isolation test](../../e2e/qa-boundaries.spec.ts) confirms that parent-page adjustments do not rewrite same-origin or opaque sandbox-frame text. Cross-origin frames and independent shadow components are not remediated. See [the conformance evidence scope](../ACCESSIBILITY.md) and [Phase 7 report](../../reports/phase-7-qa-hardening.md) for measured results and remaining human checks.

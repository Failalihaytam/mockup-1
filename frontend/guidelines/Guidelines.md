# Project Guidelines

## Primary design source
- Always use existing frontend components first:
  - `src/app/components/layout/*`
  - `src/app/components/common/*`
  - `src/app/components/ui/*`
  - Role pages in `src/app/pages/*`
- Do not introduce a new component if an existing one can be reused or extended.

## Figma handoff rules
- Use `guidelines/FIGMA_COMPONENT_MAPPING.md` as the canonical mapping.
- Every Figma frame must correspond to an implemented route in `src/app/routes.tsx`.
- Preserve role-specific structure and navigation.
- Include interaction states for all interactive components:
  - default, hover, focus, active, disabled, loading, empty.

## Design tokens
- Use color and theme tokens from `src/styles/theme.css` only.
- Keep both light and dark themes.
- Preserve border radius and hierarchy of surfaces.

## UI5/Fiori preference
- If an existing frontend component is missing for a needed pattern, use a UI5/Fiori equivalent.
- Preferred mappings are documented in `guidelines/FIGMA_COMPONENT_MAPPING.md`.
- Keep naming and behavior consistent with Fiori whenever UI5 components are chosen.

## Delivery expectation
- Final deliverables must be implementation-aligned mockups, not conceptual redesigns.
- Any visual change should be traceable to existing UI behavior or explicit UI5 replacement.

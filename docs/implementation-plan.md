# AEM Architect on EDS

## Scope and acceptance criteria

- Recreate the supplied homepage: cream background, Inter typography, navy pill navigation, red accents, white rounded cards, service grid, dark project band, profile, illustrated insights, contact and footer.
- Use authored EDS blocks and default content. All titles, descriptions, links and images belong in content documents; JavaScript only decorates them.
- Provide overview pages for Services, Work, Insights, About and Contact using the source project's existing copy. The source currently implements only the homepage; do not invent complete case studies or articles.
- Navigation and CTA links resolve to pages or anchors that actually exist.
- Mobile navigation supports keyboard, Escape, focus return and viewport changes. Layouts work at 375, 768 and 1440+ pixels without horizontal scrolling.
- Blocks retain added cells and tolerate missing images, links, rows or optional text.
- Deliver local content fixtures, a DA export/import workflow, and Polish instructions for editing, preview, publishing and independent code deployment.
- Validate with lint, browser checks, screenshots and accessibility checks. Do not modify vendored `scripts/aem.js`.

## Content model

All blocks use a single merged title row in DA. Each following row represents one item, with at most two content cells. Titles are headings, emphasis is semantic, and buttons use bold (primary) or italic (secondary) links.

| Block | Model | Authoring |
| --- | --- | --- |
| Hero (intro) | Standalone | One cell: H1, emphasized specialty paragraph, description, bold/italic CTA links |
| Stats | Collection | One row per statistic: H2 value, icon and linked label in one cell |
| Section intro | Standalone | One cell: optional italic badge, H2, description, optional CTA |
| Services | Collection | First row: enterprise feature copy; remaining rows: icon, H3 linked service title and description |
| Selected work | Collection | First row: intro, H2, button; following rows: category, H3, copy and link; optional second cell for an image |
| Profile | Standalone | One cell: badge, H2, description, list of expertise and link; optional image in second cell |
| Insights | Collection | One row per article: image in first cell; H3 linked title, summary, date and emphasized category in second cell. First row is featured. |
| Contact | Standalone | One cell: H2, description, bold CTA link |
| Section Metadata | Standard EDS | `Style` for visual treatment; `Anchor` for a stable section ID |

`nav` has a brand section (linked initials and name) and a list of navigation links. `footer` has identity, navigation and copyright sections. Page titles and descriptions use a Metadata block. Normal article text uses default content, without a custom block.

## Work checklist

- [x] Inspect source and current published plain HTML
- [x] Analyze layout and design content models
- [x] Prepare local content and start AEM CLI
- [x] Implement blocks and shared styles
- [x] Validate all pages and responsive navigation
- [x] Document DA authoring and deployment
- [x] Prepare local result with verification and remaining publication steps

Deployment is handed off as instructions, as requested. The authored DA documents and public main branch are not prerequisites for the local preview.

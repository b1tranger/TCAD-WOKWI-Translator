# Repository Rules & Guidelines

## 1. Changelog & History Maintenance
- **Automatic History Updates**: Whenever adding new features, fixing bugs, refactoring components, or altering UI/styles in this codebase, always document the changes in doc/DOCUMENTATION.md (under `## Version History`), doc/versions.md, sw.js#L5-5 (const CACHE_VERSION), and README.md (keeping version, features, and roadmap checklist synchronized with the current release state).
- **Placement & Summaries in Documentation**:
  - In `doc/DOCUMENTATION.md`, record updates exclusively under `## Version History` as concise, high-level summaries (never at the very top of the file before the Table of Contents).
  - Detailed release notes and comprehensive per-change descriptions are maintained in `doc/versions.md` (which powers the in-app changelog modal) and companion walkthrough files in `doc/prompts/`.
- **Version Ranges**: Consolidate patch updates into active minor version ranges (e.g., `v0.1.0 to v0.1.8`) in `doc/versions.md` instead of fragmenting each patch into a separate standalone entry.


## 2. Mandatory Prompt, Plan & Walkthrough Archiving
- **Automatic Per-Turn Full Conversation Updates**:
  - After **EVERY SINGLE** chat prompt-response cycle, you MUST update the session's comprehensive conversation archive (`doc/prompts/<Prefix>. <Session Title>.md`) by appending the new turn contents to it.
  - **DO NOT** create a new file for each individual prompt turn (avoid creating fragmented files like `<Prefix>.3`, `<Prefix>.4`, `<Prefix>.5`, etc.).
  - Append the current turn's verbatim user request, internal thinking (`### Thinking`), and final response (`### AI Response`) directly to the end of the session archive file, separated by horizontal rules (`---`).
- **Fractional Suffixes Reserved for Plans & Walkthroughs Only**:
  - Minor/fractional prefixes (e.g., `<Prefix>.1`, `<Prefix>.2`, etc.) are reserved **exclusively** for companion implementation plans and walkthroughs:
    - Primary chat session: `doc/prompts/<Prefix>. <Session Title>.md` (contains all turns sequentially)
    - Implementation plan: `doc/prompts/<Prefix>.1 Implementation Plan - <Plan Title>.md`
    - Walkthrough document: `doc/prompts/<Prefix>.2 Walkthrough - <Title>.md`
    - Subsequent plans/walkthroughs within the same session: `<Prefix>.3 Implementation Plan - ...`, `<Prefix>.4 Walkthrough - ...`, etc.
- **Mandatory Dual-Write on Every Turn**:
  - **Implementation Plans**: Whenever creating or updating an implementation plan artifact (`implementation_plan.md`), you MUST simultaneously write a copy to `doc/prompts/<Prefix>.<N> Implementation Plan - <Plan Title>.md` before pausing for user review.
  - **Walkthroughs**: Whenever creating or updating a walkthrough artifact (`walkthrough.md`), you MUST simultaneously write a copy to `doc/prompts/<Prefix>.<N> Walkthrough - <Title>.md` upon completing execution.
  - **Full Conversation Archive**: Update and append the active turn to `doc/prompts/<Prefix>. <Session Title>.md` immediately upon generating the response on every turn.
- **Target Location**: All prompt, plan, and walkthrough records reside in the [`doc/prompts`](doc/prompts) directory.
- **Prefix Sequencing Strategy**:
  - Inspect existing files in `doc/prompts/` to identify the current major sequence integer (e.g. `35.`).
  - Keep all conversation turns for that session inside the main file `doc/prompts/<Prefix>. <Session Title>.md`.
- **Chat Archive Fidelity**:
  - Reproduce the conversation exactly as the source (user request blocks verbatim).
  - Include the model's internal thinking/reasoning parts (`### Thinking`) alongside the final response (`### AI Response`).
  - Preserve the frontmatter tags comment block at the top of the archive file.

## 3. Code Quality & Styling Standards
- Follow the established vanilla JavaScript and CSS conventions across the repository.
- Avoid introducing unnecessary third-party runtime frameworks or heavy libraries unless explicitly requested.
- Maintain responsive design and dark/sky-blue aesthetic consistency across all interactive tools and modals.

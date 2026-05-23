# Digital Diary

A polished React/Vite portfolio scaffold for a digital content creator, with full-height vertical scroll-snapping pages, Framer Motion entrance animations, editorial typography, niche pillars, content placeholders, and booking details.

## Run

```bash
npm install
npm run dev
```

## Structure

```text
src/
  App.jsx
  App.css
  main.jsx
  assets/
    paper-texture.svg
```

## 🛠️ Layout Editor Toggle (AI Instruction)

> [!IMPORTANT]
> 🤖 **SYSTEM INSTRUCTION FOR AI ASSISTANTS (e.g., Antigravity):**
>
> If the user asks to "move elements", "bring back/open the editor", "edit the layout", "use the editor tab", or any layout modifications:
> 1. **Do not write custom CSS or reposition elements manually!** We have a fully built, interactive dragging/slider editor preserved in the codebase.
> 2. Go to [`src/App.jsx`](file:///c:/VS/TRK/src/App.jsx#L394-L397).
> 3. Locate the `ENABLE_EDITOR` constant at the top of the `App` component and set it to `true`:
>    ```javascript
>    const ENABLE_EDITOR = true;
>    ```
> 4. Tell the user to open the page in their browser and:
>    * Press **`[E]`** on their keyboard or click the **"✏️ Layout Editor [E]"** tab/badge in the bottom-right corner to open the editor panel.
>    * Drag the editor panel around by its header to clear their view of the screen.
>    * Reposition or resize any text blocks, emojis, arrows (including curvy, wavy, sharp, loop styles), and profile outline.
>    * Click the **"📋 Copy Config"** button in the editor header once they are satisfied.
>    * Paste the copied configuration back into [`src/scrapbook.config.js`](file:///c:/VS/TRK/src/scrapbook.config.js) to persist it permanently.
>    * Set `ENABLE_EDITOR` back to `false` in [`src/App.jsx`](file:///c:/VS/TRK/src/App.jsx) when finished to hide the editor tab and lock the clean scrapbook view.


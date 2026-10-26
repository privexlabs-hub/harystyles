import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Stable block ids (docs/03 §3.9a): every paragraph / heading / blockquote / rule keeps a 10-char id
 * through edits; splits give the new half a fresh id. Sentence anchors hang off these ids so
 * reactions and kept lines survive editing. The server repairs any missing or duplicate id too.
 */
const TYPES = ["paragraph", "heading", "blockquote", "horizontalRule"];
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => ALPHABET[b & 63]).join("");
}

export const BlockId = Extension.create({
  name: "blockId",
  addGlobalAttributes() {
    return [
      {
        types: TYPES,
        attributes: {
          id: { default: null, keepOnSplit: false, parseHTML: (el) => el.getAttribute("data-block-id"), renderHTML: (a) => (a.id ? { "data-block-id": a.id } : {}) },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockId"),
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((t) => t.docChanged)) return null;
          const seen = new Set<string>();
          const tr = state.tr;
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (!TYPES.includes(node.type.name)) return true;
            const id = node.attrs.id as string | null;
            if (!id || seen.has(id)) {
              const fresh = newId();
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: fresh });
              seen.add(fresh);
              changed = true;
            } else seen.add(id);
            return true;
          });
          return changed ? tr.setMeta("addToHistory", false) : null;
        },
      }),
    ];
  },
});

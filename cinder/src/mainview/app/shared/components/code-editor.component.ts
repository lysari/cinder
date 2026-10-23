import { Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, output } from "@angular/core";
import type { CompletionSource } from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";

const CODE_EDITOR_THEME = EditorView.theme({
	"&": {
		height: "100%",
		backgroundColor: "var(--bg-input)",
		color: "var(--text)",
		fontSize: "var(--font-size-md)",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-scroller": {
		fontFamily: "var(--font-mono)",
		lineHeight: "var(--line-height-text)",
	},
	".cm-content": {
		padding: "var(--space-4) 0",
		caretColor: "var(--text)",
	},
	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: "var(--text)",
	},
	"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
		backgroundColor: "var(--code-selection)",
	},
	".cm-gutters": {
		backgroundColor: "var(--bg-sidebar)",
		color: "var(--text-muted)",
		borderRight: "var(--border-width) solid var(--border)",
	},
	".cm-activeLine": {
		backgroundColor: "var(--code-active-line)",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--code-active-line)",
		color: "var(--text)",
	},
	"&.cm-focused .cm-matchingBracket": {
		backgroundColor: "var(--code-bracket-match)",
	},
	"&.cm-focused .cm-nonmatchingBracket": {
		backgroundColor: "var(--danger-subtle)",
	},
	".cm-tooltip": {
		border: "var(--border-width) solid var(--border-strong)",
		borderRadius: "var(--radius-md)",
		backgroundColor: "var(--bg-input)",
		color: "var(--text)",
	},
	".cm-tooltip.cm-tooltip-autocomplete > ul": {
		fontFamily: "var(--font-mono)",
	},
	".cm-tooltip-autocomplete ul li[aria-selected]": {
		backgroundColor: "var(--accent-subtle)",
		color: "var(--accent-strong)",
	},
	".cm-completionDetail": {
		color: "var(--text-muted)",
	},
});

const CODE_HIGHLIGHT_STYLE = HighlightStyle.define([
	{
		tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.operatorKeyword],
		color: "var(--code-keyword)",
	},
	{ tag: [tags.string, tags.special(tags.string), tags.regexp], color: "var(--code-string)" },
	{ tag: [tags.number, tags.bool, tags.null], color: "var(--code-number)" },
	{ tag: [tags.lineComment, tags.blockComment], color: "var(--code-comment)", fontStyle: "italic" },
	{ tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--code-function)" },
	{ tag: tags.invalid, color: "var(--text-danger)" },
]);

@Component({
	selector: "app-code-editor",
	template: "",
	styleUrl: "./code-editor.component.scss",
})
export class CodeEditorComponent {
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private view: EditorView | null = null;
	readonly value = input.required<string>();
	readonly label = input.required<string>();
	readonly completionSources = input<CompletionSource[]>([]);
	readonly valueChange = output<string>();
	readonly runRequested = output<void>();

	constructor() {
		afterNextRender(() => {
			this.view = new EditorView({
				parent: this.host.nativeElement,
				doc: this.value(),
				extensions: [
					basicSetup,
					javascript(),
					...this.completionSources().map((source) => javascriptLanguage.data.of({ autocomplete: source })),
					syntaxHighlighting(CODE_HIGHLIGHT_STYLE),
					CODE_EDITOR_THEME,
					Prec.highest(keymap.of([{ key: "Mod-Enter", run: () => this.requestRun() }])),
					EditorView.contentAttributes.of({ "aria-label": this.label() }),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							this.valueChange.emit(update.state.doc.toString());
						}
					}),
				],
			});
		});
		effect(() => {
			const value = this.value();
			const view = this.view;
			if (view && value !== view.state.doc.toString()) {
				view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
			}
		});
		inject(DestroyRef).onDestroy(() => this.view?.destroy());
	}

	private requestRun(): boolean {
		this.runRequested.emit();
		return true;
	}
}

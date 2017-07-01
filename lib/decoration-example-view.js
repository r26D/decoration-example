"use babel";
let DecorationExampleView;
import { View } from "atom-space-pen-views";
import { CompositeDisposable } from "atom";

export default (DecorationExampleView = (function() {
  DecorationExampleView = class DecorationExampleView extends View {
    static initClass() {
      this.prototype.colors = ["green", "blue", "red"];
      this.prototype.randomizeColors = true;
    }
    static content() {
      return this.div(
        { class: "decoration-example tool-panel panel-bottom padded" },
        () => {
          return this.div({ class: "btn-toolbar" }, () => {
            this.div({ class: "btn-group" }, () => {
              this.button(
                { outlet: "gutterToggle", class: "btn" },
                "Toggle Gutter Decoration"
              );
              return this.button(
                { outlet: "gutterColorCycle", class: "btn" },
                "Cycle Gutter Color"
              );
            });

            this.div({ class: "btn-group" }, () => {
              this.button(
                { outlet: "lineToggle", class: "btn" },
                "Toggle Lines Decoration"
              );
              return this.button(
                { outlet: "lineColorCycle", class: "btn" },
                "Cycle Lines Color"
              );
            });

            this.div({ class: "btn-group" }, () => {
              this.button(
                { outlet: "highlightToggle", class: "btn" },
                "Toggle Highlight Decoration"
              );
              return this.button(
                { outlet: "highlightColorCycle", class: "btn" },
                "Cycle Highlight Color"
              );
            });

            return this.div({ class: "btn-group" }, () => {
              return this.button(
                { outlet: "overlayToggle", class: "btn" },
                "Toggle Overlay Decoration"
              );
            });
          });
        }
      );
    }

    initialize(serializeState) {
      this.decorationsByEditorId = {};
      let disposables = new CompositeDisposable();

      this.toggleButtons = {
        line: this.lineToggle,
        gutter: this.gutterToggle,
        overlay: this.overlayToggle,
        highlight: this.highlightToggle
      };

      this.lineToggle.on("click", () =>
        this.toggleDecorationForCurrentSelection("line")
      );
      this.gutterToggle.on("click", () =>
        this.toggleDecorationForCurrentSelection("line-number")
      );
      this.highlightToggle.on("click", () =>
        this.toggleDecorationForCurrentSelection("highlight")
      );

      this.lineColorCycle.on("click", () => this.cycleDecorationColor("line"));
      this.gutterColorCycle.on("click", () =>
        this.cycleDecorationColor("line-number")
      );
      this.highlightColorCycle.on("click", () =>
        this.cycleDecorationColor("highlight")
      );

      this.overlayToggle.on("click", () => {
        let editor;
        if (!(editor = this.getEditor())) {
          return;
        }

        let type = "overlay";

        let decoration = this.getCachedDecoration(editor, type);
        if (decoration != null) {
          decoration.destroy();
          this.setCachedDecoration(editor, type, null);
        } else {
          let position = editor.getCursorBufferPosition();
          let range = [position, position];

          let item = document.createElement("div");
          item.classList.add("overlay-example");
          item.classList.add("popover-list");

          // marker = editor.markBufferRange(range, invalidate: 'never')
          let { marker } = editor.getLastCursor();

          // create a decoration that follows the marker. A Decoration object is returned which can be updated
          decoration = editor.decorateMarker(marker, { type, item });

          this.setCachedDecoration(editor, type, decoration);
        }

        this.updateToggleButtonStates();
        atom.focus();
      });

      return disposables.add(
        atom.workspace.onDidChangeActivePaneItem(() =>
          this.updateToggleButtonStates()
        )
      );
    }

    //# Decoration API methods

    createDecorationFromCurrentSelection(editor, type) {
      // Get the user's selection from the editor
      let range = editor.getSelectedBufferRange();

      // create a marker that never invalidates that folows the user's selection range
      let marker = editor.markBufferRange(range, { invalidate: "never" });

      // create a decoration that follows the marker. A Decoration object is returned which can be updated
      let decoration = editor.decorateMarker(marker, {
        type,
        class: `${type}-${this.getRandomColor()}`
      });
      return decoration;
    }

    updateDecoration(decoration, newDecorationParams) {
      // This allows you to change the class on the decoration
      return decoration.setProperties(newDecorationParams);
    }

    destroyDecorationMarker(decoration) {
      // Destory the decoration's marker because we will no longer need it.
      // This will destroy the decoration as well. Destroying the marker is the
      // recommended way to destory the decorations.
      return decoration.getMarker().destroy();
    }

    //# Button handling methods

    toggleDecorationForCurrentSelection(type) {
      let editor;
      if (!(editor = this.getEditor())) {
        return;
      }

      let decoration = this.getCachedDecoration(editor, type);
      if (decoration != null) {
        this.destroyDecorationMarker(decoration);
        this.setCachedDecoration(editor, type, null);
      } else {
        decoration = this.createDecorationFromCurrentSelection(editor, type);
        this.setCachedDecoration(editor, type, decoration);
      }

      this.updateToggleButtonStates();
      atom.views.getView(atom.workspace).focus();
      return decoration;
    }

    updateToggleButtonStates() {
      let button, editor, type;
      if ((editor = this.getEditor())) {
        let decorations = this.decorationsByEditorId[editor.id] != null
          ? this.decorationsByEditorId[editor.id]
          : {};
        return (() => {
          let result = [];
          for (type in this.toggleButtons) {
            button = this.toggleButtons[type];
            if (decorations[type] != null) {
              result.push(button.addClass("selected"));
            } else {
              result.push(button.removeClass("selected"));
            }
          }
          return result;
        })();
      } else {
        return (() => {
          let result1 = [];
          for (type in this.toggleButtons) {
            button = this.toggleButtons[type];
            result1.push(button.removeClass("selected"));
          }
          return result1;
        })();
      }
    }

    cycleDecorationColor(type) {
      let editor;
      if (!(editor = this.getEditor())) {
        return;
      }

      let decoration = this.getCachedDecoration(editor, type);
      if (decoration == null) {
        decoration = this.toggleDecorationForCurrentSelection(type);
      }

      let klass = decoration.getProperties().class;
      let currentColor = klass.replace(`${type}-`, "");
      let newColor = this.colors[
        (this.colors.indexOf(currentColor) + 1) % this.colors.length
      ];
      klass = `${type}-${newColor}`;

      return this.updateDecoration(decoration, { type, class: klass });
    }

    //# Utility methods

    getEditor() {
      return atom.workspace.getActiveTextEditor();
    }

    getCachedDecoration(editor, type) {
      return (this.decorationsByEditorId[editor.id] != null
        ? this.decorationsByEditorId[editor.id]
        : {})[type];
    }

    setCachedDecoration(editor, type, decoration) {
      if (this.decorationsByEditorId[editor.id] == null) {
        this.decorationsByEditorId[editor.id] = {};
      }
      return (this.decorationsByEditorId[editor.id][type] = decoration);
    }

    getRandomColor() {
      if (this.randomizeColors) {
        return this.colors[Math.round(Math.random() * 2)];
      } else {
        return this.colors[0];
      }
    }

    attach() {
      return atom.workspace.addBottomPanel({ item: this });
    }

    // Tear down any state and detach
    destroy() {
      return this.detach();
    }
  };
  DecorationExampleView.initClass();
  return DecorationExampleView;
})());

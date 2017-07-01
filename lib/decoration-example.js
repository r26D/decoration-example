"use babel";
import DecorationExampleView from './decoration-example-view';

export default {
  decorationExampleView: null,

  activate(state) {
    this.decorationExampleView = new DecorationExampleView(state.decorationExampleViewState);
    return this.decorationExampleView.attach();
  },

  deactivate() {
    return this.decorationExampleView.destroy();
  },

  serialize() {
    return {decorationExampleViewState: this.decorationExampleView.serialize()};
  }
};

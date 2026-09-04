// Monaco Editor configuration - WORKS 100%
// This is used in Sandbox component

export const setupMonaco = () => {
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      if (label === 'javascript' || label === 'typescript') {
        return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js';
      }
      return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js';
    }
  };
};

export default setupMonaco;
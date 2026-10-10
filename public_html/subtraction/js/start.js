/* Susy the Subtractor — plugs the subtraction engine into the shared Arithmetic Gang shell. */
window.ArithShell.start({
  id: 'subtraction',
  title: 'Subtraction with Susy',
  noun: 'subtraction',
  char: { key: 'susy', name: 'Susy', role: 'Subtractor' },
  storageKey: 'subtraction-susy:progress:v1', // unchanged, so existing learners keep their stars
  C: window.SusyCurriculum,
  D: window.SusyDialogue,
  board: window.SusyBoard
});

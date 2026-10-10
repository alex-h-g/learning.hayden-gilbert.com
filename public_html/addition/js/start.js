/* Andy the Adder — plugs the addition engine into the shared Arithmetic Gang shell. */
window.ArithShell.start({
  id: 'addition',
  title: 'Addition with Andy',
  noun: 'addition',
  char: { key: 'andy', name: 'Andy', role: 'Adder' },
  storageKey: 'arith-addition:progress:v1',
  C: window.AndyCurriculum,
  D: window.AndyDialogue,
  board: window.AndyBoard
});

/* Danny the Divisor — plugs the division engine into the shared Arithmetic Gang shell. */
window.ArithShell.start({
  id: 'division',
  title: 'Division with Danny',
  noun: 'division',
  char: { key: 'danny', name: 'Danny', role: 'Divisor' },
  storageKey: 'arith-division:progress:v1',
  keypadDot: false,
  C: window.DannyCurriculum,
  D: window.DannyDialogue,
  board: window.DannyBoard
});

/** What Gina says. Varied so she doesn't sound the same every time. */
const pickOne = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export const say = {
  correctFirst: () => pickOne(['Brilliant. You worked that out yourself.', 'Spot on — nicely reasoned.', 'Exactly right!', 'Yes! That’s it.', 'Perfect. You didn’t need any help there.']),
  correctStep: () => pickOne(['That’s right.', 'Good — on to the next step.', 'Yes, well done.', 'Correct.', 'Nice. Keep going.']),
  correctAfterHint: () => pickOne(['That’s it! Using the hint was a smart move.', 'Yes — you took the hint and ran with it.', 'Got it. Hints are there to help you think.']),
  correctAfterWrong: () => pickOne(['You got there! Sticking with it is how maths gets easier.', 'Yes! Mistakes are part of learning — you fixed it.', 'That’s it. Well done for having another go.']),
  wrong: () => pickOne(['Not quite, but you’re thinking about the right things.', 'Not quite. Let’s look at the diagram again.', 'Close, but not yet. Take your time.', 'Hmm, not that one. Which rule might help here?']),
  wrongAgain: () => pickOne(['Take your time. We can break this into smaller steps — here’s a hint.', 'Let’s slow down. Here’s a clue to help.', 'That’s okay — tricky ones take a few tries. Here’s a hint.']),
  revealed: () => pickOne(['This one’s tricky — let’s look at the working together. We’ll try an easier one next.', 'No problem. Here’s how it works; read it through, then we’ll try another.', 'Mistakes help us learn. Here’s the reasoning — have a look before moving on.']),
  questionDone: (first: boolean) => (first ? pickOne(['Brilliant. You solved that one all by yourself!', 'Superb — every step right first time.', 'Fantastic work. That was all you!']) : pickOne(['Well done — you got there!', 'Done! Each one makes the next easier.', 'Great persistence. Question complete!'])),
};

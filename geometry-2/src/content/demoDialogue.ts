/** Everything Gina says in the "Why Pythagoras works" demonstration. */
export const DEMO = {
  intro:
    'Today we’re going to discover **why** Pythagoras’ theorem works.\n\nWe’re going to use a triangle, three squares and some colourful little tiles.\n\nBy the end, you’ll be able to **see** why the formula works.',
  introLetters:
    'The letters $a$ and $b$ are the two shorter sides of a right-angled triangle.\n\nThe letter $c$ is the **hypotenuse**: the side opposite the right angle. It’s always the longest side.',
  spotAsk: 'Here’s our triangle. The little square in the corner marks the right angle.\n\nCan you spot the hypotenuse? Tap it.',
  spotHint: 'Look for the side **opposite** the little square marking the right angle — the one that doesn’t touch it.',
  spotHint2: 'The hypotenuse is also the longest side. Which number is biggest?',
  spotRight: 'Yes! The side of length $5$ is opposite the right angle, so it’s the hypotenuse, $c = 5$. The shorter sides are $a = 3$ and $b = 4$.',
  spotExplained: 'Here it is: the side of length $5$ doesn’t touch the right angle, so it’s the hypotenuse, $c = 5$. The other two are $a = 3$ and $b = 4$.',
  squaredAsk: 'Before we draw any squares: what do you think **3 squared** ($3^2$) means?',
  squaredWrong: {
    times2: 'Close, but squaring isn’t doubling. $3^2$ means $3$ multiplied by **itself**.',
    plus: 'That’s $3 + 3$ — adding. Squaring means multiplying the number by itself.',
    digits: 'The little $2$ isn’t a digit — it tells us how many threes to multiply together.',
  },
  squared3: 'Three squared means three multiplied by three.\n\nWe can picture it as a square that is three tiles wide and three tiles high. That gives us **nine** little squares altogether.',
  squared4: 'Four squared is $4 \\times 4$: a square four tiles wide and four tiles high. That’s **sixteen** tiles.',
  squared5: 'And five squared is $5 \\times 5$: five tiles wide, five tiles high — **twenty-five** tiles.\n\nSo “squared” really does mean the area of a square!',
  squaresOn: 'Now let’s build a square on **each side** of the triangle, outside it.\n\nThe blue square sits on the side of length $3$, the orange square on the side of length $4$, and the green square on the hypotenuse, length $5$.',
  exploreBlue: 'Let’s start with the smaller squares.\n\nHow many little squares do you see on the square attached to the side of length $3$? Tap the blue square.',
  exploreOrange: 'Nine! $3 \\times 3 = 9$.\n\nAnd what about the square attached to the side of length $4$? Tap the orange square.',
  exploreSum: 'Sixteen! $4 \\times 4 = 16$.\n\nIf we put the blue tiles and the orange tiles together, how many would we have?',
  exploreSumHint: 'We have nine squares here and sixteen there. How many would we have if we put them together?',
  exploreSumHint2: 'Count on from 16: 17, 18, 19… nine more.',
  exploreRight: '$9 + 16 = 25$. Now look at the green square on the hypotenuse — how many tiles does **it** have room for? Let’s find out!',
  combineReady:
    'The green square has $25$ empty spaces. Let’s see whether the blue and orange tiles can fill them — no gaps, no overlaps.\n\nPress the button when you’re ready.',
  combineBlue: 'Here are the **9 blue tiles** from the square on side $3$…',
  combineOrange: '…and the **16 orange tiles** from the square on side $4$.',
  combineCount: '$9 + 16 = 25$ tiles altogether. Watch them move across!',
  combineMoveOrange: 'The 16 orange tiles slide across together as a $4 \\times 4$ block.',
  combineMoveBlue: 'The 9 blue tiles can’t stay as a $3 \\times 3$ block here, so they’re **rearranged** one by one into the space that’s left. Same 9 tiles, same area — just moved.',
  combineDone:
    'Look at that!\n\nThe square on the side of length $3$ has nine little squares. The square on the side of length $4$ has sixteen.\n\nNine plus sixteen gives us twenty-five. And the square on the hypotenuse holds twenty-five little squares too!',
  discoverAsk: 'What do you notice about the two smaller squares?',
  discoverHint: 'Remember the nine blue squares and sixteen orange squares. What happened when we added them together?',
  discoverRight: 'Exactly! The areas of the two smaller squares **add up** to the area of the square on the hypotenuse.',
  formula:
    'The squares on the two shorter sides have areas of $9$ and $16$ square units.\n\nTogether, they have an area of $25$ square units. The square on the hypotenuse also has an area of $25$ square units.\n\nThat’s why this triangle satisfies Pythagoras’ theorem.',
  formulaAll:
    'This was one example, but it works for **every** right-angled triangle — big or small, and even when the sides aren’t whole numbers. Next, let’s use it on a brand-new triangle.',
  countOf: (n: number, what: string) => `${n} unit squares in the ${what} square.`,
};

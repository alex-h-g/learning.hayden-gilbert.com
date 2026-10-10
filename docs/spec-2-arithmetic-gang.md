Right, let's bring the whole thing together into one coherent project. The aim is to give Claude Code a **complete specification for the arithmetic learning app**, including all four characters, their individual lessons, the practice systems, progression, and the main launch page.

The four characters will have distinct personalities and teaching styles:

- **Susy the Subtractor:** Purple outfit, brown hair and pink bow. Patiently teaches column subtraction and borrowing.
- **Danny the Divisor:** Blue outfit and cap. Guides learners through long division, remainders and eventually decimals.
- **Mandy the Multiplier:** Pink outfit and bow. Teaches multiplication tables and progresses to long-form multiplication.
- **Andy the Adder:** Green outfit. Makes addition approachable, from basic sums to carrying across multiple columns.

The launch page should feature **all four characters together**, with a colourful, cartoon-style design consistent with the mockups. Each character should have a prominent card linking to their respective activity.

I've also included your existing requirements for Susy: the 14-level subtraction curriculum, guided teaching, independent practice, mastery checks, borrowing across zeros, and the on-screen keypad.

For the new characters, the prompt specifies their complete teaching progression rather than just their appearance.

# Complete Claude Code prompt — Arithmetic Learning Hub

**Copy everything below into Claude Code.**

---

## PROJECT: The Arithmetic Gang — Interactive Maths Learning Platform

### 1. Project objective

Build a complete, polished, browser-based arithmetic learning platform for:

`https://learning.hayden-gilbert.com/`

The platform will teach addition, subtraction, multiplication and division through interactive lessons led by four friendly cartoon characters.

The main launch page should introduce all four characters together as a team.

The four learning applications are:

1. Addition with Andy the Adder.
2. Subtraction with Susy the Subtractor.
3. Multiplication with Mandy the Multiplier.
4. Long Division with Danny the Divisor.

Each application must provide structured lessons, guided examples, independent practice, increasing difficulty, supportive feedback, progress tracking and mastery checks appropriate to the subject.

This is an educational application, not simply a collection of calculators or quizzes.

**The objective is to teach learners how and why mathematical techniques work, help them practise those techniques, and gradually build their confidence and independence.**

### Important implementation instructions

Before writing code:

1. Inspect the existing project and identify its technology stack.
2. Inspect the current homepage and all existing activities.
3. Identify the existing routing, styling conventions, assets and deployment arrangements.
4. Locate any existing Susy artwork and other supplied character mockups or images.
5. Produce a brief implementation plan.
6. Implement the application within the existing project wherever practical.

Do not assume that this is a new, empty project.

Do not replace the existing website wholesale or break existing activities.

Preserve working features and extend the existing application.

If a previous version of Susy's subtraction lesson already exists, improve and integrate it rather than creating a duplicate.

---

# PART 1: THE ARITHMETIC GANG

## 2. Character design

The application should have a consistent, polished cartoon aesthetic inspired by the supplied visual mockups.

The characters should be recognisable, expressive and visually consistent across their homepages, lessons, speech bubbles and celebration screens.

Use the supplied artwork whenever available.

**Do not redraw an existing character using CSS or create a generic SVG approximation when proper character artwork is available.**

Look for character assets in the repository, particularly under:

`/assets/susy/`

Use the existing naming conventions and asset locations if they differ.

If a supplied character exists only as a composite image or contact sheet, inspect it and, where practical, crop the individual poses into reusable transparent PNG or WebP assets. Preserve the artwork rather than attempting to recreate it.

If the required assets are genuinely missing, implement the rest of the application using clearly defined asset references and report which artwork still needs to be supplied. Do not silently substitute a different character design.

### Character 1: Susy the Subtractor

**Colour:** Purple.

**Appearance:** Brown hair, pink bow, purple top with a white S.

**Personality:** Patient, encouraging, thoughtful and supportive.

Susy specialises in column subtraction and regrouping.

She should have expressions for:
- Welcoming the learner.
- Thinking.
- Explaining.
- Pointing to a digit.
- Encouraging the learner.
- Offering a hint.
- Reassuring the learner after a mistake.
- Celebrating success.

Her lessons must teach subtraction from two-digit calculations through to challenging four-digit calculations.

Her defining feature is her ability to explain borrowing one step at a time.

### Character 2: Danny the Divisor

**Colour:** Blue.

**Appearance:** Friendly cartoon boy wearing a blue cap and blue top featuring a white D.

**Personality:** Calm, methodical, patient and reassuring.

Danny teaches division.

He should help learners understand:
- What division means.
- How division relates to multiplication.
- Exact division.
- Long division.
- Quotients and remainders.
- Division involving larger numbers.
- Decimal answers.
- Long division involving decimals, introduced only after the learner has mastered the earlier skills.

Danny should break every calculation into manageable steps.

### Character 3: Mandy the Multiplier

**Colour:** Pink.

**Appearance:** Friendly cartoon girl with brown hair, a pink bow and a pink top featuring a white M.

**Personality:** Energetic, encouraging, enthusiastic and patient.

Mandy teaches multiplication.

She should first assess the learner's multiplication-table knowledge, then offer lessons progressing from basic multiplication to long multiplication involving increasingly large numbers.

Her defining feature is her ability to break complicated multiplication into manageable calculations and show how the partial results are combined.

### Character 4: Andy the Adder

**Colour:** Green.

**Appearance:** Friendly cartoon boy with brown or reddish-brown hair and a green top featuring a white A.

**Personality:** Cheerful, straightforward, supportive and reassuring.

Andy teaches addition.

Addition should be the simplest of the four applications.

His lessons should cover:
- Basic addition.
- Adding two-digit numbers.
- Carrying into the next column.
- Three-digit addition.
- Four-digit addition.
- Adding numbers with different numbers of digits.
- Mixed practice.

Andy should still teach the method, provide guided examples and offer independent practice.

Do not overcomplicate his application.

---

# PART 2: THE MAIN LAUNCH PAGE

## 3. Homepage design

Create a dedicated arithmetic launch page within the existing learning website.

Use the existing homepage and project structure as the starting point.

If the website already has a homepage, integrate the arithmetic section into it or adapt the existing activity structure. Do not overwrite unrelated content.

The launch page should feel like a colourful educational game hub.

### Main heading

**Meet the Arithmetic Gang!**

Suggested introduction:

"Ready to become a maths superstar?

Meet Andy, Susy, Mandy and Danny. They'll help you learn the tricks, practise your skills and tackle bigger challenges, one step at a time."

Use a friendly, readable typeface, colourful illustrations, rounded cards and generous spacing.

The design should appeal to children without feeling overly childish to older learners.

### Hero section

Feature all four characters together.

They should appear to be a team, with consistent proportions, visual styling and expressions.

The group illustration should be the main visual feature of the launch page.

Use the supplied character artwork to achieve this where possible.

Do not simply place four unrelated images side by side if a better group composition can be made using the available assets.

The character names and subjects should be clearly visible.

### Four activity cards

Display four prominent cards beneath the hero section.

**Andy the Adder**

"Learn addition, master carrying and build confidence with bigger numbers."

Button: **Let's Add!**

**Susy the Subtractor**

"Learn subtraction step by step, from simple sums to tricky borrowing."

Button: **Let's Subtract!**

**Mandy the Multiplier**

"Learn your times tables and master long multiplication."

Button: **Let's Multiply!**

**Danny the Divisor**

"Learn division step by step, from simple sharing to long division and decimals."

Button: **Let's Divide!**

Each card must use the corresponding character's actual artwork.

Link each card to its respective lesson.

Suggested routes:

- `/addition`
- `/subtraction`
- `/multiplication`
- `/division`

Follow the existing routing conventions if they differ.

### Progress overview

If the learner has previously used the application, show an optional progress summary.

For example:

- Addition: Level 3 completed.
- Subtraction: Level 5 completed.
- Multiplication: Times-table assessment completed.
- Division: Getting started.

Do not show misleading progress for activities that the learner has never attempted.

Store progress locally in the browser.

### Future expansion

Keep the homepage architecture modular so that additional learning activities can be added later.

Do not add non-functional links.

---

# PART 3: SHARED LEARNING ENGINE

## 4. The learning philosophy

All four applications should follow a consistent educational structure while allowing each subject to have its own teaching method.

Every new skill should progress through four phases.

### Phase A: Learn

The character introduces the concept and explains how it works.

Use simple language, visual examples and interactive demonstrations.

### Phase B: Guided practice

The learner completes examples with the character's help.

The character explains each step and provides hints when needed.

### Phase C: Independent practice

The learner solves problems with progressively less assistance.

Hints remain available.

### Phase D: Mastery check

The learner completes a short assessment to demonstrate their understanding.

If they demonstrate mastery, the next level becomes available.

If they struggle, offer additional practice targeted at the relevant skill.

Do not treat a learner's mistakes as failures.

**The characters should behave like patient tutors, not judges.**

### Personalisation

On the first visit to each application, allow the learner to provide a preferred name.

The name is optional.

If provided, the character may use it naturally in their dialogue.

For example:

"Well done, Alex! You worked that out brilliantly."

Store the name locally using localStorage.

Allow the learner to change or clear it.

Do not transmit personal information to a server.

The four applications should share the same learner profile so that the name and progress experience are consistent across the platform.

### Adaptive assistance

Track the learner's performance for each skill.

If they struggle with borrowing, offer additional subtraction practice.

If they understand basic multiplication but struggle with carrying, offer more practice with carrying.

Do not assume that a learner's overall mathematical ability is uniform across all subjects.

The system should recognise individual strengths and weaknesses.

### Progress tracking

Store locally:
- Questions attempted.
- Correct answers.
- Assisted answers.
- Independent answers.
- Hints used.
- Skills completed.
- Levels completed.
- Current level.
- Best performance.

Progress must survive a browser refresh.

Provide a way to reset progress.

Do not require registration or a backend.

### Mastery requirements

Use a configurable default mastery threshold of 80% across at least five assessment questions.

Track independent performance separately from assisted performance.

Watching a demonstration must not count as demonstrating mastery.

Previously completed lessons should remain accessible even after the learner progresses.

### Feedback

Use natural, varied dialogue.

Examples:

- "Great work!"
- "Nearly there. Let's look at that again."
- "You're getting the hang of this."
- "Would you like a hint?"
- "Fantastic! You've mastered that step."
- "This one is a little trickier. Let's work through it together."

After two unsuccessful attempts, offer a more explicit hint.

After three unsuccessful attempts, offer a worked demonstration.

Do not immediately reveal the answer on the first mistake.

Do not make the learner repeat correctly completed steps unnecessarily.

---

# PART 4: ANDY THE ADDER

## 5. Addition curriculum

Addition should be the simplest of the four applications.

The objective is to provide a complete, friendly introduction to column addition without excessive complexity.

### Level 1: Single-digit addition

Examples:

- 3 + 4
- 5 + 2
- 6 + 3

Teach the learner to add two numbers.

Use simple visual explanations.

### Level 2: Two-digit addition without carrying

Examples:

```text
  23
+ 14
----
```

```text
  45
+ 32
----
```

Teach place-value alignment and addition from the units column.

### Level 3: Two-digit addition with carrying

Examples:

```text
  27
+ 18
----
```

```text
  46
+ 37
----
```

Teach the learner that when the units add up to ten or more, the extra ten is carried into the next column.

Show the carried digit clearly.

### Level 4: Three-digit addition

Begin with examples that do not require carrying.

Then introduce carrying in one or more columns.

### Level 5: Four-digit addition

Progress to larger numbers and more complex carrying.

### Level 6: Mixed addition challenge

Combine the skills already introduced.

Include different number lengths and problems requiring carrying across multiple columns.

### Andy's teaching interface

Use a vertical column-addition layout.

Highlight the current column.

Display carried digits above the relevant column.

Provide the same style of on-screen numeric keypad used by the other applications.

Andy should explain each step, offer hints and provide short celebrations.

Do not introduce subtraction or negative numbers into Andy's lessons.

### Practice and mastery

Each level must include:
- A short introduction.
- Guided examples.
- Independent practice.
- A mastery check.

Generate varied questions appropriate to the level.

Validate the intermediate working as well as the final answer.

---

# PART 5: SUSY THE SUBTRACTOR

## 6. Subtraction curriculum

Implement Susy's subtraction application using the established 14-level curriculum.

The progression is:

1. Two-digit numbers minus one-digit numbers, without borrowing.
2. Two-digit numbers minus one-digit numbers, with borrowing.
3. Two-digit numbers minus two-digit numbers, without borrowing.
4. Two-digit numbers minus two-digit numbers, with borrowing.
5. Three-digit numbers minus one-digit numbers.
6. Three-digit numbers minus two-digit numbers, without borrowing.
7. Three-digit numbers minus two-digit numbers, with borrowing.
8. Three-digit numbers minus three-digit numbers, without borrowing.
9. Three-digit numbers minus three-digit numbers, with borrowing.
10. Four-digit numbers minus one-digit or two-digit numbers.
11. Four-digit numbers minus three-digit numbers.
12. Four-digit numbers minus four-digit numbers, without borrowing.
13. Four-digit numbers minus four-digit numbers, with borrowing.
14. Mixed subtraction challenge.

Every level must contain teaching, guided practice, independent practice and a mastery check.

Generate questions dynamically.

Ensure that the question generator follows the requirements of the selected level.

Do not accidentally generate a borrowing question in a level intended to teach subtraction without borrowing.

### Interactive borrowing

The regrouping engine is the most important part of Susy's application.

For example:

```text
  58
- 49
----
```

Susy identifies that 8 is smaller than 9.

She asks:

"Uh-oh! We can't take 9 away from 8 just yet.

Do you think we need to borrow a ten from next door?"

The learner chooses whether to borrow.

Susy guides the learner through:
1. Reducing the tens digit from 5 to 4.
2. Showing the original 5 crossed out.
3. Increasing the units digit from 8 to 18.
4. Calculating 18 − 9.
5. Calculating 4 − 4.
6. Completing the answer.

The learner participates in every step.

Do not simply reveal the final answer.

Support borrowing across zero and multiple columns.

For example, the application must correctly teach the regrouping involved in:

```text
  402
- 187
-----
```

The visual representation must remain mathematically correct throughout the calculation.

Implement the arithmetic and regrouping logic independently of the user interface.

Test all intermediate states.

### Practice

After guided examples, let the learner solve additional questions with reduced assistance.

Provide hints, replayable explanations and targeted practice.

Reward progress and demonstrated understanding.

---

# PART 6: MANDY THE MULTIPLIER

## 7. Multiplication learning experience

Mandy's application has two distinct objectives:

1. Assess and improve the learner's multiplication-table knowledge.
2. Teach written multiplication, including multi-step long multiplication.

Do not assume that the learner knows their times tables just because they say they do.

However, do not make the initial assessment feel like an examination.

Mandy should make it playful and encouraging.

## 8. The times-table introduction

When the learner first enters Mandy's application, she asks:

"Hi there! I'm Mandy the Multiplier.

Before we start multiplying bigger numbers, let's see how well you know your times tables.

Do you know your times tables?"

Provide two choices:

- Yes, let's go!
- Not yet. I need some practice.

**Regardless of which option the learner chooses, Mandy must begin with a short diagnostic assessment consisting of exactly three randomly selected multiplication questions.**

Each question must be of the form:

`x × y`

where both `x` and `y` are integers from 1 to 9 inclusive.

For example:
- 6 × 7
- 4 × 8
- 3 × 9

Randomly select the questions each time, avoiding duplicate questions within the same three-question assessment.

Do not use the same fixed three questions for every learner.

The learner should answer each question using the on-screen numeric keypad.

After each answer, Mandy provides friendly feedback.

Once all three questions have been answered, show a short summary.

For example:

"You got 2 out of 3 right! Great start. Let's practise a few multiplication tricks before we move on."

Or:

"Brilliant! You knew all three. Let's see how you get on with multiplying bigger numbers."

Do not make assumptions about overall multiplication mastery based solely on these three questions.

The assessment is a starting point, not a final judgement.

Offer the learner the opportunity to practise their times tables before proceeding.

### Times-table practice

Provide a simple practice mode covering multiplication facts from 1 × 1 through 9 × 9.

Allow the learner to practise individual tables or mixed questions.

Include:
- Randomised questions.
- An on-screen keypad.
- Immediate supportive feedback.
- Optional hints.
- Progress tracking.
- A way to repeat questions answered incorrectly.

Allow the learner to proceed to written multiplication even if they have not mastered every times-table fact.

Recommend additional practice where appropriate, but do not create an unnecessary barrier.

---

## 9. Long multiplication curriculum

Once the learner has completed the introductory assessment, Mandy begins teaching written multiplication.

The progression should introduce one major new skill at a time.

### Level 1: One-digit multiplication

Examples:

- 3 × 4
- 6 × 7
- 8 × 5

Use this level to establish the multiplication process and identify whether the learner needs additional times-table practice.

Do not spend too long on this level if the learner already demonstrates confidence.

### Level 2: Two-digit numbers multiplied by one-digit numbers, without carrying

Examples:

```text
  23
×  3
----
```

```text
  12
×  4
----
```

Teach the learner to multiply the units and tens.

Use vertical notation.

Explain why place value matters.

### Level 3: Two-digit numbers multiplied by one-digit numbers, with carrying

Examples:

```text
  27
×  4
----
```

```text
  36
×  7
----
```

Teach the learner to:
1. Multiply the units.
2. Write the units digit.
3. Carry the remaining tens.
4. Multiply the tens.
5. Add the carried value.
6. Complete the answer.

Mandy must explain carrying step by step.

The learner should enter each digit using the on-screen keypad.

### Level 4: Two-digit numbers multiplied by two-digit numbers

Begin with straightforward examples.

For example:

```text
   23
×  12
-----
```

Teach the learner to multiply by the units digit first.

Then teach multiplication by the tens digit.

Explain that the second partial product represents multiplication by a multiple of ten, so it must be correctly aligned with the tens column.

Show the two partial products separately.

Then guide the learner through adding them together.

For 23 × 12, the working should be:

```text
    23
 ×  12
 -----
    46
 + 230
 -----
   276
```

The precise visual layout may vary, but the place-value alignment must be correct.

Mandy should explain why the second row represents 23 × 10 rather than another multiplication by 2.

This is an essential conceptual step.

### Level 5: Three-digit numbers multiplied by two-digit numbers

Examples:

```text
   123
×   24
------
```

Teach the learner to:
1. Multiply the three-digit number by the units digit.
2. Write the first partial product.
3. Multiply the three-digit number by the tens digit.
4. Align the second partial product correctly.
5. Add the partial products.

Introduce carrying within the partial products and then addition of the results.

Do not introduce every difficulty simultaneously.

Use guided examples followed by independent practice.

### Level 6: Three-digit numbers multiplied by three-digit numbers

Examples:

```text
   123
×  234
------
```

Teach the learner to generate three partial products.

Explain the significance of the units, tens and hundreds digits of the multiplier.

Each partial product must be aligned according to place value.

Then guide the learner through adding the partial products.

This level is more demanding, so include additional guided examples and allow the learner to practise each component separately.

### Level 7: Mixed multiplication challenge

Combine the skills already introduced.

Include:
- Times-table questions.
- Two-digit by one-digit multiplication.
- Carrying.
- Two-digit by two-digit multiplication.
- Three-digit by two-digit multiplication.
- Three-digit by three-digit multiplication.

Only include question types that the learner has already been taught.

The learner should identify the required technique independently.

---

## 10. Mandy's long-multiplication interface

This interface must be particularly clear because long multiplication involves multiple stages.

Use a vertical calculation layout.

Display:
- The original numbers.
- The active digit.
- The multiplication currently being performed.
- Any carried digits.
- Each partial product.
- The final addition of partial products.

Provide an on-screen keypad.

The learner should enter the answers step by step.

Mandy must explain what each row represents.

For example:

"Great! We've finished multiplying by the units digit.

Now we're multiplying by the tens digit.

Remember, this 2 represents 20, not just 2, so our answer needs to line up with the tens column."

Highlight the relevant place-value column.

When a partial product is complete, preserve it visibly while the learner moves to the next step.

After all partial products have been generated, guide the learner through adding them together.

Do not simply calculate the final answer and display it.

The learner must participate in the written multiplication process.

### Common errors

Detect and explain common mistakes, including:
- Forgetting a carried digit.
- Incorrect carrying.
- Misaligning the second partial product.
- Forgetting the place-value shift.
- Adding partial products incorrectly.

Offer targeted hints.

Do not erase correctly completed work unnecessarily.

### Practice and mastery

Each level must include:
- A short introduction.
- Guided examples.
- Independent practice.
- A mastery check.

Times-table practice should remain available throughout the multiplication application.

If the learner struggles with a multiplication fact during long multiplication, Mandy can offer a hint or recommend practising that fact.

Do not interrupt every calculation with a times-table test.

---

# PART 7: DANNY THE DIVISOR

## 11. Division learning experience

Danny teaches division from the foundations upward.

The learner should understand what division means before attempting formal long division.

The progression must be gentle.

Begin with simple, exact divisions.

Then introduce long division, remainders and decimals.

Each level must include teaching, guided practice, independent practice and a mastery check.

## 12. Division curriculum

### Level 1: Understanding division

Introduce division as sharing equally and grouping.

Examples:

- 12 ÷ 3
- 15 ÷ 5
- 20 ÷ 4

Use simple visual explanations, such as grouping objects into equal sets.

Explain that division asks how many equal groups can be made or how many objects belong in each group.

Introduce the division symbol.

Do not overwhelm the learner with formal terminology.

### Level 2: Exact division

Introduce simple divisions where the answer is a whole number and there is no remainder.

Examples:

- 27 ÷ 9
- 27 ÷ 3
- 36 ÷ 4
- 48 ÷ 6
- 56 ÷ 7

Explain the relationship between multiplication and division.

For example:

"27 divided by 3 asks how many groups of 3 fit into 27.

We know that 3 × 9 = 27, so 27 ÷ 3 = 9."

Encourage the learner to use multiplication facts to help solve division questions.

### Level 3: Introduction to long division

Introduce the written long-division method.

Begin with examples such as:

```text
27 ÷ 3
```

Then progress to:

```text
84 ÷ 4
```

Show the dividend, divisor and quotient clearly.

Explain each stage of the long-division process.

Danny should demonstrate how to:
1. Determine how many times the divisor fits into the current part of the dividend.
2. Write the next quotient digit.
3. Multiply the divisor by that digit.
4. Subtract the result.
5. Bring down the next digit.
6. Repeat until the calculation is complete.

Do not expect the learner to understand the entire algorithm immediately.

Guide them through each operation.

### Level 4: Two-digit dividends with one-digit divisors

Examples:

- 96 ÷ 3
- 84 ÷ 4
- 75 ÷ 5

Begin with straightforward calculations and progress to examples requiring several stages.

The learner should actively enter each quotient digit and intermediate subtraction result.

### Level 5: Three-digit dividends with one-digit divisors

Examples:

- 144 ÷ 3
- 248 ÷ 4
- 369 ÷ 3

Teach the learner to continue the long-division process across multiple digits.

Explain why each quotient digit belongs in its particular place-value position.

Include examples where a quotient position is zero.

For example:

```text
408 ÷ 4 = 102
```

Explain why the zero in the quotient is necessary.

### Level 6: Division with remainders

Introduce division where the dividend is not exactly divisible by the divisor.

Begin with simple examples.

For example:

```text
29 ÷ 8
```

Danny should guide the learner through the calculation:

- 8 fits into 29 three times.
- 3 × 8 = 24.
- 29 − 24 = 5.
- The remainder is 5.

Show the answer as:

`3 remainder 5`

Explain that the remainder must be smaller than the divisor.

The learner should practise recognising when a division has a remainder.

### Level 7: Larger divisions with remainders

Progress to larger dividends.

Examples:

- 157 ÷ 6
- 245 ÷ 8
- 389 ÷ 7

Use long division and guide the learner through every stage.

Include problems with multiple quotient digits and remainders.

### Level 8: Introduction to decimal answers

Once the learner has demonstrated an understanding of remainders, introduce decimal answers.

Use simple examples first.

For example:

```text
7 ÷ 2 = 3.5
```

Explain that a remainder can sometimes be expressed as a decimal.

Introduce the idea of adding a decimal point and a zero to the dividend so the calculation can continue.

Use clear visual guidance.

Do not introduce decimal division before the learner has understood exact division and remainders.

### Level 9: Long division with decimal answers

Progress to examples such as:

- 15 ÷ 4
- 25 ÷ 8
- 7 ÷ 4
- 125 ÷ 5

Teach the learner how to continue the calculation beyond the decimal point.

Explain each step carefully.

Include examples where the answer terminates and examples that would otherwise continue repeating.

For the initial version, use terminating decimal answers or clearly specify when a question should be rounded to a particular number of decimal places.

Do not expect the learner to understand recurring decimals at this stage.

### Level 10: Mixed division challenge

Combine:
- Exact division.
- Long division.
- Division with remainders.
- Division producing decimal answers.

The learner must identify the appropriate approach.

Only include question types that have already been introduced.

---

## 13. Danny's long-division interface

Use a clear long-division layout.

For example, display 27 ÷ 3 using a conventional long-division bracket.

Highlight the current portion of the dividend.

Show the current quotient digit.

Show the multiplication and subtraction steps beneath the dividend.

Use the on-screen keypad for entering digits.

Danny should explain each stage.

Example:

"Great! Let's see how many times 3 goes into 27.

We know that 3 × 9 = 27.

So what number should we put in the quotient?"

The learner enters 9.

Danny confirms the answer and continues.

For longer calculations, guide the learner through:
1. Division.
2. Multiplication.
3. Subtraction.
4. Bringing down the next digit.
5. Repeating the process.

When remainders are introduced, explain why the remainder is what remains after subtracting the largest suitable multiple of the divisor.

When decimals are introduced, explain how the calculation continues beyond the decimal point.

### Common errors

Detect and explain common mistakes, including:
- Choosing a quotient digit that is too large.
- Multiplying incorrectly.
- Subtracting incorrectly.
- Forgetting to bring down a digit.
- Writing quotient digits in the wrong position.
- Recording an invalid remainder.
- Placing the decimal point incorrectly.

Offer supportive hints.

Preserve correctly completed steps.

### Practice and mastery

Each level must contain guided examples, independent practice and a mastery check.

If the learner struggles with a particular stage, provide additional practice targeting that skill.

Do not require the learner to restart the entire problem because of a single mistake.

---

# PART 8: SHARED USER INTERFACE

## 14. On-screen keypad

All four applications should use a consistent on-screen keypad.

It must be suitable for iPads, tablets, phones and desktop computers.

The keypad should include:
- Digits 0–9.
- Backspace.
- Clear or undo where appropriate.
- Done or Confirm.

The keypad should have large, rounded buttons with clear labels.

Use a colourful style consistent with the character's application.

For example:
- Purple accents for Susy.
- Blue accents for Danny.
- Pink accents for Mandy.
- Green accents for Andy.

Do not make the keypad excessively small on tablets.

The learner must be able to complete all lessons without using the physical keyboard.

Support physical keyboard input as well.

Ensure that input goes into the intended digit position.

The application must prevent accidental overwriting of the original calculation.

Different steps may require different input behaviours, so the keypad should respond to the active lesson state.

---

## 15. Tablet and iPad support

**The application must be designed for iPads and other tablets from the beginning, not adapted for them afterwards.**

Support:
- Desktop browsers.
- iPad Safari.
- Android tablet browsers.
- Mobile Safari.
- Android mobile browsers.

Use responsive layouts.

On larger screens, use a balanced multi-column layout with the character, explanation, calculation and keypad clearly visible.

On tablets, ensure the keypad remains large enough for comfortable touch input.

On phones, rearrange the layout vertically.

Avoid hover-only interactions.

Every action must work through touch.

Provide visible feedback when a button is pressed.

Do not rely on right-click, mouseover or keyboard-only controls.

Support portrait and landscape orientation.

The layout should adapt when the tablet is rotated.

Avoid fixed-width designs that overflow smaller screens.

Do not let speech bubbles obscure the calculation.

The learner must be able to see the active column, current calculation and keypad simultaneously wherever practical.

### Accessibility

Implement:
- Clear labels.
- Keyboard navigation.
- Visible focus indicators.
- Sufficient colour contrast.
- Screen-reader announcements for important feedback.
- Reduced-motion support.
- Touch-friendly controls.

Do not communicate correct or incorrect answers through colour alone.

---

# PART 9: VISUAL DESIGN

## 16. Overall design language

Use the supplied mockups as the primary visual reference.

The aesthetic should be:
- Colourful.
- Cartoon-like.
- Friendly.
- Modern.
- Clean.
- Consistent.
- Suitable for children without alienating older learners.

Use rounded cards, soft backgrounds, bold headings and clear typography.

Give each character a distinct colour identity.

Use consistent components for:
- Speech bubbles.
- Progress indicators.
- Level cards.
- Numeric keypads.
- Calculation panels.
- Hint buttons.
- Celebration screens.
- Navigation.
- Mastery indicators.

The characters should be visually prominent without obscuring the mathematical work.

Use the actual character assets wherever available.

Do not substitute emoji or generic illustrations for the characters.

Animations should be brief and purposeful.

Respect the user's reduced-motion preferences.

Sound effects should be optional and muted by default.

Avoid excessive confetti or animations that slow the learner down.

---

# PART 10: TECHNICAL ARCHITECTURE

## 17. Implementation requirements

Inspect the existing project and follow its current technology stack and coding conventions wherever practical.

Do not introduce a large framework solely for this project.

Do not add paid services, external APIs or unnecessary backend dependencies.

The application should work without external API keys.

Keep the architecture modular.

Separate the following concerns:

1. Curriculum definitions.
2. Question generation.
3. Arithmetic validation.
4. Intermediate calculation logic.
5. Lesson state management.
6. Character dialogue.
7. User interface components.
8. Progress persistence.
9. Character assets.
10. Styling and animations.

Create reusable components for common interface elements.

The four applications should share a consistent design system while retaining their own curriculum and calculation logic.

Do not implement all four subjects as one enormous component.

Use clear, maintainable modules.

### Arithmetic engines

Each operation requires its own calculation logic.

Addition must calculate carries correctly.

Subtraction must calculate borrowing and regrouping correctly.

Multiplication must calculate carries and partial products correctly.

Division must calculate quotient digits, intermediate products, remainders and decimal continuation correctly.

**The arithmetic engine must validate intermediate steps, not just final answers.**

The interface must never display mathematically incorrect working.

For example, Mandy must not show a correct multiplication answer alongside incorrectly aligned partial products.

Danny must not show an invalid remainder.

Susy must not display incorrect regrouping across zero.

Keep calculation logic independent of presentation so it can be tested separately.

### Question generation

Questions must be generated dynamically according to the current level.

Do not rely on a small collection of fixed examples.

Avoid repeating questions too frequently.

Every generated question must be validated before it is displayed.

The generator must understand:
- Operand size.
- Whether carrying or borrowing is allowed.
- Whether carrying or borrowing is required.
- The difficulty of intermediate steps.
- The relevant learning objective.
- Whether the question belongs in the selected level.

Do not accidentally generate questions requiring an unintroduced skill.

### Local persistence

Use localStorage for:
- Preferred name.
- Progress.
- Level completion.
- Assessment results.
- Skills mastered.
- Practice history.
- Optional sound preferences.

Handle missing, malformed or outdated stored data gracefully.

Provide a way to reset progress.

Do not require an account.

### Performance

Keep the application lightweight.

Optimise character assets.

Avoid unnecessarily large images.

Avoid loading assets that are not needed for the current page.

Prevent layout shifts.

Ensure animations remain smooth on ordinary devices.

---

# PART 11: TESTING

## 18. Arithmetic correctness

Create automated tests for each arithmetic engine.

At minimum, test the following addition calculations:

- 23 + 14 = 37.
- 27 + 18 = 45.
- 347 + 268 = 615.
- 768 + 584 = 1,352.

Test subtraction:

- 52 − 28 = 24.
- 58 − 49 = 9.
- 402 − 187 = 215.
- 6000 − 4321 = 1679.

Test multiplication:

- 6 × 7 = 42.
- 23 × 4 = 92.
- 23 × 12 = 276.
- 123 × 24 = 2952.
- 123 × 234 = 28782.

Test division:

- 27 ÷ 9 = 3.
- 27 ÷ 3 = 9.
- 84 ÷ 4 = 21.
- 29 ÷ 8 = 3 remainder 5.
- 7 ÷ 2 = 3.5.
- 408 ÷ 4 = 102.

Verify all intermediate working, not just the final results.

### Curriculum testing

Verify that:
- Each level generates appropriate questions.
- No-borrowing and no-carrying levels follow their rules.
- Levels requiring borrowing or carrying include suitable examples.
- Multiplication's initial diagnostic contains exactly three random questions.
- Both factors in the diagnostic are between 1 and 9.
- The diagnostic questions are not duplicated within the same assessment.
- Division introduces remainders only after exact division.
- Decimal division is introduced only after the learner has covered remainders.
- Mastery checks are scored correctly.
- Learners cannot unlock a level simply by clicking through lessons.
- Previously completed levels remain accessible.

### Interaction testing

Verify that:
- All four characters appear on the launch page.
- Each activity card opens the correct application.
- The keypad works.
- Physical keyboard input works.
- Hints work.
- Incorrect answers produce supportive feedback.
- Completed steps are preserved.
- Progress persists after refreshing.
- Progress can be reset.
- The application does not get stuck after unexpected input.

### Tablet testing

Test the layouts at common tablet sizes in both portrait and landscape orientations.

Check for:
- Clipped calculations.
- Overlapping speech bubbles.
- Unusable keypads.
- Unwanted horizontal scrolling.
- Incorrect column alignment.
- Controls that are too small to tap.

Also test desktop and mobile layouts.

### Regression testing

Ensure that existing website pages and activities continue to work.

Do not claim that tests passed unless they were actually performed.

---

# PART 12: IMPLEMENTATION WORKFLOW

## 19. Build the application in stages

### Phase 1: Inspect the existing project

Identify:
- Technology stack.
- Homepage structure.
- Existing activities.
- Routes.
- Assets.
- Deployment requirements.

Report the findings briefly.

### Phase 2: Establish the shared design system

Implement or extend the shared components for:
- Character presentation.
- Speech bubbles.
- Level cards.
- Progress indicators.
- Numeric keypad.
- Calculation panels.
- Feedback.
- Celebrations.

Use the supplied artwork.

### Phase 3: Build the arithmetic launch page

Introduce the four characters together.

Create the four activity cards.

Integrate the page with the existing website.

Ensure all routes work.

### Phase 4: Complete Susy's subtraction application

Implement the 14-level curriculum, including guided borrowing, independent practice, mastery checks and borrowing across zero.

Preserve and improve existing working features.

### Phase 5: Build Mandy's multiplication application

Implement the three-question diagnostic, times-table practice and the complete long-multiplication curriculum.

Pay particular attention to carrying and partial-product alignment.

### Phase 6: Build Danny's division application

Implement exact division, long division, remainders and decimal answers.

Pay particular attention to quotient placement, bringing down digits and decimal continuation.

### Phase 7: Build Andy's addition application

Implement basic addition, carrying, multi-digit calculations and mixed practice.

Keep the application simple and approachable.

### Phase 8: Integrate progress tracking

Ensure that learner preferences and progress are stored consistently across all four activities.

### Phase 9: Test everything

Test arithmetic, intermediate working, curriculum progression, persistence, responsive design and existing functionality.

Fix any errors discovered.

### Phase 10: Report and prepare for deployment

Provide a summary of:
- What was implemented.
- Which files were created or modified.
- Which tests were run.
- Whether the acceptance criteria passed.
- Any remaining limitations.
- The steps needed to deploy the application to SiteGround.

Do not deploy to production without explicit authorisation.

---

# FINAL INSTRUCTION

Build a complete arithmetic learning platform centred around Andy the Adder, Susy the Subtractor, Mandy the Multiplier and Danny the Divisor.

The homepage must introduce all four characters together as a friendly team.

Each character must lead a complete, structured learning experience that progresses from foundational concepts to more advanced techniques.

The applications must include guided teaching, independent practice, increasing difficulty, supportive feedback, mastery checks and local progress tracking.

Use the supplied character artwork wherever available.

Make the experience work beautifully on desktop computers, iPads, tablets and mobile devices.

Prioritise mathematical correctness, clear explanations, accurate intermediate working and reliable progression over decorative features.

**Do not build four disconnected calculators. Build four complementary learning experiences that share a common visual identity and a consistent approach to teaching.**

Start by inspecting the existing project. Then implement the application in the order specified above, preserving existing functionality and testing each stage before proceeding.

---

## A final practical recommendation

I would give Claude Code this prompt **in the existing learning-hub project**, rather than starting a fresh project.

One other point is worth keeping in mind: this is a fairly substantial application. The prompt describes the complete end goal, but Claude may need to implement and test it in stages rather than successfully completing everything in one pass.

The most important acceptance test is that the arithmetic working is correct at every step, not just that the final answer is correct.

Once the shared interface and the four characters are established, the site should also be much easier to extend with fractions, percentages, geometry and other educational activities later.
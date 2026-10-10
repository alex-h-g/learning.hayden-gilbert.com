Absolutely. I think the original prompt was too focused on teaching individual subtraction problems and didn't give enough attention to the progression from beginner to confident learner.

**Susy should work like a combination of a patient tutor and a maths practice game.** She teaches a new skill, demonstrates it, guides the learner through it, and then gives them enough practice to master it before introducing the next challenge.

I'd structure the difficulty around three things:

1. **Number size:** Start with two-digit numbers, then progress to three-digit and four-digit numbers.
2. **Borrowing difficulty:** Introduce subtraction without borrowing first, then borrowing across one column, and eventually borrowing across zeros and multiple columns.
3. **Independence:** Initially, Susy guides almost every step. As the learner improves, she gradually steps back and lets them solve problems independently.

The important point is that these should be separate dimensions of difficulty. A three-digit subtraction problem without borrowing may be easier than a two-digit problem requiring regrouping. The levels should account for that.

Here is the revised prompt. I've rewritten the whole specification so you can copy and paste it directly into Claude Code.

The biggest change is that **every level now has a teaching phase, guided practice, independent practice and a mastery check**. Susy also needs to remember which skills the learner has mastered and provide extra practice when necessary.

---

# CLAUDE CODE PROJECT: SUSY THE SUBTRACTOR
## An interactive subtraction learning game for learning.hayden-gilbert.com

### 1. Project overview

Build a polished, interactive, browser-based educational application that teaches children how to perform multi-digit subtraction using the traditional column-subtraction method, including borrowing, also known as regrouping.

The application will be published at:

`https://learning.hayden-gilbert.com/subtraction`

It will be part of an existing educational website.

**IMPORTANT: Inspect the existing project before making changes.**

Determine the current technology stack, directory structure, routing, homepage design and deployment arrangements.

Integrate the new lesson into the existing website rather than creating a disconnected application.

Preserve all existing functionality.

The application must work in a normal web browser without requiring installation, registration or a backend account.

The primary audience is children aged approximately 6–12, although the application should be useful to anyone learning or practising subtraction.

The objective is not simply to teach children how to obtain the correct answer.

The application must teach them to understand the subtraction process, practise it repeatedly, recognise mistakes and eventually complete problems independently.

**The guiding principle is: Teach a skill, practise it together, practise independently, demonstrate mastery, then move on to the next skill.**

The application should combine the qualities of:
- A friendly personal tutor.
- A structured maths curriculum.
- An interactive workbook.
- A motivating practice game.

It must not feel like a calculator with a cartoon character attached.

---

# 2. Meet Susy the Subtractor

Create an original cartoon character named **Susy the Subtractor**.

Susy is the learner's friendly guide throughout the application.

### Character design

Susy should be:
- Cute, friendly and approachable.
- A cheerful cartoon girl.
- Visually distinctive and recognisable.
- Expressive, with clear facial expressions.
- Colourful without being overwhelming.
- Suitable for younger learners.

A suggested design is a girl with brown hair, a pink hair accessory and a purple top featuring a large white letter S.

Use this as a starting point rather than a restriction.

Create a consistent set of character illustrations or visual states:

1. Welcoming.
2. Thinking.
3. Explaining.
4. Curious or puzzled.
5. Encouraging.
6. Celebrating success.
7. Offering reassurance.
8. Proud of the learner.

Use the same character design throughout the application.

Do not use emoji as a substitute for Susy.

If the project supports image assets, create or implement reusable illustrations. Avoid generating a different-looking character for each screen.

### Susy's personality

Susy should be warm, patient and encouraging.

Examples of her dialogue include:

- "Hi there! I'm Susy the Subtractor. Shall we learn something new?"
- "Great job! You've got that one."
- "Nearly there! Let's work it out together."
- "Uh-oh! We can't take 9 away from 8 just yet. What do you think we should do?"
- "That's right! We need to borrow a ten."
- "Brilliant! You've mastered that step."
- "Don't worry. This is a tricky bit. I'll help you."
- "You've been practising hard. Look how much you've learned!"
- "Ready for a new challenge?"

Avoid repeating the same phrases constantly.

Susy's dialogue must respond to the learner's actual actions and progress.

She should never make the learner feel stupid for getting an answer wrong.

Praise persistence, effort, understanding and improvement, not just speed.

---

# 3. Welcome screen and personalisation

When a learner first opens the application, Susy introduces herself.

Example:

"Hi there! I'm Susy the Subtractor.

I'm here to help you become brilliant at subtraction.

We'll start with the easy stuff and work our way up to some really big numbers.

What should I call you?"

Provide an optional name field and a prominent **Let's Go!** button.

If the learner enters a name, Susy can use it naturally:

"Well done, Alex!"

If no name is provided, the learner must still be able to start immediately.

Save the preferred name locally in the browser using localStorage.

Provide an option to change or clear the name.

Do not transmit personal information to a server.

The welcome screen should explain that the learner will progress through increasingly difficult levels and can revisit previous skills whenever they want.

---

# 4. The learning philosophy: teach, practise, master

This is one of the most important requirements.

The application must distinguish between learning a new skill and practising a skill already introduced.

Every level must contain four phases.

## Phase A: Learn

Susy introduces the new skill.

She explains the mathematical concept using simple language and visual demonstrations.

The learner should see the calculation change as Susy explains it.

For example, when introducing borrowing:

```text
   58
 - 49
 ----
```

Susy highlights the 8 and explains why subtracting 9 directly from 8 requires regrouping.

She then demonstrates how one ten can be exchanged for ten ones.

The learner must be able to replay the explanation.

Do not overwhelm beginners with long paragraphs.

Use short instructions, visual demonstrations and simple questions.

## Phase B: Guided practice

The learner works through several problems with Susy's assistance.

Susy explains each step, highlights the relevant digits and prompts the learner to enter the next number.

If the learner makes a mistake, Susy offers a helpful explanation.

The learner should be actively involved throughout the process.

Do not simply animate the solution while the learner watches.

## Phase C: Independent practice

Once the learner has completed the guided examples, Susy introduces practice questions.

She provides less assistance.

The learner should solve each problem using the technique they have just learned.

Hints remain available, but Susy should not interrupt unnecessarily.

If the learner struggles, she can offer progressively more detailed help.

## Phase D: Mastery check

At the end of the level, present a short assessment without step-by-step guidance.

The learner must demonstrate that they understand the skill.

If they pass, celebrate their achievement and unlock the next level.

If they do not pass, explain that they need a little more practice and offer targeted exercises.

Do not make the learner feel that they have failed.

For the initial version, use a configurable mastery threshold, such as **80% correct answers over a minimum of five assessment questions**.

A level should not be marked as mastered simply because the learner completed its questions with extensive assistance.

Track assisted and independent performance separately.

---

# 5. Curriculum and increasing difficulty

Build a structured curriculum with clearly defined levels.

The learner must progress from simple subtraction to increasingly complex multi-digit calculations.

The curriculum should increase difficulty along three dimensions:

1. Number size.
2. Regrouping complexity.
3. Degree of independence.

Do not increase all three dimensions simultaneously when introducing a new skill.

Introduce one major new concept at a time wherever practical.

The following curriculum defines the minimum required progression.

## Level 1: Two-digit numbers minus one-digit numbers, without borrowing

Examples:

```text
  24
-  3
----
```

```text
  57
-  4
----
```

```text
  86
-  2
----
```

Teach the learner to subtract a single-digit number from the units column of a two-digit number.

Choose questions where the units digit of the top number is greater than or equal to the number being subtracted.

No borrowing should be required.

The learner should understand that the tens digit remains unchanged.

**New skill:** Subtracting a single-digit number from a two-digit number.

## Level 2: Two-digit numbers minus one-digit numbers, with borrowing

Examples:

```text
  52
-  8
----
```

```text
  61
-  7
----
```

```text
  43
-  6
----
```

Introduce borrowing.

Explain that a ten can be exchanged for ten ones.

Show how the tens digit decreases by one and the units digit increases by ten.

The learner must participate in the regrouping process.

**New skill:** Borrowing from the tens column.

## Level 3: Two-digit numbers minus two-digit numbers, without borrowing

Examples:

```text
  86
- 32
----
```

```text
  79
- 45
----
```

Teach column subtraction when both numbers have two digits.

The learner works through the units column first and then the tens column.

No borrowing should be necessary.

**New skill:** Subtracting two multi-digit numbers column by column.

## Level 4: Two-digit numbers minus two-digit numbers, with borrowing

Examples:

```text
  52
- 28
----
```

```text
  58
- 49
----
```

```text
  73
- 56
----
```

Introduce borrowing when subtracting one two-digit number from another.

This is a major teaching level.

Use detailed, interactive explanations and multiple guided examples.

The learner must understand why the top digit changes and why the digit to its right increases by ten.

**New skill:** Regrouping during two-digit subtraction.

## Level 5: Three-digit numbers minus one-digit numbers

Begin with questions that do not require borrowing.

Examples:

```text
  458
-   3
-----
```

Then introduce borrowing in the units column.

Examples:

```text
  452
-   8
-----
```

Teach the learner to preserve the hundreds and tens columns unless regrouping is required.

**New skill:** Applying existing subtraction skills to three-digit numbers.

## Level 6: Three-digit numbers minus two-digit numbers, without borrowing

Examples:

```text
  786
-  42
-----
```

```text
  654
-  23
-----
```

Teach the learner to align numbers correctly.

Explain that a two-digit number is aligned with the tens and units columns, not the hundreds column.

The application must use a clear vertical layout that makes place value obvious.

**New skill:** Subtracting numbers with different numbers of digits.

## Level 7: Three-digit numbers minus two-digit numbers, with borrowing

Examples:

```text
  402
-  18
-----
```

```text
  351
-  76
-----
```

Introduce borrowing in the tens and units columns as needed.

Include questions where the units column requires borrowing and questions where borrowing through a zero is necessary.

The learner must understand that the zero represents zero tens and cannot simply be reduced by one without first regrouping from the hundreds column.

**New skill:** Regrouping in three-digit calculations, including borrowing across zero.

## Level 8: Three-digit numbers minus three-digit numbers, without borrowing

Examples:

```text
  786
- 243
-----
```

```text
  975
- 421
-----
```

Teach complete three-column subtraction without regrouping.

The learner should complete each column independently.

**New skill:** Working confidently with three-digit subtraction.

## Level 9: Three-digit numbers minus three-digit numbers, with borrowing

Examples:

```text
  731
- 456
-----
```

```text
  604
- 278
-----
```

```text
  402
- 187
-----
```

Introduce increasingly complex regrouping.

Include:
- Borrowing in the units column.
- Borrowing in the tens column.
- Borrowing across a zero.
- Problems requiring more than one regrouping operation.

**New skill:** Multi-column regrouping and borrowing across zero.

## Level 10: Four-digit numbers minus one-digit or two-digit numbers

Begin with straightforward examples.

```text
  5834
-    2
------
```

Then introduce borrowing.

```text
  5204
-    7
------
```

Move on to two-digit numbers.

```text
  5834
-  27
------
```

Teach the learner to maintain the correct place-value alignment across four columns.

**New skill:** Applying subtraction techniques to four-digit numbers.

## Level 11: Four-digit numbers minus three-digit numbers

Start without borrowing.

```text
  5834
-  321
------
```

Then introduce borrowing.

```text
  5004
-  327
------
```

Teach the learner to align the hundreds, tens and units correctly while retaining the thousands digit.

**New skill:** Four-digit subtraction with differently sized operands.

## Level 12: Four-digit numbers minus four-digit numbers, without borrowing

Examples:

```text
  9876
- 4321
------
```

```text
  8754
- 3212
------
```

Introduce complete four-column subtraction without borrowing.

**New skill:** Four-digit subtraction without regrouping.

## Level 13: Four-digit numbers minus four-digit numbers, with borrowing

Examples:

```text
  5832
- 2764
------
```

```text
  7002
- 3487
------
```

```text
  6000
- 4321
------
```

Teach increasingly difficult regrouping, including borrowing across multiple zeros.

The final example is particularly important because it requires the learner to understand how regrouping works across several columns.

Do not simply reveal the answer.

Guide the learner through each necessary change in place value.

**New skill:** Complex multi-column subtraction and regrouping across multiple zeros.

## Level 14: Mixed subtraction challenge

Combine all previously introduced skills.

Include:
- Two-digit subtraction.
- Three-digit subtraction.
- Four-digit subtraction.
- Questions requiring borrowing.
- Questions without borrowing.
- Borrowing across zero.
- Problems requiring multiple regrouping operations.

The learner should not know in advance which technique will be required.

This tests whether they can identify the appropriate method independently.

**New skill:** Choosing and applying the correct subtraction technique without being told which one to use.

### Curriculum requirements

The levels above define the minimum progression.

Design the curriculum so that additional levels can be added later.

Keep the level definitions in structured data rather than hard-coding all curriculum behaviour into the interface.

Each level should specify:
- Its name.
- Its learning objective.
- The permitted number of digits.
- Whether borrowing is allowed or required.
- The types of borrowing permitted.
- The teaching examples.
- The guided practice configuration.
- The independent practice configuration.
- The mastery threshold.
- The next level to unlock.

The system must generate valid questions for each level.

All subtraction questions in the initial curriculum must produce non-negative answers.

Do not introduce decimal subtraction, negative results or advanced mathematical notation in this version.

---

# 6. Question generation and practice

Practice must be a substantial part of the application.

Do not create a game that consists of a few fixed examples followed by an end screen.

Generate varied questions that match the current level's learning objectives.

Avoid repeating the same small set of questions too frequently.

Use structured question-generation logic.

The generator must understand the mathematical properties of each level.

For example:

- A no-borrowing level must not accidentally generate a question requiring borrowing.
- A borrowing level should generate questions where the intended regrouping skill is genuinely required.
- A level teaching borrowing across zero must include suitable examples.
- A mixed challenge must combine the skills already introduced.

Validate generated questions before displaying them.

For every question, the application should know:
- The correct answer.
- The correct intermediate working.
- The columns requiring borrowing.
- The order in which regrouping must occur.
- The expected answer at each interactive step.
- The hints associated with common mistakes.

Do not use the final answer alone as the source of truth for the teaching interface.

The application must calculate and validate the intermediate steps independently.

### Question variety

Use a configurable practice structure.

A suggested default is:

**Guided practice**
- Three questions.
- Susy explains every new or recently introduced technique.
- The learner participates in each step.

**Independent practice**
- Five questions.
- Less assistance.
- Hints remain available.

**Mastery check**
- Five questions.
- Minimal prompting.
- No automatic demonstration before an answer is attempted.

These counts should be configurable.

If the learner struggles, provide additional targeted practice.

If the learner demonstrates mastery, allow progression without unnecessary repetition.

---

# 7. Teaching the borrowing technique

Borrowing is the most important interactive feature.

The application must teach the technique correctly for every supported number of digits.

Use the example:

**58 − 49**

Display the subtraction vertically:

```text
   58
 - 49
 ----
```

Highlight the 8 in the units column.

Susy says:

"Uh-oh! We need to take 9 away from 8.

Can we do that yet?

Do you think we need to borrow a ten from the next door?"

Offer:

- Yes, let's borrow!
- I'm not sure.

If the learner chooses the second option, Susy explains the concept without penalty.

If the learner chooses the first option, begin the regrouping sequence.

### Step 1: Reduce the tens digit

Susy says:

"Great thinking!

We'll borrow one ten from the 5.

That means we have one fewer ten, so the 5 becomes 4."

Ask the learner to enter 4.

When correct:
- Keep the original 5 visible.
- Cross it out.
- Display the new 4 above or beside it.
- Animate the change.
- Explain that the number of tens has decreased by one.

Do not simply replace the 5 with 4.

The original value must remain visible as part of the working.

### Step 2: Increase the units digit

Susy says:

"That ten is worth 10 ones.

We're going to add those 10 ones to our 8."

Show the 8 becoming 18.

Explain:

"Five tens and eight ones is the same as four tens and eighteen ones."

The learner should understand that the overall value has not changed.

The application must preserve the mathematical relationship between the original number and its regrouped representation.

### Step 3: Subtract the units

Susy says:

"Brilliant! Now we have 18 minus 9.

What's the answer?"

Move the active cursor to the units answer position.

The learner enters 9.

Validate the answer.

If correct, provide positive feedback.

If incorrect, provide a hint and allow another attempt.

### Step 4: Subtract the tens

Move the active cursor to the tens column.

Susy says:

"Now we've finished the units.

Let's look at the tens column.

We have 4 minus 4. What is the answer?"

The learner enters 0.

### Step 5: Celebrate

Show the completed answer:

```text
  58
- 49
----
  09
```

Explain that the answer is 9.

Susy says:

"Fantastic! You did it!

58 minus 49 equals 9.

You borrowed a ten, worked out the units and finished the tens.

That's brilliant subtraction!"

Provide a short celebration animation and a Next Question button.

### Borrowing across zero

The borrowing system must also work for questions such as:

```text
  402
- 187
-----
```

The application must explain how borrowing works when the tens digit is zero.

It must correctly represent the transformation:

- 4 hundreds becomes 3 hundreds.
- The hundreds are regrouped into tens.
- One ten is then regrouped into ten ones.
- The units column becomes 12.
- The tens column has the appropriate remaining value.

The final regrouped representation should show:

```text
  3  9 12
  4  0  2
- 1  8  7
---------
```

The visual interface must distinguish the original digits from the updated working.

The precise layout may differ, but it must clearly communicate the changes.

**Never allow the animation to show mathematically incorrect intermediate values.**

Implement the regrouping algorithm independently of the interface and test it thoroughly.

---

# 8. Guided learning versus independent practice

The application must have three clearly identifiable learning modes.

### Learn a new skill

Susy explains the technique and guides the learner through examples.

Use this mode when a new concept is introduced.

### Practise

The learner solves multiple questions independently.

Susy provides feedback and hints when needed.

### Challenge

The learner completes a set of questions with minimal assistance.

Challenge mode should be available for mastered levels and the mixed subtraction challenge.

The interface should clearly show which mode the learner is using.

The learner should be able to revisit completed levels and practise any previously introduced skill.

Do not lock previously completed content.

New levels may remain locked until the learner demonstrates the required mastery.

---

# 9. Supportive feedback and hints

Incorrect answers must be handled constructively.

When the learner enters an incorrect answer:

1. Keep the learner on the current step.
2. Preserve correctly completed work.
3. Explain the problem gently.
4. Provide a useful hint.
5. Allow another attempt.

Example:

"Nearly there! Remember, we borrowed one ten, so our 8 became 18.

Let's try 18 minus 9 again."

Hints should become progressively more explicit.

For example:

- First attempt: a small verbal hint.
- Second attempt: a more specific explanation.
- Third attempt: offer a worked demonstration.

Do not automatically reveal answers on the first mistake.

Track repeated mistakes and provide targeted practice when appropriate.

The learner must be able to request a hint or replay an explanation at any time.

Do not penalise the learner for asking for help.

---

# 10. Adaptive difficulty

Susy should gradually reduce the amount of assistance as the learner improves.

Track performance separately for each skill.

For example, the learner may be good at two-digit subtraction without borrowing but struggle with borrowing across zero.

The application should recognise that distinction.

Do not force the learner to repeat mastered skills unnecessarily.

If the learner struggles with a particular concept:
- Offer additional guided examples.
- Generate more questions targeting that skill.
- Explain the technique again.
- Suggest revisiting the relevant lesson.

If the learner performs well:
- Reduce unnecessary prompting.
- Offer harder questions within the current level.
- Allow progression once mastery requirements are met.

Do not make the application harder merely because the learner answers quickly.

Correctness and demonstrated understanding are more important than speed.

Use a configurable mastery threshold, with an initial default of 80% across at least five assessment questions.

Track the learner's performance without requiring a backend or account.

Store progress locally using localStorage.

The learner must be able to reset their progress.

---

# 11. Progress, rewards and motivation

Make progress visible and satisfying.

Use:
- Stars.
- Small celebrations.
- Progress bars.
- Completed-level indicators.
- Skill badges.
- Encouraging messages.

Reward meaningful achievements, including:
- Completing a new technique.
- Correctly completing a borrowing step.
- Finishing a practice session.
- Mastering a level.
- Improving performance after additional practice.
- Completing the mixed challenge.

Do not reward speed alone.

Avoid excessive animation and unnecessary sound effects.

Sound must be optional and muted by default.

Track:
- Questions attempted.
- Correct answers.
- Independent correct answers.
- Assisted correct answers.
- Hints used.
- Levels completed.
- Skills mastered.
- Current level.
- Overall progress.

Use the data to provide helpful feedback.

For example:

"You've mastered two-digit subtraction without borrowing. Next, we'll practise borrowing."

Do not imply mastery if the learner has only watched demonstrations.

---

# 12. On-screen keypad and input

Provide an on-screen numeric keypad containing:
- Digits 0–9.
- Backspace.
- Clear or undo, where appropriate.
- Done or Confirm.

The entire lesson must be completable using the on-screen keypad.

Physical keyboard input should also be supported.

Use large, clearly labelled buttons.

The learner must always know where the next digit will appear.

The application should prevent accidental overwriting of the original problem.

Input validation must be specific to the current step.

For example, entering the tens digit during a regrouping step must not accidentally submit the final answer.

Ensure that keyboard focus is managed correctly.

---

# 13. Visual design and accessibility

Use a modern, friendly educational design.

The interface should be:
- Bright but not overwhelming.
- Clean and readable.
- Responsive.
- Suitable for children and adults.
- Consistent with the existing learning hub.

Use rounded cards, generous spacing and large numbers.

Purple and blue are suitable starting colours for Susy's lesson.

Make the active column easy to identify.

Use visual emphasis, labels and animation rather than relying on colour alone.

Ensure that Susy's speech bubble never obscures the working.

On mobile, rearrange the character, speech bubble, calculation and keypad so the learner can use everything comfortably.

Implement:
- Keyboard navigation.
- Visible focus indicators.
- Accessible button labels.
- Screen-reader announcements for important feedback.
- Sufficient colour contrast.
- Reduced-motion support.
- Responsive layouts.
- Touch-friendly controls.

Keep animations brief and purposeful.

---

# 14. Technical implementation

Inspect the existing project before choosing an implementation approach.

Follow the existing framework, coding conventions and deployment arrangements wherever practical.

Do not introduce a large framework unnecessarily.

The application should work without paid services, external API keys or a backend.

Keep the following components separate:

1. Curriculum definitions.
2. Question generation.
3. Arithmetic validation.
4. Regrouping logic.
5. Lesson state management.
6. Susy's dialogue.
7. User interface.
8. Progress tracking.
9. Character assets.
10. Styling and animation.

Use reusable components and structured data.

Do not hard-code the teaching sequence separately for every question.

Build the regrouping engine so it can support two-, three- and four-digit subtraction.

The question generator must produce questions appropriate to the selected level.

The arithmetic engine must calculate the expected intermediate working as well as the final answer.

Use the same underlying arithmetic logic to validate both guided and independent practice.

The application must not depend on an internet connection for its core arithmetic functionality once the necessary page assets have loaded.

Keep the initial download lightweight.

Avoid unnecessary external dependencies.

---

# 15. Integrate with the learning homepage

Update the existing homepage without replacing it.

Add a prominent activity card for Susy.

Suggested copy:

**Subtraction with Susy the Subtractor**

Learn subtraction step by step. Start with simple sums, master borrowing and work your way up to big numbers with Susy by your side.

Button: **Start Learning**

Link to:

`/subtraction`

Keep the design consistent with the existing site.

If the homepage uses a structured list of activities, update that list rather than duplicating content.

The architecture should accommodate future lessons without requiring a homepage redesign.

Do not create non-functional links to future activities.

---

# 16. Future expansion

The learning hub will eventually include additional educational activities.

### Danny the Divisor

An interactive long-division tutor.

It should use the same broad teaching philosophy:
- Introduce a skill.
- Demonstrate it.
- Guide the learner.
- Provide independent practice.
- Test mastery.

### Multiplication flashcards

A separate multiplication practice game.

This should focus on:
- Multiplication facts.
- Repetition.
- Recall.
- Gradually increasing difficulty.
- Tracking progress.
- Building confidence.

Do not implement these future applications in this task.

Build Susy's lesson so that common design elements can be reused later.

Do not over-engineer the architecture in anticipation of features that are not yet required.

---

# 17. Testing requirements

Test the application thoroughly before declaring it complete.

### Arithmetic tests

Verify at least the following:

| Problem | Correct answer |
|---|---:|
| 24 − 3 | 21 |
| 52 − 8 | 44 |
| 86 − 32 | 54 |
| 58 − 49 | 9 |
| 458 − 3 | 455 |
| 786 − 42 | 744 |
| 402 − 18 | 384 |
| 786 − 243 | 543 |
| 731 − 456 | 275 |
| 5834 − 2 | 5832 |
| 5834 − 321 | 5513 |
| 9876 − 4321 | 5555 |
| 5832 − 2764 | 3068 |
| 7002 − 3487 | 3515 |
| 6000 − 4321 | 1679 |

Test both the final answers and the intermediate regrouping states.

The arithmetic engine must handle borrowing across zero correctly.

### Curriculum tests

Verify that:
- Every level generates appropriate questions.
- No-borrowing levels never require borrowing.
- Borrowing levels actually exercise the intended skill.
- Questions remain within the specified digit ranges.
- The learner cannot unlock a new level simply by clicking through the previous level.
- Mastery checks are scored correctly.
- Previous levels remain accessible.
- Adaptive practice targets the relevant skill.

### Interaction tests

Verify that:
- The welcome screen works.
- Names persist correctly.
- The keypad works.
- Physical keyboard input works.
- Hints and explanations work.
- Incorrect answers trigger supportive feedback.
- Completed steps are preserved.
- Progress persists after refreshing.
- Progress can be reset.
- The application never gets stuck after an invalid input.

### Responsive tests

Test desktop, tablet and mobile layouts.

Check for:
- Overlapping elements.
- Clipped digits.
- Inaccessible buttons.
- Unwanted horizontal scrolling.
- Incorrect column alignment.
- Speech bubbles covering the calculation.

### Regression tests

Verify that the existing homepage and other activities still work after integration.

Do not claim that a test passed unless it has actually been performed.

---

# 18. Implementation workflow

Work in the following order.

### Phase 1: Inspect

Inspect the existing project.

Identify:
- Technology stack.
- Homepage structure.
- Existing routes.
- Current design conventions.
- Hosting and deployment requirements.

### Phase 2: Design

Define the curriculum and level configuration.

Design the arithmetic engine, regrouping representation and lesson state model before implementing the visual interface.

Make sure the design supports both guided teaching and independent practice.

### Phase 3: Implement

Build:
- Susy's character presentation.
- The welcome screen.
- The level-selection interface.
- Guided lessons.
- Independent practice.
- Mastery checks.
- The interactive keypad.
- The regrouping engine.
- Feedback and hints.
- Progress tracking.
- Homepage integration.

### Phase 4: Test

Run the application.

Test the arithmetic, intermediate working, borrowing across zero, level progression, mastery checks, persistence and responsive layouts.

Fix any errors discovered.

### Phase 5: Report

Summarise:
- What was implemented.
- Which files were created or modified.
- Which tests were run.
- Whether the acceptance criteria passed.
- Any remaining limitations.
- How to deploy the changes to the existing SiteGround hosting environment.

Do not deploy to production without explicit authorisation.

---

# Final instruction

Build Susy the Subtractor as a complete learning experience, not just a collection of subtraction questions.

**The learner must progress from understanding simple subtraction to independently solving complex four-digit problems.**

Every new skill should be introduced clearly, practised with Susy's guidance, reinforced through independent exercises and assessed before progression.

The application should adapt to the learner's needs, provide meaningful encouragement and make progress visible.

Prioritise mathematical correctness, accurate regrouping, clear explanations and reliable progression over decorative features.

The final result should be a polished, accessible and extensible educational application that can become the foundation for a wider collection of learning activities.

**Start by inspecting the existing project, then implement the application in the order described above.**

---

## My final recommendation

Once Claude has implemented this, I'd pay particular attention to three things when testing it:

1. **Does the curriculum genuinely teach each skill?** A learner shouldn't jump from basic subtraction straight into four-digit borrowing without sufficient practice.
2. **Does the regrouping display remain mathematically correct?** Especially when subtracting across zeros, where a visually convincing animation can still teach the wrong method.
3. **Does progression depend on understanding?** A learner should be able to make mistakes, practise again and eventually demonstrate mastery without being trapped in an endless loop of the same questions.

I'd also keep the level system flexible. The 14 levels provide a useful initial curriculum, but Susy should be able to offer extra practice within a level without making the learner feel that they're going backwards.

That combination of structured progression, adaptive practice and friendly instruction is what will make this a genuinely useful learning resource.
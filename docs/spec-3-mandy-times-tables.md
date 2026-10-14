Project: Mandy’s Multiplication Learning App

Live application: https://learning.hayden-gilbert.com/multiplication/

You already have access to the GitHub repositories for the learning website and the Arithmetic Gang game. Inspect the existing code and assets before making changes. Reuse Mandy’s existing character artwork and the established design conventions.

Build on the existing multiplication application rather than creating a separate website.

Objective

Create an interactive multiplication learning application for children, covering multiplication facts from 1 × 1 through to 10 × 10.

The application has three modes:

1. Chant Along: Mandy rhythmically speaks the multiplication tables to help children memorise them.
2. Flashcards: Children practise recalling multiplication answers at their own pace.
3. The Game: Children answer multiple-choice questions, receive encouragement from Mandy, and revisit questions they find difficult.

The application must also ask for the child’s name so Mandy can greet them personally and address them throughout the experience.

Because the application may be used by several children on the same computer or tablet, maintain separate student profiles and learning histories.

The primary objective is memorisation. Encourage repetition, build confidence, and help children identify which multiplication facts they need to practise.

Keep the interface simple, friendly, and suitable for desktop computers, tablets, and phones.

⸻

1. Student Welcome and Personalisation

1.1 Welcome screen

When a child opens the application, Mandy should greet them warmly.

If there is no active student, display Mandy and the following message:

“Hello. I’m Mandy, and I’m here to help you learn your multiplication tables. What’s your name?”

Provide a large text field and a prominent Start button.

The child should be able to enter their first name or a nickname. Do not request a surname, email address, date of birth, or other personal information.

The interface must be easy for young children to use, including those using an iPad.

Allow the child to start by pressing the button or using the keyboard’s Enter key.

Do not allow an empty or whitespace-only name.

Trim unnecessary spaces from the entered name.

1.2 Personalised greeting

After the child enters their name, Mandy should greet them enthusiastically.

For example, if the child enters Alex:

“Hello, Alex. It’s lovely to see you. Are you ready to practise your multiplication tables with me?”

Use the existing Mandy character artwork.

Keep the greeting friendly and natural. Do not make the child wait through a long introduction before reaching the learning activities.

Display the three learning modes clearly after the greeting.

1.3 Personalised messages

Mandy should use the child’s name occasionally throughout the application.

Examples:

“Well done, Alex. You got that right.”

“Hmm, Alex, that’s not quite right. Have another try.”

“Come on, Alex. Let’s see if you can remember this one.”

“Brilliant work, Alex. You’re getting better at this.”

“Ready for another round, Alex?”

Use varied messages rather than repeating the same sentence every time.

Do not include the child’s name in every message. It should feel natural, not mechanical.

Use text messages in Flashcards and the Game. Chant Along uses spoken equations.

Do not add speech to the Game or Flashcards.

1.4 Student profiles

Provide a simple Change Student option that is accessible from the main menu and learning screens.

When selected, allow the current child to switch to an existing student profile or create a new one by entering a name.

When a student returns, allow them to select their profile without having to enter their name again.

A simple list of locally saved names is sufficient. Do not introduce accounts, passwords, or authentication.

Use an internal profile identifier rather than relying only on the displayed name. Two children might have the same name and must still have separate learning histories.

Keep the active student’s name available when switching between Chant Along, Flashcards, and the Game.

Do not create a new profile every time a returning student enters the same name.

If a name matches an existing profile, offer that profile for selection rather than silently creating a duplicate.

1.5 Privacy

Store student profiles and learning histories locally in the browser.

Do not send names, progress, or learning records to an external service.

Do not collect unnecessary personal information.

Because this application may be used on shared computers, provide clear controls for changing students and resetting progress.

The active student must always be identifiable in the interface, so children can check that they are using their own profile.

⸻

2. Main Menu and Learning Levels

After the welcome screen, display Mandy and three prominent learning options:

* Chant Along
* Flashcards
* Play the Game

Allow children to select a multiplication table from 1 to 10 for Chant Along and Flashcards.

The Game must support questions from 1 × 1 through to 10 × 10.

For the Game, allow children to configure the maximum value of each multiplier independently.

For example, a child could select:

* First multiplier: 1 to 5.
* Second multiplier: 1 to 4.

The game should then generate questions using only those ranges.

If the child selects a maximum first multiplier of 7 and a maximum second multiplier of 3, the game must generate questions from the selected ranges without exceeding either limit.

Examples of valid questions include 2 × 3, 5 × 2, 7 × 1, and 4 × 3.

A question such as 8 × 2 would not be valid for that configuration because the first multiplier exceeds the selected maximum.

Use clear, child-friendly controls, such as a grid of numbers or simple selectors.

The selected limits must be independent. Do not confuse the first and second multipliers.

Provide a sensible beginner default and allow children to increase the difficulty gradually.

Allow the child to change the settings before starting a new round.

Keep the selection interface simple and easy to use on a touchscreen.

⸻

3. Chant Along Mode

This mode teaches multiplication through rhythmic spoken repetition.

3.1 Mandy’s voice

Use the browser’s built-in Web Speech API.

The target voice should be:

* Female-sounding.
* High-pitched.
* Young-sounding.
* Friendly and energetic.
* Clear and easy for children to understand.

Choose the best available English voice and adjust its pitch and speaking rate experimentally.

The intention is to give Mandy a bright, youthful character voice rather than the sound of an adult narrator.

Provide a simple voice test and controls to adjust the speaking speed.

Handle the fact that available voices vary between browsers and operating systems. Do not assume a particular voice exists on every device.

Load voices correctly, including handling the voiceschanged event where necessary.

Do not add an external text-to-speech API or a paid service for this initial implementation.

3.2 Rhythmic multiplication

Allow the child to select a multiplication table from 1 to 10.

Mandy speaks each equation in sequence.

For example, for the 3 times table:

“Three times one equals three.”

“Three times two equals six.”

“Three times three equals nine.”

Continue through:

“Three times ten equals thirty.”

Generate the equations programmatically. Do not hardcode every table separately.

Display the complete table vertically on the screen.

Highlight the equation currently being spoken so the child can read along and repeat it aloud.

3.3 Rhythm and timing

The objective is memorisation through repetition.

Use:

* A consistent speaking pace.
* Short pauses between equations.
* A slightly longer pause after every fifth equation.
* Clear pronunciation of every equation.
* Visual highlighting that follows the speech.

The child should be able to anticipate the rhythm and say the equations aloud with Mandy.

Use speech completion events and controlled pauses rather than relying entirely on arbitrary timeouts.

Do not attempt to generate music or a backing track in the initial version. Focus on rhythmic spoken speech.

3.4 Controls

Include:

* Select multiplication table.
* Play.
* Pause.
* Resume.
* Stop.
* Restart.
* Slower.
* Faster.
* Voice test.

Stop queued speech when the child stops playback, changes tables, or leaves Chant Along.

Prevent overlapping speech and stale callbacks.

Changing the selected table must cancel the previous chant immediately.

Handle missing speech support gracefully.

Keep the speech implementation isolated from Flashcards and the Game.

⸻

4. Flashcards Mode

The flashcards help children recall multiplication facts independently.

4.1 Card design

Display one large multiplication question at a time.

For example:

7 × 6 = ?

Initially, hide the answer.

The child can click or tap the card, or use a clearly labelled Reveal Answer button, to reveal the result.

For example:

7 × 6 = 42

After revealing the answer, display Mandy with a friendly message.

Examples:

“Did you get it right? Ready for another one?”

“How did you do? Let’s try the next card.”

“Keep practising. You’ll get quicker with every round.”

“Feeling confident? You can test yourself in the game.”

The child should be able to think about the answer before revealing it.

Do not automatically advance to the next card.

4.2 Flashcard controls

Provide:

* Reveal Answer.
* Next Card.
* Previous Card.
* Shuffle.
* Restart.
* Select Table.
* Return to Menu.
* Try the Game.

Allow children to select an individual multiplication table from 1 to 10.

Provide two modes:

Sequential: Work through the selected table in order.

Random: Practise questions in a shuffled order.

Generate answers programmatically.

Keep the question visually prominent and the controls large enough for touchscreens.

4.3 Flashcard feedback

Mandy’s messages should encourage the child to assess their own recall.

For example:

“Did you remember that one?”

“Ready to see if you know the next one?”

“Would you like to try the game now?”

Do not assume the child got an answer right or wrong simply because they revealed it. They are practising independently.

Do not add spoken audio to Flashcards.

⸻

5. The Multiplication Game

The Game is the main testing and revision mode.

The screen should be simple and visually clear.

Display one large multiplication equation in the centre of the screen, with exactly three possible answers below it.

5.1 Game screen

For example:

7 × 6 = ?

Below the equation, display three large answer buttons:

36

42

48

In this example, 42 is correct.

The equation should be much larger than the answer buttons.

Space the three buttons evenly and make them easy to tap on an iPad or phone.

Do not display additional answer choices.

Do not add unnecessary decorations, timers, or distracting interface elements.

5.2 Mandy’s introduction to each question

Before the child answers, Mandy should display a friendly prompt.

For example:

“Let’s see. Which one could it be?”

Other possible prompts:

“Think carefully. Which answer looks right?”

“Can you remember this one?”

“Take your time. You can do it.”

Vary the messages so the game feels natural rather than repetitive.

Do not speak these messages aloud. Display them as text alongside Mandy’s existing artwork.

5.3 Generate plausible incorrect answers

This is an important requirement.

The incorrect answers must be plausible mistakes that children might genuinely make when learning multiplication.

Do not use obviously silly or unrelated numbers.

For example, for 7 × 6, reasonable distractors include:

* 36, from confusing the answer with 6 × 6.
* 48, from confusing the answer with 8 × 6.

These are more useful than answers such as 3, 100, or 999.

Generate distractors programmatically using strategies such as:

* Confusing one multiplier with the number immediately above or below it.
* Using a neighbouring multiplication fact.
* Using the correct multiplier with a neighbouring number.
* Selecting a nearby product that children might reasonably confuse with the correct answer.

Avoid duplicate answers and ensure that exactly one of the three options is correct.

Do not always place the correct answer in the same position.

Shuffle the answer buttons for each question.

Handle boundary cases, particularly multiplication by 1 and multiplication by 10.

Incorrect answers must be positive, plausible, and different from the correct answer.

If the algorithm cannot generate two distinct plausible distractors for a particular question, use a controlled fallback that produces two distinct, positive, incorrect answers near the correct answer.

Test the distractor generator thoroughly.

5.4 Correct answers

When the child selects the correct answer, Mandy should congratulate them.

Examples:

“That’s right. Well done.”

“Brilliant. You remembered it.”

“Yes, that’s the one.”

“Excellent work. Ready for another?”

“Well done, [name]. You’re getting the hang of this.”

Vary the messages.

Track whether the child answered correctly on the first attempt or needed additional attempts.

Once the answer is correct, lock the question so it cannot be scored repeatedly.

After a short pause, advance to the next question.

5.5 Incorrect answers and retrying

If the child selects an incorrect answer, Mandy should respond gently.

Examples:

“Hmm, that’s not quite right. Try again.”

“Not that one. Have another think.”

“Almost. Let’s see if you can find the right answer.”

“That’s a tricky one. Give it another try.”

The child must be allowed to try again.

Do not immediately move to the next question.

Keep the same equation on the screen.

Remove or disable the incorrect option the child selected so they cannot repeatedly select it and inflate the attempt count.

The child can then choose between the remaining answers.

Continue until the correct answer is selected.

Once the child answers correctly, congratulate them and move to the next question.

Record the initial mistake and the number of attempts required to reach the correct answer.

The goal is to learn, not to penalise mistakes.

5.6 Game progression

Allow children to select the number of questions in a round, such as 10, 20, or 30.

Provide sequential and random question orders.

The default should be untimed.

Do not introduce a timer unless it is genuinely useful and does not distract from the memorisation objective.

Every question must respect the selected multiplier limits.

Do not use speech in the Game.

Mandy’s prompts, encouragement, and corrections should be displayed as text.

⸻

6. Remember Difficult Questions

This is a core requirement.

The application must remember which multiplication facts each child finds difficult and bring them back for revision in subsequent rounds.

Use browser localStorage.

Do not introduce a database, backend, account system, or external service.

6.1 What to remember

For each student’s multiplication fact, track:

* The multiplication question.
* The number of times it has been attempted.
* The number of incorrect attempts.
* The number of correct first attempts.
* The number of attempts required before answering correctly.
* The date of the most recent attempt.
* Whether the question should be prioritised for revision.

Keep each student’s records separate.

A question answered correctly on the first attempt should receive a stronger mastery indication than one that required several attempts.

Do not assume that one incorrect answer means a child has permanently failed to learn a fact.

Use repeated performance to distinguish occasional mistakes from recurring difficulties.

6.2 Revision rounds

At the beginning of a new Game session, offer:

* Practise the selected multiplication range.
* Revise previously missed questions.
* Mix revision questions with new questions.

Revision questions must respect the selected difficulty range.

For example, if the child selects a maximum first multiplier of 5 and a maximum second multiplier of 4, do not include 7 × 8.

Prioritise questions that have been answered incorrectly more than once.

Questions that were previously difficult should recur in revision rounds until the child demonstrates more consistent recall.

Once a question has been answered correctly on the first attempt in several separate rounds, reduce its revision priority.

Use a simple, transparent rule rather than a complicated machine-learning system.

6.3 Identify weak multiplication facts

After a round, show the child which multiplication facts would benefit from further practice.

For example:

Mandy says: Let’s practise these a little more.

* 6 × 7
* 7 × 8
* 9 × 6

Make it clear that these are suggestions, not failures.

Provide a button to start a revision round focused on these questions.

Also show a simple overview of the selected multiplication range, indicating which facts appear strong and which need more practice.

Do not label a question mastered simply because it was answered correctly once.

Use first-attempt accuracy across multiple rounds to estimate mastery.

Keep the feedback positive and understandable for children.

⸻

7. Student Profiles and Shared Computers

The application may be used by several children on the same computer or tablet.

Student profiles must be implemented alongside progress tracking, not added as an afterthought.

7.1 Separate progress

Each student must have a separate profile and learning history.

Use an internal profile identifier rather than the displayed name alone.

When a child selects their profile, load that child’s progress.

When another child switches profiles, load the second child’s progress without changing the first child’s records.

Do not merge progress merely because two children have the same name.

Keep the implementation simple and local to the browser.

7.2 Change Student

Provide a clearly visible Change Student option.

It should allow the current student to return to the profile-selection screen.

From there, the child can select an existing profile or create a new one.

Switching students must not delete the previous student’s progress.

Do not require passwords or other personal information.

7.3 Reset Progress

Provide a Reset Progress option.

Because several children may use the same device, distinguish between:

* Resetting the current student’s learning progress.
* Removing a student’s profile and associated learning history.

The reset action must display a confirmation message.

For example:

“Are you sure you want to reset your progress? Mandy will forget the questions you have practised and the answers you got wrong.”

Provide Cancel and Reset Progress buttons.

Resetting the current student’s progress should clear that student’s question history, revision queue, and mastery estimates without affecting other students.

If removing a student profile is supported, clearly explain that the profile and its associated progress will be deleted.

Require explicit confirmation before deleting anything.

Do not reset progress automatically when the page is refreshed.

Do not erase unrelated applications’ localStorage data.

Use clearly namespaced storage keys for this application.

7.4 Privacy

Do not transmit student names or learning records to external services.

Do not collect children’s personal information beyond the name or nickname they choose to enter.

Do not add advertising, tracking, or third-party analytics as part of this feature.

⸻

8. Results and Revision Summary

At the end of a Game round, display a friendly summary.

For example:

Well done, Alex. You’ve finished this round.

* Questions completed: 10.
* Correct on the first attempt: 7.
* Questions that needed another try: 3.
* Questions to practise: 3.

Then show the relevant multiplication facts.

Provide these options:

* Play Again.
* Revise My Mistakes.
* Change Difficulty.
* Choose Another Table.
* Change Student.
* Return to Menu.

The results must reflect the actual questions and attempts.

Do not overemphasise scores or introduce leaderboards.

The purpose is to help children memorise multiplication facts, not compete against other children.

The summary should help the child understand what they have learned and what they should practise next.

⸻

9. Design and Character Requirements

Use Mandy’s existing artwork from the Arithmetic Gang project.

Do not redesign Mandy or create a replacement character.

Use her existing expressions and poses where available.

Mandy should be the friendly guide throughout the application.

Her welcome, prompts, encouragement, and corrections should match the same personality.

Keep messages short enough to fit comfortably on tablets and phones.

The interface should be colourful, clear, and easy to understand.

Use large typography for multiplication questions.

Make the three answer buttons large and evenly spaced.

Ensure that the application works on:

* Desktop computers.
* Laptops.
* iPads.
* Android tablets.
* Mobile phones.

All interactive controls must be touch-friendly.

Do not rely on hover effects.

Maintain sufficient contrast and visible keyboard focus indicators.

Respect reduced-motion preferences.

Keep the application focused on memorisation and practice rather than adding unnecessary game mechanics.

⸻

10. Technical Requirements

Inspect the existing project before changing code.

Use the existing framework, libraries, components, and conventions wherever possible.

Do not create a separate website.

Do not break other educational applications.

Keep the implementation modular and maintainable.

Use programmatic multiplication calculations rather than hardcoding individual answers.

Ensure that question generation, distractor generation, answer checking, scoring, revision tracking, and persistence are tested independently.

Handle malformed or unavailable localStorage data gracefully.

Ensure that restarting a round does not erase historical progress.

Ensure that resetting one student’s progress affects only that student’s learning history.

Keep speech isolated to Chant Along.

Do not add a speech service to Flashcards or the Game.

Do not introduce a backend, database, authentication system, or paid API.

Avoid unnecessary dependencies.

If the existing application already contains reusable components or a suitable profile system, reuse them where appropriate.

⸻

11. Testing Requirements

Before declaring the work complete, verify the following.

Student welcome and profiles

* A new student sees Mandy’s welcome and name prompt.
* Empty names are rejected.
* Mandy greets the child using their chosen name.
* The name remains available when switching learning modes.
* Returning students can select their existing profile.
* New students can create separate profiles.
* Two students with the same displayed name still have separate records.
* Switching students does not delete or overwrite progress.
* No names or learning records are transmitted to external services.

Chant Along

* All tables from 1 to 10 can be selected.
* All equations are mathematically correct.
* The selected voice is used consistently.
* Play, Pause, Resume, Stop, and Restart work.
* Changing tables cancels the previous chant.
* Speech does not overlap.
* The current equation is highlighted correctly.

Flashcards

* The correct question appears.
* The answer remains hidden until requested.
* Reveal Answer works.
* Next and Previous work.
* Sequential mode follows the correct order.
* Random mode shuffles the questions.
* Table selection works.
* Flashcards do not speak.

Game

* The screen displays one large equation.
* Exactly three answer choices are displayed.
* Exactly one answer is correct.
* The other answers are plausible multiplication mistakes.
* No answer choices are duplicated.
* The correct answer appears in different positions.
* Incorrect answers allow another attempt.
* An incorrect option cannot be repeatedly scored.
* Correct answers advance the game appropriately.
* Correct and incorrect attempts are recorded accurately.
* The game respects both selected multiplier limits.
* Boundary cases, particularly multiplication by 1 and 10, work correctly.
* Mandy’s messages use the active student’s name naturally.
* The Game does not speak aloud.

Revision

* Incorrect answers are remembered across page refreshes.
* Each student’s revision history is separate.
* Difficult questions can be selected for revision.
* Revision respects the selected difficulty range.
* Repeatedly difficult questions receive higher revision priority.
* Repeated first-attempt successes reduce revision priority.
* Progress summaries reflect actual results.

Reset

* The confirmation dialog appears.
* Cancel preserves the saved progress.
* Confirming a reset clears the intended student’s progress.
* Other students’ histories remain untouched.
* Removing a profile requires confirmation.
* Unrelated applications’ saved data remains untouched.

Deployment

* Run the existing type checks and build commands.
* Fix any errors.
* Test the application locally.
* Check desktop and tablet layouts.
* Confirm the correct production build and deployment procedure.

Do not claim the application has been deployed or fully tested unless those steps have actually been completed.

⸻

12. Final Deliverable

Implement the complete application within the existing multiplication project.

Preserve existing functionality and reuse Mandy’s established character design.

When finished, report:

1. What was implemented.
2. Which files were changed.
3. How to run and test the application locally.
4. Any limitations that remain.
5. How to deploy the updated application to the existing SiteGround hosting.

The primary goal is to help children memorise multiplication facts through rhythmic repetition, independent recall, supportive feedback, and targeted revision.

Mandy should feel like a friendly learning companion who knows which child she is helping, celebrates their successes, encourages them when they struggle, and helps them improve over time.
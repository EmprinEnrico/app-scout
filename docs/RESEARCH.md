# Research notes: life objectives and personal progression

Research reviewed on 2026-10-10. This document records evidence and product
inferences for the **next** version of Scout Journey. It does not describe all
features of the current app. Keep the distinction between a study's finding,
our interpretation, and a feature to test with users.

## Product thesis

Scout Journey should help someone choose a meaningful life direction, work
backwards to concrete practices, observe what happens, and adjust. It is a
personal growth journal, not a daily task or calendar app. A missed practice
should invite reflection or rescheduling, not a broken-streak penalty.

The most useful loop is **choose → try → notice → review → adapt**. The app can
support this loop, but cannot itself provide the experience, learning, or
relationships that make progress possible.

## What the evidence supports

| Finding | Evidence and limits | Product inference |
| --- | --- | --- |
| Personally endorsed goals matter. | Longitudinal studies link self-concordant goals to sustained effort, attainment, and greater wellbeing benefits. Association and model fit do not establish that an app can create that motivation [1]. | Ask why an objective matters to the person. Do not judge the reason. |
| Specific goals and plans can improve action. | Goal-setting research is strongest when tasks are understood, feedback exists, and the person has ability and commitment [2]. A meta-analysis found benefits for *if–then* plans across varied settings [3]. Neither result guarantees sustained pursuit of a years-long aim. | Translate an objective into a small, controllable next practice and, when useful, a cue: “After dinner, I will read one page.” |
| Learning goals may be better while the route is unclear. | Goal-setting research distinguishes learning from performance goals on complex or unfamiliar tasks [2, 4]. | Allow “explore how to learn Spanish” before demanding a numeric outcome. |
| Monitoring progress can help. | A meta-analysis of 138 randomized studies involving 19,951 participants found that interventions increasing progress monitoring improved attainment [5]. It does not identify an ideal tracking frequency for a life journal. | Make observations and evidence of growth easy to record without demanding daily check-ins. |
| Action plus reflection is a promising scaffold. | World Scouting includes learning by doing and personal progression in a broader social educational method [6]. Scouts UK gives a concrete “plan, do, review” exercise and notes that people may learn something other than the intended lesson [7]. These are official educational methods, not trials of an adult app. | Record what was tried, what happened, what was learned, and what to change. |
| Reminders can prompt immediate engagement. | In an app trial, notifications increased near-term opening, but daily, varied, and no-notification policies did not differ significantly in time to disengagement [8]. Appointment reminder evidence does not establish a cadence for life goals [9]. | Separate an actionable practice reminder from a reflective review prompt. Make both optional and adjustable. Measure progress, not app opens. |
| Habit formation varies substantially. | A real-world study estimated 18–254 days to reach 95% of each participant's modeled automaticity plateau. One missed opportunity did not materially derail formation [10]. | Support stable cues and easy resumption; avoid universal “habit formed in X days” claims or punitive streaks. |
| Revising or leaving goals can be adaptive. | Research on disengagement from unattainable goals and reengagement with alternatives links those capacities to wellbeing [11]. Goal-setting also has documented conceptual risks such as narrow focus and reduced intrinsic motivation [12]. | Include pause, revise, and let go as valid states. Preserve the person's learning when a goal changes. |

## Evidence that challenges simple rules

- **No proven one-third/two-thirds checkpoint rule.** The frequently cited
  2002 study of evenly spaced deadlines was retracted in September 2026 [13].
  A 2026 replication found negligible effects of deadline arrangement and no
  special advantage for evenly spaced deadlines [14]. These results concern
  student assignments, so neither result establishes the best timing for life
  objectives. Use thirds only as an optional convenience for a finite project,
  never as a science-backed default for every objective.
- **A deadline is not always meaningful.** “Learn Spanish” can be an ongoing
  direction. A dated exam or a particular conversation may have a deadline;
  learning the language as part of life need not. This is a product inference.
- **A count can misrepresent growth.** A finished book, lesson, badge, or
  percentage may show activity without showing improved ability. The scout
  method includes community, mentorship, values, and practice; a solo app
  cannot reproduce that whole method [6].
- **More structure is not automatically better.** Research on mental
  contrasting plus implementation intentions shows a small-to-moderate
  average effect, with possible publication bias [15]. Prompts about desired
  outcomes, obstacles, and plans may be useful, but should not become a long
  compulsory form.
- **Goals can crowd each other out.** The “Goals Gone Wild” paper warns about
  overprescribing goals and neglecting unmeasured areas [12]. It is a
  conceptual caution, not a meta-analysis estimating how often these harms
  occur. A review should allow “Is this still worth the cost?”

## Candidate conceptual structure

This structure is a design proposal, not an experimentally validated model:

1. **Objective or direction:** what the person wants to grow toward, and why.
   It may be ongoing and have no deadline.
2. **Evidence of growth:** what would tell the person that they are learning or
   changing. It may be qualitative, observable, or measurable.
3. **Practice or experiment:** a controllable action connected to that growth.
   It can recur, happen once, or be tried temporarily.
4. **Cue or reminder:** optional help to start a practice. It should refer to
   an action the person can take now.
5. **Review:** a separate, optional prompt to notice progress, obstacles,
   unintended costs, and whether to continue, change, pause, or stop.

For example, “Learn Spanish” might mean “be comfortable in conversation.” A
15-minute conversation could provide evidence of progress. A weekly lesson
and reading a graded Spanish book could be practices. “Read a book each month”
should only be included if that specific practice serves the objective; a book
count alone does not demonstrate language ability. A review could ask what
became easier and what practice helped. The weekly lesson needs a practical
reminder only if the user wants one; the broader objective needs occasional
reflection, not a daily demand to mark it complete.

## Decisions to test before locking the product model

- Can someone create an objective and one next practice quickly, without
  being forced to invent a deadline, metric, or full plan?
- Do people understand the difference between **objective**, **evidence of
  growth**, **practice**, and **review** in their own words?
- Which reminders lead to actual practice or useful reflection, rather than
  merely opening the app? When do people mute them?
- When does recording progress feel encouraging, and when does it become
  bookkeeping or pressure?
- Can someone pause, revise, or abandon an objective without losing the story
  of what they tried and learned?

## Sources

1. Sheldon & Elliot (1999), self-concordance and longitudinal wellbeing:
   https://pubmed.ncbi.nlm.nih.gov/10101878/
2. Locke & Latham (2002), goal-setting theory and its moderators:
   https://pubmed.ncbi.nlm.nih.gov/12237980/
3. Gollwitzer & Sheeran (2006), implementation-intention meta-analysis:
   https://doi.org/10.1016/S0065-2601%2806%2938002-1
4. Latham & Seijts (2005), learning versus performance goals:
   https://doi.org/10.5465/ame.2005.15841964
5. Harkin et al. (2016), experimental meta-analysis of progress monitoring:
   https://pubmed.ncbi.nlm.nih.gov/26479070/
6. World Organization of the Scout Movement, *The Scout Method*:
   https://learn.scout.org/resource/scout-method
7. Scouts UK, *Plan, do, review*:
   https://www.scouts.org.uk/activities/plan-do-review/
8. Bell et al. (2023), randomized notification policies in the Drink Less app:
   https://mhealth.jmir.org/2023/1/e38342/
9. TURNUP systematic review of appointment reminders:
   https://doi.org/10.3310/hsdr02340
10. Lally et al. (2010), real-world habit formation:
    https://doi.org/10.1002/ejsp.674
11. Wrosch et al. (2003), disengagement and reengagement with goals:
    https://pubmed.ncbi.nlm.nih.gov/15018681/
12. Ordóñez et al. (2009), *Goals Gone Wild*:
    https://doi.org/10.5465/amp.2009.37007999
13. *Psychological Science* (2026), retraction of Ariely & Wertenbroch (2002):
    https://www.psychologicalscience.org/journals/psychological-science/09567976261488042/
14. Hyndman & Bisin (2026), replication of the deadline study:
    https://www.psychologicalscience.org/journals/psychological-science/09567976261460772/
15. Wang et al. (2021), meta-analysis of mental contrasting with
    implementation intentions and its publication-bias caveat:
    https://doi.org/10.3389/fpsyg.2021.565202

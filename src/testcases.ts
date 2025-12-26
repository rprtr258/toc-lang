export const problemTreeTestcases = [
  {
    name: "with only UDE",
    text: `b: "badness" class=UDE`,
  },
  {
    name: "with UDE and single cause",
    text: `
    b: "badness" class=UDE
    c: "cause"
    b <- c
    `,
  },
  {
    name: "with UDE and multi-cause",
    text: `
    b: "badness" class=UDE
    c1: "cause 1"
    c2: "cause 2"
    b <- c1 && c2
    `,
  },
  {
    name: "with multi-cause right arrow",
    text: `
    b: "badness"
    c1: "cause 1"
    c2: "cause 2"
    c1 && c2 -> b
    `,
  },
  {
    name: "single-line comments",
    text: "# This is a comment",
  },
  {
    name: "single cause right arrow",
    text: `
    b: "badness"
    c: "cause"
    c -> b
    `,
  },
  {
    name: "empty text",
    text: "",
  },
];

export const evaporatingCloudTestcases = [
  {
    name: "only type line parses to empty",
    text: ".type: conflict",
  },
  {
    name: "with only labels",
    text: `
.type: conflict
A: "Maximize business performance"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
E: "Attend to people's needs (& let people work)"
`,
  },
  {
    name: "with only labels, quoted",
    text: `
.type: conflict
A: "Maximize business performance {"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
E: "Attend to people's needs (& let people work)"
`,
  },
  {
    name: "with injection on requirement",
    text: `
.type: conflict
A: "Maximize business performance"
D: "Subordinate people's needs to the financial goal"
A <- D: "inject Psychological flow triggers"
`,
  },
  {
    name: "with injection on conflict",
    text: `
.type: conflict
D -> E: "Discover they don't conflict"
`,
  },
  {
    name: "can inject with bidirectional edge",
    text: `
.type: conflict
D -- E: "Discover they don't conflict"
`,
  },
  {
    name: "single-line comments",
    text: `
# This is a comment
.type: conflict
`,
  },
  {
    name: "unusual characters in annotation",
    text: `
.type: conflict
A: "*watafa* pepe"
`,
  },
];

export const goalTreeTestcases = [
  {
    name: "with only goal",
    text: `
    .type: goal
    Goal: "win"
    `,
  },
  {
    name: "with CSF and NCs",
    text: `
    .type: goal

    Goal: "win"

    weScore: "We score points" class=CSF
    theyDont: "Other team doesn't score" class=CSF

    possession: "We get the ball"
    shooting: "We shoot the ball accurately"
    defense: "We have good defense"

    theyDont <- defense
    weScore <- possession
    weScore <- shooting
    `,
  },
  {
    name: "node status",
    text: `
    .type: goal
    mynode: "win" status=50
    `,
  },
  {
    name: "single-line comments",
    text: `
    # This is a comment
    .type: goal
    `,
  },
  {
    name: "with status",
    text: `
    .type: goal

    Goal: "win"
    weScore: "We score points" status=70
    `,
  },
];

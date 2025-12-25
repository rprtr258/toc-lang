type Example = {
  id: string,
  name: string,
  text: string,
}

const exampleGoalTree = `type: goal

Goal: "Make money now and in the future"

revUp: "Generate more revenue" {class: CSF}
costsDown: "Control costs" {class: CSF}

Goal <- revUp
Goal <- costsDown

keepCust: "Protect relationship with existing customers"
newCust: "Acquire new customers"

reduceInfra: "Reduce infrastructure spending"
retain: "Retain employees"
marketSalary: "Keep up with market salaries"

morale: "Maintain employee morale"
features: "Develop new features"

newCust <- features

# This is probably the wrong place for 'retain'
features <- retain

revUp <- newCust
revUp <- keepCust
costsDown <- reduceInfra
retain <- marketSalary
retain <- morale
`;

const exampleGoal = {
  id: "goal",
  name: "Goal Tree",
  text: exampleGoalTree,
};

const exampleEvaporatingCloud = `type: conflict

A: "Maximize business performance"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
B <- D: "*inject* Psychological flow triggers"
E: "Attend to people's needs (& let people work)"
`;

const exampleCloud = {
  id: "conflict",
  name: "Conflict Cloud",
  text: exampleEvaporatingCloud,
};

const exampleProblemTree = `type: problem

bad: "Bad user experience" {class: UDE}
cluttered: "Cluttered interface" {class: UDE}
bad <- cluttered
ux: "Low investment in UX design"
features: "Many features added"
cluttered <- ux && features
`;

const exampleProblem = {
  id: "problem",
  name: "Problem Tree",
  text: exampleProblemTree,
};

const exampleRPA = `# https://www.youtube.com/watch?v=uggmMOoEfwA
type: problem

more_jobs: "RPA creates more jobs than it eliminates"
rpa_time_value: "RPA creates greater value with the time that is available"
emp_do_val: "Employees do more valuable work"
emp_time_value: "Employees doing more valuable work are more valuable to the organization"
more_jobs <- rpa_time_value && emp_time_value

rpa_no_time: "RPA does not create greater value with the time that is available" {class: UDE}
emp_no_valuable: "Employees don't do more valuable work"
rpa_no_time <- emp_valuable && emp_no_valuable

emp_valuable: "Employees can do more valuable work"
rpa_time_value <- emp_do_val && emp_valuable
emp_time_value <- emp_valuable

emp_capacity: "We create capacity with these employees"
emp_valuable <- emp_capacity

free_time: "We free up time (of these employees with RPA)"
emp_capacity <- free_time

low_value_time: "Employees spend significant amount of their time doing no or low value tasks"
rpa_low_value: "RPA takes over no/low value task (almost for free)"
rpa_deploy: "RPA is deployed"
free_time <- low_value_time && rpa_low_value && rpa_deploy

emp_deprived: "Some employees are deprived from doing tasks they like by RPA"
emp_like_do: "Some employees like doing no or low value tasks"
emp_deprived <- rpa_low_value && rpa_deploy && emp_like_do

emp_hate_rpa: "Some employees are not positive towards RPA"
emp_hate_rpa <- emp_deprived

emp_unskill: "Some employees are unskilled/unfit for more valuable work"
emp_no_value: "Some employees are not able to take over more valuable work"
emp_no_value <- emp_valuable && emp_unskill

emp_not_valuable: "Some employees are not considered as valuable to the organization than others"
emp_not_valuable <- emp_time_value && emp_no_value

emp_laidoff: "Some employees are made redundant (laid off)"
unwilling_redundant: "The organization makes unable and unwilling employees redundant"
emp_laidoff <- emp_no_value && unwilling_redundant

redundant_not_replaced: "Redundant employees are not replaced thanks to RPA"
redundant_workload: "The current workload without redundant employees can be handled with RPA"
redundant_not_replaced <- unwilling_redundant && redundant_workload

less_jobs: "RPA destroys more jobs than it creates" {class: UDE}
less_jobs <- emp_laidoff && redundant_not_replaced
`;

const exampleRpa = {
  id: "problem_rpa",
  name: "Problem Tree on RPA deployment",
  text: exampleRPA,
};

export const examples: Example[] = [
  exampleGoal,
  exampleProblem,
  exampleCloud,
  exampleRpa,
];

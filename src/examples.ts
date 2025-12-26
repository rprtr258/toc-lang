import gtExample from "../examples/gt_example.txt?raw";
import gtToclang from "../examples/gt_toclang.txt?raw";
import gtStyled from "../examples/gt_styled.txt?raw";
import crtExample from "../examples/crt_example.txt?raw";
import crtTocAdoption from "../examples/crt_toc_adoption.txt?raw";
import crtNotluck from "../examples/crt_its-not-luck.txt?raw";
import crtRpa from "../examples/crt_rpa.txt?raw";
import crtStyled from "../examples/crt_styled.txt?raw";
import ecExample from "../examples/ec_example.txt?raw";
import ecHappyQuality from "../examples/ec_happy_quality.txt?raw";
import ecHappyFast from "../examples/ec_release_fast.txt?raw";
import ecStyled from "../examples/ec_styled.txt?raw";

type Example = {
  id: string,
  name: string,
  text: string,
};

const goalTreeExamples = [
  {id: "gt:example", name: "Example", text: gtExample},
  {id: "gt:toclang", name: "Goal Tree for TOC-lang", text: gtToclang},
  {id: "gt:styled", name: "Styled Example", text: gtStyled},
];

const evaporatingCloudExamples = [
  {id: "ec:example", name: "Example", text: ecExample},
  {id: "ec:happy_quality", name: "Speed vs Quality", text: ecHappyQuality},
  {id: "ec:release_speed", name: "Release more vs less often", text: ecHappyFast},
  {id: "ec:styled", name: "Styled Example", text: ecStyled},
];

const currentRealityTreeExamples = [
  {id: "crt:example", name: "Example", text: crtExample},
  {id: "crt:toc_adoption", name: "TOC adoption among devs", text: crtTocAdoption},
  {id: "crt:notluck", name: 'Current Reality Tree from "It’s not Luck"', text: crtNotluck},
  {id: "crt:rpa", name: "Problem Tree on RPA deployment", text: crtRpa},
  {id: "crt:styled", name: "Styled Example", text: crtStyled},
];

export const examples: [group: string, examples: Example[]][] = [
  ["Goal Tree", goalTreeExamples],
  ["Evaporating Cloud", evaporatingCloudExamples],
  ["Current Reality Tree", currentRealityTreeExamples],
];

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TitrationQuiz() {
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      key: "q1",
      title:
        "1. Which property of oxalic acid makes it suitable as a primary standard in titration?",
      options: {
        A: "It is a strong acid",
        B: "It is solid, pure, and stable in air",
        C: "It reacts slowly with bases",
        D: "It has a high molar mass",
      },
      correct: "B",
      correctText: "B) It is solid, pure, and stable in air",
    },
    {
      key: "q2",
      title:
        "2. In the reaction between oxalic acid and sodium hydroxide, the stoichiometric ratio of oxalic acid to NaOH is:",
      options: { A: "1 : 1", B: "1 : 2", C: "2 : 1", D: "2 : 3" },
      correct: "B",
      correctText: "B) 1 : 2",
    },
    {
      key: "q3",
      title:
        "3. Why is phenolphthalein used as an indicator in this titration?",
      options: {
        A: "It changes color at acidic pH",
        B: "It changes color at neutral pH",
        C: "It changes color in the basic range, which matches the endpoint of NaOH neutralization",
        D: "It is colored in both acidic and basic solutions",
      },
      correct: "C",
      correctText:
        "C) It changes color in the basic range, which matches the endpoint of NaOH neutralization",
    },
    {
      key: "q4",
      title:
        "4. If the volume of oxalic acid used in titration is higher than expected, what can be inferred about the NaOH solution?",
      options: {
        A: "Its concentration is higher than expected",
        B: "Its concentration is lower than expected",
        C: "It is more basic than oxalic acid",
        D: "The indicator was faulty",
      },
      correct: "B",
      correctText: "B) Its concentration is lower than expected",
    },
    {
      key: "q5",
      title:
        "5. The normality of NaOH solution is calculated using the formula (N₁V₁ = 2 N₂V₂). The factor \"2\" in this equation represents:",
      options: {
        A: "Number of moles of water formed",
        B: "Ratio of NaOH to oxalic acid in the reaction",
        C: "Number of acidic hydrogens in NaOH",
        D: "Volume correction factor",
      },
      correct: "B",
      correctText: "B) Ratio of NaOH to oxalic acid in the reaction",
    },
  ] as const;

  const handleSelect = (key: string, val: string) => {
    setQuizSelections((s) => ({ ...s, [key]: val }));
  };

  const submitQuiz = () => {
    let sc = 0;
    questions.forEach((q) => {
      if (quizSelections[q.key] === q.correct) sc += 1;
    });
    setScore(sc);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizSelections({});
    setQuizSubmitted(false);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-2xl">Titration 1 — Quiz</CardTitle>
              {quizSubmitted && (
                <div className="text-blue-600 font-semibold">Marks obtained ({score} / {questions.length})</div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 quiz-content">
              {questions.map((q) => (
                <section key={q.key} className="quiz-item">
                  <h3 className="font-semibold">{q.title}</h3>
                  <div className="mt-2 space-y-2">
                    {(Object.keys(q.options) as Array<keyof typeof q.options>).map((optKey) => (
                      <label key={optKey} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={q.key}
                          value={optKey}
                          checked={quizSelections[q.key] === optKey}
                          onChange={() => handleSelect(q.key, String(optKey))}
                          className="form-radio"
                        />
                        <span>
                          {optKey}) {q.options[optKey]}
                        </span>
                      </label>
                    ))}
                  </div>
                  {quizSubmitted && (() => {
                    const selected = quizSelections[q.key] as keyof typeof q.options | undefined;
                    const yourText = selected ? `${selected}) ${q.options[selected]}` : 'No answer selected';
                    const correctKey = q.correct as keyof typeof q.options;
                    const correctText = `${q.correct}) ${q.options[correctKey]}`;
                    const isCorrect = selected === q.correct;
                    return (
                      <div className="mt-2 text-sm space-y-1">
                        <div className={isCorrect ? "text-green-700 font-medium" : "text-red-600"}>Your answer: {yourText}</div>
                        <div className="text-green-700 font-medium">Answer: {correctText}</div>
                      </div>
                    );
                  })()}
                </section>
              ))}

              <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Link href="/experiment/5/results">
                  <Button variant="outline" className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiment
                  </Button>
                </Link>
                  <Link href="/">
                  <Button className="bg-gray-700 text-white">Return to Experiments</Button>
                </Link>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button onClick={submitQuiz} className="bg-blue-600 text-white">Submit</Button>
                  <Button variant="outline" onClick={resetQuiz}>Reset</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

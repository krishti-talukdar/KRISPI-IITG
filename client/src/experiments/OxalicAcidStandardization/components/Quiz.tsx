import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function OxalicAcidQuiz() {
  const { id } = useParams<{ id: string }>();
  const experimentId = parseInt(id || "8");

  const [quizSelections, setQuizSelections] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      key: "q1",
      title:
        "1. What is the equivalent weight of oxalic acid dihydrate (H₂C₂O₄·2H₂O) for preparing a normal solution?",
      options: {
        A: "126 g/equiv",
        B: "63 g/equiv",
        C: "84 g/equiv",
        D: "42 g/equiv",
      },
      correct: "B",
      concept:
        "Equivalent weight = Molar mass ÷ number of acidic hydrogens. Oxalic acid is diprotic.",
    },
    {
      key: "q2",
      title:
        "2. How many grams of oxalic acid dihydrate are required to prepare 250 mL of 0.1 N solution?",
      options: { A: "0.63 g", B: "1.575 g", C: "2.5 g", D: "12.6 g" },
      correct: "B",
      concept:
        "Mass = Normality × Equivalent weight × Volume (in liters).",
    },
    {
      key: "q3",
      title:
        "3. Why is oxalic acid considered a standard solution in volumetric analysis?",
      options: {
        A: "It is highly reactive with bases.",
        B: "Its pure form is readily available and stable.",
        C: "It changes color with indicators.",
        D: "It is insoluble in water.",
      },
      correct: "B",
      concept:
        "Standard solutions require accurate, stable, and pure substances for titrations.",
    },
    {
      key: "q4",
      title:
        "4. Which type of flask is used to prepare a 0.1 N oxalic acid solution and why?",
      options: {
        A: "Beaker, for ease of mixing",
        B: "Conical flask, for titration",
        C: "Volumetric flask, for accurate volume measurement",
        D: "Test tube, for small-scale reactions",
      },
      correct: "C",
      concept:
        "Volumetric flasks ensure precise preparation of standard solutions.",
    },
    {
      key: "q5",
      title:
        "5. If oxalic acid solution is not completely dissolved before making up the volume, what is the likely consequence?",
      options: {
        A: "The solution will become acidic",
        B: "The normality will be lower than expected",
        C: "The solution will turn basic",
        D: "There is no effect",
      },
      correct: "B",
      concept:
        "Incomplete dissolution leads to less solute in solution, reducing the actual concentration.",
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
              <CardTitle className="text-2xl">Oxalic Acid Standardization — Quiz</CardTitle>
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
                        <div className="text-gray-600">Concept: {q.concept}</div>
                      </div>
                    );
                  })()}
                </section>
              ))}

              <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Link href={`/experiment/${experimentId}/results`}>
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

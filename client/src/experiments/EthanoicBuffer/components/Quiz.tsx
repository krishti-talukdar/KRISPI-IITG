import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function BufferQuiz() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Buffer pH — Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 quiz-content">

              <section className="quiz-item">
                <h3 className="font-semibold">Q1. Ethanoic acid alone has a pH ≈ 2.9 at 0.1 M. When sodium ethanoate is added, the pH rises close to 4.7. This is mainly because:</h3>
                <div className="mt-2 space-y-1">
                  <div>A) Sodium ethanoate is strongly basic and neutralizes all the acid.</div>
                  <div>B) The common ion effect reduces the dissociation of ethanoic acid.</div>
                  <div>C) The volume of solution increases, diluting the acid.</div>
                  <div>D) Sodium ethanoate removes H⁺ ions by precipitation.</div>
                </div>
                <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The common ion effect reduces the dissociation of ethanoic acid.</div>
              </section>

              <section className="quiz-item">
                <h3 className="font-semibold">Q2. At the point where [CH₃COOH] = [CH₃COONa], the pH of the solution equals:</h3>
                <div className="mt-2 space-y-1">
                  <div>A) 7.0 (neutral point)</div>
                  <div>B) The pKa of acetic acid</div>
                  <div>C) The pKb of acetate ion</div>
                  <div>D) The ionic product of water (Kw)</div>
                </div>
                <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) The pKa of acetic acid</div>
              </section>

              <section className="quiz-item">
                <h3 className="font-semibold">Q3. Why does the solution resist large pH changes upon addition of small amounts of strong acid or base once sodium ethanoate is added?</h3>
                <div className="mt-2 space-y-1">
                  <div>A) Because sodium ethanoate hydrolyzes completely to form OH⁻</div>
                  <div>B) Because the weak acid and its conjugate base establish a buffer equilibrium</div>
                  <div>C) Because sodium ions neutralize all OH⁻ ions</div>
                  <div>D) Because dilution prevents ionization</div>
                </div>
                <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) Because the weak acid and its conjugate base establish a buffer equilibrium</div>
              </section>

              <section className="quiz-item">
                <h3 className="font-semibold">Q4. Which of the following best explains the shape of the pH vs. added sodium ethanoate volume curve?</h3>
                <div className="mt-2 space-y-1">
                  <div>A) A linear increase in pH due to direct neutralization</div>
                  <div>B) A rapid rise initially, then leveling off near pKa due to buffer action</div>
                  <div>C) A sharp fall in pH due to hydrolysis of sodium acetate</div>
                  <div>D) A constant pH value because sodium acetate is neutral</div>
                </div>
                <div className="mt-2 text-sm text-green-700 font-medium">Answer: B) A rapid rise initially, then leveling off near pKa due to buffer action</div>
              </section>

              <section className="quiz-item">
                <h3 className="font-semibold">Q5. If the Ka of ethanoic acid is 1.8 × 10⁻⁵, and you prepare a buffer with [CH₃COOH] = 0.05 M and [CH₃COONa] = 0.10 M, what would be the approximate pH?</h3>
                <div className="mt-2 space-y-1">
                  <div>A) 4.7</div>
                  <div>B) 4.9</div>
                  <div>C) 5.0</div>
                  <div>D) 5.7</div>
                </div>
                <div className="mt-2 text-sm text-green-700 font-medium">Answer: C) 5.0 (pH ≈ pKa + log([A⁻]/[HA]) = 4.745 + log(0.10/0.05) ≈ 5.05)</div>
              </section>

              <div className="flex items-center space-x-2">
                <Link href="/experiment/10">
                  <Button variant="outline" className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiment
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="bg-gray-700 text-white">Return to Experiments</Button>
                </Link>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

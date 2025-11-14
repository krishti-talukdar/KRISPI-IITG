import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function TitrationResultsPage() {
  const { id } = useParams<{ id: string }>();
  const experimentId = parseInt(id || "6");

  const [experiment, setExperiment] = useState<any | null>(null);

  // Titration state (legacy) kept for titration experiment
  const [acidNormality, setAcidNormality] = useState<string>("");
  const [acidVolume, setAcidVolume] = useState<string>("");
  const [trials, setTrials] = useState<Array<{ initial: string; final: string }>>([
    { initial: "", final: "" },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiRequest('GET', `/api/experiments/${experimentId}`);
        const json = await res.json();
        if (mounted) setExperiment(json);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [experimentId]);

  // Helper derived values for titration
  const volumes = trials
    .map((t) => {
      const i = parseFloat(t.initial);
      const f = parseFloat(t.final);
      if (Number.isFinite(i) && Number.isFinite(f)) {
        return Math.max(0, f - i);
      }
      return null;
    })
    .filter((v): v is number => v !== null);

  const meanV2 = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  const n1 = parseFloat(acidNormality);
  const v1 = parseFloat(acidVolume);
  const validInputs = Number.isFinite(n1) && Number.isFinite(v1) && meanV2 > 0;
  const n2 = validInputs ? (n1 * v1) / meanV2 : 0;
  const strength = n2 * 40;

  // Show a summary page only for Oxalic Acid PREPARATION experiments.
  // NaOH standardization against oxalic acid should use the live titration layout.
  const title = experiment?.title ?? '';
  const isOxalicPreparation = /preparation/i.test(title) && /oxalic/i.test(title);

  if (isOxalicPreparation) {
    const summary = {
      stepsCompleted: experiment?.stepDetails?.length ?? 7,
      actionsPerformed: 5,
      finalVolume: '250 mL',
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Experiment Results &amp; Analysis</h1>
            <Link href={`/experiment/${experimentId}`}>
              <Button variant="outline">Return to Experiment</Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg border">
                <div className="text-sm text-gray-600">Steps Completed</div>
                <div className="text-xl font-bold">{summary.stepsCompleted}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-white to-indigo-50 rounded-lg border">
                <div className="text-sm text-gray-600">Actions Performed</div>
                <div className="text-xl font-bold">{summary.actionsPerformed}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-white to-purple-50 rounded-lg border">
                <div className="text-sm text-gray-600">Final Volume</div>
                <div className="text-xl font-bold">{summary.finalVolume}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <section className="bg-gray-50 p-4 rounded border">
                  <h3 className="font-semibold mb-2">Chemical Equation</h3>
                  <div className="text-sm text-gray-700">H₂C₂O₄·2H₂O + 2 NaOH → Na₂C₂O₄ + 4 H₂O</div>
                </section>

                <section className="bg-white p-4 rounded border">
                  <h3 className="font-semibold mb-3">Observations &amp; Timeline</h3>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Added ~50 mL distilled water and dissolved oxalic acid — solution became clear.</li>
                    <li>Transferred to volumetric flask and added water to near mark.</li>
                    <li>Made to mark and inverted flask to mix thoroughly.</li>
                    <li>Final meniscus aligned with 250 mL mark.</li>
                  </ol>
                </section>

                <section className="bg-white p-4 rounded border">
                  <h3 className="font-semibold mb-2">Final Experimental State</h3>
                  <div className="text-sm text-gray-700">
                    <p><strong>Solution:</strong> Oxalic acid standard solution (expected 0.1 M)</p>
                    <p><strong>Color:</strong> Clear</p>
                    <p><strong>Notes:</strong> Proper mixing verified by inversion.</p>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold">Contents Analysis</h4>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Mass used: —</div>
                    <div>Calculated molarity: 0.100 M (expected)</div>
                    <div>Temperature: 25°C</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/experiment/${experimentId}/quiz`}>
                    <Button className="flex-1 bg-amber-500 text-white">QUIZ</Button>
                  </Link>
                  <Button variant="outline" className="flex-1">Close Analysis</Button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: render titration results UI
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Titration Results — Live Data</h1>
          <Link href={`/experiment/${experimentId}`}>
            <Button variant="outline">Back to Experiment</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Enter Your Readings</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Oxalic Acid Normality (N₁)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={acidNormality}
                  onChange={(e) => setAcidNormality(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Oxalic Acid Volume (V₁, mL)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={acidVolume}
                  onChange={(e) => setAcidVolume(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Trial</th>
                    <th className="py-2 pr-4">Initial (mL)</th>
                    <th className="py-2 pr-4">Final (mL)</th>
                    <th className="py-2 pr-4">NaOH Used (mL)</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t, idx) => {
                    const i = parseFloat(t.initial);
                    const f = parseFloat(t.final);
                    const vol = Number.isFinite(i) && Number.isFinite(f) ? Math.max(0, f - i) : 0;
                    return (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{idx + 1}</td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={t.initial}
                            onChange={(e) =>
                              setTrials((prev) => prev.map((row, i2) => (i2 === idx ? { ...row, initial: e.target.value } : row)))
                            }
                            className="w-24 border rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={t.final}
                            onChange={(e) =>
                              setTrials((prev) => prev.map((row, i2) => (i2 === idx ? { ...row, final: e.target.value } : row)))
                            }
                            className="w-24 border rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-4 font-mono">{vol.toFixed(2)}</td>
                        <td className="py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTrials((prev) => prev.filter((_, i2) => i2 !== idx))}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTrials((prev) => [...prev, { initial: "", final: "" }])}
                >
                  + Add Trial
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Calculated Values</h2>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-600">Mean Titre Volume (V₂)</div>
              <div className="text-lg font-bold">{meanV2.toFixed(2)} mL</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-600">NaOH Normality (N₂)</div>
              <div className="text-lg font-bold">{n2.toFixed(4)} N</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-600">Strength</div>
              <div className="text-lg font-bold">{strength.toFixed(2)} g/L</div>
            </div>

            {/* Show QUIZ button when there are at least 3 trials recorded */}
            {trials.length >= 3 && (
              <div className="pt-2">
                <Link href={`/experiment/${experimentId}/quiz`}>
                  <Button className="w-full bg-amber-500 text-white hover:bg-amber-600">
                    QUIZ
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

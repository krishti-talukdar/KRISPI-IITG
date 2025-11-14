import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Eye, Shield, Thermometer, Droplets } from "lucide-react";
import { useRoute } from "wouter";

interface SafetyGuideModalProps {
  children: React.ReactNode;
}

export default function SafetyGuideModal({ children }: SafetyGuideModalProps) {
  const [match, params] = useRoute("/experiment/:id");
  const isEquilibriumShift = match && params?.id === "1";
  const isAmmoniumBuffer = match && params?.id === "9";
  const isEthanoicBuffer = match && params?.id === "10";
  const isPHComparison = match && params?.id === "8";
  const isTitration1 = match && params?.id === "5";

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            {isAmmoniumBuffer
              ? "Safety Guide — To study the change in pH of ammonium hydroxide solution on addition of ammonium chloride"
              : isEthanoicBuffer
              ? "Safety Guide — To study the change in pH of ethanoic acid on addition of sodium ethanoate"
              : isPHComparison
              ? "Safety Guide — To determine and compare pH of 0.01 M HCl and 0.01 M CH₃COOH solution using universal indicator"
              : isEquilibriumShift
              ? "Equilibrium Shift: [Co(H₂O)₆]²⁺ ⇌ [CoCl₄]²⁻ — Safety Guidelines"
              : isTitration1
              ? "Safety Guide — Determine the strength of a given solution of sodium hydroxide by titrating it against a standard solution of oxalic acid, having the strength 0.1N."
              : "Virtual Chemistry Lab Safety Guide"}
          </DialogTitle>
          <DialogDescription>
            {isAmmoniumBuffer
              ? (
                <div>
                  <p>
                    Here’s a <strong>comprehensive safety guide</strong> for the chemistry experiment: <em>“To study the change in pH of ammonium hydroxide solution on addition of ammonium chloride”</em>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">This guide covers laboratory safety, chemical hazards, first-aid, waste disposal, emergency procedures, and post-experiment cleanup.</p>
                </div>
              ) : isEthanoicBuffer
              ? (
                <div>
                  <p>
                    Here’s a <strong>complete safety guide</strong> for the experiment: <em>“To study the change in pH of ethanoic acid on addition of sodium ethanoate.”</em>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">It includes laboratory safety measures, chemical handling guidelines, first-aid steps, waste disposal, and general precautions.</p>
                </div>
              ) : isPHComparison
              ? (
                <div>
                  <p>
                    Here’s a <strong>Safety Guide</strong> for the experiment: <em>“To determine and compare the pH of 0.01 M HCl and 0.01 M CH₃COOH solution using a universal indicator.”</em>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">This guide provides experiment‑specific hazards, PPE, handling, first‑aid, and disposal instructions for this pH comparison experiment.</p>
                </div>
              ) : isEquilibriumShift
              ? "Safety guidance specific to cobalt(II) chloride / hydrochloric acid equilibrium shift demonstration."
              : isTitration1
              ? "Safety guidance specific to determining the strength of an NaOH solution by titration against 0.1N oxalic acid."
              : "Essential safety guidelines for conducting virtual chemistry experiments"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {isAmmoniumBuffer ? (
              <>
                <section>
                  <h3 className="text-lg font-semibold mb-3">🧪 1. Objective of Safety Measures</h3>
                  <p className="text-sm">To ensure safe handling of chemicals and apparatus during the experiment involving <strong>ammonium hydroxide (NH₄OH)</strong> and <strong>ammonium chloride (NH₄Cl)</strong>, both of which can cause irritation or harm if misused.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚗ 2. Chemical Hazards</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Chemical</th>
                          <th className="pb-2">Nature of Hazard</th>
                          <th className="pb-2">Possible Effects</th>
                          <th className="pb-2">Safety Precautions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Ammonium hydroxide (NH₄OH)</td>
                          <td className="py-2">Corrosive and irritant; releases ammonia vapour</td>
                          <td className="py-2">Irritates eyes, nose, throat, and skin; inhalation causes coughing or burning sensation</td>
                          <td className="py-2">Work in a well-ventilated area or fume hood. Avoid direct inhalation. Wear gloves, goggles, and lab coat. Keep container tightly closed.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Ammonium chloride (NH₄Cl)</td>
                          <td className="py-2">Low toxicity but can irritate skin, eyes, and mucous membranes</td>
                          <td className="py-2">Coughing or irritation on inhalation; nausea if ingested</td>
                          <td className="py-2">Handle with gloves; avoid dust formation; do not taste or inhale.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Distilled water</td>
                          <td className="py-2">None</td>
                          <td className="py-2">—</td>
                          <td className="py-2">Use clean, labeled containers only.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧤 3. Personal Protective Equipment (PPE)</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Lab coat: Protects skin and clothing from splashes.</li>
                    <li>• Safety goggles: Prevents eye irritation from NH₄OH vapours or splashes.</li>
                    <li>• Gloves (nitrile or latex): Prevents contact with corrosive NH₄OH.</li>
                    <li>• Closed footwear: Protects against spills.</li>
                    <li>• Face mask (optional but recommended): Reduces exposure to ammonia vapour.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🌬 4. Laboratory Environment</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Perform the experiment in a well-ventilated laboratory or fume hood.</li>
                    <li>• Keep chemical containers tightly closed when not in use.</li>
                    <li>• Avoid heating or mixing chemicals unnecessarily — ammonia vapour is released easily.</li>
                    <li>• Keep acidic substances away from ammonium hydroxide (to prevent hazardous neutralization reactions).</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚖ 5. Handling and Storage</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Label all bottles and beakers clearly (NH₄OH, NH₄Cl, distilled water).</li>
                    <li>• Store NH₄OH in a cool, shaded area away from acids.</li>
                    <li>• Do not pipette by mouth — always use a pipette filler.</li>
                    <li>• Mix solutions slowly and stir gently to avoid splashes.</li>
                    <li>• Clean all spills immediately with plenty of water.</li>
                    <li>• Wash hands thoroughly after completing the experiment.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🚱 6. Waste Disposal</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Do not pour concentrated NH₄OH into the sink directly.</li>
                    <li>• Collect waste solution (mixture of NH₄OH and NH₄Cl) in a labeled container.</li>
                    <li>• Dilute the waste with plenty of water before disposal if permitted by local rules.</li>
                    <li>• Follow local laboratory chemical disposal protocols.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🚨 7. First Aid Measures</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Incident</th>
                          <th className="pb-2">Immediate Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Skin contact (NH₄OH or NH₄Cl)</td>
                          <td className="py-2">Rinse affected area immediately with plenty of water for at least 10–15 minutes. Remove contaminated clothing. Seek medical advice if irritation persists.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Eye contact</td>
                          <td className="py-2">Rinse eyes with clean running water for at least 15 minutes. Keep eyelids open. Seek medical attention immediately.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Inhalation of NH₄OH vapour</td>
                          <td className="py-2">Move the person to fresh air immediately. Loosen clothing and ensure normal breathing. If irritation continues, seek medical help.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Accidental ingestion</td>
                          <td className="py-2">Do not induce vomiting. Rinse mouth with water. Seek medical attention immediately.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Spillage</td>
                          <td className="py-2">Wear gloves, dilute with excess water, wipe with paper towel, and dispose in chemical waste container.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔥 8. Emergency and Good Laboratory Practices</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Know the location of eye-wash station, safety shower, and first-aid box.</li>
                    <li>• Do not eat, drink, or apply cosmetics in the laboratory.</li>
                    <li>• Avoid touching face or eyes during the experiment.</li>
                    <li>• Report all spills, injuries, or accidents to the instructor immediately.</li>
                    <li>• Keep the work area tidy and dry — pH meters and electrical equipment should not be near liquid spills.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">✅ 9. Post-Experiment Cleanup</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Rinse glassware thoroughly with tap water followed by distilled water.</li>
                    <li>• Switch off the pH meter and clean the electrode as per manufacturer instructions.</li>
                    <li>• Wipe lab benches clean and dry.</li>
                    <li>• Wash hands thoroughly before leaving the lab.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚠ 10. Safety Summary</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Hazard Type</th>
                          <th className="pb-2">Risk Level</th>
                          <th className="pb-2">Preventive Measure</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Ammonia vapour inhalation</td>
                          <td className="py-2">Moderate</td>
                          <td className="py-2">Work under fume hood, avoid leaning over NH₄OH.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Chemical splashes</td>
                          <td className="py-2">Moderate</td>
                          <td className="py-2">Use goggles, gloves, and coat.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Skin/eye irritation</td>
                          <td className="py-2">Moderate</td>
                          <td className="py-2">Wash immediately with plenty of water.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Accidental ingestion</td>
                          <td className="py-2">Low</td>
                          <td className="py-2">Never pipette by mouth; label all solutions.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : isEthanoicBuffer ? (
              <>
                <section>
                  <h3 className="text-lg font-semibold mb-3">🔰 Safety Guide</h3>
                  <p className="text-sm">1. Purpose — To ensure safe handling of chemicals and instruments while studying the pH change of ethanoic acid upon addition of sodium ethanoate.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚗ 2. Chemicals Used</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Chemical</th>
                          <th className="pb-2">Nature</th>
                          <th className="pb-2">Hazards</th>
                          <th className="pb-2">Safety Measures</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        <tr>
                          <td className="py-2">Ethanoic acid (CH₃COOH)</td>
                          <td className="py-2">Weak acid</td>
                          <td className="py-2">Corrosive in concentrated form; irritant to skin and eyes</td>
                          <td className="py-2">Use diluted solution (0.1 M). Handle with gloves and goggles. Avoid inhaling vapors.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Sodium ethanoate (CH₃COONa)</td>
                          <td className="py-2">Salt (neutral/alkaline)</td>
                          <td className="py-2">Mild irritant</td>
                          <td className="py-2">Avoid contact with eyes; wash hands after use.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Distilled water</td>
                          <td className="py-2">Neutral</td>
                          <td className="py-2">No hazard</td>
                          <td className="py-2">Use only for dilution and cleaning glassware.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧤 3. Personal Protective Equipment (PPE)</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Lab coat — to protect from spills.</li>
                    <li>• Safety goggles — to protect eyes from acid splashes.</li>
                    <li>• Gloves (preferably nitrile or latex) — to prevent skin contact.</li>
                    <li>• Closed footwear — avoid sandals or open shoes.</li>
                    <li>• Mask (optional) — if working in a poorly ventilated area.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧪 4. Laboratory Safety Precautions</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Perform the experiment on a clean, dry bench.</li>
                    <li>• Do not taste or directly smell any chemical.</li>
                    <li>• Use pipette filler—never pipette by mouth.</li>
                    <li>• Handle all glassware carefully; check for cracks before use.</li>
                    <li>• Keep the pH meter electrode clean and wet when not in use.</li>
                    <li>• Label all beakers containing solutions clearly to avoid confusion.</li>
                    <li>• Keep food and drinks out of the laboratory.</li>
                    <li>• In case of spillage, dilute with plenty of water and wipe immediately.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">💧 5. Chemical Handling and Mixing</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Always add acid to water, not the reverse, to prevent splashing.</li>
                    <li>• When mixing ethanoic acid and sodium ethanoate: mix slowly while stirring with a glass rod; avoid vigorous shaking or splashing.</li>
                    <li>• Dispose of small volumes (≤25 mL) of diluted solutions down the sink with plenty of running water.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">�� 6. First Aid Measures</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Situation</th>
                          <th className="pb-2">Immediate Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Skin contact (acid or salt)</td>
                          <td className="py-2">Rinse the affected area with plenty of running water for at least 10 min. Remove contaminated clothing.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Eye contact</td>
                          <td className="py-2">Rinse with cold, clean water for 10–15 min keeping eyelids open. Seek medical attention immediately.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Inhalation of vapors</td>
                          <td className="py-2">Move to fresh air, keep calm, seek medical help if irritation persists.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Ingestion</td>
                          <td className="py-2">Rinse mouth with water. Do <strong>not</strong> induce vomiting. Inform the teacher or lab in-charge immediately.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧹 7. Waste Disposal</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Neutralize acidic residues using dilute sodium bicarbonate before disposal when appropriate.</li>
                    <li>• Discard buffer solution and rinse containers with plenty of water.</li>
                    <li>• Do not mix chemical wastes in the sink—flush separately if required by your institution.</li>
                    <li>• Dispose of broken glass in the designated glass disposal box.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚠ 8. Emergency Measures</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Know the location of: First aid box, Eye wash station, Fire extinguisher, Emergency exit.</li>
                    <li>• Report all accidents or spills to the instructor immediately.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">📋 9. General Precautions</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Read the experiment thoroughly before starting.</li>
                    <li>• Follow your instructor’s directions carefully.</li>
                    <li>• Never leave the experiment unattended.</li>
                    <li>• Wash your hands thoroughly after completing the experiment.</li>
                    <li>• Ensure the lab bench is clean and dry before leaving.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">✅ 10. Safety Summary Table</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Category</th>
                          <th className="pb-2">Safety Rule</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Personal</td>
                          <td className="py-2">Wear lab coat, goggles, and gloves.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Chemical</td>
                          <td className="py-2">Handle ethanoic acid with care; use dilute form.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Instrumental</td>
                          <td className="py-2">Calibrate and handle pH meter carefully.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Waste</td>
                          <td className="py-2">Neutralize and dispose of solutions safely.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Emergency</td>
                          <td className="py-2">Know first aid and emergency procedures.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : isPHComparison ? (
              <>
                <section>
                  <h3 className="text-sm">Here’s a <em>Safety Guide</em> for the experiment —</h3>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔒 <em>Safety Guide</em></h3>
                  <p className="text-sm">Experiment: <em>To determine and compare the pH of 0.01 M HCl and 0.01 M CH₃COOH solution using a universal indicator.</em></p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚗ <em>1. Purpose of Safety Guide</em></h3>
                  <p className="text-sm">To ensure safe laboratory practices while handling dilute acids and universal indicators during the pH determination experiment.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚠ <em>2. Hazards Identification</em></h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Substance</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Hazard Description</th>
                          <th className="pb-2">Precaution</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2"><em>Hydrochloric Acid (0.01 M)</em></td>
                          <td className="py-2">Corrosive (dilute form, mild)</td>
                          <td className="py-2">Can irritate skin, eyes, or respiratory tract if mishandled</td>
                          <td className="py-2">Avoid direct contact, wear gloves and goggles</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Ethanoic Acid (0.01 M)</em></td>
                          <td className="py-2">Irritant</td>
                          <td className="py-2">Has a pungent smell; may irritate eyes and skin</td>
                          <td className="py-2">Handle in a well-ventilated area, wear gloves</td>
                        </tr>
                        <tr>
                          <td className="py-2"><em>Universal Indicator Solution</em></td>
                          <td className="py-2">Slightly acidic/alkaline (depending on brand)</td>
                          <td className="py-2">May stain skin or clothing</td>
                          <td className="py-2">Handle carefully, avoid spills</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Glassware</em></td>
                          <td className="py-2">Physical hazard</td>
                          <td className="py-2">May break and cause injury</td>
                          <td className="py-2">Handle carefully and inspect for cracks</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧤 <em>3. Personal Protective Equipment (PPE)</em></h3>
                  <p className="text-sm">Before beginning the experiment, <em>ensure you are wearing:</em></p>
                  <ul className="space-y-2 text-sm">
                    <li>• Laboratory coat or apron</li>
                    <li>• Protective goggles</li>
                    <li>• Gloves (nitrile or latex)</li>
                    <li>• Closed-toe shoes</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧪 <em>4. Safe Handling Practices</em></h3>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Use <em>droppers or pipettes</em> for transferring solutions—never pour directly from stock bottles.</li>
                    <li><em>Label</em> all glassware before use to avoid confusion between HCl and CH₃COOH.</li>
                    <li>Always work on a <em>clean and dry lab bench</em>.</li>
                    <li>Keep acids away from bases and organic solvents.</li>
                    <li><em>Do not inhale</em> vapors from ethanoic acid—its smell can cause discomfort.</li>
                    <li><em>Do not taste or touch</em> any chemical used in the experiment.</li>
                    <li>Add <em>only a few drops</em> of universal indicator; excess may cause staining or spillage.</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🚿 <em>5. First Aid Measures</em></h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Exposure Type</th>
                          <th className="pb-2">Immediate Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Skin contact</td>
                          <td className="py-2">Rinse affected area with plenty of water for at least 5 minutes.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Eye contact</td>
                          <td className="py-2">Wash eyes immediately with water; report to instructor or lab technician.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Inhalation of vapors</td>
                          <td className="py-2">Move to fresh air immediately. If irritation persists, seek medical help.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Ingestion (accidental)</td>
                          <td className="py-2">Rinse mouth with water; do <strong>not</strong> induce vomiting; inform supervisor.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">�� <em>6. Waste Disposal Guidelines</em></h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Neutralize used acidic solutions with a small amount of <em>dilute sodium bicarbonate solution</em> before disposal.</li>
                    <li>• Dispose of neutralized solutions in the <em>designated laboratory sink</em>.</li>
                    <li>• <em>Do not mix</em> HCl and CH₃COOH waste together in the same container.</li>
                    <li>• Dispose of used indicator paper or contaminated tissues in the <em>solid waste bin</em>.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔄 <em>7. Post-Experiment Safety</em></h3>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Wash all glassware with water and place them back in the rack.</li>
                    <li>Clean your work area thoroughly.</li>
                    <li>Wash hands with soap and water even if gloves were used.</li>
                    <li>Record observations only after completing all cleanup steps.</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧭 <em>8. Emergency Equipment Checklist</em></h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Eye wash station</li>
                    <li>• Safety shower</li>
                    <li>• Fire extinguisher</li>
                    <li>• First-aid box</li>
                    <li>• Spill neutralization kit</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">✅ <em>Safety Summary</em></h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Handle acids carefully and always wear protective gear.</li>
                    <li>• Work methodically—avoid rushing.</li>
                    <li>• Maintain cleanliness and caution throughout the experiment.</li>
                    <li>• Dispose of all chemicals safely.</li>
                  </ul>
                </section>
              </>
            ) : isEquilibriumShift ? (
              <>
                <section>
                  <h3 className="text-lg font-semibold mb-3">Here’s a <em>Safety Guide</em> for the experiment — <em>“To study the shift in equilibrium between [Co(H₂O)₆]²⁺ and Cl⁻ by changing the concentration of either ions.”</em></h3>
                  <p className="text-sm">This guide provides detailed chemical hazards, PPE, safe practices, waste disposal, first aid, emergency equipment, and general safety reminders specific to this experiment.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧪 SAFETY GUIDE</h3>
                  <h4 className="text-md font-semibold mb-2">🔷 1. Chemical Hazards</h4>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Chemical</th>
                          <th className="pb-2">Hazard Type</th>
                          <th className="pb-2">Safety Precautions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2"><em>Cobalt(II) chloride (CoCl₂) / Cobalt(II) sulfate (CoSO₄)</em></td>
                          <td className="py-2">Toxic if ingested or inhaled; may cause skin irritation; harmful to aquatic life.</td>
                          <td className="py-2">• Avoid inhaling dust or vapours.<br />• Wear gloves and goggles.<br />• Do not touch with bare hands.<br />• Dispose of cobalt solutions as <em>heavy metal waste</em>, not in sink.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Hydrochloric acid (HCl)</em></td>
                          <td className="py-2">Corrosive; causes burns to skin and eyes; irritant vapour.</td>
                          <td className="py-2">• Handle in a <em>fume hood</em> or well-ventilated area.<br />• Always <em>add acid to water</em>, never the reverse.<br />• Wear gloves, goggles, and lab coat.<br />• If spilled, neutralize with sodium bicarbonate before cleaning.</td>
                        </tr>
                        <tr>
                          <td className="py-2"><em>Sodium chloride (NaCl)</em></td>
                          <td className="py-2">Low hazard, but concentrated solution can irritate eyes or cuts.</td>
                          <td className="py-2">• Avoid contact with eyes.<br />• Wipe spills immediately.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Distilled water</em></td>
                          <td className="py-2">—</td>
                          <td className="py-2">Safe, but can cause splashes when mixing acids—handle glassware carefully.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔷 2. Personal Protective Equipment (PPE)</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <em>Lab coat</em> – always worn and buttoned.</li>
                    <li>• <em>Safety goggles</em> – protect eyes from acid splashes.</li>
                    <li>• <em>Nitrile or latex gloves</em> – prevent skin contact with cobalt and acid.</li>
                    <li>• <em>Closed shoes</em> – avoid skin exposure on feet.</li>
                    <li>• <em>Face mask</em> (optional) – when working with cobalt powder or concentrated acid vapours.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔷 3. Safe Laboratory Practices</h3>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Work in a well-ventilated area or fume hood when handling HCl.</li>
                    <li>Label all test tubes clearly to avoid mix-ups.</li>
                    <li>Avoid direct contact with any chemical; use pipettes or droppers.</li>
                    <li>Never taste or smell any chemical directly.</li>
                    <li>Do not pipette by mouth. Always use a pipette bulb.</li>
                    <li>Avoid spills — in case of spill, inform instructor immediately.</li>
                    <li>Keep all containers closed when not in use to avoid evaporation or contamination.</li>
                    <li>Wash hands thoroughly after completing the experiment.</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔷 4. Waste Disposal</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <em>Cobalt-containing solutions</em> → Collect in a <em>labeled heavy-metal waste container</em> (never pour into sink).</li>
                    <li>• <em>Acidic waste</em> → Neutralize with <em>sodium carbonate or sodium bicarbonate</em> before disposal.</li>
                    <li>• <em>Glassware</em> → Rinse thoroughly before returning.</li>
                    <li>• <em>Paper towels/filters contaminated with cobalt</em> → Dispose in <em>solid chemical waste bin</em>.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔷 5. First Aid Measures</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Type of Exposure</th>
                          <th className="pb-2">Immediate Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Skin contact</td>
                          <td className="py-2">Rinse immediately with plenty of water for at least <em>10–15 minutes</em>. Remove contaminated clothing. Seek medical advice if irritation persists.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Eye contact</td>
                          <td className="py-2">Rinse eyes thoroughly with water using an eye-wash station for <em>at least 15 minutes</em>. Seek medical help immediately.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Inhalation of fumes</td>
                          <td className="py-2">Move to fresh air. Loosen tight clothing. If difficulty breathing continues, get medical help.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Ingestion</td>
                          <td className="py-2">Do <em>not</em> induce vomiting. Rinse mouth with water and get medical attention immediately.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🔷 6. Emergency Equipment Checklist</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Eye wash station</li>
                    <li>• Safety shower</li>
                    <li>• First-aid kit</li>
                    <li>• Fire extinguisher (CO₂ or dry powder type)</li>
                    <li>• Spill neutralizing agents (baking soda, sand)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚠ 7. General Safety Reminder</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Handle all cobalt compounds as <em>toxic substances</em>.</li>
                    <li>• Concentrated HCl is <em>highly corrosive</em> — add carefully using droppers or pipettes.</li>
                    <li>• Dispose of waste <em>responsibly and separately</em>.</li>
                    <li>• <em>Never work alone</em> in the lab during such experiments.</li>
                  </ul>
                </section>
              </>
            ) : isTitration1 ? (
              <>
                <section>
                  <h3 className="text-lg font-semibold mb-3">🧪 1. Objective</h3>
                  <p className="text-sm">Determine the strength of an unknown <strong>sodium hydroxide (NaOH)</strong> solution by titrating it against a <strong>standard oxalic acid (H₂C₂O₄, 0.1 N)</strong> solution using phenolphthalein indicator.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">⚠ 2. Chemical Hazards</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Chemical</th>
                          <th className="pb-2">Hazard Type</th>
                          <th className="pb-2">Safety Precautions</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        <tr>
                          <td className="py-2"><em>Sodium Hydroxide (NaOH)</em></td>
                          <td className="py-2">Corrosive — causes severe skin burns and eye damage</td>
                          <td className="py-2">Handle with gloves and goggles; if spilled, wash immediately with plenty of water</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Oxalic Acid (H₂C₂O₄)</em></td>
                          <td className="py-2">Toxic/irritant — harmful if swallowed or inhaled</td>
                          <td className="py-2">Avoid contact and inhalation; use a spatula when handling solid oxalic acid</td>
                        </tr>
                        <tr>
                          <td className="py-2"><em>Phenolphthalein Indicator</em></td>
                          <td className="py-2">Irritant — may cause skin and eye irritation</td>
                          <td className="py-2">Use small quantities; wash hands after use</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2"><em>Distilled Water</em></td>
                          <td className="py-2">No hazard</td>
                          <td className="py-2">Ensure glassware is clean before use</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧤 3. Personal Protective Equipment (PPE)</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Laboratory coat (buttoned up)</li>
                    <li>• Safety goggles</li>
                    <li>• Gloves (preferably nitrile)</li>
                    <li>• Closed shoes; tie back long hair and avoid loose clothing</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧯 4. Safety Precautions</h3>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Perform the titration on a clean, stable bench away from the edge.</li>
                    <li>Rinse burette and pipette with respective solutions before use.</li>
                    <li>Do not pipette by mouth — use a pipette filler/bulb.</li>
                    <li>Handle NaOH carefully; it can cause burns on contact.</li>
                    <li>Wipe any spills immediately with plenty of water.</li>
                    <li>Avoid inhaling oxalic acid dust/vapours.</li>
                    <li>When preparing oxalic acid, stir gently until fully dissolved.</li>
                    <li>Always add acid to water, never the reverse, when diluting.</li>
                    <li>Take burette readings at eye level to avoid parallax error.</li>
                    <li>Dispose chemical waste in designated neutralization container.</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🚿 5. First Aid Measures</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Incident</th>
                          <th className="pb-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        <tr>
                          <td className="py-2">Skin contact with NaOH or oxalic acid</td>
                          <td className="py-2">Wash immediately with plenty of running water; remove contaminated clothing; seek help if irritation persists.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Eye contact</td>
                          <td className="py-2">Rinse eyes with water for at least 15 minutes; get medical assistance immediately.</td>
                        </tr>
                        <tr>
                          <td className="py-2">Inhalation of oxalic acid dust</td>
                          <td className="py-2">Move to fresh air; seek medical help if breathing difficulty occurs.</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2">Accidental ingestion</td>
                          <td className="py-2">Do not induce vomiting; rinse mouth and seek medical attention immediately.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">🧴 6. Waste Disposal</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Neutralize acid/base residues with dilute sodium bicarbonate before disposal.</li>
                    <li>• Dispose of phenolphthalein and organic wastes in labeled waste containers.</li>
                    <li>• Rinse all glassware thoroughly with water after completion.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">📋 7. General Laboratory Conduct</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Do not eat, drink, or chew in the lab.</li>
                    <li>• Record all readings neatly and accurately.</li>
                    <li>• Wash hands thoroughly after completing the experiment.</li>
                    <li>• Clean the workspace and return apparatus to proper places.</li>
                  </ul>
                </section>
              </>
            ) : (
              <>
                {/* General Safety */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    General Laboratory Safety
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Always read experiment instructions completely before starting</li>
                    <li>• Follow all procedural steps in the correct order</li>
                    <li>• Never skip safety warnings or precautions</li>
                    <li>• Report any unusual observations or unexpected results</li>
                    <li>• Keep your virtual workspace organized and clean</li>
                  </ul>
                </section>

                {/* Chemical Handling */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    Chemical Handling
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Clearly label all reagents and verify concentrations before use</li>
                    <li>• Add acid to water when diluting, never the reverse</li>
                    <li>• Do not mix unknown chemicals or exceed specified volumes</li>
                    <li>• Treat corrosive and oxidizing reagents with extra care</li>
                    <li>• Clean simulated spills immediately and reset if unsafe conditions occur</li>
                  </ul>
                </section>

                {/* Temperature Control */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-600" />
                    Temperature and Heating Safety
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Monitor temperature continuously during heating</li>
                    <li>• Never exceed recommended temperature ranges</li>
                    <li>• Allow hot equipment to cool before handling</li>
                    <li>• Use appropriate heating rates - avoid rapid temperature changes</li>
                    <li>• Be aware that some reactions are exothermic (release heat)</li>
                  </ul>
                </section>

                {/* Equipment Safety */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    Virtual Equipment Guidelines
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Check that all virtual equipment is properly set up</li>
                    <li>• Ensure stirring mechanisms are functioning correctly</li>
                    <li>• Verify temperature controls are responsive</li>
                    <li>• Use appropriate glassware for each step</li>
                    <li>• Follow proper mixing and stirring techniques</li>
                  </ul>
                </section>

                {/* Emergency Procedures */}
                <section>
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold mb-3 text-red-800">Virtual Emergency Procedures</h3>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li>• If an experiment behaves unexpectedly, stop and review instructions</li>
                      <li>• Reset the simulation if parameters go out of safe ranges</li>
                      <li>• Contact instructor if you encounter persistent issues</li>
                      <li>• Document any unusual observations in your lab notebook</li>
                    </ul>
                  </div>
                </section>

                {/* Best Practices */}
                <section>
                  <h3 className="text-lg font-semibold mb-3">Best Practices for Virtual Labs</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Take your time - rushing leads to mistakes</li>
                    <li>• Record observations and measurements accurately</li>
                    <li>• Review safety information before each new experiment</li>
                    <li>• Practice proper laboratory techniques even in virtual environment</li>
                    <li>• Ask questions if you're unsure about any procedure</li>
                  </ul>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import React from "react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Wrench, Undo2, Beaker, Droplets, FlaskConical, TestTube } from "lucide-react";

export default function BufferWorkbenchMock() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buffer pH - Interactive Workbench (Mock)</h1>
          <p className="text-gray-600">To study the change in pH of ethanoic acid on addition of sodium ethanoate</p>
        </div>

        <Card className="min-h-[80vh] shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50">
            <CardTitle className="text-2xl">Buffer pH - Interactive Workbench</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Left column - Equipment toolbar */}
                <aside className="lg:col-span-3 space-y-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Wrench className="w-5 h-5 mr-2 text-blue-600" />Equipment</h3>
                    <div className="space-y-3">
                      <EquipmentCard icon={<TestTube className="w-6 h-6 text-blue-600" />} title="25ml Test Tube" />
                      <EquipmentCard icon={<Droplets className="w-6 h-6 text-yellow-600" />} title="0.1 M Ethanoic (Acetic) Acid" />
                      <EquipmentCard icon={<Droplets className="w-6 h-6 text-blue-600" />} title="0.1 M Sodium Ethanoate (Sodium Acetate)" />
                      <EquipmentCard icon={<FlaskConical className="w-6 h-6 text-purple-700" />} title="pH Meter or pH Paper" />
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700"><strong>Tip:</strong> Drag equipment to the workbench following the steps.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"><Undo2 className="w-4 h-4 mr-2" />UNDO</Button>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-2 text-white" />View Results & Analysis</Button>
                    <Button variant="destructive" className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100">Reset Experiment</Button>
                  </div>
                </aside>

                {/* Center - Workbench */}
                <main className="lg:col-span-6">
                  <div className="lab-workbench ethanoic-workbench relative p-6 rounded-lg">
                    <div className="workbench-step-badge absolute top-4 left-4 bg-white/90 rounded-full px-3 py-2 border shadow-sm flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2" />
                      <span className="text-sm font-medium text-gray-700">Step 8 of 9</span>
                    </div>

                    <div className="workbench-label absolute top-4 right-4 bg-white/90 rounded-lg px-3 py-2 border shadow-sm">
                      <span className="text-sm font-medium text-gray-700">Laboratory Workbench</span>
                    </div>

                    <div className="relative h-[560px] flex items-center justify-center">
                      <div className="w-[240px] h-[360px] flex flex-col items-center">
                        <img src="https://cdn.builder.io/api/v1/image/assets%2Fc52292a04d4c4255a87bdaa80a28beb9%2F3dd94cfaa2fc4876a1e3759c6d76db7e?format=webp&width=800" alt="Test tube" className="w-full h-full object-contain" />
                        <span className="text-sm font-medium mt-2 text-center block">25ml Test Tube</span>
                      </div>

                      {/* Right reagent cards */}
                      <div className="absolute right-8 top-28 w-40 space-y-3">
                        <div className="bg-white rounded-xl border p-3 shadow-sm flex items-center">
                          <div className="w-12 h-12 bg-yellow-50 rounded-md flex items-center justify-center mr-3 chemical-bottle-shadow"><Droplets className="w-6 h-6 text-yellow-700" /></div>
                          <div className="text-sm">0.1 M Ethanoic (Acetic) Acid</div>
                        </div>

                        <div className="bg-white rounded-xl border p-3 shadow-sm flex items-center">
                          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center mr-3 chemical-bottle-shadow"><Droplets className="w-6 h-6 text-blue-600" /></div>
                          <div className="text-sm">0.1 M Sodium Ethanoate</div>
                        </div>

                        <div className="mt-4">
                          <Button size="sm" className="bg-red-500 text-white hover:bg-red-600">
                          <span className="block font-semibold">RESET</span>
                          <span className="block text-xs">(CH₃COONa)</span>
                        </Button>
                        </div>
                      </div>

                      {/* Bottom platform */}
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-8 bg-amber-400 rounded shadow-sm" />
                    </div>
                  </div>
                </main>

                {/* Right - Live Analysis */}
                <aside className="lg:col-span-3 space-y-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />Live Analysis</h3>

                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Current Step</h4>
                      <p className="text-xs text-gray-600">Explore Different Ratios</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Completed Steps</h4>
                      <div className="space-y-1 text-sm text-green-600">
                        <div className="flex items-center space-x-2"><CheckCircle className="w-3 h-3" /><span>Drag and drop the test tube in the workbench</span></div>
                        <div className="flex items-center space-x-2"><CheckCircle className="w-3 h-3" /><span>Prepare Acid Solution</span></div>
                        <div className="flex items-center space-x-2"><CheckCircle className="w-3 h-3" /><span>Measure initial pH</span></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Measured pH</h4>
                      <div className="flex items-center space-x-2">
                        <div className="text-2xl font-bold text-purple-700">4.71</div>
                        <div className="text-xs text-gray-500">Acidic</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                        <div className="font-medium">CASE 1</div>
                        <div className="text-lg text-black font-semibold">4.46 (Acidic)</div>
                      </div>
                      <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                        <div className="font-medium">CASE 2</div>
                        <div className="text-lg text-black font-semibold">4.71 (Acidic)</div>
                      </div>
                    </div>

                  </div>
                </aside>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const EquipmentCard: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg">
    <div className="text-2xl mb-0 mr-3 text-blue-600">{icon}</div>
    <div className="text-sm font-medium text-gray-700">{title}</div>
  </div>
);

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Beaker, BookOpen, CheckCircle } from "lucide-react";

interface InsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onYes: () => void;
  onNo: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({
  open,
  onOpenChange,
  onYes,
  onNo,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 rounded-full p-3">
              <Beaker className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-blue-800 mb-2">
            Experiment Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔬 Let's get an insight to how the color changes.
            </h3>
            <p className="text-gray-600 text-base">
              Are you ready to explore the fascinating science behind what just
              happened?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={onYes}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              size="lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Yes! I'm Excited
            </Button>

            <Button
              onClick={onNo}
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              No! For next time
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-white/60 rounded-lg p-3 border border-blue-100">
            💡 This insight will help you understand Le Chatelier's principle
            and chemical equilibrium better!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

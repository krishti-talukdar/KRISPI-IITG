import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy, Star } from "lucide-react";

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  open,
  onOpenChange,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 rounded-full p-3 relative">
              <Trophy className="h-8 w-8 text-white" />
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Star className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-green-800 mb-2">
            Experiment Completed!
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-green-200">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🎉 Congratulations!
            </h3>
            <p className="text-gray-600 text-base">
              You've successfully completed the Chemical Equilibrium experiment.
              Great work observing the color changes and understanding Le
              Chatelier's principle!
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 You can always come back later to explore the detailed insights
              about the color changes!
            </p>
          </div>

          <Button
            onClick={onClose}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl w-full"
            size="lg"
          >
            Finish Experiment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import Header from "@/components/header";
import ChemicalEquilibriumApp from "@/experiments/ChemicalEquilibrium/components/ChemicalEquilibriumApp";
import HClPHApp from "@/experiments/HClPH/components/HClPHApp";
import EquilibriumShiftApp from "@/experiments/EquilibriumShift/components/EquilibriumShiftApp";
import FeSCNEquilibriumApp from "@/experiments/FeSCNEquilibrium/components/FeSCNEquilibriumApp";
import Titration1App from "@/experiments/Titration1/components/Titration1App";
import LassaigneApp from "@/experiments/LassaigneTest/components/LassaigneApp";
import PHComparisonApp from "@/experiments/PHComparison/components/PHComparisonApp";
import AmmoniumBufferApp from "@/experiments/AmmoniumBuffer/components/AmmoniumBufferApp";
import BufferPHApp from "@/experiments/EthanoicBuffer/components/BufferPHApp";
import BufferQuiz from "@/experiments/EthanoicBuffer/components/Quiz";
import TitrationQuiz from "@/experiments/Titration1/components/Quiz";
import { OxalicAcidApp } from "@/experiments/OxalicAcidStandardization";
import OxalicAcidQuiz from "@/experiments/OxalicAcidStandardization/components/Quiz";
import GenericExperimentApp from "@/experiments/Generic/components/GenericExperimentApp";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useRoute, useParams, useLocation } from "wouter";

export default function Experiment() {
  const { id } = useParams<{ id: string }>();
  const experimentId = parseInt(id || "1");
  const [, navigate] = useLocation();

  // detect quiz route (e.g. /experiment/10/quiz)
  const [quizMatch, quizParams] = useRoute("/experiment/:id/quiz");
  const isQuizRoute = Boolean(quizMatch && Number(quizParams?.id) === experimentId);

  // Support for available experiments
  const getExperimentComponent = () => {
    if (isQuizRoute && experimentId === 10) {
      return <BufferQuiz />;
    }

    if (isQuizRoute && experimentId === 5) {
      return <TitrationQuiz />;
    }

    if (isQuizRoute && experimentId === 8) {
      return <OxalicAcidQuiz />;
    }

    switch (experimentId) {
      case 1:
        return <EquilibriumShiftApp onBack={() => window.history.back()} />;
      case 2:
        return <ChemicalEquilibriumApp onBack={() => window.history.back()} />;
      case 3:
        return <FeSCNEquilibriumApp onBack={() => window.history.back()} />;
      case 4:
        return <HClPHApp onBack={() => window.history.back()} />;
      case 5:
        return <Titration1App onBack={() => navigate("/")} />;
      case 6:
        return <LassaigneApp onBack={() => window.history.back()} />;
      case 7:
        return <PHComparisonApp onBack={() => window.history.back()} />;
      case 8:
        return <OxalicAcidApp onBack={() => window.history.back()} />;
      case 9:
        return <AmmoniumBufferApp onBack={() => window.history.back()} />;
      case 10:
        return <BufferPHApp onBack={() => window.history.back()} />;
      default:
        return (
          <GenericExperimentApp experimentId={experimentId} onBack={() => window.history.back()} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {getExperimentComponent()}
    </div>
  );
}

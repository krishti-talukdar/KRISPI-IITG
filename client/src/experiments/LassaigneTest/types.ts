export type ExperimentMode = { current: 'guided'; currentGuidedStep: number };

export interface LassaigneStep {
  id: number;
  title: string;
  description: string;
  duration?: string;
  safety?: string;
}

export interface LassaigneData {
  title: string;
  description: string;
  stepDetails: LassaigneStep[];
}

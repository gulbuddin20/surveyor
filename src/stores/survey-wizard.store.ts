"use client";

import { create } from "zustand";

type SurveyWizardState = {
  currentSection: number;
  selectedQuestionIds: string[];
  setCurrentSection: (section: number) => void;
  setSelectedQuestionIds: (questionIds: string[]) => void;
  toggleQuestion: (questionId: string) => void;
  reset: () => void;
};

export const useSurveyWizardStore = create<SurveyWizardState>((set) => ({
  currentSection: 0,
  selectedQuestionIds: [],
  setCurrentSection: (currentSection) => set({ currentSection }),
  setSelectedQuestionIds: (selectedQuestionIds) => set({ selectedQuestionIds }),
  toggleQuestion: (questionId) =>
    set((state) => ({
      selectedQuestionIds: state.selectedQuestionIds.includes(questionId)
        ? state.selectedQuestionIds.filter((id) => id !== questionId)
        : [...state.selectedQuestionIds, questionId],
    })),
  reset: () => set({ currentSection: 0, selectedQuestionIds: [] }),
}));

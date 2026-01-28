import { create } from "zustand";
import type { RunStep } from "@/types/run.types";

interface RunState {
  // Run metadata
  runId: string | null;
  mode: "ranked" | "training" | null;
  startTitle: string;
  targetTitle: string;
  routeId: string | null;
  matchId: string | null;

  // Current state
  currentTitle: string;
  currentHtml: string;
  isLoading: boolean;

  // Metrics
  activeTimeMs: number;
  clicksCount: number;
  missesCount: number;
  routeTitles: string[];
  steps: RunStep[];

  // Timer state
  timerRunning: boolean;
  timerStartedAt: number | null;
  lastPausedAt: number | null;

  // Outgoing links from current page
  outgoingLinks: string[];

  // Run completion
  isCompleted: boolean;
  isTargetReached: boolean;

  // Actions
  initializeRun: (data: {
    runId: string;
    mode: "ranked" | "training";
    startTitle: string;
    targetTitle: string;
    routeId: string | null;
    matchId: string | null;
    initialHtml?: string;
    initialTitle?: string;
    outgoingLinks?: string[];
  }) => void;

  setCurrentArticle: (title: string, html: string) => void;
  setOutgoingLinks: (links: string[]) => void;
  setLoading: (loading: boolean) => void;

  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  registerNavigation: (nextTitle: string, hadDirectLinkToTarget: boolean) => void;
  completeRun: () => {
    activeTimeMs: number;
    clicksCount: number;
    missesCount: number;
    routeTitles: string[];
    steps: RunStep[];
  };

  reset: () => void;
}

const initialState = {
  runId: null,
  mode: null,
  startTitle: "",
  targetTitle: "",
  routeId: null,
  matchId: null,
  currentTitle: "",
  currentHtml: "",
  isLoading: false,
  activeTimeMs: 0,
  clicksCount: 0,
  missesCount: 0,
  routeTitles: [],
  steps: [],
  timerRunning: false,
  timerStartedAt: null,
  lastPausedAt: null,
  outgoingLinks: [],
  isCompleted: false,
  isTargetReached: false,
};

export const useRunStore = create<RunState>((set, get) => ({
  ...initialState,

  initializeRun: (data) => {
    const title = data.initialTitle || data.startTitle;
    const html = data.initialHtml || "";

    console.log('[RunStore] initializeRun called:', {
      title,
      htmlLength: html.length,
      hasHtml: !!html,
      startTitle: data.startTitle,
      targetTitle: data.targetTitle,
    });

    set({
      ...initialState,
      runId: data.runId,
      mode: data.mode,
      startTitle: data.startTitle,
      targetTitle: data.targetTitle,
      routeId: data.routeId,
      matchId: data.matchId,
      currentTitle: title,
      currentHtml: html,
      outgoingLinks: data.outgoingLinks || [],
      routeTitles: [title],
      steps: [
        {
          title: title,
          timestamp_entered: Date.now(),
          timestamp_left: null,
          had_direct_link_to_target: false,
        },
      ],
      // Start timer immediately on initialization
      timerRunning: true,
      timerStartedAt: performance.now(),
    });

    console.log('[RunStore] State after init:', {
      currentTitle: title,
      currentHtmlLength: html.length,
    });
  },

  setCurrentArticle: (title, html) => {
    set({ currentTitle: title, currentHtml: html });
  },

  setOutgoingLinks: (links) => {
    set({ outgoingLinks: links });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  startTimer: () => {
    set({
      timerRunning: true,
      timerStartedAt: performance.now(),
      lastPausedAt: null,
    });
  },

  pauseTimer: () => {
    const state = get();
    if (!state.timerRunning || state.timerStartedAt === null) return;

    const now = performance.now();
    const elapsed = now - state.timerStartedAt;

    set({
      timerRunning: false,
      activeTimeMs: state.activeTimeMs + elapsed,
      lastPausedAt: now,
      timerStartedAt: null,
    });
  },

  resumeTimer: () => {
    set({
      timerRunning: true,
      timerStartedAt: performance.now(),
      lastPausedAt: null,
    });
  },

  registerNavigation: (nextTitle, hadDirectLinkToTarget) => {
    const state = get();
    const now = Date.now();

    // Update the previous step's timestamp_left
    const updatedSteps = [...state.steps];
    if (updatedSteps.length > 0) {
      updatedSteps[updatedSteps.length - 1] = {
        ...updatedSteps[updatedSteps.length - 1],
        timestamp_left: now,
        had_direct_link_to_target: hadDirectLinkToTarget,
      };
    }

    // Check if this is a miss (had direct link but clicked something else)
    const isTargetReached = nextTitle.toLowerCase() === state.targetTitle.toLowerCase();
    const isMiss = hadDirectLinkToTarget && !isTargetReached;

    // Add the new step
    updatedSteps.push({
      title: nextTitle,
      timestamp_entered: now,
      timestamp_left: null,
      had_direct_link_to_target: false,
    });

    set({
      currentTitle: nextTitle,
      clicksCount: state.clicksCount + 1,
      missesCount: state.missesCount + (isMiss ? 1 : 0),
      routeTitles: [...state.routeTitles, nextTitle],
      steps: updatedSteps,
      isTargetReached,
    });
  },

  completeRun: () => {
    const state = get();

    // Ensure timer is stopped
    let finalActiveTime = state.activeTimeMs;
    if (state.timerRunning && state.timerStartedAt !== null) {
      finalActiveTime += performance.now() - state.timerStartedAt;
    }

    // Update the last step's timestamp_left
    const updatedSteps = [...state.steps];
    if (updatedSteps.length > 0) {
      updatedSteps[updatedSteps.length - 1] = {
        ...updatedSteps[updatedSteps.length - 1],
        timestamp_left: Date.now(),
      };
    }

    set({
      isCompleted: true,
      timerRunning: false,
      activeTimeMs: Math.round(finalActiveTime),
      steps: updatedSteps,
    });

    return {
      activeTimeMs: Math.round(finalActiveTime),
      clicksCount: state.clicksCount,
      missesCount: state.missesCount,
      routeTitles: state.routeTitles,
      steps: updatedSteps,
    };
  },

  reset: () => {
    set(initialState);
  },
}));

// Selector for current time (includes running time)
export const selectCurrentTime = (state: RunState): number => {
  if (state.timerRunning && state.timerStartedAt !== null) {
    return state.activeTimeMs + (performance.now() - state.timerStartedAt);
  }
  return state.activeTimeMs;
};

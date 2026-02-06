import { create } from "zustand";
import type { RunStep } from "@/types/run.types";

// Helper types and functions for session storage persistence
const STORAGE_KEY_PREFIX = "run-state-";

interface SavedRunState {
  activeTimeMs: number;
  clicksCount: number;
  missesCount: number;
  routeTitles: string[];
  steps: RunStep[];
  currentTitle: string;
  savedAt: number;
}

function saveToSession(runId: string, state: Omit<SavedRunState, "savedAt">) {
  if (typeof window === "undefined") return;
  const key = STORAGE_KEY_PREFIX + runId;
  const toSave: SavedRunState = {
    ...state,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(key, JSON.stringify(toSave));
}

function loadFromSession(runId: string): SavedRunState | null {
  if (typeof window === "undefined") return null;
  const key = STORAGE_KEY_PREFIX + runId;
  const data = sessionStorage.getItem(key);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data) as SavedRunState;
    // Only restore if saved recently (within 30 minutes)
    if (Date.now() - parsed.savedAt > 30 * 60 * 1000) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearSession(runId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY_PREFIX + runId);
}

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

    // Check for saved state (handles refresh during run)
    const savedState = loadFromSession(data.runId);

    if (savedState && savedState.routeTitles && savedState.routeTitles.length > 0) {
      console.log('[RunStore] Restoring saved state:', {
        savedClicks: savedState.clicksCount,
        savedTimeMs: savedState.activeTimeMs,
        savedRoute: savedState.routeTitles,
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
        // Restore saved progress
        activeTimeMs: savedState.activeTimeMs || 0,
        clicksCount: savedState.clicksCount || 0,
        missesCount: savedState.missesCount || 0,
        routeTitles: savedState.routeTitles || [title],
        steps: savedState.steps || [{
          title: title,
          timestamp_entered: Date.now(),
          timestamp_left: null,
          had_direct_link_to_target: false,
        }],
        // Resume timer from saved time
        timerRunning: true,
        timerStartedAt: performance.now(),
      });
    } else {
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
    }

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

    const newClicksCount = state.clicksCount + 1;
    const newMissesCount = state.missesCount + (isMiss ? 1 : 0);
    const newRouteTitles = [...state.routeTitles, nextTitle];

    set({
      currentTitle: nextTitle,
      clicksCount: newClicksCount,
      missesCount: newMissesCount,
      routeTitles: newRouteTitles,
      steps: updatedSteps,
      isTargetReached,
    });

    // Save to session storage (for refresh protection)
    if (state.runId) {
      // Calculate current active time including running timer
      let currentActiveTime = state.activeTimeMs;
      if (state.timerRunning && state.timerStartedAt !== null) {
        currentActiveTime += performance.now() - state.timerStartedAt;
      }
      saveToSession(state.runId, {
        activeTimeMs: Math.round(currentActiveTime),
        clicksCount: newClicksCount,
        missesCount: newMissesCount,
        routeTitles: newRouteTitles,
        steps: updatedSteps,
        currentTitle: nextTitle,
      });
    }
  },

  completeRun: () => {
    const state = get();

    // Idempotency guard: if already completed, return cached data
    if (state.isCompleted) {
      return {
        activeTimeMs: state.activeTimeMs,
        clicksCount: state.clicksCount,
        missesCount: state.missesCount,
        routeTitles: state.routeTitles,
        steps: state.steps,
      };
    }

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

    // Clear session storage - run is complete
    if (state.runId) {
      clearSession(state.runId);
    }

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

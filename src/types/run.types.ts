export interface RunStep {
  title: string;
  timestamp_entered: number;
  timestamp_left: number | null;
  had_direct_link_to_target: boolean;
}

export interface RunData {
  id: string;
  mode: "ranked" | "training";
  startTitle: string;
  targetTitle: string;
  routeId: string | null;
  matchId: string | null;
}

export interface RunResult {
  id: string;
  mode: "ranked" | "training";
  startTitle: string;
  targetTitle: string;
  activeTimeMs: number;
  clicksCount: number;
  missesCount: number;
  routeTitles: string[];
  isCompleted: boolean;
  createdAt: string;
}

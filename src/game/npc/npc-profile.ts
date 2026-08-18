export interface NpcProfile {
  id: string;
  name: string;
  role: string;
  personality: string[];
  speakingStyle: string;
  values: string[];
  currentGoal?: string;
}

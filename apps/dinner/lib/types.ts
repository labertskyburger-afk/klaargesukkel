export type TrackAdRecipe = {
  name: string;
  time: string;
  single: string;
  quad: string;
  method: string;
  reheat: string;
};

export type TrackBRecipe = {
  name: string;
  time: string;
  ingredients: string;
  method: string;
};

export type CustomRecipe = {
  name: string;
  time: string;
  ingredients: string;
  method: string;
  reheat: string;
  track: "A" | "B";
  custom: true;
};

export type WeekOverride = Record<string, { meal?: string; note?: string }>;

export type Leftover = { text: string; done: boolean };

export type TrackerState = Record<string, boolean[]>;

export type ShopChecks = Record<string, boolean>;

// Mirrors the Household model's JSON columns exactly — this is the shape
// synced to/from the server via GET/PUT /api/state.
export type HouseholdState = {
  subtitle: string | null;
  trackerState: TrackerState;
  shopChecks: ShopChecks;
  batchDate: string | null;
  weekOverride: WeekOverride;
  leftovers: Leftover[];
  customRecipes: CustomRecipe[];
};

export const DEFAULT_SUBTITLE = "4 people · 2 adults, kids 5 & 9 · on the table by 7pm";

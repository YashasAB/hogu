export type EnrichableField =
  | "profession"
  | "height"
  | "relationshipType"
  | "dateNeighborhoods"
  | "dateCity"
  | "diet"
  | "drinking"
  | "smoking"
  | "physicalActivity"
  | "dateBudget"
  | "dreams"
  | "fiveYearGoal"
  | "whatIWantInPartner"
  | "whyPartnerWouldLikeMe"
  | "myDayLooksLike"
  | "idealFirstDate"
  | "nonNegotiables"
  | "agePreferenceMin"
  | "agePreferenceMax"
  | "interestsText"
  | "languagesText";

export interface AgentUpdate {
  schema: "user_schema";
  field: string;
  value: string | number;
}

export interface GetToKnowAgentOutput {
  assistant_message: string | null;
  updates: AgentUpdate[];
}

export const UPDATABLE_FIELD_MAP: Record<string, EnrichableField> = {
  "Profession": "profession",
  "Height": "height",
  "Looking For": "relationshipType",
  "Date Neighborhoods": "dateNeighborhoods",
  "Date City": "dateCity",
  "Diet": "diet",
  "Drinking": "drinking",
  "Smoking": "smoking",
  "Physical Activity": "physicalActivity",
  "Date Budget": "dateBudget",
  "Dreams": "dreams",
  "Five Year Goal": "fiveYearGoal",
  "What I Want in a Partner": "whatIWantInPartner",
  "Why My Partner Would Like Me": "whyPartnerWouldLikeMe",
  "My Day Looks Like": "myDayLooksLike",
  "Ideal First Date": "idealFirstDate",
  "Non-Negotiables": "nonNegotiables",
  "Age Pref Min": "agePreferenceMin",
  "Age Pref Max": "agePreferenceMax",
  "Interests": "interestsText",
  "Languages": "languagesText",
};

export const LOCKED_FIELDS = new Set([
  "Name", "Phone", "Gender", "Date of Birth", "Age",
  "Instagram", "City", "Photos Count", "Joined",
]);

export const SKIP_FIELDS = new Set([
  "First Date Types",
  "Cuisines",
  "First Date Ideas",
]);

export const RELATIONAL_AGENT_FIELDS = new Set<string>([]);

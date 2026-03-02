export interface IntroUserProfile {
  Name: string;
  Gender: string;
  Age: number;
  Profession?: string;
  Height?: string;
  "Looking For"?: string;
  "Age Pref Min"?: number;
  "Age Pref Max"?: number;
  "Date City"?: string;
  "Date Neighborhoods"?: string;
  Diet?: string;
  Drinking?: string;
  Smoking?: string;
  "Physical Activity"?: string;
  "Date Budget"?: string;
  Cuisines?: string;
  "First Date Ideas"?: string;
  Interests?: string;
  Languages?: string;
  Dreams?: string;
  "Five Year Goal"?: string;
  "What I Want in a Partner"?: string;
  "Why My Partner Would Like Me"?: string;
  "My Day Looks Like"?: string;
  "Ideal First Date"?: string;
  "Non-Negotiables"?: string;
  City?: string;
  "Photos Count": number;
  Joined: string;
}

export interface IntroInputUser {
  user_id: string;
  role: "A" | "B";
  profile: IntroUserProfile;
}

export interface IntroConstraints {
  no_contact_info: boolean;
  no_hallucinations: boolean;
  date_idea_policy: string;
  max_words_per_message: number;
}

export interface IntroInput {
  match_id: string;
  locale: string;
  tone: string;
  strict_mode: boolean;
  constraints: IntroConstraints;
  users: [IntroInputUser, IntroInputUser];
}

export interface IntroMessage {
  to_user_id: string;
  to_role: "A" | "B";
  title: string;
  body: string;
  cta: string;
  used_fields: string[];
}

export interface IntroOutput {
  match_id: string;
  messages: [IntroMessage, IntroMessage];
}

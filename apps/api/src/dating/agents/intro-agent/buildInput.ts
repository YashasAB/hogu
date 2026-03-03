import prisma from "../../../prismaClient";
import { IntroInput, IntroInputUser, IntroUserProfile } from "./types";


const DIET_LABELS: Record<string, string> = {
  VEG: "Vegetarian",
  NON_VEG: "Non-Vegetarian",
  EGG: "Eggetarian",
  VEGAN: "Vegan",
  JAIN: "Jain",
};

const DRINKING_LABELS: Record<string, string> = {
  NEVER: "Never",
  SOCIALLY: "Socially",
  OFTEN: "Often",
};

const SMOKING_LABELS: Record<string, string> = {
  NO: "No",
  YES: "Yes",
  SOCIALLY: "Socially",
};

const ACTIVITY_LABELS: Record<string, string> = {
  RARELY: "Rarely",
  SOMETIMES: "Sometimes",
  REGULAR: "Regular",
  ATHLETE: "Athlete",
};

const REL_LABELS: Record<string, string> = {
  serious: "Serious relationship",
  casual: "Casual dating",
  not_sure: "Not sure yet",
};

function friendlyLabel(value: string | null | undefined, map: Record<string, string>): string | undefined {
  if (!value) return undefined;
  return map[value] ?? value;
}

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export async function buildIntroInput(matchId: string): Promise<IntroInput> {
  const match = await prisma.datingMatch.findUniqueOrThrow({
    where: { id: matchId },
  });

  const [user1, user2] = await Promise.all([
    prisma.datingUser.findUniqueOrThrow({
      where: { id: match.user1_id },
      include: {
        photos: true,
        cuisines: { include: { cuisineOption: true } },
        interests: true,
        firstDateTypes: { include: { firstDateTypeOption: true } },
        languages: true,
      },
    }),
    prisma.datingUser.findUniqueOrThrow({
      where: { id: match.user2_id },
      include: {
        photos: true,
        cuisines: { include: { cuisineOption: true } },
        interests: true,
        firstDateTypes: { include: { firstDateTypeOption: true } },
        languages: true,
      },
    }),
  ]);

  function buildProfile(user: typeof user1): IntroUserProfile {
    const profile: IntroUserProfile = {
      Name: user.name,
      Gender: user.gender,
      Age: getAge(user.dob),
      "Photos Count": user.photos.length,
      Joined: new Date(user.createdAt).toLocaleDateString("en-IN"),
    };

    if (user.profession) profile.Profession = user.profession;
    if (user.height) profile.Height = user.height;
    if (user.relationshipType) profile["Looking For"] = friendlyLabel(user.relationshipType, REL_LABELS);
    if (user.agePreferenceMin != null) profile["Age Pref Min"] = user.agePreferenceMin;
    if (user.agePreferenceMax != null) profile["Age Pref Max"] = user.agePreferenceMax;
    if (user.dateCity) profile["Date City"] = user.dateCity;
    if (user.dateNeighborhoods) profile["Date Neighborhoods"] = user.dateNeighborhoods;
    if (user.diet) profile.Diet = friendlyLabel(user.diet, DIET_LABELS);
    if (user.drinking) profile.Drinking = friendlyLabel(user.drinking, DRINKING_LABELS);
    if (user.smoking) profile.Smoking = friendlyLabel(user.smoking, SMOKING_LABELS);
    if (user.physicalActivity) profile["Physical Activity"] = friendlyLabel(user.physicalActivity, ACTIVITY_LABELS);
    if (user.dateBudget) profile["Date Budget"] = user.dateBudget;
    if (user.dreams) profile.Dreams = user.dreams;
    if (user.fiveYearGoal) profile["Five Year Goal"] = user.fiveYearGoal;
    if (user.whatIWantInPartner) profile["What I Want in a Partner"] = user.whatIWantInPartner;
    if (user.whyPartnerWouldLikeMe) profile["Why My Partner Would Like Me"] = user.whyPartnerWouldLikeMe;
    if (user.myDayLooksLike) profile["My Day Looks Like"] = user.myDayLooksLike;
    if (user.idealFirstDate) profile["Ideal First Date"] = user.idealFirstDate;
    if (user.nonNegotiables) profile["Non-Negotiables"] = user.nonNegotiables;
    if (user.city) profile.City = user.city;

    const cuisines = user.cuisines.map((c) => c.cuisineOption.label).join(", ");
    if (cuisines) profile.Cuisines = cuisines;

    const firstDateIdeas = user.firstDateTypes.map((f) => f.firstDateTypeOption.label).join(", ");
    if (firstDateIdeas) profile["First Date Ideas"] = firstDateIdeas;

    const interests = user.interests.map((i) => i.tag).join(", ");
    if (interests) profile.Interests = interests;

    const languages = user.languages.map((l) => l.lang).join(", ");
    if (languages) profile.Languages = languages;

    return profile;
  }

  const userA: IntroInputUser = {
    user_id: user1.id,
    role: "A",
    profile: buildProfile(user1),
  };

  const userB: IntroInputUser = {
    user_id: user2.id,
    role: "B",
    profile: buildProfile(user2),
  };

  return {
    match_id: matchId,
    locale: "en-IN",
    tone: "playful_premium",
    strict_mode: true,
    constraints: {
      no_contact_info: true,
      no_hallucinations: true,
      date_idea_policy: "prefer_overlap_else_compromise",
      max_words_per_message: 220,
    },
    users: [userA, userB],
  };
}

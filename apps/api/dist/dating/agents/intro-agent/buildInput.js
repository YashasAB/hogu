"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIntroInput = buildIntroInput;
const prismaClient_1 = __importDefault(require("../../../prismaClient"));
const DIET_LABELS = {
    VEG: "Vegetarian",
    NON_VEG: "Non-Vegetarian",
    EGG: "Eggetarian",
    VEGAN: "Vegan",
    JAIN: "Jain",
};
const DRINKING_LABELS = {
    NEVER: "Never",
    SOCIALLY: "Socially",
    OFTEN: "Often",
};
const SMOKING_LABELS = {
    NO: "No",
    YES: "Yes",
    SOCIALLY: "Socially",
};
const ACTIVITY_LABELS = {
    RARELY: "Rarely",
    SOMETIMES: "Sometimes",
    REGULAR: "Regular",
    ATHLETE: "Athlete",
};
const REL_LABELS = {
    serious: "Serious relationship",
    casual: "Casual dating",
    not_sure: "Not sure yet",
};
function friendlyLabel(value, map) {
    if (!value)
        return undefined;
    return map[value] ?? value;
}
function getAge(dob) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate()))
        age--;
    return age;
}
async function buildIntroInput(matchId) {
    const match = await prismaClient_1.default.datingMatch.findUniqueOrThrow({
        where: { id: matchId },
    });
    const [user1, user2] = await Promise.all([
        prismaClient_1.default.datingUser.findUniqueOrThrow({
            where: { id: match.user1_id },
            include: {
                photos: true,
                cuisines: { include: { cuisineOption: true } },
                interests: true,
                firstDateTypes: { include: { firstDateTypeOption: true } },
                languages: true,
            },
        }),
        prismaClient_1.default.datingUser.findUniqueOrThrow({
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
    function buildProfile(user) {
        const profile = {
            Name: user.name,
            Gender: user.gender,
            Age: getAge(user.dob),
            "Photos Count": user.photos.length,
            Joined: new Date(user.createdAt).toLocaleDateString("en-IN"),
        };
        if (user.profession)
            profile.Profession = user.profession;
        if (user.height)
            profile.Height = user.height;
        if (user.relationshipType)
            profile["Looking For"] = friendlyLabel(user.relationshipType, REL_LABELS);
        if (user.agePreferenceMin != null)
            profile["Age Pref Min"] = user.agePreferenceMin;
        if (user.agePreferenceMax != null)
            profile["Age Pref Max"] = user.agePreferenceMax;
        if (user.dateCity)
            profile["Date City"] = user.dateCity;
        if (user.dateNeighborhoods)
            profile["Date Neighborhoods"] = user.dateNeighborhoods;
        if (user.diet)
            profile.Diet = friendlyLabel(user.diet, DIET_LABELS);
        if (user.drinking)
            profile.Drinking = friendlyLabel(user.drinking, DRINKING_LABELS);
        if (user.smoking)
            profile.Smoking = friendlyLabel(user.smoking, SMOKING_LABELS);
        if (user.physicalActivity)
            profile["Physical Activity"] = friendlyLabel(user.physicalActivity, ACTIVITY_LABELS);
        if (user.dateBudget)
            profile["Date Budget"] = user.dateBudget;
        if (user.dreams)
            profile.Dreams = user.dreams;
        if (user.fiveYearGoal)
            profile["Five Year Goal"] = user.fiveYearGoal;
        if (user.whatIWantInPartner)
            profile["What I Want in a Partner"] = user.whatIWantInPartner;
        if (user.whyPartnerWouldLikeMe)
            profile["Why My Partner Would Like Me"] = user.whyPartnerWouldLikeMe;
        if (user.myDayLooksLike)
            profile["My Day Looks Like"] = user.myDayLooksLike;
        if (user.idealFirstDate)
            profile["Ideal First Date"] = user.idealFirstDate;
        if (user.nonNegotiables)
            profile["Non-Negotiables"] = user.nonNegotiables;
        if (user.city)
            profile.City = user.city;
        const cuisines = user.cuisines.map((c) => c.cuisineOption.label).join(", ");
        if (cuisines)
            profile.Cuisines = cuisines;
        const firstDateIdeas = user.firstDateTypes.map((f) => f.firstDateTypeOption.label).join(", ");
        if (firstDateIdeas)
            profile["First Date Ideas"] = firstDateIdeas;
        const interests = user.interests.map((i) => i.tag).join(", ");
        if (interests)
            profile["Interests (from signup)"] = interests;
        if (user.interestsText)
            profile["Interests (agent-enriched)"] = user.interestsText;
        const languages = user.languages.map((l) => l.lang).join(", ");
        if (languages)
            profile["Languages (from signup)"] = languages;
        if (user.languagesText)
            profile["Languages (agent-enriched)"] = user.languagesText;
        return profile;
    }
    const userA = {
        user_id: user1.id,
        role: "A",
        profile: buildProfile(user1),
    };
    const userB = {
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

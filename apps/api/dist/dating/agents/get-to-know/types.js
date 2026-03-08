"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELATIONAL_AGENT_FIELDS = exports.SKIP_FIELDS = exports.LOCKED_FIELDS = exports.UPDATABLE_FIELD_MAP = void 0;
exports.UPDATABLE_FIELD_MAP = {
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
};
exports.LOCKED_FIELDS = new Set([
    "Name", "Phone", "Gender", "Date of Birth", "Age",
    "Instagram", "City", "Photos Count", "Joined",
]);
exports.SKIP_FIELDS = new Set([
    "First Date Types",
]);
exports.RELATIONAL_AGENT_FIELDS = new Set([
    "Cuisines", "Languages", "First Date Ideas",
]);

export function isE164(phone) {
  return /^\+?[1-9]\d{7,14}$/.test(phone);
}

export function requireSignupBody(body) {
  const errors = {};
  if (!body) {
    throw new Error("Body required");
  }

  const phone = String(body.phone || body.phoneE164 || "").trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const dob = String(body.dob || "").trim(); // YYYY-MM-DD

  if (!isE164(phone)) errors.phone = "Valid phone (E.164) required";
  if (password.length < 8) errors.password = "Min 8 characters";
  if (!name) errors.name = "Name required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) errors.dob = "Use YYYY-MM-DD";

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.details = errors;
    throw err;
  }

  const pick = (k) => (body[k] === undefined ? undefined : String(body[k]));
  return {
    phoneE164: phone.startsWith("+") ? phone : `+${phone}`,
    password,
    name,
    dob, // pass into new Date(dob)
    profession: pick("profession"),
    dreams: pick("dreams"),
    fiveYearGoal: pick("fiveYearGoal"),
    whatIWantInPartner: pick("whatIWantInPartner"),
    whyPartnerWouldLikeMe: pick("whyPartnerWouldLikeMe"),
    physicalActivity: pick("physicalActivity"),
    dateBudget: pick("dateBudget"),
    instagramHandle: pick("instagramHandle"),
    diet: pick("diet"),
    drinking: pick("drinking"),
    smoking: pick("smoking"),
  };
}

export function requireLoginBody(body) {
  const errors = {};
  if (!body) throw new Error("Body required");
  const phone = String(body.phone || body.phoneE164 || "").trim();
  const password = String(body.password || "");

  if (!isE164(phone)) errors.phone = "Valid phone required";
  if (!password) errors.password = "Password required";

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.details = errors;
    throw err;
  }
  return { phoneE164: phone.startsWith("+") ? phone : `+${phone}`, password };
}

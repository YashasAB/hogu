export function isE164(phone: string) {
  return /^\+?[1-9]\d{7,14}$/.test(phone);
}

export function requireSignupBody(body: any) {
  const errors: Record<string, string> = {};
  if (!body) {
    throw new Error("Body required");
  }

  const phone = (body.phone || body.phoneE164 || "").toString().trim();
  const password = (body.password || "").toString();
  const name = (body.name || "").toString().trim();
  const dob = (body.dob || "").toString().trim(); // YYYY-MM-DD

  if (!isE164(phone)) errors.phone = "Valid phone (E.164) required";
  if (password.length < 8) errors.password = "Min 8 characters";
  if (!name) errors.name = "Name required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) errors.dob = "Use YYYY-MM-DD";

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    (err as any).status = 400;
    (err as any).details = errors;
    throw err;
  }

  // Validate photos
  const photosRaw = Array.isArray(body.photos) ? body.photos : [];
  const photos = photosRaw
    .map((p: any, i: number) => ({
      objectKey: String(p?.objectKey || ""),
      sortOrder: Number(p?.sortOrder ?? i),
    }))
    .filter((p: any) => p.objectKey);

  if (photos.length < 1) {
    errors.photos = "At least 1 photo objectKey required";
  }

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    (err as any).status = 400;
    (err as any).details = errors;
    throw err;
  }

  const pick = (k: string) =>
    body[k] === undefined ? undefined : String(body[k]);
  
  const pickArray = (k: string): string[] => {
    if (!Array.isArray(body[k])) return [];
    return body[k].filter((v: any) => typeof v === "string" && v.trim()).map((v: string) => v.trim());
  };

  return {
    phoneE164: phone.startsWith("+") ? phone : `+${phone}`,
    password,
    name,
    dob,
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
    height: pick("height"),
    gender: pick("gender") || "Male",
    relationshipType: pick("relationshipType") || "serious",
    agePreferenceMin: body.agePreferenceMin !== undefined && body.agePreferenceMin !== null && body.agePreferenceMin !== "" ? parseInt(String(body.agePreferenceMin), 10) : null,
    agePreferenceMax: body.agePreferenceMax !== undefined && body.agePreferenceMax !== null && body.agePreferenceMax !== "" ? parseInt(String(body.agePreferenceMax), 10) : null,
    photos,
    cuisines: pickArray("cuisines"),
    interests: pickArray("interests"),
    firstDateTypes: pickArray("firstDateTypes"),
    languages: pickArray("languages"),
  };
}

export function requireLoginBody(body: any) {
  const errors: Record<string, string> = {};
  if (!body) throw new Error("Body required");
  const phone = (body.phone || body.phoneE164 || "").toString().trim();
  const password = (body.password || "").toString();

  if (!isE164(phone)) errors.phone = "Valid phone required";
  if (!password) errors.password = "Password required";

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    (err as any).status = 400;
    (err as any).details = errors;
    throw err;
  }
  return { phoneE164: phone.startsWith("+") ? phone : `+${phone}`, password };
}

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

  if (photos.length !== 3) {
    errors.photos = "Exactly 3 photo objectKeys required";
  }

  if (Object.keys(errors).length) {
    const err = new Error("Validation failed");
    (err as any).status = 400;
    (err as any).details = errors;
    throw err;
  }

  const pick = (k: string) =>
    body[k] === undefined ? undefined : String(body[k]);
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
    photos,
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

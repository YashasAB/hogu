import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { postJson, fetchJson } from "../../lib/api";
import { presignPhotos, putToPresignedUrl } from "../../lib/uploads";

interface Option {
  value: string;
  label: string;
}

interface OptionsData {
  cuisines: Option[];
  firstDateTypes: Option[];
  diets: Option[];
  drinking: Option[];
  smoking: Option[];
  physicalActivity: Option[];
  dateBudget: Option[];
}

export default function Signup() {
  const [step, setStep] = useState<"verify" | "form">("verify");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const verifyPhoneE164 = "+91" + verifyPhone.replace(/\D/g, "");
  const verifyPhoneValid = /^\+91[6-9]\d{9}$/.test(verifyPhoneE164);

  async function onSendOtp() {
    setVerifyError(null);
    if (!verifyPhoneValid) { setVerifyError("Enter a valid 10-digit Indian mobile number."); return; }
    try {
      setOtpSending(true);
      await postJson("/api/dating/auth/send-otp", { phone: verifyPhoneE164 });
      setOtpSent(true);
      setOtpCode("");
    } catch (err: any) {
      setVerifyError(err?.message || "Failed to send code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  async function onVerifyOtp() {
    setVerifyError(null);
    if (!otpCode.trim()) { setVerifyError("Enter the code you received."); return; }
    try {
      setOtpVerifying(true);
      await postJson("/api/dating/auth/verify-otp", { phone: verifyPhoneE164, code: otpCode.trim() });
      set("phone", verifyPhone.replace(/\D/g, ""));
      setStep("form");
      await submit();
    } catch (err: any) {
      setVerifyError(err?.message || "Invalid code. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }

  const [options, setOptions] = useState<OptionsData | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    fetchJson<OptionsData>("/api/dating/options")
      .then((data) => setOptions(data))
      .catch((err) => console.error("Failed to load options:", err))
      .finally(() => setOptionsLoading(false));
  }, []);
  const [form, setForm] = useState({
    phone: "",
    password: "",
    name: "",
    dob: "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",

    // core prefs
    cuisines: [] as string[],
    interests: [] as string[],
    physicalActivity: "SOMETIMES",
    profession: "",
    dreams: "",
    fiveYearGoal: "",
    wantInPartner: "",
    whyTheyLikeMe: "",
    myDayLooksLike: "",
    idealFirstDate: "",
    nonNegotiables: "",
    firstDateTypes: [] as string[],
    dateBudget: "",

    gender: "Male",
    relationshipType: "serious",
    agePreferenceMin: "",
    agePreferenceMax: "",

    // optional extras for better matching
    instagram: "",
    languages: [] as string[],
    diet: "",
    drinking: "",
    smoking: "",
    dateCity: "",
    dateNeighborhoods: "",
  });

  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]); // previews
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]); // actual files
  const [height, setHeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleFromArray(key: keyof typeof form, value: string) {
    setForm((f) => {
      const arr = (f[key] as string[]) || [];
      return {
        ...f,
        [key]: arr.includes(value)
          ? arr.filter((x) => x !== value)
          : [...arr, value],
      };
    });
  }

  function addInterest(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (form.interests.includes(t)) return;
    setForm((f) => ({ ...f, interests: [...f.interests, t] }));
  }

  function removeInterest(tag: string) {
    setForm((f) => ({ ...f, interests: f.interests.filter((x) => x !== tag) }));
  }

  function addLanguage(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (form.languages.includes(t)) return;
    setForm((f) => ({ ...f, languages: [...f.languages, t] }));
  }

  function removeLanguage(tag: string) {
    setForm((f) => ({ ...f, languages: f.languages.filter((x) => x !== tag) }));
  }

  async function handlePhoto(idx: number, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image");
    
    // Store the actual file
    setFiles((prev) => {
      const next = [...prev]; 
      next[idx] = file; 
      return next;
    });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((p) => {
        const next = [...p];
        next[idx] = String(reader.result);
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (form.password.length < 8) e.password = "Min 8 characters";
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.dob) e.dob = "Date of birth required";
    if (files.filter(Boolean).length < 1) e.photos = "Add at least 1 photo";
    if (form.cuisines.length < 1) e.cuisines = "Pick at least one cuisine";
    if (form.firstDateTypes.length < 1)
      e.firstDateTypes = "Pick at least one preferred first date";
    if (!form.dateBudget) e.dateBudget = "Choose a date budget";
    // Soft guidance (not required): interests 3+
    return e;
  }, [form, files]);

  const errorLabels: Record<string, string> = {
    password: "Password",
    name: "Name",
    dob: "Date of birth",
    photos: "Photos",
    cuisines: "Favourite cuisines",
    firstDateTypes: "Preferred first date",
    dateBudget: "Date budget",
  };

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setSubmitError(null);
    setHasAttemptedSubmit(true);
    if (Object.keys(errors).length) return;

    try {
      setIsSubmitting(true);

      // 1) presign
      const realFiles = files.filter(Boolean) as File[];
      const presigned = await presignPhotos(realFiles);

      if (presigned.length < 1) throw new Error("Failed to presign uploads");

      // 2) PUT uploads
      await Promise.all(
        presigned.map((p, i) => putToPresignedUrl(p.uploadUrl, realFiles[i], p.contentType))
      );

      // 3) assemble request body for signup (photos => objectKey + sortOrder)
      const body = {
        phone: "+91" + form.phone.replace(/\D/g, ""),
        password: form.password,
        name: form.name,
        dob: form.dob,
        profession: form.profession,
        dreams: form.dreams,
        fiveYearGoal: form.fiveYearGoal,
        whatIWantInPartner: form.wantInPartner,
        whyPartnerWouldLikeMe: form.whyTheyLikeMe,
        myDayLooksLike: form.myDayLooksLike,
        idealFirstDate: form.idealFirstDate,
        nonNegotiables: form.nonNegotiables,
        physicalActivity: form.physicalActivity,
        dateBudget: form.dateBudget,
        instagramHandle: form.instagram,
        diet: form.diet,
        drinking: form.drinking,
        smoking: form.smoking,
        height: height,
        gender: form.gender,
        relationshipType: form.relationshipType,
        agePreferenceMin: form.agePreferenceMin ? parseInt(form.agePreferenceMin) : null,
        agePreferenceMax: form.agePreferenceMax ? parseInt(form.agePreferenceMax) : null,
        dateCity: form.dateCity,
        dateNeighborhoods: form.dateNeighborhoods,
        city: "BLR",

        // multi-selects serialized to strings arrays on backend later if needed
        // but for photos we pass objectKeys now:
        photos: presigned.map((p, i) => ({ objectKey: p.objectKey, sortOrder: i })),
        cuisines: form.cuisines,            // (ignored by server in Step 6; will wire later)
        interests: form.interests,          // same
        firstDateTypes: form.firstDateTypes // same
      };

      // 4) call signup
      const resp = await postJson<{ ok: boolean; sessionToken?: string; user: { id: string } }>("/api/dating/auth/signup", body);

      // 5) store token and redirect on success
      if (resp.sessionToken) sessionStorage.setItem("dating_token", resp.sessionToken);
      window.location.href = "/app";
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="hogu-auth">
      <div className="hogu-auth-card" style={{ position: "relative" }}>
        <a href="/" className="back-btn" aria-label="Back to home">← Back</a>
        <h1>Create your Hogu account</h1>
        <p className="muted">
          Serious connections. Curated experiences. Built for real dates.
        </p>

        {/* Phone verification widget — always at top */}
        {step === "verify" ? (
          <div className="otp-widget">
            <div className="otp-widget-label">Step 1 — Verify your phone number</div>
            <p className="muted" style={{ marginBottom: 12, fontSize: 13 }}>We'll send a one-time code. Fill in the form below while you wait.</p>
            <div className="hogu-field" style={{ marginBottom: 12 }}>
              <label>Mobile number</label>
              <div className="phone-row">
                <span className="phone-prefix">+91</span>
                <input
                  className="hogu-input phone-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={verifyPhone}
                  onChange={(e) => setVerifyPhone(e.target.value)}
                  disabled={otpSent}
                />
              </div>
            </div>
            {!otpSent ? (
              <>
                {verifyError && <div className="hogu-error" style={{ marginBottom: 10 }}>{verifyError}</div>}
                <button
                  className="hogu-btn hogu-btn--primary"
                  type="button"
                  onClick={onSendOtp}
                  disabled={otpSending}
                  style={{ width: "100%" }}
                >
                  {otpSending ? "Sending code..." : "Send OTP"}
                </button>
              </>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <p className="otp-sent-msg">A code was sent to <strong>+91 {verifyPhone}</strong>. Enter it below.</p>
                <div className="hogu-field">
                  <label>Verification code</label>
                  <input
                    className="hogu-input otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                </div>
                {verifyError && <div className="hogu-error">{verifyError}</div>}
                <button
                  className="hogu-btn hogu-btn--primary"
                  type="button"
                  onClick={onVerifyOtp}
                  disabled={otpVerifying}
                  style={{ width: "100%" }}
                >
                  {otpVerifying ? "Verifying & signing up..." : "Verify & Sign Up"}
                </button>
                <button
                  className="resend-link"
                  type="button"
                  onClick={onSendOtp}
                  disabled={otpSending}
                >
                  {otpSending ? "Resending..." : "Resend code"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="otp-widget otp-widget--verified">
            <span style={{ color: "#4cde9a", fontWeight: 700 }}>✓ Phone verified</span>
            <span style={{ color: "#aaa", marginLeft: 8 }}>+91 {form.phone}</span>
          </div>
        )}

        <form className="hogu-form" onSubmit={submit} noValidate>
          {/* Contact / Security */}
          <div className="grid-two">
            <div className="hogu-field">
              <label>Phone number</label>
              <div className="phone-row" style={{ opacity: 0.75, pointerEvents: "none" }}>
                <span className="phone-prefix">+91</span>
                <input
                  className="hogu-input phone-input"
                  type="tel"
                  value={step === "form" ? form.phone : verifyPhone}
                  readOnly
                />
              </div>
            </div>
            <div className="hogu-field">
              <label>Password</label>
              <input
                className="hogu-input"
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              {errors.password && (
                <span className="hogu-error">{errors.password}</span>
              )}
            </div>
          </div>

          <div className="grid-two">
            <div className="hogu-field">
              <label>Name</label>
              <input
                className="hogu-input"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && <span className="hogu-error">{errors.name}</span>}
            </div>
            <div className="hogu-field">
              <label>Date of birth</label>
              <input
                className="hogu-input"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
              {errors.dob && <span className="hogu-error">{errors.dob}</span>}
            </div>
          </div>

          <div className="hogu-field">
            <label>Gender</label>
            <div className="chip-row">
              {[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${form.gender === opt.value ? "chip--active" : ""}`}
                  onClick={() => set("gender", opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hogu-field">
            <label>What are you looking for?</label>
            <div className="chip-row">
              {[
                { value: "serious", label: "Serious relationship" },
                { value: "casual", label: "Casual dating" },
                { value: "not_sure", label: "I'm not sure" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${form.relationshipType === opt.value ? "chip--active" : ""}`}
                  onClick={() => set("relationshipType", opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hogu-field">
            <label>Age preference for dates</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="number"
                className="hogu-input"
                placeholder="Min age"
                min={18}
                max={99}
                value={form.agePreferenceMin}
                onChange={(e) => set("agePreferenceMin", e.target.value)}
                style={{ width: "120px" }}
              />
              <span style={{ color: "#888" }}>to</span>
              <input
                type="number"
                className="hogu-input"
                placeholder="Max age"
                min={18}
                max={99}
                value={form.agePreferenceMax}
                onChange={(e) => set("agePreferenceMax", e.target.value)}
                style={{ width: "120px" }}
              />
            </div>
          </div>

          <div className="grid-three">
            <div className="hogu-field">
              <label>Date budget</label>
              <select
                className="hogu-input"
                value={form.dateBudget}
                onChange={(e) => set("dateBudget", e.target.value)}
              >
                <option value="">Select</option>
                {(options?.dateBudget || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.dateBudget && (
                <span className="hogu-error">{errors.dateBudget}</span>
              )}
            </div>

            <div className="hogu-field">
              <label>Physical activity</label>
              <select
                className="hogu-input"
                value={form.physicalActivity}
                onChange={(e) => set("physicalActivity", e.target.value)}
              >
                {(options?.physicalActivity || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Height */}
          <div className="hogu-field">
            <label>Height (optional)</label>
            <input
              className="hogu-input"
              type="text"
              placeholder="e.g., 5'10&quot; or 178cm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          {/* Photos */}
          <div className="hogu-field">
            <label>Photos (at least 1, up to 3)</label>
            <div className="photo-grid">
              {[0, 1, 2].map((i) => (
                <label key={i} className="photo-slot">
                  {photos[i] ? (
                    <img src={photos[i] as string} alt={`Photo ${i + 1}`} />
                  ) : (
                    <span className="photo-placeholder">Add photo</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handlePhoto(i, e.target.files?.[0] || null)
                    }
                    style={{ display: "none" }}
                  />
                </label>
              ))}
            </div>
            {errors.photos && (
              <span className="hogu-error">{errors.photos}</span>
            )}
          </div>

          {/* Cuisines */}
          <div className="hogu-field">
            <label>Favourite cuisines</label>
            <div className="chip-row">
              {(options?.cuisines || []).map((opt) => {
                const active = form.cuisines.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chip ${active ? "chip--active" : ""}`}
                    onClick={() => toggleFromArray("cuisines", opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.cuisines && (
              <span className="hogu-error">{errors.cuisines}</span>
            )}
          </div>

          {/* Interests */}
          <div className="hogu-field">
            <label>Interests</label>
            <TagEditor
              placeholder="Add an interest and press Enter"
              values={form.interests}
              onAdd={addInterest}
              onRemove={removeInterest}
            />
          </div>

          {/* City & Neighborhoods */}
          <div className="grid-two">
            <div className="hogu-field">
              <label>City you want to go on dates in</label>
              <input
                className="hogu-input"
                type="text"
                placeholder="e.g., Bengaluru"
                value={form.dateCity}
                onChange={(e) => set("dateCity", e.target.value)}
              />
            </div>
            <div className="hogu-field">
              <label>Neighborhoods you prefer for dates</label>
              <textarea
                className="hogu-input"
                rows={2}
                placeholder="e.g., Koramangala, Indiranagar, HSR Layout"
                value={form.dateNeighborhoods}
                onChange={(e) => set("dateNeighborhoods", e.target.value)}
              />
            </div>
          </div>

          {/* Profession & Persona */}
          <div className="grid-two">
            <div className="hogu-field">
              <label>Profession</label>
              <input
                className="hogu-input"
                type="text"
                placeholder="e.g., Product Manager"
                value={form.profession}
                onChange={(e) => set("profession", e.target.value)}
              />
            </div>
            <div className="hogu-field">
              <label>Instagram (optional)</label>
              <input
                className="hogu-input"
                type="text"
                placeholder="@yourhandle"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </div>
          </div>

          <div className="grid-two">
            <div className="hogu-field">
              <label>What you want to see in a partner</label>
              <textarea
                className="hogu-input"
                rows={3}
                maxLength={500}
                placeholder="Please enter 100+ chars... the more you share, the better we can help match you!"
                value={form.wantInPartner}
                onChange={(e) => set("wantInPartner", e.target.value)}
              />
            </div>
            <div className="hogu-field">
              <label>Why they’d love dating you</label>
              <textarea
                className="hogu-input"
                rows={3}
                maxLength={500}
                placeholder="Please enter 100+ chars... the more you share, the better we can help match you!"
                value={form.whyTheyLikeMe}
                onChange={(e) => set("whyTheyLikeMe", e.target.value)}
              />
            </div>
          </div>

          <div className="grid-two">
            <div className="hogu-field">
              <label>Dreams</label>
              <textarea
                className="hogu-input"
                rows={3}
                maxLength={500}
                placeholder="A vision you’re chasing…"
                value={form.dreams}
                onChange={(e) => set("dreams", e.target.value)}
              />
            </div>
            <div className="hogu-field">
              <label>5-year goal</label>
              <textarea
                className="hogu-input"
                rows={3}
                maxLength={500}
                placeholder="Please enter 100+ chars... the more you share, the better we can help match you!"
                value={form.fiveYearGoal}
                onChange={(e) => set("fiveYearGoal", e.target.value)}
              />
            </div>
          </div>

          <div className="hogu-field">
            <label>My day looks like</label>
            <textarea
              className="hogu-input"
              rows={3}
              maxLength={500}
              placeholder="Walk us through your typical day! e.g. 'I work in tech till 6, hit the gym, and then I'm free for drinks' or 'College till 5, then I'm out exploring cafes and looking to meet someone new on weekends'"
              value={form.myDayLooksLike}
              onChange={(e) => set("myDayLooksLike", e.target.value)}
            />
          </div>

          <div className="hogu-field">
            <label>My ideal fun first date would be</label>
            <textarea
              className="hogu-input"
              rows={3}
              maxLength={500}
              placeholder="I cannot refuse a person if they plan a first date like... (Tell us your dream first date! A rooftop with cocktails? A street food walk? A bookstore date followed by coffee?)"
              value={form.idealFirstDate}
              onChange={(e) => set("idealFirstDate", e.target.value)}
            />
          </div>

          <div className="hogu-field">
            <label>Non-negotiables in a partner</label>
            <textarea
              className="hogu-input"
              rows={3}
              maxLength={500}
              placeholder="What are the things you absolutely need in a partner? e.g. 'Must be active and into fitness, has to love dogs, needs to be ambitious' or 'Has to be vegetarian, must be taller than 5'5, values family'"
              value={form.nonNegotiables}
              onChange={(e) => set("nonNegotiables", e.target.value)}
            />
          </div>

          {/* First date types */}
          <div className="hogu-field">
            <label>Preferred first date</label>
            <div className="chip-row">
              {(options?.firstDateTypes || []).map((opt) => {
                const active = form.firstDateTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chip ${active ? "chip--active" : ""}`}
                    onClick={() => toggleFromArray("firstDateTypes", opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.firstDateTypes && (
              <span className="hogu-error">{errors.firstDateTypes}</span>
            )}
          </div>

          {/* Optional match boosters */}
          <div className="grid-three">
            <div className="hogu-field">
              <label>Diet (optional)</label>
              <select
                className="hogu-input"
                value={form.diet}
                onChange={(e) => set("diet", e.target.value)}
              >
                <option value="">Select</option>
                {(options?.diets || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hogu-field">
              <label>Drinking (optional)</label>
              <select
                className="hogu-input"
                value={form.drinking}
                onChange={(e) => set("drinking", e.target.value)}
              >
                <option value="">Select</option>
                {(options?.drinking || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hogu-field">
              <label>Smoking (optional)</label>
              <select
                className="hogu-input"
                value={form.smoking}
                onChange={(e) => set("smoking", e.target.value)}
              >
                <option value="">Select</option>
                {(options?.smoking || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hogu-field">
            <label>Languages (optional)</label>
            <TagEditor
              placeholder="Add a language and press Enter"
              values={form.languages}
              onAdd={addLanguage}
              onRemove={removeLanguage}
            />
          </div>

          {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
            <div className="validation-summary">
              <strong>Please complete the following:</strong>
              <ul>
                {Object.keys(errors).map((key) => (
                  <li key={key}>{errorLabels[key] || key}</li>
                ))}
              </ul>
            </div>
          )}
          {submitError && <div className="hogu-error" style={{marginTop:8}}>{submitError}</div>}
          {step === "verify" && (
            <p className="muted tiny" style={{ marginBottom: 8, textAlign: "center" }}>
              Verify your phone number above to submit.
            </p>
          )}
          <button className="hogu-btn hogu-btn--primary" type="submit" disabled={isSubmitting || step === "verify"}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>

          <p className="muted tiny">
            Already have an account?{" "}
            <a className="hogu-link" href="/login">
              Log in
            </a>
          </p>
        </form>
      </div>

      <style>{signupCss}</style>
    </div>
  );
}

/** Simple tag editor used for interests/languages */
function TagEditor({
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        onAdd(input.trim());
        setInput("");
      }
    }
  }
  return (
    <>
      <div className="chip-row" style={{ marginBottom: 6 }}>
        {values.map((v) => (
          <span key={v} className="chip chip--active">
            {v}
            <button
              type="button"
              className="chip-x"
              onClick={() => onRemove(v)}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="hogu-input"
        type="text"
        placeholder={placeholder || "Add and press Enter"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </>
  );
}

const signupCss = `
.back-btn {
  position: absolute;
  top: 16px;
  left: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 8px;
  transition: color .15s, background .15s;
}
.back-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
.phone-row {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.phone-prefix {
  display: flex;
  align-items: center;
  padding: 12px 12px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  border-right: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  white-space: nowrap;
  user-select: none;
}
.phone-input {
  flex: 1;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}
.phone-row:focus-within { border-color: rgba(227,41,149,0.6); box-shadow: 0 0 0 3px rgba(227,41,149,0.18); }
.otp-input { letter-spacing: 6px; font-size: 20px; font-weight: 700; text-align: center; }
.otp-sent-msg { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; line-height: 1.5; }
.resend-link {
  background: transparent; border: none; color: rgba(255,255,255,0.5);
  font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0; text-align: center; width: 100%;
}
.resend-link:hover { color: rgba(255,255,255,0.8); }
.resend-link:disabled { opacity: 0.4; cursor: not-allowed; }
/* OTP widget */
.otp-widget {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
.otp-widget--verified {
  padding: 12px 16px;
  display: flex;
  align-items: center;
}
.otp-widget-label {
  font-size: 13px;
  font-weight: 700;
  color: #4cde9a;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
/* container */
.hogu-auth {
  min-height: 100dvh;
  background: #0f1115;
  color: #eaeaea;
  padding: min(5vw, 32px) 0;
  padding-top: calc(min(5vw, 32px) + env(safe-area-inset-top));
}
.hogu-auth-card {
  width: min(900px, 94vw);
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: clamp(20px, 3.2vw, 32px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.hogu-auth-card h1 { margin: 0 0 6px 0; font-size: clamp(22px, 3.6vw, 30px); color: #fff; }
.muted { color: rgba(255,255,255,0.75); }
.tiny { font-size: 12px; margin-top: 10px; }

/* layout */
.hogu-form { margin-top: 18px; display: grid; gap: 16px; }
.hogu-field { display: grid; gap: 6px; }
.hogu-field label { font-weight: 600; color: rgba(255,255,255,0.9); font-size: 13px; }
.grid-two { display: grid; gap: 14px; grid-template-columns: 1fr; }
.grid-three { display: grid; gap: 14px; grid-template-columns: 1fr; }
@media (min-width: 860px) {
  .grid-two { grid-template-columns: 1fr 1fr; }
  .grid-three { grid-template-columns: 1fr 1fr 1fr; }
}

/* inputs */
.hogu-input, .chip {
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06); color: #fff; padding: 12px 12px;
  font-size: 14px; outline: none;
}
textarea.hogu-input { resize: vertical; }
.hogu-input:focus { border-color: rgba(227,41,149,0.6); box-shadow: 0 0 0 3px rgba(227,41,149,0.18); }

/* chips */
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { background: rgba(255,255,255,0.07); cursor: pointer; padding: 8px 12px; }
.chip--active { background: #e32995; color: #0b0b0b; border-color: transparent; }
.chip .chip-x {
  background: transparent; border: none; margin-left: 8px; color: currentColor;
  cursor: pointer; font-weight: 700;
}

/* photos */
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.photo-slot {
  aspect-ratio: 1 / 1; border-radius: 14px; border: 1px dashed rgba(255,255,255,0.2);
  display: grid; place-items: center; cursor: pointer; overflow: hidden;
  background: rgba(255,255,255,0.05);
}
.photo-slot img { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { color: rgba(255,255,255,0.7); font-size: 12px; }

/* buttons */
.hogu-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px; padding: 12px 18px; font-weight: 700;
  border: 1px solid rgba(255,255,255,0.14); transition: transform .15s ease;
}
.hogu-btn--primary { background: #e32995; color: #0b0b0b; border-color: transparent; }
.hogu-btn--primary:hover { transform: translateY(-1px); }

/* misc */
.hogu-link { color: #eaeaea; text-decoration: underline; }
.hogu-error { color: #ffb3c6; font-size: 12px; }

.phone-notice {
  background: rgba(227, 41, 149, 0.12);
  border: 1px solid rgba(227, 41, 149, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #f0c0d8;
}

/* validation summary */
.validation-summary {
  background: rgba(255, 107, 129, 0.15);
  border: 1px solid rgba(255, 107, 129, 0.4);
  border-radius: 12px;
  padding: 14px 18px;
  color: #ffb3c6;
  font-size: 14px;
}
.validation-summary strong {
  display: block;
  margin-bottom: 8px;
  color: #fff;
}
.validation-summary ul {
  margin: 0;
  padding-left: 20px;
}
.validation-summary li {
  margin-bottom: 4px;
}
`;

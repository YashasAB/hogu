import React, { useMemo, useState } from "react";
import { postJson } from "../../lib/api";
import { presignPhotos, putToPresignedUrl } from "../../lib/uploads";

const CUISINES = [
  "NORTH_INDIAN",
  "SOUTH_INDIAN",
  "ITALIAN",
  "JAPANESE",
  "THAI",
  "MEXICAN",
  "MIDDLE_EASTERN",
  "VEGETARIAN_ONLY",
  "VEGAN",
  "JAIN",
] as const;

const FIRST_DATE_TYPES = [
  "COFFEE",
  "QUICK_COCKTAIL",
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "GO_KARTING",
  "PAINT_DATE",
  "BOWLING",
  "MUSEUM_WALK",
  "LIVE_MUSIC",
  "ICECREAM_WALK",
] as const;

const PHYSICAL = ["RARELY", "SOMETIMES", "REGULAR", "ATHLETE"] as const;

const DIET = ["VEG", "EGG", "NON_VEG", "VEGAN", "JAIN"] as const;
const DRINKING = ["NEVER", "SOCIALLY", "OFTEN"] as const;
const SMOKING = ["NO", "SOCIALLY", "YES"] as const;

const BUDGET = [
  "₹500–1,000",
  "₹1,000–2,500",
  "₹2,500–5,000",
  "₹5,000+",
] as const;

export default function Signup() {
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
    firstDateTypes: [] as string[],
    dateBudget: "",

    // optional extras for better matching
    instagram: "",
    languages: [] as string[],
    diet: "",
    drinking: "",
    smoking: "",
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
    if (!/^\+?[0-9]{10,15}$/.test(form.phone))
      e.phone = "Enter a valid phone number";
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
    phone: "Phone number",
    password: "Password",
    name: "Name",
    dob: "Date of birth",
    photos: "Photos",
    cuisines: "Favourite cuisines",
    firstDateTypes: "Preferred first date",
    dateBudget: "Date budget",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        phone: form.phone,
        password: form.password,
        name: form.name,
        dob: form.dob,
        profession: form.profession,
        dreams: form.dreams,
        fiveYearGoal: form.fiveYearGoal,
        whatIWantInPartner: form.wantInPartner,
        whyPartnerWouldLikeMe: form.whyTheyLikeMe,
        physicalActivity: form.physicalActivity,
        dateBudget: form.dateBudget,
        instagramHandle: form.instagram,
        diet: form.diet,
        drinking: form.drinking,
        smoking: form.smoking,
        height: height,

        // multi-selects serialized to strings arrays on backend later if needed
        // but for photos we pass objectKeys now:
        photos: presigned.map((p, i) => ({ objectKey: p.objectKey, sortOrder: i })),
        cuisines: form.cuisines,            // (ignored by server in Step 6; will wire later)
        interests: form.interests,          // same
        firstDateTypes: form.firstDateTypes // same
      };

      // 4) call signup
      const resp = await postJson<{ ok: boolean; user: { id: string } }>("/api/dating/auth/signup", body);

      // 5) redirect on success
      window.location.href = "/app"; // or wherever your dashboard lives
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="hogu-auth">
      <div className="hogu-auth-card">
        <h1>Create your Hogu account</h1>
        <p className="muted">
          Serious connections. Curated experiences. Built for real dates.
        </p>

        <form className="hogu-form" onSubmit={submit} noValidate>
          {/* Contact / Security */}
          <div className="grid-two">
            <div className="hogu-field">
              <label>Phone number</label>
              <input
                className="hogu-input"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.trim())}
              />
              {errors.phone && (
                <span className="hogu-error">{errors.phone}</span>
              )}
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

          <div className="grid-three">
            <div className="hogu-field">
              <label>Date budget</label>
              <select
                className="hogu-input"
                value={form.dateBudget}
                onChange={(e) => set("dateBudget", e.target.value)}
              >
                <option value="">Select</option>
                {BUDGET.map((b) => (
                  <option key={b} value={b}>
                    {b}
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
                {PHYSICAL.map((p) => (
                  <option key={p} value={p}>
                    {p.replaceAll("_", " ")}
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
              {CUISINES.map((c) => {
                const active = form.cuisines.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`chip ${active ? "chip--active" : ""}`}
                    onClick={() => toggleFromArray("cuisines", c)}
                  >
                    {c.replaceAll("_", " ")}
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

          {/* First date types */}
          <div className="hogu-field">
            <label>Preferred first date</label>
            <div className="chip-row">
              {FIRST_DATE_TYPES.map((t) => {
                const active = form.firstDateTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${active ? "chip--active" : ""}`}
                    onClick={() => toggleFromArray("firstDateTypes", t)}
                  >
                    {t.replaceAll("_", " ")}
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
                {DIET.map((d) => (
                  <option key={d} value={d}>
                    {d.replaceAll("_", " ")}
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
                {DRINKING.map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                {SMOKING.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
          <button className="hogu-btn hogu-btn--primary" type="submit" disabled={isSubmitting}>
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
/* container */
.hogu-auth {
  min-height: 100dvh;
  background: #0f1115;
  color: #eaeaea;
  padding: min(5vw, 32px) 0;
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

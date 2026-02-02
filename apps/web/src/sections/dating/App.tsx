import React, { useState, useEffect } from "react";

interface Match {
  id: string;
  name: string;
  profession: string | null;
  dob: string;
  photos: { objectKey: string; sortOrder: number }[];
  matchedAt: string;
}

interface Profile {
  id: string;
  name: string;
  phoneE164: string;
  dob: string;
  profession: string | null;
  dreams: string | null;
  fiveYearGoal: string | null;
  whatIWantInPartner: string | null;
  whyPartnerWouldLikeMe: string | null;
  physicalActivity: string | null;
  dateBudget: string | null;
  instagramHandle: string | null;
  diet: string | null;
  drinking: string | null;
  smoking: string | null;
  photos: { id: string; objectKey: string; sortOrder: number }[];
  cuisines: string[];
  interests: string[];
  firstDateTypes: string[];
  languages: string[];
}

type Tab = "matches" | "profile" | "edit";

export default function DatingApp() {
  const [tab, setTab] = useState<Tab>("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchMyProfile();
  }, []);

  async function fetchMatches() {
    try {
      const res = await fetch("/api/dating/profile/matches", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setMatches(data.matches);
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyProfile() {
    try {
      const res = await fetch("/api/dating/profile/me", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setMyProfile(data.profile);
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }

  async function viewMatchProfile(userId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/dating/profile/${userId}`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setSelectedMatch(data.profile);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (err) {
      setError("Failed to load profile");
    }
  }

  async function handleLogout() {
    await fetch("/api/dating/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myProfile) return;

    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      profession: formData.get("profession"),
      dreams: formData.get("dreams"),
      fiveYearGoal: formData.get("fiveYearGoal"),
      whatIWantInPartner: formData.get("whatIWantInPartner"),
      whyPartnerWouldLikeMe: formData.get("whyPartnerWouldLikeMe"),
      physicalActivity: formData.get("physicalActivity"),
      dateBudget: formData.get("dateBudget"),
      instagramHandle: formData.get("instagramHandle"),
      diet: formData.get("diet"),
      drinking: formData.get("drinking"),
      smoking: formData.get("smoking"),
    };

    try {
      const res = await fetch("/api/dating/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchMyProfile();
        setTab("profile");
      } else {
        setError(data.error || "Failed to save");
      }
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function getPhotoUrl(objectKey: string) {
    return `/api/images/storage/${encodeURIComponent(objectKey)}`;
  }

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  if (loading) {
    return (
      <div className="hogu-app">
        <div className="hogu-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="hogu-app">
      <header className="hogu-shell hogu-header">
        <div className="hogu-brand">Hogu</div>
        <nav className="hogu-nav">
          <button
            className={`hogu-tab ${tab === "matches" ? "hogu-tab--active" : ""}`}
            onClick={() => { setTab("matches"); setSelectedMatch(null); }}
          >
            Matches
          </button>
          <button
            className={`hogu-tab ${tab === "profile" ? "hogu-tab--active" : ""}`}
            onClick={() => { setTab("profile"); setSelectedMatch(null); }}
          >
            My Profile
          </button>
          <button className="hogu-link" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>

      <main className="hogu-shell hogu-main">
        {error && <div className="hogu-error">{error}</div>}

        {tab === "matches" && !selectedMatch && (
          <section className="hogu-matches">
            <h2>Your Matches</h2>
            {matches.length === 0 ? (
              <div className="hogu-empty">
                <p>No matches yet. Check back soon!</p>
                <p className="hogu-muted">We'll notify you when you get a match.</p>
              </div>
            ) : (
              <div className="hogu-match-grid">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="hogu-match-card"
                    onClick={() => viewMatchProfile(match.id)}
                  >
                    {match.photos[0] && (
                      <img
                        src={getPhotoUrl(match.photos[0].objectKey)}
                        alt={match.name}
                        className="hogu-match-photo"
                      />
                    )}
                    <div className="hogu-match-info">
                      <h3>{match.name}, {calculateAge(match.dob)}</h3>
                      {match.profession && <p>{match.profession}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "matches" && selectedMatch && (
          <section className="hogu-profile-view">
            <button className="hogu-back" onClick={() => setSelectedMatch(null)}>
              &larr; Back to matches
            </button>
            <div className="hogu-profile-photos">
              {selectedMatch.photos.map((p, i) => (
                <img
                  key={i}
                  src={getPhotoUrl(p.objectKey)}
                  alt={`${selectedMatch.name} photo ${i + 1}`}
                  className="hogu-profile-photo"
                />
              ))}
            </div>
            <div className="hogu-profile-details">
              <h2>{selectedMatch.name}, {calculateAge(selectedMatch.dob)}</h2>
              {selectedMatch.profession && <p className="hogu-profession">{selectedMatch.profession}</p>}
              {selectedMatch.instagramHandle && (
                <p className="hogu-instagram">@{selectedMatch.instagramHandle}</p>
              )}

              {selectedMatch.dreams && (
                <div className="hogu-section">
                  <h4>Dreams</h4>
                  <p>{selectedMatch.dreams}</p>
                </div>
              )}

              {selectedMatch.fiveYearGoal && (
                <div className="hogu-section">
                  <h4>5 Year Goal</h4>
                  <p>{selectedMatch.fiveYearGoal}</p>
                </div>
              )}

              {selectedMatch.whatIWantInPartner && (
                <div className="hogu-section">
                  <h4>What I Want in a Partner</h4>
                  <p>{selectedMatch.whatIWantInPartner}</p>
                </div>
              )}

              {selectedMatch.whyPartnerWouldLikeMe && (
                <div className="hogu-section">
                  <h4>Why You'd Like Me</h4>
                  <p>{selectedMatch.whyPartnerWouldLikeMe}</p>
                </div>
              )}

              <div className="hogu-tags">
                {selectedMatch.cuisines.length > 0 && (
                  <div className="hogu-tag-group">
                    <span className="hogu-tag-label">Cuisines:</span>
                    {selectedMatch.cuisines.map((c) => (
                      <span key={c} className="hogu-tag">{c}</span>
                    ))}
                  </div>
                )}
                {selectedMatch.firstDateTypes.length > 0 && (
                  <div className="hogu-tag-group">
                    <span className="hogu-tag-label">First date ideas:</span>
                    {selectedMatch.firstDateTypes.map((t) => (
                      <span key={t} className="hogu-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="hogu-lifestyle">
                {selectedMatch.diet && <span>Diet: {selectedMatch.diet}</span>}
                {selectedMatch.drinking && <span>Drinking: {selectedMatch.drinking}</span>}
                {selectedMatch.smoking && <span>Smoking: {selectedMatch.smoking}</span>}
                {selectedMatch.physicalActivity && <span>Activity: {selectedMatch.physicalActivity}</span>}
                {selectedMatch.dateBudget && <span>Budget: {selectedMatch.dateBudget}</span>}
              </div>
            </div>
          </section>
        )}

        {tab === "profile" && myProfile && (
          <section className="hogu-my-profile">
            <div className="hogu-profile-header">
              <h2>My Profile</h2>
              <button className="hogu-btn hogu-btn--secondary" onClick={() => setTab("edit")}>
                Edit Profile
              </button>
            </div>

            <div className="hogu-profile-photos">
              {myProfile.photos.map((p, i) => (
                <img
                  key={p.id}
                  src={getPhotoUrl(p.objectKey)}
                  alt={`Your photo ${i + 1}`}
                  className="hogu-profile-photo"
                />
              ))}
            </div>

            <div className="hogu-profile-details">
              <h3>{myProfile.name}, {calculateAge(myProfile.dob)}</h3>
              {myProfile.profession && <p className="hogu-profession">{myProfile.profession}</p>}

              {myProfile.dreams && (
                <div className="hogu-section">
                  <h4>Dreams</h4>
                  <p>{myProfile.dreams}</p>
                </div>
              )}

              {myProfile.fiveYearGoal && (
                <div className="hogu-section">
                  <h4>5 Year Goal</h4>
                  <p>{myProfile.fiveYearGoal}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "edit" && myProfile && (
          <section className="hogu-edit-profile">
            <h2>Edit Profile</h2>
            <form onSubmit={saveProfile} className="hogu-edit-form">
              <div className="hogu-form-group">
                <label>Name</label>
                <input type="text" name="name" defaultValue={myProfile.name} required />
              </div>

              <div className="hogu-form-group">
                <label>Profession</label>
                <input type="text" name="profession" defaultValue={myProfile.profession || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Instagram Handle</label>
                <input type="text" name="instagramHandle" defaultValue={myProfile.instagramHandle || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Dreams</label>
                <textarea name="dreams" rows={3} defaultValue={myProfile.dreams || ""} />
              </div>

              <div className="hogu-form-group">
                <label>5 Year Goal</label>
                <textarea name="fiveYearGoal" rows={3} defaultValue={myProfile.fiveYearGoal || ""} />
              </div>

              <div className="hogu-form-group">
                <label>What I Want in a Partner</label>
                <textarea name="whatIWantInPartner" rows={3} defaultValue={myProfile.whatIWantInPartner || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Why You'd Like Me</label>
                <textarea name="whyPartnerWouldLikeMe" rows={3} defaultValue={myProfile.whyPartnerWouldLikeMe || ""} />
              </div>

              <div className="hogu-form-row">
                <div className="hogu-form-group">
                  <label>Physical Activity</label>
                  <select name="physicalActivity" defaultValue={myProfile.physicalActivity || ""}>
                    <option value="">Select...</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                    <option value="very_active">Very Active</option>
                  </select>
                </div>

                <div className="hogu-form-group">
                  <label>Date Budget</label>
                  <select name="dateBudget" defaultValue={myProfile.dateBudget || ""}>
                    <option value="">Select...</option>
                    <option value="budget">Budget-friendly</option>
                    <option value="moderate">Moderate</option>
                    <option value="upscale">Upscale</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="hogu-form-row">
                <div className="hogu-form-group">
                  <label>Diet</label>
                  <select name="diet" defaultValue={myProfile.diet || ""}>
                    <option value="">Select...</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non_vegetarian">Non-Vegetarian</option>
                    <option value="eggetarian">Eggetarian</option>
                  </select>
                </div>

                <div className="hogu-form-group">
                  <label>Drinking</label>
                  <select name="drinking" defaultValue={myProfile.drinking || ""}>
                    <option value="">Select...</option>
                    <option value="never">Never</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="regularly">Regularly</option>
                  </select>
                </div>

                <div className="hogu-form-group">
                  <label>Smoking</label>
                  <select name="smoking" defaultValue={myProfile.smoking || ""}>
                    <option value="">Select...</option>
                    <option value="never">Never</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="regularly">Regularly</option>
                  </select>
                </div>
              </div>

              <div className="hogu-form-actions">
                <button type="button" className="hogu-btn hogu-btn--ghost" onClick={() => setTab("profile")}>
                  Cancel
                </button>
                <button type="submit" className="hogu-btn hogu-btn--primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      <style>{`
        .hogu-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
        }
        .hogu-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 1.2rem;
        }
        .hogu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .hogu-brand {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e94560;
        }
        .hogu-nav {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .hogu-tab {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .hogu-tab:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
        }
        .hogu-tab--active {
          color: #fff;
          background: rgba(233,69,96,0.3);
        }
        .hogu-link {
          color: rgba(255,255,255,0.7);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .hogu-link:hover {
          color: #e94560;
        }
        .hogu-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .hogu-error {
          background: rgba(233,69,96,0.2);
          border: 1px solid #e94560;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .hogu-matches h2, .hogu-my-profile h2, .hogu-edit-profile h2 {
          margin-bottom: 1.5rem;
        }
        .hogu-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
        }
        .hogu-muted {
          color: rgba(255,255,255,0.5);
          margin-top: 0.5rem;
        }
        .hogu-match-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .hogu-match-card {
          background: rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hogu-match-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .hogu-match-photo {
          width: 100%;
          height: 320px;
          object-fit: cover;
        }
        .hogu-match-info {
          padding: 1rem;
        }
        .hogu-match-info h3 {
          margin: 0 0 0.25rem;
          font-size: 1.2rem;
        }
        .hogu-match-info p {
          margin: 0;
          color: rgba(255,255,255,0.6);
        }
        .hogu-back {
          background: none;
          border: none;
          color: #e94560;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 1.5rem;
        }
        .hogu-profile-photos {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 1rem;
        }
        .hogu-profile-photo {
          width: 280px;
          height: 350px;
          object-fit: cover;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .hogu-profile-details {
          margin-top: 1.5rem;
        }
        .hogu-profile-details h2 {
          margin: 0 0 0.5rem;
        }
        .hogu-profession {
          color: rgba(255,255,255,0.7);
          font-size: 1.1rem;
        }
        .hogu-instagram {
          color: #e94560;
        }
        .hogu-section {
          margin-top: 1.5rem;
        }
        .hogu-section h4 {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .hogu-tags {
          margin-top: 1.5rem;
        }
        .hogu-tag-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .hogu-tag-label {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        .hogu-tag {
          background: rgba(233,69,96,0.3);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
        }
        .hogu-lifestyle {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }
        .hogu-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .hogu-edit-form {
          max-width: 600px;
        }
        .hogu-form-group {
          margin-bottom: 1.25rem;
        }
        .hogu-form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }
        .hogu-form-group input,
        .hogu-form-group textarea,
        .hogu-form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 1rem;
        }
        .hogu-form-group input:focus,
        .hogu-form-group textarea:focus,
        .hogu-form-group select:focus {
          outline: none;
          border-color: #e94560;
        }
        .hogu-form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .hogu-form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }
        .hogu-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .hogu-btn--primary {
          background: #e94560;
          color: #fff;
        }
        .hogu-btn--primary:hover {
          background: #d13350;
        }
        .hogu-btn--primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hogu-btn--secondary {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .hogu-btn--ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .hogu-btn--ghost:hover {
          background: rgba(255,255,255,0.05);
        }
        @media (max-width: 768px) {
          .hogu-header {
            flex-direction: column;
            gap: 1rem;
          }
          .hogu-main {
            padding: 1rem;
          }
          .hogu-profile-photo {
            width: 200px;
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}

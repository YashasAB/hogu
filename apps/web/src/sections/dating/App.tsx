import React, { useState, useEffect } from "react";

const DIET_LABELS: Record<string, string> = { VEG: "Vegetarian", EGG: "Eggetarian", NON_VEG: "Non-Vegetarian", VEGAN: "Vegan", JAIN: "Jain" };
const DRINKING_LABELS: Record<string, string> = { NEVER: "Never", SOCIALLY: "Socially", OFTEN: "Often" };
const SMOKING_LABELS: Record<string, string> = { NO: "No", SOCIALLY: "Socially", YES: "Yes" };
const ACTIVITY_LABELS: Record<string, string> = { RARELY: "Rarely", SOMETIMES: "Sometimes", REGULAR: "Regular", ATHLETE: "Athlete" };
const friendlyLabel = (val: string | null | undefined, labels: Record<string, string>) => val ? (labels[val] || val) : null;

interface Match {
  id: string;
  name: string;
  profession: string | null;
  dob: string;
  photos: { objectKey: string; sortOrder: number }[];
  matchedAt: string;
  status: string;
  matchId: string;
  user1Interested: boolean;
  user2Interested: boolean;
  user1_id: string;
  user2_id: string;
  myUserId: string;
}

interface AvailabilityEntry {
  id: string;
  matchId: string;
  userId: string;
  datesFree: string;
  timesFree: string;
  neighborhoods: string;
  createdAt: string;
}

interface AdminMessage {
  id: string;
  userId: string;
  fromAdmin: boolean;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Profile {
  id: string;
  name: string;
  phoneE164: string;
  dob: string;
  profession: string | null;
  height: string | null;
  gender: string | null;
  dreams: string | null;
  fiveYearGoal: string | null;
  whatIWantInPartner: string | null;
  whyPartnerWouldLikeMe: string | null;
  myDayLooksLike: string | null;
  idealFirstDate: string | null;
  nonNegotiables: string | null;
  physicalActivity: string | null;
  dateBudget: string | null;
  instagramHandle: string | null;
  diet: string | null;
  drinking: string | null;
  smoking: string | null;
  relationshipType: string | null;
  agePreferenceMin: number | null;
  agePreferenceMax: number | null;
  dateCity: string | null;
  dateNeighborhoods: string | null;
  photos: { id: string; objectKey: string; sortOrder: number }[];
  cuisines: string[];
  interests: string[];
  firstDateTypes: string[];
  languages: string[];
}

type Tab = "matches" | "profile" | "edit" | "messages";

const MATCH_STATUS_ORDER = ["CONFIRMED", "SCHEDULING", "INTERESTED", "MATCHED", "COMPLETED"];

export default function DatingApp() {
  const [tab, setTab] = useState<Tab>("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [availabilityByMatch, setAvailabilityByMatch] = useState<Record<string, AvailabilityEntry[]>>({});
  const [schedForm, setSchedForm] = useState<{ matchId: string; datesFree: string; timesFree: string; neighborhoods: string; editId?: string } | null>(null);

  useEffect(() => {
    fetchMatches();
    fetchMyProfile();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);
    return () => clearInterval(interval);
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

  async function expressInterest(matchId: string) {
    try {
      const res = await fetch(`/api/dating/profile/matches/${matchId}/interested`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        fetchMatches();
      }
    } catch (err) {
      console.error("Failed to express interest:", err);
    }
  }

  async function fetchAvailability(matchId: string) {
    try {
      const res = await fetch(`/api/dating/profile/matches/${matchId}/availability`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setAvailabilityByMatch((prev) => ({ ...prev, [matchId]: data.availability }));
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    }
  }

  async function saveAvailability() {
    if (!schedForm) return;
    setSaving(true);
    try {
      if (schedForm.editId) {
        const res = await fetch(`/api/dating/profile/availability/${schedForm.editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ datesFree: schedForm.datesFree, timesFree: schedForm.timesFree, neighborhoods: schedForm.neighborhoods }),
        });
        const data = await res.json();
        if (!data.ok) { setError(data.error); return; }
      } else {
        const res = await fetch(`/api/dating/profile/matches/${schedForm.matchId}/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ datesFree: schedForm.datesFree, timesFree: schedForm.timesFree, neighborhoods: schedForm.neighborhoods }),
        });
        const data = await res.json();
        if (!data.ok) { setError(data.error); return; }
      }
      setSchedForm(null);
      fetchAvailability(schedForm.matchId);
    } catch (err) {
      setError("Failed to save availability");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAvailability(entryId: string, matchId: string) {
    try {
      const res = await fetch(`/api/dating/profile/availability/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        fetchAvailability(matchId);
      }
    } catch (err) {
      console.error("Failed to delete availability:", err);
    }
  }

  useEffect(() => {
    const schedulingMatches = matches.filter((m) => m.status === "SCHEDULING" || m.status === "CONFIRMED");
    schedulingMatches.forEach((m) => {
      if (!availabilityByMatch[m.matchId]) {
        fetchAvailability(m.matchId);
      }
    });
  }, [matches]);

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

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/dating/profile/messages/unread-count", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch("/api/dating/profile/messages", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch("/api/dating/profile/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  useEffect(() => {
    if (tab === "messages") {
      fetchMessages();
      const interval = setInterval(() => {
        fetchMessages();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [tab]);

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
      myDayLooksLike: formData.get("myDayLooksLike"),
      idealFirstDate: formData.get("idealFirstDate"),
      nonNegotiables: formData.get("nonNegotiables"),
      physicalActivity: formData.get("physicalActivity"),
      dateBudget: formData.get("dateBudget"),
      instagramHandle: formData.get("instagramHandle"),
      diet: formData.get("diet"),
      drinking: formData.get("drinking"),
      smoking: formData.get("smoking"),
      gender: formData.get("gender"),
      relationshipType: formData.get("relationshipType"),
      agePreferenceMin: formData.get("agePreferenceMin") || null,
      agePreferenceMax: formData.get("agePreferenceMax") || null,
      dateCity: formData.get("dateCity"),
      dateNeighborhoods: formData.get("dateNeighborhoods"),
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
          <button
            className={`hogu-tab ${tab === "messages" ? "hogu-tab--active" : ""}`}
            onClick={() => setTab("messages")}
          >
            Messages {unreadCount > 0 && <span className="hogu-badge">{unreadCount}</span>}
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
                <p className="hogu-muted" style={{ marginTop: "1.5rem", lineHeight: 1.7, maxWidth: 520 }}>
                  Hi! We're working on finding you the best possible matches.<br />
                  To improve your chances, please complete your profile with as much detail as possible.<br />
                  Adding your diet preferences, interests, profession, and preferred areas to go out in makes a huge difference in helping us curate relevant introductions for you.
                </p>
                <button
                  className="hogu-btn"
                  style={{ marginTop: "1.25rem" }}
                  onClick={() => setTab("edit")}
                >
                  Complete Your Profile
                </button>
              </div>
            ) : (
              <>
                {MATCH_STATUS_ORDER.map((status) => {
                  const statusMatches = matches.filter((m) => m.status === status);
                  if (statusMatches.length === 0) return null;
                  return (
                    <div key={status} className="hogu-status-group">
                      <h3 className="hogu-status-title">
                        <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                        ({statusMatches.length})
                      </h3>
                      <div className="hogu-match-grid">
                        {statusMatches.map((match) => {
                          const isUser1 = match.myUserId === match.user1_id;
                          const myInterested = isUser1 ? match.user1Interested : match.user2Interested;
                          const theirInterested = isUser1 ? match.user2Interested : match.user1Interested;
                          return (
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
                            {(match.status === "MATCHED" || match.status === "INTERESTED") && !myInterested && (
                              <button
                                className="hogu-btn hogu-btn--interest"
                                onClick={(e) => { e.stopPropagation(); expressInterest(match.matchId); }}
                              >
                                {theirInterested ? "They're interested! I am too" : "I'm Interested"}
                              </button>
                            )}
                            {(match.status === "MATCHED" || match.status === "INTERESTED") && myInterested && !theirInterested && (
                              <div className="hogu-interest-waiting">You're interested - waiting for them</div>
                            )}
                            {(match.status === "MATCHED" || match.status === "INTERESTED") && !myInterested && theirInterested && (
                              <div className="hogu-interest-indicator">They're interested!</div>
                            )}

                            {(match.status === "SCHEDULING" || match.status === "CONFIRMED") && (
                              <div className="hogu-scheduling-section" onClick={(e) => e.stopPropagation()}>
                                <h4 className="hogu-sched-title">Your Availability</h4>
                                {(availabilityByMatch[match.matchId] || []).length > 0 ? (
                                  <div className="hogu-avail-list">
                                    {(availabilityByMatch[match.matchId] || []).map((entry) => (
                                      <div key={entry.id} className="hogu-avail-entry">
                                        <div className="hogu-avail-detail"><strong>Dates:</strong> {entry.datesFree}</div>
                                        <div className="hogu-avail-detail"><strong>Times:</strong> {entry.timesFree}</div>
                                        <div className="hogu-avail-detail"><strong>Neighborhoods:</strong> {entry.neighborhoods}</div>
                                        <div className="hogu-avail-actions">
                                          <button
                                            className="hogu-btn hogu-btn--small"
                                            onClick={() => setSchedForm({ matchId: match.matchId, datesFree: entry.datesFree, timesFree: entry.timesFree, neighborhoods: entry.neighborhoods, editId: entry.id })}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="hogu-btn hogu-btn--small hogu-btn--danger"
                                            onClick={() => deleteAvailability(entry.id, match.matchId)}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="hogu-muted" style={{ fontSize: "0.85rem", margin: "4px 0" }}>No availability added yet</p>
                                )}

                                {schedForm && schedForm.matchId === match.matchId ? (
                                  <div className="hogu-sched-form">
                                    <label>
                                      Dates you're free
                                      <input
                                        type="text"
                                        placeholder="e.g. Feb 15, Feb 16, any weekend"
                                        value={schedForm.datesFree}
                                        onChange={(e) => setSchedForm({ ...schedForm, datesFree: e.target.value })}
                                      />
                                    </label>
                                    <label>
                                      Times you're free
                                      <input
                                        type="text"
                                        placeholder="e.g. 7pm-10pm, evenings, after 6pm"
                                        value={schedForm.timesFree}
                                        onChange={(e) => setSchedForm({ ...schedForm, timesFree: e.target.value })}
                                      />
                                    </label>
                                    <label>
                                      Preferred neighborhoods
                                      <input
                                        type="text"
                                        placeholder="e.g. Indiranagar, Koramangala, HSR Layout"
                                        value={schedForm.neighborhoods}
                                        onChange={(e) => setSchedForm({ ...schedForm, neighborhoods: e.target.value })}
                                      />
                                    </label>
                                    <div className="hogu-sched-btns">
                                      <button className="hogu-btn hogu-btn--primary" onClick={saveAvailability} disabled={saving}>
                                        {saving ? "Saving..." : schedForm.editId ? "Update" : "Save"}
                                      </button>
                                      <button className="hogu-btn" onClick={() => setSchedForm(null)}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    className="hogu-btn hogu-btn--interest"
                                    style={{ marginTop: "8px" }}
                                    onClick={() => setSchedForm({ matchId: match.matchId, datesFree: "", timesFree: "", neighborhoods: "" })}
                                  >
                                    + Add Availability
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
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
              {selectedMatch.gender && <p className="hogu-detail-line">Gender: {selectedMatch.gender}</p>}
              {selectedMatch.height && <p className="hogu-detail-line">Height: {selectedMatch.height}</p>}
              {selectedMatch.relationshipType && (
                <div className="hogu-section">
                  <h4>Looking for</h4>
                  <p>{selectedMatch.relationshipType === "serious" ? "Serious relationship" : selectedMatch.relationshipType === "not_sure" ? "Not sure yet" : "Casual dating"}</p>
                </div>
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

              {selectedMatch.myDayLooksLike && (
                <div className="hogu-section">
                  <h4>My Day Looks Like</h4>
                  <p>{selectedMatch.myDayLooksLike}</p>
                </div>
              )}

              {selectedMatch.idealFirstDate && (
                <div className="hogu-section">
                  <h4>My Ideal First Date</h4>
                  <p>{selectedMatch.idealFirstDate}</p>
                </div>
              )}

              {selectedMatch.nonNegotiables && (
                <div className="hogu-section">
                  <h4>Non-Negotiables</h4>
                  <p>{selectedMatch.nonNegotiables}</p>
                </div>
              )}

              {(selectedMatch.diet || selectedMatch.drinking || selectedMatch.smoking || selectedMatch.physicalActivity || selectedMatch.dateBudget) && (
                <div className="hogu-section">
                  <h4>Lifestyle</h4>
                  <div className="hogu-lifestyle-tags">
                    {selectedMatch.diet && <span>Diet: {friendlyLabel(selectedMatch.diet, DIET_LABELS)}</span>}
                    {selectedMatch.drinking && <span>Drinking: {friendlyLabel(selectedMatch.drinking, DRINKING_LABELS)}</span>}
                    {selectedMatch.smoking && <span>Smoking: {friendlyLabel(selectedMatch.smoking, SMOKING_LABELS)}</span>}
                    {selectedMatch.physicalActivity && <span>Activity: {friendlyLabel(selectedMatch.physicalActivity, ACTIVITY_LABELS)}</span>}
                    {selectedMatch.dateBudget && <span>Date budget: {selectedMatch.dateBudget}</span>}
                  </div>
                </div>
              )}

              {selectedMatch.cuisines.length > 0 && (
                <div className="hogu-section">
                  <h4>Favourite Cuisines</h4>
                  <div className="hogu-tags">{selectedMatch.cuisines.map((c) => <span key={c} className="hogu-tag">{c}</span>)}</div>
                </div>
              )}

              {selectedMatch.firstDateTypes.length > 0 && (
                <div className="hogu-section">
                  <h4>First Date Ideas</h4>
                  <div className="hogu-tags">{selectedMatch.firstDateTypes.map((f) => <span key={f} className="hogu-tag">{f}</span>)}</div>
                </div>
              )}

              {selectedMatch.interests.length > 0 && (
                <div className="hogu-section">
                  <h4>Interests</h4>
                  <div className="hogu-tags">{selectedMatch.interests.map((i) => <span key={i} className="hogu-tag">{i}</span>)}</div>
                </div>
              )}

              {selectedMatch.languages.length > 0 && (
                <div className="hogu-section">
                  <h4>Languages</h4>
                  <div className="hogu-tags">{selectedMatch.languages.map((l) => <span key={l} className="hogu-tag">{l}</span>)}</div>
                </div>
              )}
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
              {myProfile.gender && <p className="hogu-detail-line">Gender: {myProfile.gender}</p>}
              {myProfile.height && <p className="hogu-detail-line">Height: {myProfile.height}</p>}
              {myProfile.instagramHandle && <p className="hogu-detail-line">Instagram: @{myProfile.instagramHandle.replace(/^@/, "")}</p>}
              {myProfile.dateCity && <p className="hogu-detail-line">Date City: {myProfile.dateCity}</p>}
              {myProfile.dateNeighborhoods && <p className="hogu-detail-line">Date Neighborhoods: {myProfile.dateNeighborhoods}</p>}

              {myProfile.relationshipType && (
                <div className="hogu-section">
                  <h4>Looking for</h4>
                  <p>{myProfile.relationshipType === "serious" ? "Serious relationship" : myProfile.relationshipType === "not_sure" ? "Not sure yet" : "Casual dating"}</p>
                </div>
              )}

              {(myProfile.agePreferenceMin || myProfile.agePreferenceMax) && (
                <div className="hogu-section">
                  <h4>Age preference</h4>
                  <p>
                    {myProfile.agePreferenceMin && myProfile.agePreferenceMax
                      ? `${myProfile.agePreferenceMin} – ${myProfile.agePreferenceMax}`
                      : myProfile.agePreferenceMin
                        ? `${myProfile.agePreferenceMin}+`
                        : `Up to ${myProfile.agePreferenceMax}`}
                  </p>
                </div>
              )}

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

              {myProfile.whatIWantInPartner && (
                <div className="hogu-section">
                  <h4>What I Want in a Partner</h4>
                  <p>{myProfile.whatIWantInPartner}</p>
                </div>
              )}

              {myProfile.whyPartnerWouldLikeMe && (
                <div className="hogu-section">
                  <h4>Why You'd Like Me</h4>
                  <p>{myProfile.whyPartnerWouldLikeMe}</p>
                </div>
              )}

              {myProfile.myDayLooksLike && (
                <div className="hogu-section">
                  <h4>My Day Looks Like</h4>
                  <p>{myProfile.myDayLooksLike}</p>
                </div>
              )}

              {myProfile.idealFirstDate && (
                <div className="hogu-section">
                  <h4>My Ideal First Date</h4>
                  <p>{myProfile.idealFirstDate}</p>
                </div>
              )}

              {myProfile.nonNegotiables && (
                <div className="hogu-section">
                  <h4>Non-Negotiables</h4>
                  <p>{myProfile.nonNegotiables}</p>
                </div>
              )}

              {(myProfile.diet || myProfile.drinking || myProfile.smoking || myProfile.physicalActivity || myProfile.dateBudget) && (
                <div className="hogu-section">
                  <h4>Lifestyle</h4>
                  <div className="hogu-lifestyle-tags">
                    {myProfile.diet && <span>Diet: {friendlyLabel(myProfile.diet, DIET_LABELS)}</span>}
                    {myProfile.drinking && <span>Drinking: {friendlyLabel(myProfile.drinking, DRINKING_LABELS)}</span>}
                    {myProfile.smoking && <span>Smoking: {friendlyLabel(myProfile.smoking, SMOKING_LABELS)}</span>}
                    {myProfile.physicalActivity && <span>Activity: {friendlyLabel(myProfile.physicalActivity, ACTIVITY_LABELS)}</span>}
                    {myProfile.dateBudget && <span>Date budget: {myProfile.dateBudget}</span>}
                  </div>
                </div>
              )}

              {myProfile.cuisines.length > 0 && (
                <div className="hogu-section">
                  <h4>Favourite Cuisines</h4>
                  <div className="hogu-tags">{myProfile.cuisines.map((c) => <span key={c} className="hogu-tag">{c}</span>)}</div>
                </div>
              )}

              {myProfile.firstDateTypes.length > 0 && (
                <div className="hogu-section">
                  <h4>First Date Ideas</h4>
                  <div className="hogu-tags">{myProfile.firstDateTypes.map((f) => <span key={f} className="hogu-tag">{f}</span>)}</div>
                </div>
              )}

              {myProfile.interests.length > 0 && (
                <div className="hogu-section">
                  <h4>Interests</h4>
                  <div className="hogu-tags">{myProfile.interests.map((i) => <span key={i} className="hogu-tag">{i}</span>)}</div>
                </div>
              )}

              {myProfile.languages.length > 0 && (
                <div className="hogu-section">
                  <h4>Languages</h4>
                  <div className="hogu-tags">{myProfile.languages.map((l) => <span key={l} className="hogu-tag">{l}</span>)}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "edit" && myProfile && (
          <section className="hogu-edit-profile">
            <h2>Edit Profile</h2>

            <div className="hogu-photo-manager">
              <h3>Your Photos</h3>
              <div className="hogu-photo-grid">
                {myProfile.photos.map((p, i) => (
                  <div key={p.id} className="hogu-photo-slot">
                    <img src={getPhotoUrl(p.objectKey)} alt={`Photo ${i + 1}`} />
                    <button
                      type="button"
                      className="hogu-photo-delete-btn"
                      onClick={async () => {
                        if (myProfile.photos.length <= 1) {
                          setError("You must keep at least 1 photo");
                          return;
                        }
                        if (!confirm("Delete this photo?")) return;
                        try {
                          const res = await fetch(`/api/dating/profile/photos/${p.id}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                          const data = await res.json();
                          if (data.ok) {
                            await fetchMyProfile();
                          } else {
                            setError(data.error || "Failed to delete photo");
                          }
                        } catch {
                          setError("Failed to delete photo");
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {myProfile.photos.length < 6 && (
                  <label className="hogu-photo-add-slot">
                    <span>+ Add Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = "";
                        try {
                          setError(null);
                          const contentType = file.type || "image/jpeg";
                          const presignRes = await fetch("/api/dating/uploads/presign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ count: 1, contentTypes: [contentType], userHint: "profile" }),
                          });
                          const presignData = await presignRes.json();
                          if (!presignData.ok || !presignData.items?.length) throw new Error("Presign failed");

                          const item = presignData.items[0];
                          const uploadRes = await fetch(item.uploadUrl, {
                            method: "PUT",
                            headers: { "Content-Type": item.contentType },
                            body: file,
                          });
                          if (!uploadRes.ok) throw new Error("Upload failed");

                          const addRes = await fetch("/api/dating/profile/photos", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ objectKey: item.objectKey }),
                          });
                          const addData = await addRes.json();
                          if (addData.ok) {
                            await fetchMyProfile();
                          } else {
                            setError(addData.error || "Failed to add photo");
                          }
                        } catch {
                          setError("Failed to upload photo");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

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
                <label>Height (optional)</label>
                <input type="text" name="height" placeholder="e.g., 5'10&quot; or 178cm" defaultValue={myProfile.height || ""} />
              </div>

              <div className="hogu-form-group">
                <label>City you want to go on dates in</label>
                <input type="text" name="dateCity" placeholder="e.g., Bengaluru" defaultValue={myProfile.dateCity || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Neighborhoods you prefer for dates</label>
                <textarea name="dateNeighborhoods" rows={2} placeholder="e.g., Koramangala, Indiranagar, HSR Layout" defaultValue={myProfile.dateNeighborhoods || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Gender</label>
                <select name="gender" defaultValue={myProfile.gender || "Male"}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="hogu-form-group">
                <label>What are you looking for?</label>
                <select name="relationshipType" defaultValue={myProfile.relationshipType || "serious"}>
                  <option value="serious">Serious relationship</option>
                  <option value="casual">Casual dating</option>
                  <option value="not_sure">I'm not sure</option>
                </select>
              </div>

              <div className="hogu-form-group">
                <label>Age preference for dates</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input type="number" name="agePreferenceMin" placeholder="Min age" min={18} max={99} defaultValue={myProfile.agePreferenceMin ?? ""} style={{ width: "120px" }} />
                  <span style={{ color: "#888" }}>to</span>
                  <input type="number" name="agePreferenceMax" placeholder="Max age" min={18} max={99} defaultValue={myProfile.agePreferenceMax ?? ""} style={{ width: "120px" }} />
                </div>
              </div>

              <div className="hogu-form-group">
                <label>Dreams</label>
                <textarea name="dreams" rows={3} placeholder="Share your biggest dreams and aspirations. What do you hope to achieve in life? What drives and motivates you? (Try writing at least 100 characters to give your matches a real sense of who you are)" defaultValue={myProfile.dreams || ""} />
              </div>

              <div className="hogu-form-group">
                <label>5 Year Goal</label>
                <textarea name="fiveYearGoal" rows={3} placeholder="Where do you see yourself in 5 years? What are you working toward in your career, personal life, or relationships? Be specific! (Aim for 100+ characters)" defaultValue={myProfile.fiveYearGoal || ""} />
              </div>

              <div className="hogu-form-group">
                <label>What I Want in a Partner</label>
                <textarea name="whatIWantInPartner" rows={3} placeholder="Describe the qualities you're looking for in a partner. What values, personality traits, or lifestyle factors matter most to you? (100+ characters helps us find better matches)" defaultValue={myProfile.whatIWantInPartner || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Why You'd Like Me</label>
                <textarea name="whyPartnerWouldLikeMe" rows={3} placeholder="What makes you a great partner? Share your personality, interests, and what you bring to a relationship. Help potential matches understand what makes you special! (100+ characters recommended)" defaultValue={myProfile.whyPartnerWouldLikeMe || ""} />
              </div>

              <div className="hogu-form-group">
                <label>My Day Looks Like</label>
                <textarea name="myDayLooksLike" rows={3} placeholder="Walk us through your typical day! e.g. 'I work in tech till 6, hit the gym, and then I'm free for drinks'" defaultValue={myProfile.myDayLooksLike || ""} />
              </div>

              <div className="hogu-form-group">
                <label>My Ideal First Date</label>
                <textarea name="idealFirstDate" rows={3} placeholder="I cannot refuse a person if they plan a first date like... (Tell us your dream first date!)" defaultValue={myProfile.idealFirstDate || ""} />
              </div>

              <div className="hogu-form-group">
                <label>Non-Negotiables in a Partner</label>
                <textarea name="nonNegotiables" rows={3} placeholder="What are the things you absolutely need in a partner? e.g. 'Must be active and into fitness, has to love dogs'" defaultValue={myProfile.nonNegotiables || ""} />
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

        {tab === "messages" && (
          <section className="hogu-messages">
            <h2>Messages from Your Matchmaker</h2>
            <p className="hogu-muted">Chat with your personal matchmaker for advice, scheduling help, and updates on your matches.</p>
            
            <div className="hogu-messages-list">
              {messages.length === 0 ? (
                <div className="hogu-empty">
                  <p>No messages yet.</p>
                  <p className="hogu-muted">Send a message to start a conversation with your matchmaker!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`hogu-message ${msg.fromAdmin ? "from-admin" : "from-me"}`}>
                    <div className="hogu-message-header">
                      <span className="hogu-message-sender">{msg.fromAdmin ? "Matchmaker" : "You"}</span>
                      <span className="hogu-message-time">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="hogu-message-content">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="hogu-message-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message to your matchmaker..."
                rows={3}
              />
              <button className="hogu-btn hogu-btn--primary" onClick={sendMessage}>
                Send
              </button>
            </div>
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
        .hogu-photo-manager {
          margin-bottom: 2rem;
        }
        .hogu-photo-manager h3 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
        }
        .hogu-photo-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hogu-photo-slot {
          position: relative;
          width: 120px;
          height: 150px;
          border-radius: 10px;
          overflow: hidden;
        }
        .hogu-photo-slot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hogu-photo-delete-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.9);
          color: #fff;
          border: none;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hogu-photo-delete-btn:hover {
          background: #dc2626;
        }
        .hogu-photo-add-slot {
          width: 120px;
          height: 150px;
          border-radius: 10px;
          border: 2px dashed #555;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #888;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }
        .hogu-photo-add-slot:hover {
          border-color: #e32995;
          color: #e32995;
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
        .hogu-btn--interest {
          background: #e94560;
          color: #fff;
          width: 100%;
          margin-top: 0.5rem;
          font-weight: 600;
        }
        .hogu-btn--interest:hover {
          background: #d13350;
        }
        .hogu-interest-waiting {
          text-align: center;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          margin-top: 0.5rem;
          font-style: italic;
        }
        .hogu-interest-indicator {
          text-align: center;
          color: #4CAF50;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          font-weight: 600;
        }
        .hogu-badge {
          background: #e94560;
          color: #fff;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 4px;
        }
        .hogu-status-group {
          margin-bottom: 2rem;
        }
        .hogu-status-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-confirmed { background: #4CAF50; color: #fff; }
        .status-scheduling { background: #FF9800; color: #000; }
        .status-interested { background: #2196F3; color: #fff; }
        .status-matched { background: #9C27B0; color: #fff; }
        .status-completed { background: #607D8B; color: #fff; }
        .hogu-messages {
          max-width: 700px;
        }
        .hogu-messages-list {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 1rem;
          margin: 1.5rem 0;
          max-height: 400px;
          overflow-y: auto;
        }
        .hogu-message {
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
        }
        .hogu-message.from-admin {
          background: rgba(233,69,96,0.2);
          margin-left: 2rem;
        }
        .hogu-message.from-me {
          background: rgba(255,255,255,0.1);
          margin-right: 2rem;
        }
        .hogu-message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .hogu-message-sender {
          font-weight: 600;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }
        .hogu-message-time {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .hogu-message-content {
          margin: 0;
          line-height: 1.5;
        }
        .hogu-message-input {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        .hogu-message-input textarea {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 1rem;
          resize: vertical;
        }
        .hogu-scheduling-section {
          padding: 0.75rem 1rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
        }
        .hogu-sched-title {
          margin: 0 0 0.5rem;
          font-size: 0.95rem;
          color: #FF9800;
        }
        .hogu-avail-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .hogu-avail-entry {
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
        }
        .hogu-avail-detail {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 2px;
        }
        .hogu-avail-detail strong {
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }
        .hogu-avail-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .hogu-btn--small {
          padding: 0.3rem 0.7rem;
          font-size: 0.8rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: none;
          cursor: pointer;
        }
        .hogu-btn--small:hover {
          background: rgba(255,255,255,0.2);
        }
        .hogu-btn--danger {
          background: rgba(233,69,96,0.3);
          color: #e94560;
        }
        .hogu-btn--danger:hover {
          background: rgba(233,69,96,0.5);
        }
        .hogu-sched-form {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .hogu-sched-form label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
        }
        .hogu-sched-form input {
          padding: 0.5rem 0.65rem;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 0.9rem;
        }
        .hogu-sched-form input:focus {
          outline: none;
          border-color: #FF9800;
        }
        .hogu-sched-btns {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
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

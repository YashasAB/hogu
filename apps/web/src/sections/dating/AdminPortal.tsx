import React, { useEffect, useRef, useState } from "react";

const API_BASE = "/api/dating/admin";

const DIET_LABELS: Record<string, string> = { VEG: "Vegetarian", EGG: "Eggetarian", NON_VEG: "Non-Vegetarian", VEGAN: "Vegan", JAIN: "Jain" };
const DRINKING_LABELS: Record<string, string> = { NEVER: "Never", SOCIALLY: "Socially", OFTEN: "Often" };
const SMOKING_LABELS: Record<string, string> = { NO: "No", SOCIALLY: "Socially", YES: "Yes" };
const ACTIVITY_LABELS: Record<string, string> = { RARELY: "Rarely", SOMETIMES: "Sometimes", REGULAR: "Regular", ATHLETE: "Athlete" };
const friendlyLabel = (val: string | undefined, labels: Record<string, string>) => val ? (labels[val] || val) : "-";

interface DatingUser {
  id: string;
  name: string;
  phoneE164: string;
  dob: string;
  profession?: string;
  height?: string;
  gender?: string;
  createdAt: string;
  photos: { objectKey: string; sortOrder: number }[];
  instagramHandle?: string;
  diet?: string;
  drinking?: string;
  smoking?: string;
  physicalActivity?: string;
  dateBudget?: string;
  dreams?: string;
  fiveYearGoal?: string;
  whatIWantInPartner?: string;
  whyPartnerWouldLikeMe?: string;
  myDayLooksLike?: string;
  idealFirstDate?: string;
  nonNegotiables?: string;
  cuisines?: string[];
  firstDateTypes?: string[];
  interests?: string[];
  languages?: string[];
  relationshipType?: string;
  agePreferenceMin?: number | null;
  agePreferenceMax?: number | null;
  dateCity?: string;
  dateNeighborhoods?: string;
  city?: string;
}

interface Match {
  id: string;
  user1: { id: string; name: string; phoneE164: string };
  user2: { id: string; name: string; phoneE164: string };
  status: string;
  user1Interested: boolean;
  user2Interested: boolean;
  createdAt: string;
}

interface AvailabilityData {
  user1Filled: boolean;
  user2Filled: boolean;
  user1Availability: { id: string; datesFree: string; timesFree: string; neighborhoods: string; createdAt: string }[];
  user2Availability: { id: string; datesFree: string; timesFree: string; neighborhoods: string; createdAt: string }[];
}

interface Message {
  id: string;
  userId: string;
  fromAdmin: boolean;
  content: string;
  read: boolean;
  createdAt: string;
  user?: { id: string; name: string; phoneE164: string };
}

const MATCH_STATUSES = ["MATCHED", "INTERESTED", "SCHEDULING", "CONFIRMED", "COMPLETED", "UNMATCHED"];

export default function AdminPortal() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<"users" | "matches" | "messages">("users");
  const [users, setUsers] = useState<DatingUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<DatingUser | null>(null);
  const [selectedUserMessages, setSelectedUserMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [createMatchUser1, setCreateMatchUser1] = useState("");
  const [createMatchUser2, setCreateMatchUser2] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [matchAvailability, setMatchAvailability] = useState<Record<string, AvailabilityData>>({});
  const [expandedAvailMatch, setExpandedAvailMatch] = useState<string | null>(null);
  const [addAvailForm, setAddAvailForm] = useState<Record<string, { userId: string; datesFree: string; timesFree: string; neighborhoods: string }>>({});

  const [getToKnowMessages, setGetToKnowMessages] = useState<{ id: string; role: string; content: string; createdAt: string }[]>([]);
  const [showGetToKnow, setShowGetToKnow] = useState(false);
  const [loadingGetToKnow, setLoadingGetToKnow] = useState(false);

  const [selectedMatchChat, setSelectedMatchChat] = useState<{ matchId: string; userId: string; userName: string } | null>(null);
  const [matchChatMessages, setMatchChatMessages] = useState<{ id: string; fromAdmin: boolean; content: string; createdAt: string }[]>([]);
  const [matchChatInput, setMatchChatInput] = useState("");
  const [matchChatSending, setMatchChatSending] = useState(false);
  const matchChatBottomRef = useRef<HTMLDivElement>(null);

  const [filterCity, setFilterCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterDiet, setFilterDiet] = useState<string>("all");
  const [filterDrinking, setFilterDrinking] = useState<string>("all");
  const [filterSmoking, setFilterSmoking] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterRelType, setFilterRelType] = useState<string>("all");
  const [filterAgeMin, setFilterAgeMin] = useState<string>("");
  const [filterAgeMax, setFilterAgeMax] = useState<string>("");
  const [filterDreams, setFilterDreams] = useState<string>("all");
  const [filterFiveYear, setFilterFiveYear] = useState<string>("all");
  const [filterWantInPartner, setFilterWantInPartner] = useState<string>("all");
  const [filterWhyLikeMe, setFilterWhyLikeMe] = useState<string>("all");
  const [filterProfession, setFilterProfession] = useState<string>("all");
  const [filterDateCity, setFilterDateCity] = useState<string>("all");
  const [filterNeighborhoods, setFilterNeighborhoods] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  function getAge(dob: string): number {
    const d = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age;
  }

  function applyFilters(list: DatingUser[]): DatingUser[] {
    return list.filter((u) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = u.name.toLowerCase().includes(q)
          || u.phoneE164.toLowerCase().includes(q)
          || (u.instagramHandle || "").toLowerCase().includes(q)
          || (u.profession || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterGender !== "all" && (u.gender || "Male") !== filterGender) return false;
      if (filterDiet !== "all") {
        if (filterDiet === "_empty" && u.diet) return false;
        if (filterDiet !== "_empty" && u.diet !== filterDiet) return false;
      }
      if (filterDrinking !== "all") {
        if (filterDrinking === "_empty" && u.drinking) return false;
        if (filterDrinking !== "_empty" && u.drinking !== filterDrinking) return false;
      }
      if (filterSmoking !== "all") {
        if (filterSmoking === "_empty" && u.smoking) return false;
        if (filterSmoking !== "_empty" && u.smoking !== filterSmoking) return false;
      }
      if (filterActivity !== "all") {
        if (filterActivity === "_empty" && u.physicalActivity) return false;
        if (filterActivity !== "_empty" && u.physicalActivity !== filterActivity) return false;
      }
      if (filterRelType !== "all" && (u.relationshipType || "serious") !== filterRelType) return false;
      if (filterAgeMin || filterAgeMax) {
        const age = u.dob ? getAge(u.dob) : null;
        if (age === null) return false;
        if (filterAgeMin && age < parseInt(filterAgeMin)) return false;
        if (filterAgeMax && age > parseInt(filterAgeMax)) return false;
      }
      const isFilled = (v: string | undefined | null) => !!(v && v.trim().length > 0);
      if (filterDreams === "filled" && !isFilled(u.dreams)) return false;
      if (filterDreams === "empty" && isFilled(u.dreams)) return false;
      if (filterFiveYear === "filled" && !isFilled(u.fiveYearGoal)) return false;
      if (filterFiveYear === "empty" && isFilled(u.fiveYearGoal)) return false;
      if (filterWantInPartner === "filled" && !isFilled(u.whatIWantInPartner)) return false;
      if (filterWantInPartner === "empty" && isFilled(u.whatIWantInPartner)) return false;
      if (filterWhyLikeMe === "filled" && !isFilled(u.whyPartnerWouldLikeMe)) return false;
      if (filterWhyLikeMe === "empty" && isFilled(u.whyPartnerWouldLikeMe)) return false;
      if (filterProfession === "filled" && !isFilled(u.profession)) return false;
      if (filterProfession === "empty" && isFilled(u.profession)) return false;
      if (filterDateCity === "filled" && !isFilled(u.dateCity)) return false;
      if (filterDateCity === "empty" && isFilled(u.dateCity)) return false;
      if (filterNeighborhoods === "filled" && !isFilled(u.dateNeighborhoods)) return false;
      if (filterNeighborhoods === "empty" && isFilled(u.dateNeighborhoods)) return false;
      if (filterCity !== "all" && (u.city || "BLR") !== filterCity) return false;
      return true;
    });
  }

  const filteredUsers = applyFilters(users);
  const activeFilterCount = [filterGender, filterDiet, filterDrinking, filterSmoking, filterActivity, filterRelType, filterDreams, filterFiveYear, filterWantInPartner, filterWhyLikeMe, filterProfession, filterDateCity, filterNeighborhoods].filter(v => v !== "all").length + (filterAgeMin ? 1 : 0) + (filterAgeMax ? 1 : 0);

  function clearAllFilters() {
    setSearchQuery("");
    setFilterGender("all");
    setFilterDiet("all");
    setFilterDrinking("all");
    setFilterSmoking("all");
    setFilterActivity("all");
    setFilterRelType("all");
    setFilterAgeMin("");
    setFilterAgeMax("");
    setFilterDreams("all");
    setFilterFiveYear("all");
    setFilterWantInPartner("all");
    setFilterWhyLikeMe("all");
    setFilterProfession("all");
    setFilterDateCity("all");
    setFilterNeighborhoods("all");
    setFilterCity("all");
  }

  async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
        ...options.headers,
      },
    });
    if (res.status === 401) {
      setAuthenticated(false);
      throw new Error("Unauthorized");
    }
    return res.json();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/users`);
      if (data.ok) {
        setAuthenticated(true);
        setUsers(data.users);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Invalid password");
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/users`);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/matches`);
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function loadUserMessages(userId: string) {
    try {
      const data = await fetchWithAuth(`${API_BASE}/messages/${userId}`);
      setSelectedUserMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(userId: string) {
    if (!newMessage.trim()) return;
    try {
      await fetchWithAuth(`${API_BASE}/messages`, {
        method: "POST",
        body: JSON.stringify({ userId, content: newMessage }),
      });
      setNewMessage("");
      loadUserMessages(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateMatchInterest(matchId: string, user: "user1" | "user2", interested: boolean) {
    try {
      await fetchWithAuth(`${API_BASE}/matches/${matchId}/interest`, {
        method: "PUT",
        body: JSON.stringify({ user, interested }),
      });
      loadMatches();
    } catch (err) {
      console.error(err);
    }
  }

  async function updateMatchStatus(matchId: string, status: string) {
    try {
      await fetchWithAuth(`${API_BASE}/matches/${matchId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      loadMatches();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteMatch(matchId: string) {
    if (!confirm("Delete this match?")) return;
    try {
      await fetchWithAuth(`${API_BASE}/matches/${matchId}`, { method: "DELETE" });
      loadMatches();
    } catch (err) {
      console.error(err);
    }
  }

  async function openMatchChat(matchId: string, userId: string, userName: string) {
    setSelectedMatchChat({ matchId, userId, userName });
    setMatchChatMessages([]);
    setMatchChatInput("");
    try {
      const data = await fetchWithAuth(`${API_BASE}/match-messages/${matchId}/${userId}`);
      if (data.ok) setMatchChatMessages(data.messages);
    } catch (err) {
      console.error("Failed to load match messages:", err);
    }
  }

  useEffect(() => {
    if (matchChatBottomRef.current) {
      matchChatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [matchChatMessages]);

  async function sendMatchChatMessage() {
    if (!matchChatInput.trim() || !selectedMatchChat || matchChatSending) return;
    setMatchChatSending(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/match-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatchChat.matchId, userId: selectedMatchChat.userId, content: matchChatInput.trim() }),
      });
      if (data.ok) {
        setMatchChatMessages((prev) => [...prev, data.message]);
        setMatchChatInput("");
      }
    } catch (err) {
      console.error("Failed to send match message:", err);
    } finally {
      setMatchChatSending(false);
    }
  }

  async function fetchMatchAvailability(matchId: string) {
    try {
      const data = await fetchWithAuth(`${API_BASE}/matches/${matchId}/availability`);
      setMatchAvailability((prev) => ({ ...prev, [matchId]: data }));
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    }
  }

  async function adminAddAvailability(matchId: string, userId: string, datesFree: string, timesFree: string, neighborhoods: string) {
    try {
      await fetchWithAuth(`${API_BASE}/matches/${matchId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, datesFree, timesFree, neighborhoods }),
      });
      const formKey = `${matchId}_${userId}`;
      setAddAvailForm((prev) => {
        const copy = { ...prev };
        delete copy[formKey];
        return copy;
      });
      fetchMatchAvailability(matchId);
    } catch (err) {
      console.error("Failed to add availability:", err);
      alert("Failed to add availability");
    }
  }

  async function createMatch() {
    if (!createMatchUser1 || !createMatchUser2) {
      alert("Select both users");
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE}/matches`, {
        method: "POST",
        body: JSON.stringify({ user1Id: createMatchUser1, user2Id: createMatchUser2 }),
      });
      if (res.ok) {
        loadMatches();
        setCreateMatchUser1("");
        setCreateMatchUser2("");
        setSearch1("");
        setSearch2("");
      } else {
        alert(res.error || "Failed to create match");
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (authenticated) {
      if (tab === "users") loadUsers();
      else if (tab === "matches") loadMatches();
      else if (tab === "messages") loadMessages();
    }
  }, [authenticated, tab]);

  async function loadFullUser(userId: string) {
    try {
      const data = await fetchWithAuth(`${API_BASE}/users/${userId}`);
      if (data.ok && data.user) {
        setSelectedUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGetToKnowMessages(userId: string) {
    setLoadingGetToKnow(true);
    setShowGetToKnow(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/users/${userId}/get-to-know`);
      setGetToKnowMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGetToKnow(false);
    }
  }

  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete ${userName}? This will permanently remove their profile, photos, matches, and messages. This cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedUser(null);
        loadUsers();
      } else {
        alert(res.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  }

  async function downloadMatchCsv() {
    try {
      const res = await fetch(`${API_BASE}/matches/export/csv`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hogu-matches-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download match data");
    }
  }

  async function downloadCsv() {
    try {
      const res = await fetch(`${API_BASE}/users/export/csv`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hogu-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download spreadsheet");
    }
  }

  async function handleViewUser(user: DatingUser) {
    setSelectedUser(user);
    loadFullUser(user.id);
  }

  async function goToUserConversation(userId: string) {
    setTab("users");
    await loadFullUser(userId);
  }

  useEffect(() => {
    if (selectedUser) {
      loadUserMessages(selectedUser.id);
    }
  }, [selectedUser?.id]);

  if (!authenticated) {
    return (
      <div className="admin-portal">
        <div className="admin-login">
          <h1>Hogu Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
        <style>{adminCss}</style>
      </div>
    );
  }

  return (
    <div className="admin-portal">
      <header className="admin-header">
        <h1>Hogu Admin</h1>
        <nav>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
            Users
          </button>
          <button className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
            Matches
          </button>
          <button className={tab === "messages" ? "active" : ""} onClick={() => setTab("messages")}>
            Messages
          </button>
        </nav>
      </header>

      <main className="admin-content">
        {loading && <p>Loading...</p>}

        {tab === "users" && !selectedUser && (
          <div className="users-list">
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button onClick={() => setFilterCity("all")} style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: filterCity === "all" ? "#e32995" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>All Cities</button>
              <button onClick={() => setFilterCity("BLR")} style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: filterCity === "BLR" ? "#e32995" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Bengaluru</button>
              <button onClick={() => setFilterCity("NYC")} style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: filterCity === "NYC" ? "#e32995" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>New York</button>
            </div>
            <div className="users-header">
              <h2>All Users ({users.length})</h2>
              <button className="export-btn" onClick={downloadCsv}>
                Download Spreadsheet
              </button>
                <button className="export-btn" onClick={downloadMatchCsv} style={{ marginLeft: "8px" }}>
                  Export Match Data
                </button>
            </div>

            <div className="filter-toolbar">
              <div className="filter-search-row">
                <input
                  type="text"
                  className="filter-search"
                  placeholder="Search by name, phone, Instagram, profession..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                </button>
                {activeFilterCount > 0 && (
                  <button className="filter-clear-btn" onClick={clearAllFilters}>Clear all</button>
                )}
              </div>

              {showFilters && (
                <div className="filter-panel">
                  <div className="filter-section">
                    <h4>Profile</h4>
                    <div className="filter-grid">
                      <label className="filter-item">
                        <span>Gender</span>
                        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                          <option value="all">All</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Relationship</span>
                        <select value={filterRelType} onChange={(e) => setFilterRelType(e.target.value)}>
                          <option value="all">All</option>
                          <option value="serious">Serious</option>
                          <option value="casual">Casual</option>
                          <option value="not_sure">Not sure</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Age min</span>
                        <input type="number" placeholder="e.g. 25" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} />
                      </label>
                      <label className="filter-item">
                        <span>Age max</span>
                        <input type="number" placeholder="e.g. 35" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Lifestyle</h4>
                    <div className="filter-grid">
                      <label className="filter-item">
                        <span>Diet</span>
                        <select value={filterDiet} onChange={(e) => setFilterDiet(e.target.value)}>
                          <option value="all">All</option>
                          <option value="VEG">Vegetarian</option>
                          <option value="EGG">Eggetarian</option>
                          <option value="NON_VEG">Non-Vegetarian</option>
                          <option value="VEGAN">Vegan</option>
                          <option value="JAIN">Jain</option>
                          <option value="_empty">Not specified</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Drinking</span>
                        <select value={filterDrinking} onChange={(e) => setFilterDrinking(e.target.value)}>
                          <option value="all">All</option>
                          <option value="NEVER">Never</option>
                          <option value="SOCIALLY">Socially</option>
                          <option value="OFTEN">Often</option>
                          <option value="_empty">Not specified</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Smoking</span>
                        <select value={filterSmoking} onChange={(e) => setFilterSmoking(e.target.value)}>
                          <option value="all">All</option>
                          <option value="NO">No</option>
                          <option value="SOCIALLY">Socially</option>
                          <option value="YES">Yes</option>
                          <option value="_empty">Not specified</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Activity</span>
                        <select value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)}>
                          <option value="all">All</option>
                          <option value="RARELY">Rarely</option>
                          <option value="SOMETIMES">Sometimes</option>
                          <option value="REGULAR">Regular</option>
                          <option value="ATHLETE">Athlete</option>
                          <option value="_empty">Not specified</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Profile Completion</h4>
                    <div className="filter-grid">
                      <label className="filter-item">
                        <span>Profession</span>
                        <select value={filterProfession} onChange={(e) => setFilterProfession(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Date City</span>
                        <select value={filterDateCity} onChange={(e) => setFilterDateCity(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Neighborhoods</span>
                        <select value={filterNeighborhoods} onChange={(e) => setFilterNeighborhoods(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Essays</h4>
                    <div className="filter-grid">
                      <label className="filter-item">
                        <span>Dreams</span>
                        <select value={filterDreams} onChange={(e) => setFilterDreams(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>5-Year Plan</span>
                        <select value={filterFiveYear} onChange={(e) => setFilterFiveYear(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Want in Partner</span>
                        <select value={filterWantInPartner} onChange={(e) => setFilterWantInPartner(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                      <label className="filter-item">
                        <span>Why They'd Like Me</span>
                        <select value={filterWhyLikeMe} onChange={(e) => setFilterWhyLikeMe(e.target.value)}>
                          <option value="all">All</option>
                          <option value="filled">Filled</option>
                          <option value="empty">Not filled</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {(searchQuery || activeFilterCount > 0) && (
                <div className="filter-results-count">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              )}
            </div>

            {(() => {
              const maleUsers = filteredUsers.filter((u) => (u.gender || "Male") === "Male");
              const femaleUsers = filteredUsers.filter((u) => (u.gender || "Male") === "Female");
              const renderUserTable = (userList: DatingUser[]) => (
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Phone</th>
                      <th>Profession</th>
                      <th>Diet</th>
                      <th>Looking for</th>
                      <th>City</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u) => {
                      return (
                      <tr key={u.id}>
                        <td>
                          {u.photos[0] && (
                            <img
                              src={`/api/images/storage/${u.photos[0].objectKey}`}
                              alt=""
                              className="thumb"
                            />
                          )}
                        </td>
                        <td>{u.name}</td>
                        <td>{u.dob ? getAge(u.dob) : "-"}</td>
                        <td>{u.phoneE164}</td>
                        <td>{u.profession || "-"}</td>
                        <td>{friendlyLabel(u.diet, DIET_LABELS)}</td>
                        <td><span className={`rel-badge rel-${u.relationshipType || "serious"}`}>{u.relationshipType === "casual" ? "Casual" : u.relationshipType === "not_sure" ? "Not sure" : "Serious"}</span></td>
                        <td>{u.dateCity || "-"}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => handleViewUser(u)}>View / Message</button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
              return (
                <>
                  <div className="gender-section">
                    <h3 className="gender-heading">Men ({maleUsers.length})</h3>
                    {maleUsers.length > 0 ? renderUserTable(maleUsers) : <p className="no-users">No male users</p>}
                  </div>
                  <div className="gender-section">
                    <h3 className="gender-heading">Women ({femaleUsers.length})</h3>
                    {femaleUsers.length > 0 ? renderUserTable(femaleUsers) : <p className="no-users">No female users</p>}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {tab === "users" && selectedUser && (
          <div className="user-detail">
            <div className="detail-actions">
              <button className="back-btn" onClick={() => { setSelectedUser(null); setShowGetToKnow(false); setGetToKnowMessages([]); }}>
                ← Back to Users
              </button>
              <button
                onClick={() => showGetToKnow ? setShowGetToKnow(false) : loadGetToKnowMessages(selectedUser.id)}
                style={{ background: "#1e1e2e", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
              >
                {showGetToKnow ? "Hide Get to Know Chat" : "Get to Know Chat"}
              </button>
              <button className="delete-btn" onClick={() => deleteUser(selectedUser.id, selectedUser.name)}>
                Delete User
              </button>
            </div>

            {showGetToKnow && (
              <div style={{ margin: "1rem 0", background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px", maxHeight: 400, overflowY: "auto" }}>
                <h4 style={{ margin: "0 0 12px", color: "#c9a84c", fontSize: "0.9rem" }}>Get to Know Conversation</h4>
                {loadingGetToKnow && <p style={{ color: "#a3a3a3" }}>Loading...</p>}
                {!loadingGetToKnow && getToKnowMessages.length === 0 && (
                  <p style={{ color: "#a3a3a3", fontSize: "0.85rem" }}>No conversation yet.</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {getToKnowMessages.map((msg) => {
                    const isAgent = msg.role === "agent";
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isAgent ? "flex-start" : "flex-end" }}>
                        <div style={{
                          maxWidth: "75%",
                          padding: "8px 12px",
                          borderRadius: isAgent ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                          background: isAgent ? "#1e1e2e" : "#c9a84c",
                          color: isAgent ? "#e5e5e5" : "#0f0f0f",
                          fontSize: "0.82rem",
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                        }}>
                          <div style={{ fontSize: "0.7rem", marginBottom: 4, opacity: 0.6 }}>
                            {isAgent ? "Matchmaker" : selectedUser.name} · {new Date(msg.createdAt).toLocaleString()}
                          </div>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="user-profile">
              <h2>{selectedUser.name} <span style={{ display: "inline-block", fontSize: "13px", padding: "3px 10px", borderRadius: "6px", background: (selectedUser.city || "BLR") === "NYC" ? "#3b82f6" : "#e32995", color: "#fff", fontWeight: 600, verticalAlign: "middle", marginLeft: "8px" }}>{(selectedUser.city || "BLR") === "NYC" ? "New York" : "Bengaluru"}</span></h2>
              <p className="user-phone">{selectedUser.phoneE164}</p>
              
              <div className="photos-row">
                {selectedUser.photos.map((p) => (
                  <img
                    key={p.objectKey}
                    src={`/api/images/storage/${p.objectKey}`}
                    alt=""
                    className="photo"
                  />
                ))}
              </div>

              <div className="profile-grid">
                <div className="profile-section">
                  <h4>Basic Info</h4>
                  <p><strong>Gender:</strong> {selectedUser.gender || "Male"}</p>
                  <p><strong>Profession:</strong> {selectedUser.profession || "-"}</p>
                  <p><strong>Date of Birth:</strong> {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : "-"}</p>
                  <p><strong>Height:</strong> {selectedUser.height || "-"}</p>
                  <p><strong>Looking for:</strong> {selectedUser.relationshipType === "casual" ? "Casual dating" : selectedUser.relationshipType === "not_sure" ? "Not sure yet" : "Serious relationship"}</p>
                  <p><strong>Age preference:</strong> {selectedUser.agePreferenceMin || selectedUser.agePreferenceMax ? `${selectedUser.agePreferenceMin ?? "?"} – ${selectedUser.agePreferenceMax ?? "?"}` : "Not set"}</p>
                  <p><strong>Instagram:</strong> {selectedUser.instagramHandle ? `@${selectedUser.instagramHandle}` : "-"}</p>
                  <p><strong>Date City:</strong> {selectedUser.dateCity || "-"}</p>
                  <p><strong>Date Neighborhoods:</strong> {selectedUser.dateNeighborhoods || "-"}</p>
                </div>

                <div className="profile-section">
                  <h4>Lifestyle</h4>
                  <p><strong>Diet:</strong> {friendlyLabel(selectedUser.diet, DIET_LABELS)}</p>
                  <p><strong>Drinking:</strong> {friendlyLabel(selectedUser.drinking, DRINKING_LABELS)}</p>
                  <p><strong>Smoking:</strong> {friendlyLabel(selectedUser.smoking, SMOKING_LABELS)}</p>
                  <p><strong>Physical Activity:</strong> {friendlyLabel(selectedUser.physicalActivity, ACTIVITY_LABELS)}</p>
                  <p><strong>Date Budget:</strong> {selectedUser.dateBudget || "-"}</p>
                </div>

                <div className="profile-section">
                  <h4>Interests</h4>
                  <p><strong>Cuisines:</strong> {selectedUser.cuisines?.join(", ") || "-"}</p>
                  <p><strong>First Date Ideas:</strong> {selectedUser.firstDateTypes?.join(", ") || "-"}</p>
                  <p><strong>Interests:</strong> {selectedUser.interests?.join(", ") || "-"}</p>
                  <p><strong>Languages:</strong> {selectedUser.languages?.join(", ") || "-"}</p>
                </div>
              </div>

              <div className="profile-essays">
                <div className="essay">
                  <h4>Dreams</h4>
                  <p>{selectedUser.dreams || "-"}</p>
                </div>
                <div className="essay">
                  <h4>Five Year Goal</h4>
                  <p>{selectedUser.fiveYearGoal || "-"}</p>
                </div>
                <div className="essay">
                  <h4>What I Want in a Partner</h4>
                  <p>{selectedUser.whatIWantInPartner || "-"}</p>
                </div>
                <div className="essay">
                  <h4>Why My Partner Would Like Me</h4>
                  <p>{selectedUser.whyPartnerWouldLikeMe || "-"}</p>
                </div>
                <div className="essay">
                  <h4>My Day Looks Like</h4>
                  <p>{selectedUser.myDayLooksLike || "-"}</p>
                </div>
                <div className="essay">
                  <h4>Ideal First Date</h4>
                  <p>{selectedUser.idealFirstDate || "-"}</p>
                </div>
                <div className="essay">
                  <h4>Non-Negotiables</h4>
                  <p>{selectedUser.nonNegotiables || "-"}</p>
                </div>
              </div>
            </div>

            <div className="messages-section">
              <h3>Messages with {selectedUser.name}</h3>
              <div className="messages-list">
                {selectedUserMessages.map((m) => (
                  <div key={m.id} className={`message ${m.fromAdmin ? "from-admin" : "from-user"}`}>
                    <span className="sender">{m.fromAdmin ? "Admin" : selectedUser.name}</span>
                    <p>{m.content}</p>
                    <span className="time">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="send-message">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button onClick={() => sendMessage(selectedUser.id)}>Send</button>
              </div>
            </div>
          </div>
        )}

        {tab === "matches" && (
          <div className="matches-section">
            <h2>Matches ({matches.length})</h2>

            {selectedMatchChat && (
              <div style={{ background: "#12121f", border: "1px solid #e879a8", borderRadius: 12, padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0, color: "#e879a8" }}>Chat with {selectedMatchChat.userName}</h3>
                  <button onClick={() => setSelectedMatchChat(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "18px" }}>✕</button>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem", background: "#0a0a14", borderRadius: 8, padding: "0.75rem" }}>
                  {matchChatMessages.length === 0 && (
                    <p style={{ color: "#666", fontSize: "0.85rem", textAlign: "center", margin: "0.75rem 0" }}>No messages yet</p>
                  )}
                  {matchChatMessages.map((msg) => (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.fromAdmin ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "80%",
                        background: msg.fromAdmin ? "#e879a8" : "#1e1e2f",
                        color: msg.fromAdmin ? "#0f0f0f" : "#fff",
                        borderRadius: msg.fromAdmin ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                      }}>
                        {!msg.fromAdmin && <div style={{ fontSize: "0.7rem", color: "#a78bfa", marginBottom: "0.2rem", fontWeight: 600 }}>{selectedMatchChat.userName}</div>}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={matchChatBottomRef} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={matchChatInput}
                    onChange={(e) => setMatchChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMatchChatMessage(); } }}
                    placeholder={`Message ${selectedMatchChat.userName}...`}
                    style={{ flex: 1, background: "#1a1a2e", border: "1px solid #555", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#fff", fontSize: "0.875rem", outline: "none" }}
                  />
                  <button
                    onClick={sendMatchChatMessage}
                    disabled={matchChatSending || !matchChatInput.trim()}
                    style={{ background: "#e879a8", color: "#0f0f0f", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", opacity: matchChatSending || !matchChatInput.trim() ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            <div className="create-match">
              <h3>Create New Match</h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {[
                  { label: "User 1", search: search1, setSearch: setSearch1, selected: createMatchUser1, setSelected: setCreateMatchUser1, show: showDropdown1, setShow: setShowDropdown1 },
                  { label: "User 2", search: search2, setSearch: setSearch2, selected: createMatchUser2, setSelected: setCreateMatchUser2, show: showDropdown2, setShow: setShowDropdown2 },
                ].map((field) => {
                  const selectedUser = users.find((u) => u.id === field.selected);
                  const filtered = field.search.trim().length > 0
                    ? users.filter((u) => {
                        const q = field.search.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.phoneE164.includes(q);
                      }).slice(0, 10)
                    : [];
                  return (
                    <div key={field.label} style={{ position: "relative", flex: "1", minWidth: "220px" }}>
                      <label style={{ display: "block", fontSize: "13px", marginBottom: "4px", color: "#ccc" }}>{field.label}</label>
                      {selectedUser ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2a2a3a", border: "1px solid #555", borderRadius: "8px", padding: "8px 12px" }}>
                          <span style={{ flex: 1 }}>
                            <strong>{selectedUser.name}</strong>{" "}
                            <span style={{ fontSize: "12px", color: "#aaa" }}>
                              {selectedUser.gender === "Female" ? "F" : "M"} · {(selectedUser.city || "BLR") === "NYC" ? "NYC" : "BLR"}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => { field.setSelected(""); field.setSearch(""); }}
                            style={{ background: "none", border: "none", color: "#e879a8", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}
                          >✕</button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Type name or phone..."
                            value={field.search}
                            onChange={(e) => { field.setSearch(e.target.value); field.setShow(true); }}
                            onFocus={() => field.setShow(true)}
                            onBlur={() => setTimeout(() => field.setShow(false), 200)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #555", background: "#1a1a2e", color: "#fff", fontSize: "14px" }}
                          />
                          {field.show && filtered.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e1e2f", border: "1px solid #555", borderRadius: "8px", marginTop: "4px", maxHeight: "220px", overflowY: "auto", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                              {filtered.map((u) => (
                                <div
                                  key={u.id}
                                  onMouseDown={(e) => { e.preventDefault(); field.setSelected(u.id); field.setSearch(""); field.setShow(false); }}
                                  style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a3a")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span><strong>{u.name}</strong> <span style={{ fontSize: "12px", color: "#aaa" }}>{u.phoneE164}</span></span>
                                  <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: u.gender === "Female" ? "#e3299533" : "#3b82f633", color: u.gender === "Female" ? "#e879a8" : "#60a5fa" }}>
                                    {u.gender === "Female" ? "F" : "M"} · {(u.city || "BLR") === "NYC" ? "NYC" : "BLR"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {field.show && field.search.trim().length > 0 && filtered.length === 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e1e2f", border: "1px solid #555", borderRadius: "8px", marginTop: "4px", padding: "12px", color: "#888", textAlign: "center", zIndex: 50 }}>
                              No users found
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <button onClick={createMatch} style={{ alignSelf: "flex-end", marginBottom: "2px" }}>Create Match</button>
              </div>
            </div>

            {MATCH_STATUSES.map((status) => {
              const statusMatches = matches.filter((m) => m.status === status);
              if (statusMatches.length === 0) return null;
              return (
                <div key={status} className="status-group">
                  <h3>
                    {status} ({statusMatches.length})
                  </h3>
                  <table>
                    <thead>
                      <tr>
                        <th>User 1</th>
                        <th>User 2</th>
                        <th>Status</th>
                        <th>Interest</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusMatches.map((m) => {
                        const avail = matchAvailability[m.id];
                        const isScheduling = m.status === "SCHEDULING" || m.status === "CONFIRMED";
                        return (
                        <React.Fragment key={m.id}>
                        <tr>
                          <td>{m.user1?.name || "Unknown"}</td>
                          <td>{m.user2?.name || "Unknown"}</td>
                          <td>
                            <select
                              value={m.status}
                              onChange={(e) => updateMatchStatus(m.id, e.target.value)}
                            >
                              {MATCH_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="interest-toggles">
                              <button
                                className={`interest-btn ${m.user1Interested ? "interested" : ""}`}
                                onClick={() => updateMatchInterest(m.id, "user1", !m.user1Interested)}
                              >
                                {m.user1Interested ? "✓" : "✗"} {m.user1?.name || "U1"}
                              </button>
                              <button
                                className={`interest-btn ${m.user2Interested ? "interested" : ""}`}
                                onClick={() => updateMatchInterest(m.id, "user2", !m.user2Interested)}
                              >
                                {m.user2Interested ? "✓" : "✗"} {m.user2?.name || "U2"}
                              </button>
                            </div>
                          </td>
                          <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="delete-btn" onClick={() => deleteMatch(m.id)}>
                              Delete
                            </button>
                            {m.user1 && (
                              <button
                                className="avail-btn"
                                style={{ marginLeft: 4, fontSize: "11px", padding: "3px 8px" }}
                                onClick={() => openMatchChat(m.id, m.user1!.id, m.user1!.name)}
                              >
                                Chat {m.user1.name.split(" ")[0]}
                              </button>
                            )}
                            {m.user2 && (
                              <button
                                className="avail-btn"
                                style={{ marginLeft: 4, fontSize: "11px", padding: "3px 8px" }}
                                onClick={() => openMatchChat(m.id, m.user2!.id, m.user2!.name)}
                              >
                                Chat {m.user2.name.split(" ")[0]}
                              </button>
                            )}
                            {isScheduling && (
                              <button
                                className="avail-btn"
                                onClick={() => {
                                  if (expandedAvailMatch === m.id) {
                                    setExpandedAvailMatch(null);
                                  } else {
                                    setExpandedAvailMatch(m.id);
                                    if (!avail) fetchMatchAvailability(m.id);
                                  }
                                }}
                              >
                                {expandedAvailMatch === m.id ? "Hide" : "View"} Availability
                              </button>
                            )}
                          </td>
                        </tr>
                        {isScheduling && expandedAvailMatch === m.id && (
                          <tr>
                            <td colSpan={6}>
                              <div className="avail-panel">
                                {!avail ? (
                                  <p style={{ color: "#aaa" }}>Loading availability...</p>
                                ) : (
                                  <div className="avail-grid">
                                    {[
                                      { key: "user1", user: m.user1, entries: avail.user1Availability, filled: avail.user1Filled, userId: m.user1?.id },
                                      { key: "user2", user: m.user2, entries: avail.user2Availability, filled: avail.user2Filled, userId: m.user2?.id },
                                    ].map(({ key, user, entries, filled, userId }) => {
                                      const formKey = `${m.id}_${userId}`;
                                      const form = addAvailForm[formKey];
                                      return (
                                        <div className="avail-user-col" key={key}>
                                          <h4>{user?.name || key}</h4>
                                          {filled ? (
                                            entries.map((a) => (
                                              <div key={a.id} className="avail-card">
                                                <div><strong>Dates:</strong> {a.datesFree}</div>
                                                <div><strong>Times:</strong> {a.timesFree}</div>
                                                <div><strong>Neighborhoods:</strong> {a.neighborhoods}</div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="avail-pending">Not yet filled</p>
                                          )}
                                          {userId && (form ? (
                                            <div className="avail-add-form">
                                              <input placeholder="Dates free" value={form.datesFree} onChange={(e) => setAddAvailForm((prev) => ({ ...prev, [formKey]: { ...prev[formKey], datesFree: e.target.value } }))} />
                                              <input placeholder="Times free" value={form.timesFree} onChange={(e) => setAddAvailForm((prev) => ({ ...prev, [formKey]: { ...prev[formKey], timesFree: e.target.value } }))} />
                                              <input placeholder="Neighborhoods" value={form.neighborhoods} onChange={(e) => setAddAvailForm((prev) => ({ ...prev, [formKey]: { ...prev[formKey], neighborhoods: e.target.value } }))} />
                                              <div className="avail-form-actions">
                                                <button className="avail-save-btn" disabled={!form.datesFree.trim() || !form.timesFree.trim() || !form.neighborhoods.trim()} onClick={() => adminAddAvailability(m.id, userId, form.datesFree, form.timesFree, form.neighborhoods)}>Save</button>
                                                <button className="avail-cancel-btn" onClick={() => setAddAvailForm((prev) => { const copy = { ...prev }; delete copy[formKey]; return copy; })}>Cancel</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button className="avail-add-btn" onClick={() => setAddAvailForm((prev) => ({ ...prev, [formKey]: { userId, datesFree: "", timesFree: "", neighborhoods: "" } }))}>+ Add Availability</button>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <button className="avail-refresh" onClick={() => fetchMatchAvailability(m.id)}>
                                  Refresh
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {tab === "messages" && (
          <div className="all-messages">
            <h2>Recent Messages</h2>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>From</th>
                  <th>Message</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={m.read ? "" : "unread"}>
                    <td>{m.user?.name || "Unknown"}</td>
                    <td>{m.fromAdmin ? "Admin" : "User"}</td>
                    <td>{m.content.slice(0, 100)}...</td>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>
                      <button onClick={() => goToUserConversation(m.userId)}>Reply</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style>{adminCss}</style>
    </div>
  );
}

const adminCss = `
.admin-portal {
  min-height: 100vh;
  background: #0f1115;
  color: #eaeaea;
  font-family: system-ui, sans-serif;
}

.gender-section {
  margin-bottom: 32px;
}
.gender-heading {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e32995;
  color: #e32995;
}
.no-users {
  color: #888;
  font-style: italic;
  padding: 12px 0;
}

.admin-login {
  max-width: 320px;
  margin: 100px auto;
  text-align: center;
}
.admin-login h1 { margin-bottom: 24px; }
.admin-login input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: #fff;
}
.admin-login button {
  width: 100%;
  padding: 12px;
  background: #e32995;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.admin-login .error { color: #ff6b6b; margin-top: 12px; }

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}
.admin-header h1 { margin: 0; font-size: 20px; }
.admin-header nav { display: flex; gap: 8px; }
.admin-header button {
  padding: 8px 16px;
  background: transparent;
  color: #999;
  border: 1px solid #333;
  border-radius: 6px;
  cursor: pointer;
}
.admin-header button.active {
  background: #e32995;
  color: #fff;
  border-color: transparent;
}

.admin-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}
th { color: #999; font-weight: 600; }
.thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.back-btn {
  background: transparent;
  color: #e32995;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.user-profile { margin-bottom: 32px; }
.user-phone { color: #999; margin-bottom: 16px; }
.photos-row {
  display: flex;
  gap: 12px;
  margin: 16px 0 24px;
  flex-wrap: wrap;
}
.photo {
  width: 140px;
  height: 140px;
  border-radius: 12px;
  object-fit: cover;
}
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}
.profile-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}
.profile-section h4 {
  color: #E32995;
  margin: 0 0 12px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.profile-section p {
  margin: 8px 0;
  font-size: 14px;
  color: #ccc;
}
.profile-section p strong {
  color: #fff;
}
.profile-essays {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
.essay {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.essay h4 {
  color: #E32995;
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
}
.essay p {
  margin: 0;
  font-size: 14px;
  color: #ddd;
  line-height: 1.6;
  white-space: pre-wrap;
}

.messages-section { margin-top: 32px; }
.messages-list {
  max-height: 400px;
  overflow-y: auto;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.message {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
}
.message.from-admin {
  background: rgba(227, 41, 149, 0.2);
  margin-left: 40px;
}
.message.from-user {
  background: rgba(255, 255, 255, 0.1);
  margin-right: 40px;
}
.message .sender {
  font-weight: 600;
  font-size: 12px;
  color: #999;
}
.message p { margin: 4px 0; }
.message .time { font-size: 11px; color: #666; }

.send-message { display: flex; gap: 12px; }
.send-message textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: #fff;
  resize: vertical;
  min-height: 60px;
}
.send-message button {
  padding: 12px 24px;
  background: #e32995;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.create-match {
  background: #1a1a1a;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.create-match h3 { margin: 0; width: 100%; }
.create-match select {
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #0f1115;
  color: #fff;
  min-width: 200px;
}
.create-match button {
  padding: 8px 16px;
  background: #e32995;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.status-group {
  margin-bottom: 32px;
  background: #1a1a1a;
  padding: 16px;
  border-radius: 12px;
}
.status-group h3 { margin: 0 0 12px 0; }

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.users-header h2 { margin: 0; }
.export-btn {
  padding: 8px 16px;
  background: #2a7d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.export-btn:hover {
  background: #34a063;
}

.filter-toolbar {
  margin-bottom: 16px;
}
.filter-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a2e;
  color: #eee;
  font-size: 14px;
  outline: none;
}
.filter-search:focus {
  border-color: #e32995;
}
.filter-search::placeholder {
  color: #666;
}
.filter-toggle-btn {
  padding: 10px 16px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a2e;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.filter-toggle-btn.active {
  border-color: #e32995;
  color: #e32995;
}
.filter-badge {
  background: #e32995;
  color: #fff;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 99px;
  font-weight: 700;
}
.filter-clear-btn {
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #e32995;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.filter-clear-btn:hover {
  text-decoration: underline;
}
.filter-panel {
  margin-top: 12px;
  padding: 16px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 10px;
}
.filter-section {
  margin-bottom: 14px;
}
.filter-section:last-child {
  margin-bottom: 0;
}
.filter-section h4 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  font-weight: 700;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-item span {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
}
.filter-item select,
.filter-item input {
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #0f0f23;
  color: #eee;
  font-size: 13px;
  outline: none;
}
.filter-item select:focus,
.filter-item input:focus {
  border-color: #e32995;
}
.filter-results-count {
  margin-top: 10px;
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.delete-btn {
  background: #ff4444;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.rel-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.rel-serious {
  background: rgba(74, 144, 226, 0.2);
  color: #6cb4ee;
}
.rel-casual {
  background: rgba(255, 165, 0, 0.2);
  color: #ffa500;
}

.unread { background: rgba(227, 41, 149, 0.1); }

select {
  padding: 6px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
}

.interest-toggles {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.interest-btn {
  padding: 4px 10px;
  border: 1px solid #555;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  color: #999;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.interest-btn.interested {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border-color: #4CAF50;
}

.avail-btn {
  background: #FF9800;
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 6px;
  font-size: 12px;
  font-weight: 600;
}
.avail-btn:hover {
  background: #e68a00;
}

.avail-panel {
  background: rgba(255, 152, 0, 0.05);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.avail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.avail-user-col h4 {
  margin: 0 0 0.5rem;
  color: #FF9800;
  font-size: 0.95rem;
}

.avail-card {
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.6;
}

.avail-card strong {
  color: rgba(255,255,255,0.5);
}

.avail-pending {
  color: #ff6b6b;
  font-style: italic;
  font-size: 0.85rem;
}

.avail-refresh {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 0.75rem;
}
.avail-refresh:hover {
  background: rgba(255,255,255,0.2);
}

.avail-add-btn {
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
  border: 1px dashed rgba(255, 152, 0, 0.4);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 0.5rem;
  width: 100%;
}
.avail-add-btn:hover {
  background: rgba(255, 152, 0, 0.25);
}

.avail-add-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 0.5rem;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  padding: 0.5rem;
}
.avail-add-form input {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 13px;
}
.avail-add-form input::placeholder {
  color: rgba(255,255,255,0.35);
}
.avail-form-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.avail-save-btn {
  background: #FF9800;
  color: #000;
  border: none;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.avail-save-btn:hover {
  background: #e68a00;
}
.avail-cancel-btn {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.avail-cancel-btn:hover {
  background: rgba(255,255,255,0.2);
}
`;

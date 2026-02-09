import { useEffect, useState } from "react";

const API_BASE = "/api/dating/admin";

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
  cuisines?: string[];
  firstDateTypes?: string[];
  interests?: string[];
  languages?: string[];
  relationshipType?: string;
  agePreferenceMin?: number | null;
  agePreferenceMax?: number | null;
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
            <div className="users-header">
              <h2>All Users ({users.length})</h2>
              <button className="export-btn" onClick={downloadCsv}>
                Download Spreadsheet
              </button>
            </div>
            {(() => {
              const maleUsers = users.filter((u) => (u.gender || "Male") === "Male");
              const femaleUsers = users.filter((u) => (u.gender || "Male") === "Female");
              const renderUserTable = (userList: DatingUser[]) => (
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Profession</th>
                      <th>Height</th>
                      <th>Looking for</th>
                      <th>Age Pref</th>
                      <th>DOB</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u) => (
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
                        <td>{u.phoneE164}</td>
                        <td>{u.profession || "-"}</td>
                        <td>{u.height || "-"}</td>
                        <td><span className={`rel-badge rel-${u.relationshipType || "serious"}`}>{u.relationshipType === "casual" ? "Casual" : "Serious"}</span></td>
                        <td>{u.agePreferenceMin || u.agePreferenceMax ? `${u.agePreferenceMin ?? "?"}–${u.agePreferenceMax ?? "?"}` : "-"}</td>
                        <td>{u.dob ? new Date(u.dob).toLocaleDateString() : "-"}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => handleViewUser(u)}>View / Message</button>
                        </td>
                      </tr>
                    ))}
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
              <button className="back-btn" onClick={() => setSelectedUser(null)}>
                ← Back to Users
              </button>
              <button className="delete-btn" onClick={() => deleteUser(selectedUser.id, selectedUser.name)}>
                Delete User
              </button>
            </div>
            <div className="user-profile">
              <h2>{selectedUser.name}</h2>
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
                  <p><strong>Looking for:</strong> {selectedUser.relationshipType === "casual" ? "Casual dating" : "Serious relationship"}</p>
                  <p><strong>Age preference:</strong> {selectedUser.agePreferenceMin || selectedUser.agePreferenceMax ? `${selectedUser.agePreferenceMin ?? "?"} – ${selectedUser.agePreferenceMax ?? "?"}` : "Not set"}</p>
                  <p><strong>Instagram:</strong> {selectedUser.instagramHandle ? `@${selectedUser.instagramHandle}` : "-"}</p>
                </div>

                <div className="profile-section">
                  <h4>Lifestyle</h4>
                  <p><strong>Diet:</strong> {selectedUser.diet || "-"}</p>
                  <p><strong>Drinking:</strong> {selectedUser.drinking || "-"}</p>
                  <p><strong>Smoking:</strong> {selectedUser.smoking || "-"}</p>
                  <p><strong>Physical Activity:</strong> {selectedUser.physicalActivity || "-"}</p>
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

            <div className="create-match">
              <h3>Create New Match</h3>
              <select value={createMatchUser1} onChange={(e) => setCreateMatchUser1(e.target.value)}>
                <option value="">Select User 1</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phoneE164})
                  </option>
                ))}
              </select>
              <select value={createMatchUser2} onChange={(e) => setCreateMatchUser2(e.target.value)}>
                <option value="">Select User 2</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phoneE164})
                  </option>
                ))}
              </select>
              <button onClick={createMatch}>Create Match</button>
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
                      {statusMatches.map((m) => (
                        <tr key={m.id}>
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
                          </td>
                        </tr>
                      ))}
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
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={m.read ? "" : "unread"}>
                    <td>{m.user?.name || "Unknown"}</td>
                    <td>{m.fromAdmin ? "Admin" : "User"}</td>
                    <td>{m.content.slice(0, 100)}...</td>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
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
`;

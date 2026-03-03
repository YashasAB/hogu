import { useEffect, useRef, useState } from "react";

interface Message {
  id?: string;
  role: string;
  content: string;
  createdAt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GetToKnowChat({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dailyRemaining, setDailyRemaining] = useState<number>(5);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch("/api/dating/get-to-know/messages", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/dating/get-to-know/status", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(async ([msgs, status]) => {
        const loaded: Message[] = Array.isArray(msgs) ? msgs : [];
        setDailyRemaining(status.dailyRemaining ?? 5);
        if (loaded.length === 0) {
          try {
            const startRes = await fetch("/api/dating/get-to-know/start", {
              method: "POST",
              credentials: "include",
            });
            const startData = await startRes.json();
            if (startData.reply) {
              loaded.push({ role: "agent", content: startData.reply });
            }
          } catch (err) {
            console.error("[GetToKnowChat] start error:", err);
          }
        }
        setMessages(loaded);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || dailyRemaining <= 0) return;

    const optimisticMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/dating/get-to-know/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setDailyRemaining(0);
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: "You've used all 5 conversations for today. Come back tomorrow!" },
        ]);
        return;
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
      }
      setDailyRemaining(data.dailyRemaining ?? 0);
    } catch (err) {
      console.error("[GetToKnowChat] send error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const limitReached = dailyRemaining <= 0;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "min(420px, 100vw)",
      backgroundColor: "#0f0f0f",
      borderLeft: "1px solid #2a2a2a",
      display: "flex", flexDirection: "column",
      zIndex: 50,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid #2a2a2a",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Your Matchmaker</div>
          <div style={{
            fontSize: "0.75rem",
            color: limitReached ? "#ef4444" : "#a3a3a3",
            marginTop: 2,
          }}>
            {limitReached
              ? "Daily limit reached — come back tomorrow"
              : `${dailyRemaining} of 5 conversations remaining today`}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#a3a3a3",
            fontSize: "1.5rem", cursor: "pointer", lineHeight: 1, padding: 4,
          }}
        >×</button>
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {loading && (
          <div style={{ color: "#a3a3a3", textAlign: "center", marginTop: 32 }}>Loading...</div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ color: "#a3a3a3", textAlign: "center", marginTop: 32, lineHeight: 1.6 }}>
            Starting your conversation...
          </div>
        )}
        {messages.map((msg, i) => {
          const isAgent = msg.role === "agent";
          return (
            <div key={msg.id ?? i} style={{
              display: "flex",
              justifyContent: isAgent ? "flex-start" : "flex-end",
            }}>
              <div style={{
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: isAgent ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                backgroundColor: isAgent ? "#1e1e2e" : "#c9a84c",
                color: isAgent ? "#e5e5e5" : "#0f0f0f",
                fontSize: "0.875rem",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "12px 20px 20px",
        borderTop: "1px solid #2a2a2a",
        flexShrink: 0,
      }}>
        {limitReached ? (
          <div style={{
            textAlign: "center", color: "#a3a3a3", fontSize: "0.85rem",
            padding: "12px 0",
          }}>
            You've used all 5 conversations for today. Come back tomorrow!
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={2}
              disabled={sending}
              style={{
                flex: 1,
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#fff",
                padding: "10px 12px",
                fontSize: "0.875rem",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{
                backgroundColor: sending || !input.trim() ? "#2a2a2a" : "#c9a84c",
                color: sending || !input.trim() ? "#666" : "#0f0f0f",
                border: "none",
                borderRadius: 8,
                padding: "0 16px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

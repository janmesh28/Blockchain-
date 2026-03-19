import { useState, useEffect, useRef } from "react";

// ─── Blockchain Core ──────────────────────────────────────────────────────────

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function mineBlock(data, previousHash, difficulty = 3) {
  let nonce = 0;
  let hash = "";
  const prefix = "0".repeat(difficulty);
  while (true) {
    const raw = JSON.stringify(data) + previousHash + nonce;
    hash = await sha256(raw);
    if (hash.startsWith(prefix)) break;
    nonce++;
  }
  return { hash, nonce };
}

async function createBlock(data, previousHash, index, difficulty = 3) {
  const timestamp = Date.now();
  const { hash, nonce } = await mineBlock(
    { ...data, timestamp, index },
    previousHash,
    difficulty
  );
  return { index, timestamp, data, previousHash, hash, nonce };
}

// ─── Candidates ───────────────────────────────────────────────────────────────

const CANDIDATES = [
  { id: "A", name: "Alexandra Chen", party: "Progressive Alliance", color: "#4ade80", icon: "🌿" },
  { id: "B", name: "Marcus Rivera", party: "Liberty Union", color: "#60a5fa", icon: "🦅" },
  { id: "C", name: "Priya Nair", party: "Future Coalition", color: "#f472b6", icon: "⚡" },
];

const STEPS = [
  { id: 1, label: "Welcome", icon: "🏛️" },
  { id: 2, label: "Register", icon: "🪪" },
  { id: 3, label: "Vote", icon: "🗳️" },
  { id: 4, label: "Mining", icon: "⛏️" },
  { id: 5, label: "Ledger", icon: "📜" },
  { id: 6, label: "Results", icon: "📊" },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function BlockchainVoting() {
  const [step, setStep] = useState(1);
  const [voterID, setVoterID] = useState("");
  const [voterName, setVoterName] = useState("");
  const [registered, setRegistered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [chain, setChain] = useState([]);
  const [genesis, setGenesis] = useState(null);
  const [miningStatus, setMiningStatus] = useState("");
  const [miningDone, setMiningDone] = useState(false);
  const [voters, setVoters] = useState([]);
  const [animHash, setAnimHash] = useState("");
  const [hashAnim, setHashAnim] = useState(false);
  const intervalRef = useRef(null);

  // Init genesis block
  useEffect(() => {
    (async () => {
      const g = await createBlock({ type: "GENESIS", message: "Let democracy prevail." }, "0000000000000000", 0);
      setGenesis(g);
      setChain([g]);
    })();
  }, []);

  // Hash animation
  useEffect(() => {
    if (hashAnim) {
      intervalRef.current = setInterval(() => {
        setAnimHash(
          Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
        );
      }, 60);
      return () => clearInterval(intervalRef.current);
    }
  }, [hashAnim]);

  const handleRegister = () => {
    if (!voterID.trim() || !voterName.trim()) return;
    if (voters.find((v) => v.id === voterID)) {
      alert("Voter ID already registered!");
      return;
    }
    const reg = { id: voterID, name: voterName, timestamp: new Date().toLocaleTimeString() };
    setRegistered(reg);
    setVoters((v) => [...v, reg]);
    setStep(3);
  };

  const handleVote = async () => {
    if (!selected) return;
    setStep(4);
    setMiningStatus("Preparing transaction...");
    setMiningDone(false);
    setHashAnim(true);

    await new Promise((r) => setTimeout(r, 800));
    setMiningStatus("Broadcasting to network nodes...");
    await new Promise((r) => setTimeout(r, 800));
    setMiningStatus("Running Proof-of-Work (difficulty: 3)...");
    await new Promise((r) => setTimeout(r, 400));

    const voteData = {
      type: "VOTE",
      voterID: registered.id,
      voterName: registered.name,
      candidateID: selected,
      candidateName: CANDIDATES.find((c) => c.id === selected).name,
    };

    const prevHash = chain[chain.length - 1].hash;
    const newBlock = await createBlock(voteData, prevHash, chain.length);

    setHashAnim(false);
    setAnimHash(newBlock.hash);
    setMiningStatus(`✅ Block #${newBlock.index} mined! Nonce: ${newBlock.nonce}`);
    setChain((c) => [...c, newBlock]);
    setMiningDone(true);
  };

  const getTally = () => {
    const tally = {};
    CANDIDATES.forEach((c) => (tally[c.id] = 0));
    chain.forEach((b) => {
      if (b.data.type === "VOTE") tally[b.data.candidateID]++;
    });
    return tally;
  };

  const totalVotes = chain.filter((b) => b.data.type === "VOTE").length;
  const tally = getTally();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #0a0a1a 100%)",
      fontFamily: "'Courier New', monospace",
      color: "#e2e8f0",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(99,255,180,0.15)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>⛓️</span>
          <span style={{ color: "#4ade80", fontWeight: "bold", fontSize: "14px", letterSpacing: "2px" }}>
            VOTECHAIN
          </span>
          <span style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "20px",
            letterSpacing: "1px",
          }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {STEPS.map((s) => (
            <div
              key={s.id}
              onClick={() => step > s.id && setStep(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                cursor: step > s.id ? "pointer" : "default",
                background: step === s.id
                  ? "rgba(74,222,128,0.15)"
                  : step > s.id
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
                border: step === s.id
                  ? "1px solid rgba(74,222,128,0.5)"
                  : "1px solid transparent",
                color: step === s.id ? "#4ade80" : step > s.id ? "#94a3b8" : "#334155",
                transition: "all 0.3s",
              }}
            >
              <span>{s.icon}</span>
              <span style={{ display: window.innerWidth > 600 ? "inline" : "none" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>

        {/* ── STEP 1: Welcome ── */}
        {step === 1 && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.6s ease" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>⛓️</div>
            <h1 style={{
              fontSize: "clamp(28px,5vw,48px)",
              fontWeight: "900",
              background: "linear-gradient(90deg, #4ade80, #60a5fa, #f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px",
              letterSpacing: "3px",
            }}>BLOCKCHAIN VOTING</h1>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "40px", letterSpacing: "2px" }}>
              TRANSPARENT · IMMUTABLE · DECENTRALIZED
            </p>

            {/* How it works */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "40px",
              textAlign: "left",
            }}>
              {[
                { icon: "🪪", title: "1. Register", desc: "Get a unique cryptographic voter ID linked to your identity." },
                { icon: "🗳️", title: "2. Cast Vote", desc: "Select your candidate. Your vote becomes a transaction." },
                { icon: "⛏️", title: "3. Mining", desc: "Proof-of-Work algorithm mines your vote into a block." },
                { icon: "🔗", title: "4. Chained", desc: "Block is hashed and appended to the immutable ledger." },
              ].map((item) => (
                <div key={item.title} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "20px",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ color: "#4ade80", fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>{item.title}</div>
                  <div style={{ color: "#64748b", fontSize: "12px", lineHeight: "1.5" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Genesis block preview */}
            {genesis && (
              <div style={{
                background: "rgba(74,222,128,0.04)",
                border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "32px",
                textAlign: "left",
              }}>
                <div style={{ color: "#4ade80", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>
                  ✅ GENESIS BLOCK INITIALIZED
                </div>
                <div style={{ color: "#475569", fontSize: "11px", wordBreak: "break-all" }}>
                  Hash: <span style={{ color: "#94a3b8" }}>{genesis.hash}</span>
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)} style={btnStyle("#4ade80")}>
              BEGIN VOTING PROCESS →
            </button>
          </div>
        )}

        {/* ── STEP 2: Register ── */}
        {step === 2 && (
          <div style={{ maxWidth: "480px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
            <StepHeader icon="🪪" title="VOTER REGISTRATION" subtitle="Establish your cryptographic identity on the chain" />
            <div style={cardStyle}>
              <label style={labelStyle}>FULL NAME</label>
              <input
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="e.g. Jane Doe"
                style={inputStyle}
              />
              <label style={labelStyle}>VOTER ID</label>
              <input
                value={voterID}
                onChange={(e) => setVoterID(e.target.value)}
                placeholder="e.g. V-20240001"
                style={inputStyle}
              />
              <div style={{ color: "#475569", fontSize: "11px", marginBottom: "20px", lineHeight: "1.6" }}>
                🔒 Your identity will be hashed and stored on-chain. No personal data is exposed.
              </div>
              <button
                onClick={handleRegister}
                disabled={!voterID || !voterName}
                style={btnStyle("#4ade80", !voterID || !voterName)}
              >
                REGISTER ON BLOCKCHAIN →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Vote ── */}
        {step === 3 && registered && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <StepHeader icon="🗳️" title="CAST YOUR VOTE" subtitle={`Voting as: ${registered.name} (${registered.id})`} />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}>
              {CANDIDATES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    ...cardStyle,
                    cursor: "pointer",
                    border: selected === c.id
                      ? `2px solid ${c.color}`
                      : "1px solid rgba(255,255,255,0.06)",
                    background: selected === c.id
                      ? `rgba(${hexToRgb(c.color)},0.08)`
                      : "rgba(255,255,255,0.03)",
                    transform: selected === c.id ? "translateY(-4px)" : "none",
                    transition: "all 0.25s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {selected === c.id && (
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: c.color,
                      color: "#000",
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "2px 8px",
                      borderRadius: "20px",
                    }}>✓ SELECTED</div>
                  )}
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>{c.icon}</div>
                  <div style={{ color: c.color, fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>{c.name}</div>
                  <div style={{ color: "#475569", fontSize: "12px" }}>{c.party}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleVote}
                disabled={!selected}
                style={btnStyle("#60a5fa", !selected)}
              >
                SIGN & BROADCAST VOTE →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Mining ── */}
        {step === 4 && (
          <div style={{ maxWidth: "560px", margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
            <StepHeader icon="⛏️" title="MINING YOUR VOTE" subtitle="Proof-of-Work consensus in progress" />
            <div style={cardStyle}>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>LIVE HASH OUTPUT</div>
                <div style={{
                  background: "#000",
                  borderRadius: "8px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  wordBreak: "break-all",
                  color: hashAnim ? "#f59e0b" : "#4ade80",
                  minHeight: "42px",
                  transition: "color 0.5s",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {animHash || "Initializing..."}
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: miningDone ? "#4ade80" : "#f59e0b",
                  boxShadow: miningDone ? "0 0 10px #4ade80" : "0 0 10px #f59e0b",
                  animation: miningDone ? "none" : "pulse 1s infinite",
                }} />
                <span style={{ color: miningDone ? "#4ade80" : "#f59e0b", fontSize: "13px" }}>{miningStatus}</span>
              </div>

              {/* Mining visualization */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6px",
                marginBottom: "20px",
              }}>
                {["Validate Voter", "Build Tx", "Find Nonce", "Append Block"].map((s, i) => (
                  <div key={s} style={{
                    textAlign: "center",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    background: miningDone || (i < 3 && miningStatus.includes("Block"))
                      ? "rgba(74,222,128,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: miningDone || (i < 3 && miningStatus.includes("Block"))
                      ? "1px solid rgba(74,222,128,0.3)"
                      : "1px solid rgba(255,255,255,0.05)",
                    fontSize: "10px",
                    color: "#64748b",
                    transition: "all 0.5s",
                  }}>
                    {miningDone ? "✅" : "⏳"} {s}
                  </div>
                ))}
              </div>

              {miningDone && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#4ade80", fontSize: "13px", marginBottom: "16px" }}>
                    🎉 Vote successfully recorded on the blockchain!
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button onClick={() => { setStep(5); }} style={btnStyle("#94a3b8")}>
                      VIEW LEDGER
                    </button>
                    <button onClick={() => {
                      setVoterID(""); setVoterName(""); setRegistered(null); setSelected(null);
                      setMiningDone(false); setMiningStatus(""); setAnimHash("");
                      setStep(2);
                    }} style={btnStyle("#4ade80")}>
                      NEW VOTER
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5: Ledger ── */}
        {step === 5 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <StepHeader icon="📜" title="BLOCKCHAIN LEDGER" subtitle={`${chain.length} blocks · Immutable record`} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {chain.map((block, idx) => (
                <div key={block.hash} style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${block.data.type === "GENESIS" ? "#f59e0b" : "#4ade80"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <span style={{
                        background: block.data.type === "GENESIS" ? "rgba(245,158,11,0.15)" : "rgba(74,222,128,0.15)",
                        color: block.data.type === "GENESIS" ? "#f59e0b" : "#4ade80",
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        letterSpacing: "1px",
                      }}>
                        {block.data.type === "GENESIS" ? "⚡ GENESIS" : `🗳️ VOTE BLOCK`}
                      </span>
                    </div>
                    <span style={{ color: "#334155", fontSize: "11px" }}>Block #{block.index}</span>
                  </div>

                  {block.data.type === "VOTE" && (
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                        <b style={{ color: "#e2e8f0" }}>{block.data.voterName}</b> voted for{" "}
                        <b style={{ color: CANDIDATES.find((c) => c.id === block.data.candidateID)?.color }}>
                          {block.data.candidateName}
                        </b>
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: "10px", color: "#334155", wordBreak: "break-all", lineHeight: "1.7" }}>
                    <div>HASH: <span style={{ color: "#475569" }}>{block.hash}</span></div>
                    <div>PREV: <span style={{ color: "#334155" }}>{block.previousHash.slice(0, 32)}...</span></div>
                    <div>NONCE: <span style={{ color: "#475569" }}>{block.nonce}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep(6)} style={btnStyle("#f472b6")}>
                VIEW RESULTS →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Results ── */}
        {step === 6 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <StepHeader icon="📊" title="ELECTION RESULTS" subtitle={`${totalVotes} vote${totalVotes !== 1 ? "s" : ""} recorded on-chain`} />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
              {CANDIDATES.sort((a, b) => tally[b.id] - tally[a.id]).map((c, i) => {
                const pct = totalVotes > 0 ? Math.round((tally[c.id] / totalVotes) * 100) : 0;
                const isLeading = i === 0 && tally[c.id] > 0;
                return (
                  <div key={c.id} style={{ ...cardStyle, border: isLeading ? `1px solid ${c.color}40` : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ fontSize: "28px" }}>{c.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <div>
                            <span style={{ color: c.color, fontWeight: "bold", fontSize: "15px" }}>{c.name}</span>
                            {isLeading && (
                              <span style={{
                                marginLeft: "8px",
                                background: `${c.color}20`,
                                color: c.color,
                                fontSize: "10px",
                                padding: "1px 6px",
                                borderRadius: "10px",
                              }}>LEADING</span>
                            )}
                            <div style={{ color: "#475569", fontSize: "11px" }}>{c.party}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: c.color, fontSize: "22px", fontWeight: "bold" }}>{tally[c.id]}</div>
                            <div style={{ color: "#475569", fontSize: "11px" }}>{pct}%</div>
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)`,
                            borderRadius: "4px",
                            transition: "width 1s ease",
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              ...cardStyle,
              textAlign: "center",
              background: "rgba(74,222,128,0.04)",
              border: "1px solid rgba(74,222,128,0.15)",
            }}>
              <div style={{ color: "#4ade80", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
                🔒 CHAIN INTEGRITY VERIFIED
              </div>
              <div style={{ color: "#475569", fontSize: "12px" }}>
                {chain.length} blocks · SHA-256 hashed · Proof-of-Work consensus
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={() => setStep(2)} style={btnStyle("#4ade80")}>
                ADD ANOTHER VOTER →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: #334155; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepHeader({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "32px" }}>
      <div style={{ fontSize: "40px", marginBottom: "10px" }}>{icon}</div>
      <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: "bold", letterSpacing: "3px", marginBottom: "6px" }}>{title}</h2>
      <p style={{ color: "#475569", fontSize: "12px", letterSpacing: "1px" }}>{subtitle}</p>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "20px",
};

const labelStyle = {
  display: "block",
  color: "#475569",
  fontSize: "10px",
  letterSpacing: "2px",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "12px 14px",
  color: "#e2e8f0",
  fontSize: "13px",
  fontFamily: "monospace",
  marginBottom: "18px",
  outline: "none",
};

function btnStyle(color, disabled = false) {
  return {
    background: disabled ? "rgba(255,255,255,0.04)" : `rgba(${hexToRgb(color)},0.12)`,
    border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : color + "60"}`,
    color: disabled ? "#334155" : color,
    padding: "13px 28px",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold",
    letterSpacing: "2px",
    transition: "all 0.2s",
  };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

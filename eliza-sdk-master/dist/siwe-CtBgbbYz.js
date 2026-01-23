import { z as a } from "zod";
class p extends Error {
  isRetryable;
  details;
  constructor(e, t = !1, r) {
    super(e), this.name = this.constructor.name, this.isRetryable = t, this.details = r, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      isRetryable: this.isRetryable,
      ...this.details && { details: this.details }
    };
  }
}
class I extends p {
  code = "API_ERROR";
  statusCode;
  constructor(e, t = 500, r) {
    const n = t >= 500 && t < 600;
    super(e, n, r), this.statusCode = t;
  }
  static fromResponse(e, t) {
    const r = t?.message || t?.error || `API error (${e})`;
    return new I(r, e, t?.details);
  }
}
class G extends p {
  code = "NETWORK_ERROR";
  statusCode = 0;
  constructor(e = "Network request failed", t) {
    super(e, !0, t ? { cause: t.message } : void 0), t && (this.cause = t);
  }
}
class d extends p {
  code = "VALIDATION_ERROR";
  statusCode = 400;
  fieldErrors;
  constructor(e = "Validation failed", t = {}) {
    super(e, !1, { fieldErrors: t }), this.fieldErrors = t;
  }
  static fromFields(e) {
    const t = Object.keys(e), r = t.length > 0 ? `Validation failed for: ${t.join(", ")}` : "Validation failed";
    return new d(r, e);
  }
}
const i = {
  name: 100,
  bio: 500,
  maxBioEntries: 10,
  lore: 500,
  maxLoreEntries: 20,
  topic: 50,
  maxTopics: 30,
  adjective: 30,
  maxAdjectives: 20,
  styleRule: 200,
  maxStyleRules: 10,
  postExample: 280,
  maxPostExamples: 20,
  systemPrompt: 4e3,
  maxKnowledgeDocs: 5,
  maxKnowledgeSize: 51200
  // 50KB
}, v = a.object({
  name: a.string().min(1).max(i.name).trim()
}).passthrough(), y = a.object({
  role: a.enum(["user", "assistant"]),
  content: a.string().max(1e3)
}), R = a.object({
  all: a.array(a.string().max(i.styleRule)).max(i.maxStyleRules).optional(),
  chat: a.array(a.string().max(i.styleRule)).max(i.maxStyleRules).optional(),
  post: a.array(a.string().max(i.styleRule)).max(i.maxStyleRules).optional()
}), C = a.object({
  id: a.string(),
  path: a.string(),
  content: a.string()
}), w = a.array(a.string().max(i.bio)).min(1).max(i.maxBioEntries), S = a.array(a.string().max(i.lore)).max(i.maxLoreEntries), D = a.array(a.string().max(i.topic)).max(i.maxTopics), A = a.array(a.string().max(i.adjective)).max(i.maxAdjectives), $ = a.array(a.string().max(i.postExample)).max(i.maxPostExamples), b = a.array(C).max(i.maxKnowledgeDocs), q = a.object({
  name: a.string().min(1, "Name is required").max(i.name, "Name too long").trim(),
  personality: a.string().min(10, "Personality must be at least 10 characters").max(5e3).optional(),
  backstory: a.string().min(10, "Backstory must be at least 10 characters").max(1e4),
  systemPrompt: a.string().max(i.systemPrompt).optional(),
  exampleMessages: a.array(y).max(20).optional(),
  style: R.optional(),
  externalId: a.string().max(255).optional(),
  // Extended Eliza fields
  bio: w.optional(),
  lore: S.optional(),
  topics: D.optional(),
  adjectives: A.optional(),
  postExamples: $.optional(),
  knowledge: b.optional()
}), B = a.object({
  name: a.string().min(1).max(i.name).trim().optional(),
  personality: a.string().min(10).max(5e3).optional(),
  backstory: a.string().min(10).max(1e4).optional(),
  systemPrompt: a.string().max(i.systemPrompt).optional(),
  exampleMessages: a.array(y).max(20).optional(),
  style: R.optional(),
  // Extended Eliza fields
  bio: w.optional(),
  lore: S.optional(),
  topics: D.optional(),
  adjectives: A.optional(),
  postExamples: $.optional(),
  knowledge: b.optional()
});
function J(s) {
  const e = v.safeParse(s);
  if (!e.success) {
    const t = {};
    for (const r of e.error.issues) {
      const n = r.path.join(".");
      t[n] || (t[n] = []), t[n].push(r.message);
    }
    throw d.fromFields(t);
  }
  return e.data;
}
function Y(s) {
  const e = q.safeParse(s);
  if (!e.success) {
    const t = {};
    for (const r of e.error.issues) {
      const n = r.path.join(".");
      t[n] || (t[n] = []), t[n].push(r.message);
    }
    throw d.fromFields(t);
  }
  return e.data;
}
function Q(s) {
  const e = B.safeParse(s);
  if (!e.success) {
    const t = {};
    for (const r of e.error.issues) {
      const n = r.path.join(".");
      t[n] || (t[n] = []), t[n].push(r.message);
    }
    throw d.fromFields(t);
  }
  return e.data;
}
const j = /^0x[a-fA-F0-9]{40}$/, M = /^(.+) wants you to sign in with your Ethereum account:$/, N = "Version: 1", o = {
  uri: "URI: ",
  chainId: "Chain ID: ",
  nonce: "Nonce: ",
  issuedAt: "Issued At: ",
  expirationTime: "Expiration Time: ",
  notBefore: "Not Before: ",
  requestId: "Request ID: "
}, W = "Resources:", f = "- ";
function u(s, e) {
  if (!s)
    throw new Error(e);
}
function _(s, e) {
  if (!j.test(s))
    throw new Error(e);
}
function F(s, e) {
  return `Domain mismatch: expected ${s}, got ${e}`;
}
function k(s) {
  return new Date(s) < /* @__PURE__ */ new Date();
}
function L(s) {
  return new Date(s) > /* @__PURE__ */ new Date();
}
function Z(s) {
  const {
    domain: e,
    address: t,
    statement: r,
    uri: n,
    chainId: m,
    nonce: l,
    issuedAt: P = (/* @__PURE__ */ new Date()).toISOString(),
    expirationTime: x,
    notBefore: g,
    requestId: E,
    resources: h
  } = s;
  u(e, "domain is required"), u(t, "address is required"), u(n, "uri is required"), u(m, "chainId is required"), u(l, "nonce is required"), _(t, "Invalid Ethereum address format");
  const c = [
    `${e} wants you to sign in with your Ethereum account:`,
    t,
    ""
  ];
  if (r && c.push(r, ""), c.push(`${o.uri}${n}`), c.push(N), c.push(`${o.chainId}${m}`), c.push(`${o.nonce}${l}`), c.push(`${o.issuedAt}${P}`), x && c.push(`${o.expirationTime}${x}`), g && c.push(`${o.notBefore}${g}`), E && c.push(`${o.requestId}${E}`), h && h.length > 0) {
    c.push(W);
    for (const T of h)
      c.push(`${f}${T}`);
  }
  return c.join(`
`);
}
function ee(s, e) {
  try {
    const t = H(s);
    return e?.domain && t.domain !== e.domain ? {
      success: !1,
      error: F(e.domain, t.domain)
    } : e?.nonce && t.nonce !== e.nonce ? {
      success: !1,
      error: "Nonce mismatch"
    } : e?.checkExpiration && t.expirationTime && k(t.expirationTime) ? {
      success: !1,
      error: "Message has expired"
    } : t.notBefore && L(t.notBefore) ? {
      success: !1,
      error: "Message is not yet valid"
    } : {
      success: !0,
      address: t.address,
      fields: t
    };
  } catch (t) {
    return {
      success: !1,
      error: t instanceof Error ? t.message : "Failed to parse message"
    };
  }
}
function O(s) {
  const e = s.match(M);
  if (!e)
    throw new Error("Invalid SIWE header");
  return e[1];
}
function U(s) {
  if (!j.test(s))
    throw new Error("Invalid Ethereum address");
  return s;
}
function V(s, e) {
  const t = [];
  let r = e;
  for (; r < s.length && !s[r].startsWith(o.uri.trimEnd()); )
    s[r] && t.push(s[r]), r++;
  return t.length > 0 ? { statement: t.join(`
`), nextIndex: r } : { nextIndex: r };
}
function K(s, e, t) {
  const r = e[t];
  if (r.startsWith(o.uri)) {
    s.uri = r.slice(o.uri.length);
    return;
  }
  if (r.startsWith(o.chainId)) {
    s.chainId = parseInt(r.slice(o.chainId.length), 10);
    return;
  }
  if (r.startsWith(o.nonce)) {
    s.nonce = r.slice(o.nonce.length);
    return;
  }
  if (r.startsWith(o.issuedAt)) {
    s.issuedAt = r.slice(o.issuedAt.length);
    return;
  }
  if (r.startsWith(o.expirationTime)) {
    s.expirationTime = r.slice(o.expirationTime.length);
    return;
  }
  if (r.startsWith(o.notBefore)) {
    s.notBefore = r.slice(o.notBefore.length);
    return;
  }
  if (r.startsWith(o.requestId)) {
    s.requestId = r.slice(o.requestId.length);
    return;
  }
  if (r === W) {
    s.resources = [];
    for (let n = t + 1; n < e.length && e[n].startsWith(f); n++)
      s.resources.push(e[n].slice(f.length));
  }
}
function z(s) {
  if (!s.uri) throw new Error("Missing URI field");
  if (!s.chainId) throw new Error("Missing Chain ID field");
  if (!s.nonce) throw new Error("Missing Nonce field");
}
function H(s) {
  const e = s.split(`
`);
  if (e.length < 7)
    throw new Error("Invalid SIWE message format");
  const t = O(e[0]), r = U(e[1]), n = {
    domain: t,
    address: r,
    uri: "",
    chainId: 0,
    nonce: ""
  }, m = V(e, 3);
  m.statement && (n.statement = m.statement);
  for (let l = m.nextIndex; l < e.length; l++)
    K(n, e, l);
  return z(n), n;
}
function te(s = 16) {
  const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  if (typeof crypto < "u" && crypto.getRandomValues) {
    const r = new Uint8Array(s);
    crypto.getRandomValues(r);
    for (let n = 0; n < s; n++)
      t += e[r[n] % e.length];
  } else
    for (let r = 0; r < s; r++)
      t += e[Math.floor(Math.random() * e.length)];
  return t;
}
export {
  v as A,
  q as C,
  p as E,
  i as F,
  B as U,
  G as a,
  I as b,
  Y as c,
  Q as d,
  Z as e,
  ee as f,
  te as g,
  d as h,
  J as v
};
//# sourceMappingURL=siwe-CtBgbbYz.js.map

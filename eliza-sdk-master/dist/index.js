import { E as T, a as u, b as g, v as I, c as M, d as P } from "./siwe-CtBgbbYz.js";
import { A as et, C as st, h as rt, F as at, U as ot, e as nt, g as it, f as ct } from "./siwe-CtBgbbYz.js";
class $ extends T {
  code = "AUTH_ERROR";
  statusCode = 401;
  constructor(t = "Authentication failed") {
    super(t, !1);
  }
}
class A extends T {
  code = "RATE_LIMIT";
  statusCode = 429;
  retryAfter;
  constructor(t = "Rate limit exceeded", e) {
    super(t, !0, e ? { retryAfter: e } : void 0), this.retryAfter = e;
  }
  static fromHeaders(t) {
    const e = t.get("Retry-After"), s = e ? parseInt(e, 10) : void 0;
    return new A("Rate limit exceeded", s);
  }
}
const _ = 3e4, H = {
  maxRetries: 3,
  baseDelay: 1e3,
  retryServerErrors: !0
};
class U {
  baseUrl;
  timeout;
  retryConfig;
  getAuthHeader;
  constructor(t) {
    this.baseUrl = t.baseUrl.replace(/\/$/, ""), this.timeout = t.timeout ?? _, this.retryConfig = { ...H, ...t.retry }, this.getAuthHeader = t.getAuthHeader ?? (() => null);
  }
  setAuthHeaderProvider(t) {
    this.getAuthHeader = t;
  }
  async request(t, e = {}) {
    const { method: s = "GET", headers: r = {}, body: a, timeout: n, skipRetry: h = !1 } = e, c = `${this.baseUrl}${t.startsWith("/") ? t : `/${t}`}`, i = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...r
    }, f = this.getAuthHeader();
    f && (i.Authorization = f);
    const l = {
      method: s,
      headers: i,
      ...a !== void 0 && { body: JSON.stringify(a) }
    }, v = n ?? this.timeout;
    let w;
    const y = h ? 1 : this.retryConfig.maxRetries + 1;
    for (let d = 0; d < y; d++)
      try {
        const p = await this.fetchWithTimeout(c, l, v);
        return await this.handleResponse(p);
      } catch (p) {
        if (w = p, !this.shouldRetry(p, d))
          throw p;
        const C = this.calculateDelay(d);
        await this.sleep(C);
      }
    throw w;
  }
  async fetchWithTimeout(t, e, s) {
    const r = new AbortController(), a = setTimeout(() => r.abort(), s);
    try {
      return await fetch(t, {
        ...e,
        signal: r.signal
      });
    } catch (n) {
      throw n instanceof DOMException && n.name === "AbortError" ? new u("Request timed out") : new u(
        "Network request failed",
        n instanceof Error ? n : void 0
      );
    } finally {
      clearTimeout(a);
    }
  }
  async handleResponse(t) {
    if (t.status === 429)
      throw A.fromHeaders(t.headers);
    if (t.status === 401) {
      const s = await this.safeParseJSON(t);
      throw new $(s?.message || "Authentication failed");
    }
    if (!t.ok) {
      const s = await this.safeParseJSON(t);
      throw g.fromResponse(t.status, s ?? void 0);
    }
    const e = t.headers.get("Content-Type");
    if (t.status === 204 || !e?.includes("application/json"))
      return {};
    try {
      return await t.json();
    } catch {
      throw new g("Invalid JSON response", t.status);
    }
  }
  async safeParseJSON(t) {
    try {
      return await t.json();
    } catch {
      return null;
    }
  }
  shouldRetry(t, e) {
    return e >= this.retryConfig.maxRetries ? !1 : "isRetryable" in t && typeof t.isRetryable == "boolean" ? t instanceof A && t.retryAfter ? !0 : t instanceof g && t.statusCode >= 500 ? this.retryConfig.retryServerErrors : t.isRetryable : t instanceof u;
  }
  calculateDelay(t) {
    const e = this.retryConfig.baseDelay * Math.pow(2, t), s = Math.random() * 0.3 * e;
    return Math.min(e + s, 3e4);
  }
  sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
  // Convenience methods
  async get(t, e) {
    return this.request(t, { ...e, method: "GET" });
  }
  async post(t, e, s) {
    return this.request(t, { ...s, method: "POST", body: e });
  }
  async put(t, e, s) {
    return this.request(t, { ...s, method: "PUT", body: e });
  }
  async patch(t, e, s) {
    return this.request(t, { ...s, method: "PATCH", body: e });
  }
  async delete(t, e) {
    return this.request(t, { ...e, method: "DELETE" });
  }
}
const k = "eliza_auth_tokens", z = 5 * 60 * 1e3;
class N {
  apiKey;
  tokens;
  httpClient;
  refreshPromise;
  onTokenRefresh;
  onAuthRequired;
  constructor(t) {
    this.apiKey = t.apiKey, this.onTokenRefresh = t.onTokenRefresh, this.onAuthRequired = t.onAuthRequired, t.accessToken ? this.tokens = { accessToken: t.accessToken } : typeof window < "u" && this.loadFromStorage();
  }
  setHttpClient(t) {
    this.httpClient = t;
  }
  /**
   * Get the authorization header value
   */
  getAuthHeader() {
    return this.apiKey ? `Bearer ${this.apiKey}` : this.tokens?.accessToken ? `Bearer ${this.tokens.accessToken}` : null;
  }
  /**
   * Check if we have valid authentication
   */
  isAuthenticated() {
    return this.apiKey ? !0 : !(!this.tokens?.accessToken || this.tokens.expiresAt && Date.now() >= this.tokens.expiresAt);
  }
  /**
   * Check if token needs refresh
   */
  needsRefresh() {
    return this.apiKey || !this.tokens?.refreshToken || !this.tokens.expiresAt ? !1 : Date.now() >= this.tokens.expiresAt - z;
  }
  /**
   * Set tokens after successful authentication
   */
  setTokens(t) {
    this.tokens = t, this.saveToStorage(), this.onTokenRefresh?.(t);
  }
  /**
   * Clear all auth state
   */
  clearAuth() {
    this.tokens = void 0, this.clearStorage();
  }
  /**
   * Refresh the access token
   */
  async refreshTokens() {
    if (this.refreshPromise)
      return this.refreshPromise;
    if (!this.tokens?.refreshToken || !this.httpClient)
      throw this.onAuthRequired?.(), new Error("No refresh token available");
    this.refreshPromise = this.doRefresh();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = void 0;
    }
  }
  async doRefresh() {
    try {
      const t = await this.httpClient.post("/auth/refresh", {
        refreshToken: this.tokens.refreshToken
      }), e = {
        accessToken: t.accessToken,
        refreshToken: t.refreshToken || this.tokens.refreshToken,
        expiresAt: t.expiresIn ? Date.now() + t.expiresIn * 1e3 : this.tokens.expiresAt
      };
      this.setTokens(e);
    } catch {
      throw this.clearAuth(), this.onAuthRequired?.(), new Error("Token refresh failed");
    }
  }
  // SIWE Auth Flow Methods
  /**
   * Get nonce for SIWE authentication
   */
  async getNonce() {
    if (!this.httpClient)
      throw new Error("HTTP client not initialized");
    return this.httpClient.get("/auth/nonce");
  }
  /**
   * Verify SIWE message and signature
   */
  async verify(t, e, s) {
    if (!this.httpClient)
      throw new Error("HTTP client not initialized");
    const r = await this.httpClient.post("/auth/verify", { message: t, signature: e, sessionId: s }), a = {
      accessToken: r.token,
      refreshToken: r.refreshToken,
      expiresAt: r.expiresIn ? Date.now() + r.expiresIn * 1e3 : void 0
    };
    return this.setTokens(a), a;
  }
  // Storage Methods
  loadFromStorage() {
    try {
      const t = localStorage.getItem(k);
      t && (this.tokens = JSON.parse(t));
    } catch {
    }
  }
  saveToStorage() {
    if (!(typeof window > "u" || !this.tokens))
      try {
        localStorage.setItem(k, JSON.stringify(this.tokens));
      } catch {
      }
  }
  clearStorage() {
    if (!(typeof window > "u"))
      try {
        localStorage.removeItem(k);
      } catch {
      }
  }
}
function O() {
  return {
    fullContent: "",
    messageId: "",
    conversationId: "",
    aborted: !1,
    completed: !1
  };
}
function x(o, t) {
  return {
    id: t ?? o.messageId,
    role: "assistant",
    content: o.fullContent,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function R(o) {
  o && clearTimeout(o);
}
function D(o, t, e) {
  return R(o), setTimeout(e, t);
}
function S(o, t, e) {
  o.fullContent += e, t.onChunk(e);
}
function j(o, t, e) {
  if (!t.startsWith("data: "))
    return;
  const s = t.slice(6);
  if (s !== "[DONE]")
    try {
      const r = JSON.parse(s);
      if (r.token || r.content) {
        const a = r.token || r.content;
        S(o, e, a);
      }
      if (r.conversationId && (o.conversationId = r.conversationId), (r.messageId || r.id) && (o.messageId = r.messageId || r.id), r.done || r.type === "complete") {
        const a = x(o);
        e.onComplete(a, o.conversationId);
      }
    } catch {
      s.trim() && S(o, e, s);
    }
}
async function q(o, t, e) {
  const { url: s, getAuthHeader: r, timeout: a = 6e4 } = o, n = O(), h = new AbortController();
  let c;
  c = D(c, a, () => h.abort());
  try {
    const i = {
      "Content-Type": "application/json",
      Accept: "text/event-stream"
    }, f = r();
    f && (i.Authorization = f);
    const l = await fetch(s, {
      method: "POST",
      headers: i,
      body: JSON.stringify(t),
      signal: h.signal
    });
    if (!l.ok)
      throw g.fromResponse(l.status);
    if (!l.body)
      throw new u("No response body");
    const v = l.body.getReader(), w = new TextDecoder();
    for (; ; ) {
      const { done: y, value: d } = await v.read();
      if (y)
        break;
      const C = w.decode(d, { stream: !0 }).split(`
`);
      for (const b of C)
        j(n, b, e);
    }
    if (n.fullContent && !n.messageId) {
      const y = x(
        n,
        crypto.randomUUID?.() || Date.now().toString()
      );
      e.onComplete(y, n.conversationId);
    }
  } catch (i) {
    i instanceof DOMException && i.name === "AbortError" ? e.onError(new u("Stream timed out")) : i instanceof g ? e.onError(i) : e.onError(
      new u("Stream failed", i instanceof Error ? i : void 0)
    );
  } finally {
    R(c);
  }
}
class F {
  constructor(t, e) {
    this.http = t, this.getAuthHeader = e;
  }
  /**
   * Send a message and get the complete response
   */
  async sendMessage(t) {
    const { characterId: e, message: s, conversationId: r } = t, a = r ? `/characters/${e}/chat/${r}` : `/characters/${e}/chat`;
    return this.http.post(a, { message: s });
  }
  /**
   * Send a message and stream the response
   */
  async sendMessageStream(t, e) {
    const { characterId: s, message: r, conversationId: a } = t, n = this.http.baseUrl || "", h = a ? `/characters/${s}/chat/${a}/stream` : `/characters/${s}/chat/stream`, c = `${n}${h}`;
    await q(
      {
        url: c,
        getAuthHeader: this.getAuthHeader,
        timeout: 6e4
      },
      { message: r },
      e
    );
  }
  /**
   * Send a message to the builder chat (no character required).
   * Used for the character builder assistant.
   */
  async sendBuilderMessage(t) {
    return this.http.post("/chat/builder", t);
  }
}
function m(o) {
  const t = o.character, e = typeof t.backstory == "string" ? t.backstory : "", s = typeof t.personality == "string" ? t.personality : void 0, r = typeof t.systemPrompt == "string" ? t.systemPrompt : typeof t.system == "string" ? t.system : void 0, a = Array.isArray(t.exampleMessages) ? t.exampleMessages : void 0, n = Array.isArray(t.lore) ? t.lore : void 0, h = Array.isArray(t.adjectives) ? t.adjectives : void 0, c = Array.isArray(t.postExamples) ? t.postExamples : void 0, i = Array.isArray(t.knowledge) ? t.knowledge : void 0;
  return {
    id: o.id,
    name: t.name,
    externalId: o.externalId ?? void 0,
    personality: s,
    backstory: e,
    systemPrompt: r,
    exampleMessages: a,
    bio: t.bio,
    lore: n,
    topics: t.topics,
    adjectives: h,
    style: t.style,
    postExamples: c,
    knowledge: i,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}
function E(o) {
  return o.map((t) => [{ name: t.role, content: { text: t.content } }]);
}
class K {
  constructor(t) {
    this.http = t;
  }
  async listRecords(t = {}) {
    const { page: e = 1, pageSize: s = 20 } = t, r = typeof t.nftCollectionId == "string" ? t.nftCollectionId : void 0, a = new URLSearchParams();
    a.set("page", String(e)), a.set("pageSize", String(s)), r && a.set("nftCollectionId", r);
    const n = await this.http.get(`/characters?${a.toString()}`);
    return {
      items: n.characters,
      total: n.total,
      page: e,
      pageSize: s,
      hasMore: e * s < n.total
    };
  }
  async getRecord(t) {
    return this.http.get(`/characters/${t}`);
  }
  async createRecord(t) {
    const e = I(t.character), s = {
      externalId: t.externalId,
      character: e
    };
    return this.http.post("/characters", s);
  }
  async replaceRecord(t, e) {
    const r = {
      character: I(e.character)
    };
    return this.http.put(`/characters/${t}`, r);
  }
  async parseSummary(t) {
    return (await this.http.post(
      "/characters/parse-summary",
      t
    )).parsed;
  }
  /**
   * List all characters (with pagination)
   */
  async list(t = {}) {
    const { page: e = 1, pageSize: s = 20 } = t, r = await this.listRecords({ page: e, pageSize: s });
    return {
      items: r.items.map(m),
      total: r.total,
      page: r.page,
      pageSize: r.pageSize,
      hasMore: r.hasMore
    };
  }
  /**
   * Get a character by ID
   */
  async get(t) {
    const e = await this.getRecord(t);
    return m(e);
  }
  /**
   * Create a new character
   * If externalId is provided and a character with that externalId exists,
   * it will be updated instead (upsert behavior)
   */
  async create(t) {
    const e = M(t), s = {
      name: e.name,
      system: e.systemPrompt,
      bio: e.bio ?? (e.personality ? [e.personality] : void 0),
      topics: e.topics,
      style: e.style,
      knowledge: e.knowledge,
      messageExamples: e.exampleMessages ? E(e.exampleMessages) : void 0
    };
    s.backstory = e.backstory, e.personality !== void 0 && (s.personality = e.personality), e.systemPrompt !== void 0 && (s.systemPrompt = e.systemPrompt), e.exampleMessages !== void 0 && (s.exampleMessages = e.exampleMessages), e.lore !== void 0 && (s.lore = e.lore), e.adjectives !== void 0 && (s.adjectives = e.adjectives), e.postExamples !== void 0 && (s.postExamples = e.postExamples);
    const r = await this.createRecord({
      externalId: e.externalId,
      character: s
    });
    return m(r);
  }
  /**
   * Update an existing character
   */
  async update(t, e) {
    const s = P(e), a = { ...(await this.getRecord(t)).character };
    s.name !== void 0 && (a.name = s.name), s.backstory !== void 0 && (a.backstory = s.backstory), s.systemPrompt !== void 0 && (a.system = s.systemPrompt, a.systemPrompt = s.systemPrompt), s.personality !== void 0 && (a.personality = s.personality, s.bio === void 0 && (a.bio = [s.personality])), s.exampleMessages !== void 0 && (a.exampleMessages = s.exampleMessages, a.messageExamples = E(s.exampleMessages)), s.style !== void 0 && (a.style = s.style), s.bio !== void 0 && (a.bio = s.bio), s.lore !== void 0 && (a.lore = s.lore), s.topics !== void 0 && (a.topics = s.topics), s.adjectives !== void 0 && (a.adjectives = s.adjectives), s.postExamples !== void 0 && (a.postExamples = s.postExamples), s.knowledge !== void 0 && (a.knowledge = s.knowledge);
    const n = await this.replaceRecord(t, { character: a });
    return m(n);
  }
  /**
   * Delete a character
   */
  async delete(t) {
    await this.http.delete(`/characters/${t}`);
  }
  /**
   * Get a character by external ID
   * Useful for integrations that track characters by their own IDs
   */
  async getByExternalId(t) {
    try {
      const e = await this.http.get(
        `/characters/external/${encodeURIComponent(t)}`
      );
      return m(e);
    } catch (e) {
      if (e && typeof e == "object" && "statusCode" in e && e.statusCode === 404)
        return null;
      throw e;
    }
  }
  /**
   * Get a CharacterRecord by external ID
   * Returns the full record with AgentCharacter payload (canonical format)
   */
  async getRecordByExternalId(t) {
    try {
      return await this.http.get(
        `/characters/external/${encodeURIComponent(t)}`
      );
    } catch (e) {
      if (e && typeof e == "object" && "statusCode" in e && e.statusCode === 404)
        return null;
      throw e;
    }
  }
}
class L {
  constructor(t) {
    this.http = t;
  }
  /**
   * List all conversations for the authenticated user
   */
  async list(t = {}) {
    const { page: e = 1, pageSize: s = 20 } = t, r = await this.http.get(`/conversations?page=${e}&pageSize=${s}`);
    return {
      items: r.conversations.map((a) => this.mapConversation(a)),
      total: r.total,
      page: e,
      pageSize: s,
      hasMore: e * s < r.total
    };
  }
  /**
   * List conversations for a specific character
   */
  async listForCharacter(t, e = {}) {
    const { page: s = 1, pageSize: r = 20 } = e, a = await this.http.get(`/characters/${t}/conversations?page=${s}&pageSize=${r}`);
    return {
      items: a.conversations.map((n) => this.mapConversation(n)),
      total: a.total,
      page: s,
      pageSize: r,
      hasMore: s * r < a.total
    };
  }
  /**
   * Get a conversation with its message history
   */
  async get(t) {
    const e = await this.http.get(`/conversations/${t}`);
    return {
      id: e.id,
      characterId: e.characterId,
      characterName: "",
      // May not be available from this endpoint
      messageCount: e.messages.length,
      lastMessageAt: e.updatedAt,
      createdAt: e.createdAt,
      messages: e.messages
    };
  }
  /**
   * Delete a conversation and all its messages
   */
  async delete(t) {
    await this.http.delete(`/conversations/${t}`);
  }
  /**
   * Map API response to Conversation type
   */
  mapConversation(t) {
    return {
      id: t.id,
      characterId: t.characterId,
      characterName: "",
      // May need to be fetched separately
      messageCount: t.messageCount ?? 0,
      lastMessageAt: t.updatedAt,
      createdAt: t.createdAt
    };
  }
}
function J(o) {
  return o === "erc721" || o === "erc1155" || o === "unknown" ? o : "unknown";
}
function W(o) {
  return typeof o == "object" && o !== null && !Array.isArray(o);
}
class B {
  constructor(t) {
    this.http = t;
  }
  // Collections
  async listCollections(t = {}) {
    const { page: e = 1, pageSize: s = 20 } = t, r = await this.http.get(`/nft/collections?page=${e}&pageSize=${s}`), a = r.pagination?.total ?? 0;
    return {
      items: (r.collections ?? []).map((n) => this.mapCollection(n)),
      total: a,
      page: r.pagination?.page ?? e,
      pageSize: r.pagination?.pageSize ?? s,
      hasMore: e * s < a
    };
  }
  async getCollection(t) {
    const e = await this.http.get(`/nft/collections/${t}`);
    return this.mapCollection(e);
  }
  async upsertCollection(t) {
    const e = await this.http.post("/nft/collections", t);
    return this.mapCollection(e);
  }
  async updateCollection(t, e) {
    const s = await this.http.put(`/nft/collections/${t}`, e);
    return this.mapCollection(s);
  }
  async deleteCollection(t) {
    await this.http.delete(`/nft/collections/${t}`);
  }
  // Provisioning
  async provisionCharacter(t) {
    return this.http.post("/nft/provision", t);
  }
  // Token listing
  async listCollectionTokens(t) {
    const { collectionId: e, limit: s = 10, cursor: r, ownerAddress: a } = t, n = new URLSearchParams();
    return n.set("limit", String(s)), r && n.set("cursor", r), a && n.set("owner", a), this.http.get(
      `/nft/collections/${encodeURIComponent(e)}/tokens?${n.toString()}`
    );
  }
  mapCollection(t) {
    const e = W(t.config) ? t.config : void 0;
    return {
      id: t.id,
      chainId: t.chainId,
      contractAddress: t.contractAddress,
      name: t.name,
      tokenStandard: J(t.tokenStandard),
      ...e ? { config: e } : {},
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    };
  }
}
class Y {
  http;
  authManager;
  baseUrl;
  // Lazy-loaded namespaced APIs
  _characters;
  _chat;
  _conversations;
  _auth;
  _nft;
  constructor(t) {
    this.baseUrl = t.baseUrl.replace(/\/$/, ""), this.authManager = new N({
      apiKey: t.apiKey,
      accessToken: t.accessToken
    }), this.http = new U({
      baseUrl: this.baseUrl,
      timeout: t.timeout,
      retry: t.retry,
      getAuthHeader: () => this.authManager.getAuthHeader()
    }), this.authManager.setHttpClient(this.http);
  }
  /**
   * Verify the current credentials are valid
   */
  async verifyCredentials() {
    return this.http.get("/integration/verify");
  }
  /**
   * Check if the client is authenticated
   */
  isAuthenticated() {
    return this.authManager.isAuthenticated();
  }
  /**
   * Access auth methods
   */
  get auth() {
    return this._auth || (this._auth = new G(this.authManager)), this._auth;
  }
  /**
   * Access characters API
   */
  get characters() {
    return this._characters || (this._characters = new K(this.http)), this._characters;
  }
  /**
   * Access chat API
   */
  get chat() {
    return this._chat || (this._chat = new F(this.http, () => this.authManager.getAuthHeader())), this._chat;
  }
  /**
   * Access conversations API
   */
  get conversations() {
    return this._conversations || (this._conversations = new L(this.http)), this._conversations;
  }
  /**
   * Access NFT API (collections + provisioning)
   */
  get nft() {
    return this._nft || (this._nft = new B(this.http)), this._nft;
  }
  /**
   * Get the underlying HTTP client (for advanced usage)
   */
  getHttpClient() {
    return this.http;
  }
}
class G {
  constructor(t) {
    this.authManager = t;
  }
  /**
   * Get a nonce for SIWE authentication
   */
  async getNonce() {
    return this.authManager.getNonce();
  }
  /**
   * Verify SIWE message and signature
   */
  async verify(t, e, s) {
    return this.authManager.verify(t, e, s);
  }
  /**
   * Refresh the access token
   */
  async refresh() {
    return this.authManager.refreshTokens();
  }
  /**
   * Clear authentication state
   */
  logout() {
    this.authManager.clearAuth();
  }
  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.authManager.isAuthenticated();
  }
}
function Q(o) {
  return o instanceof T;
}
const X = "0.1.0";
export {
  et as AgentCharacterSchema,
  K as CharactersAPI,
  F as ChatAPI,
  L as ConversationsAPI,
  st as CreateCharacterInputSchema,
  g as ElizaAPIError,
  $ as ElizaAuthError,
  Y as ElizaClient,
  T as ElizaError,
  u as ElizaNetworkError,
  A as ElizaRateLimitError,
  rt as ElizaValidationError,
  at as FIELD_LIMITS,
  B as NftAPI,
  ot as UpdateCharacterInputSchema,
  X as VERSION,
  nt as createSIWEMessage,
  it as generateNonce,
  Q as isElizaError,
  I as validateAgentCharacter,
  M as validateCreateCharacter,
  P as validateUpdateCharacter,
  ct as verifySIWEMessage
};
//# sourceMappingURL=index.js.map

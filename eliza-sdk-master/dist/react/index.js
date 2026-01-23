import { jsx as u, jsxs as A, Fragment as ye } from "react/jsx-runtime";
import { createContext as ze, useMemo as J, useContext as pe, useState as T, useRef as H, useEffect as G, useCallback as B, createElement as We } from "react";
import { b as Q, a as re, e as Ge, F as R, c as Me, h as Pe } from "../siwe-CtBgbbYz.js";
function P(...e) {
  return e.filter((t) => !!t).join(" ");
}
function K(e, t = "Unexpected error") {
  return e instanceof Error ? e : typeof e == "string" ? new Error(e) : new Error(t);
}
function ne(e) {
  return { "data-eliza-component": e };
}
function j(e) {
  return { "data-eliza-slot": e };
}
function $t(e, t) {
  return t ? { "data-eliza-component": e, "data-eliza-slot": t } : { "data-eliza-component": e };
}
const Ae = ze(null);
function Rt({ transport: e, children: t }) {
  const s = J(() => ({ transport: e }), [e]);
  return /* @__PURE__ */ u(Ae.Provider, { value: s, children: t });
}
function Z() {
  return pe(Ae);
}
function Ke() {
  const e = Z();
  if (!e)
    throw new Error("useEliza must be used within an ElizaProvider");
  return e;
}
function Bt() {
  return Ke().transport;
}
function jt(e) {
  return {
    auth: {
      getNonce: () => e.auth.getNonce(),
      verify: (t, s, l) => e.auth.verify(t, s, l)
    },
    characters: {
      listRecords: (t) => e.characters.listRecords(t),
      getRecord: (t) => e.characters.getRecord(t),
      createRecord: (t) => e.characters.createRecord(t),
      replaceRecord: (t, s) => e.characters.replaceRecord(t, s),
      parseSummary: (t) => e.characters.parseSummary(t)
    },
    chat: {
      sendMessageStream: (t, s) => e.chat.sendMessageStream(t, s),
      sendBuilderMessage: (t) => e.chat.sendBuilderMessage(t)
    },
    conversations: {
      list: (t) => e.conversations.list(t),
      listForCharacter: (t, s) => e.conversations.listForCharacter(t, s),
      get: (t) => e.conversations.get(t),
      delete: (t) => e.conversations.delete(t)
    },
    nft: {
      listCollections: (t) => e.nft.listCollections(t),
      getCollection: (t) => e.nft.getCollection(t),
      upsertCollection: (t) => e.nft.upsertCollection(t),
      updateCollection: (t, s) => e.nft.updateCollection(t, s),
      deleteCollection: (t) => e.nft.deleteCollection(t),
      provisionCharacter: (t) => e.nft.provisionCharacter(t),
      listCollectionTokens: (t) => e.nft.listCollectionTokens(t)
    }
  };
}
function ie(e) {
  return typeof e == "object" && e !== null;
}
function W(e) {
  return typeof e == "string" ? e : null;
}
function de(e) {
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
function Je(e, t) {
  return {
    id: e,
    role: "assistant",
    content: t,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Qe() {
  const e = globalThis.crypto;
  return e?.randomUUID ? e.randomUUID() : `msg-${Date.now()}`;
}
function Ye(e) {
  const t = W(e.token);
  if (t !== null) return t;
  const s = W(e.content);
  return s !== null ? s : e.type === "token" ? "" : null;
}
function be(e) {
  const t = W(e.message);
  if (t) return t;
  const s = W(e.error);
  return s || "Stream error";
}
function ve(e) {
  return W(e.conversationId) ?? null;
}
function xe(e) {
  const t = W(e.messageId);
  if (t) return t;
  const s = W(e.id);
  return s || null;
}
function Se(e) {
  return e.done === !0 || e.type === "complete";
}
async function Xe(e, t) {
  let s = !1, l = "", d = "", f = "";
  try {
    if (!e.ok) {
      const r = e.status, o = await e.text().catch(() => ""), i = o ? de(o) : null;
      ie(i) ? t.onError(Q.fromResponse(r, i)) : t.onError(new Q(o || `HTTP ${r}`, r));
      return;
    }
    if (!e.body) {
      t.onError(new re("No response stream"));
      return;
    }
    const h = e.body.getReader(), m = new TextDecoder();
    let w = "";
    const y = (r, o, i) => {
      if (s) return;
      s = !0;
      const a = typeof r == "string" ? r : l;
      typeof r == "string" && (l = r), typeof i == "string" && (d = i), typeof o == "string" && (f = o);
      const c = f || Qe(), n = Je(c, a);
      t.onComplete(n, d);
    }, v = (r) => {
      s || (l += r, t.onChunk(r));
    }, E = (r) => {
      s || t.onError(new Q(r, 500));
    }, C = (r) => {
      const o = ve(r);
      o && (d = o);
      const i = xe(r);
      if (i && (f = i), r.type === "error" || r.error) {
        E(be(r));
        return;
      }
      const a = Ye(r);
      if (a !== null && !Se(r) && v(a), Se(r)) {
        const c = ie(r.message) ? r.message : null, n = c ? W(c.content) : null, b = W(r.content) ?? n ?? void 0, g = c ? W(c.id) : null, S = xe(r) ?? g ?? void 0, L = ve(r) ?? void 0;
        y(b, S, L);
      }
    }, N = (r, o) => {
      const i = de(o);
      if (!ie(i)) {
        if (r === "token") {
          v(o);
          return;
        }
        if (r === "error") {
          E(o || "Stream error");
          return;
        }
        if (r === "complete") {
          y(o);
          return;
        }
        return;
      }
      const a = i;
      if (r === "token") {
        const c = W(a.token) ?? W(a.content) ?? "";
        v(c);
        return;
      }
      if (r === "error") {
        E(be(a));
        return;
      }
      if (r === "complete") {
        const c = W(a.content) ?? l, n = W(a.conversationId) ?? d, b = W(a.id) ?? f;
        n && (d = n), b && (f = b), y(c, b || void 0, n || void 0);
      }
    }, p = (r) => {
      const o = r.trim();
      if (!o) return;
      const i = o.split(`
`);
      let a = "";
      const c = [];
      for (const g of i) {
        if (g.startsWith("event:")) {
          a = g.slice(6).trim();
          continue;
        }
        if (g.startsWith("data:")) {
          c.push(g.slice(5).trimStart());
          continue;
        }
      }
      const n = c.join(`
`);
      if (!n || n === "[DONE]") return;
      if (a) {
        N(a, n);
        return;
      }
      const b = de(n);
      if (ie(b)) {
        C(b);
        return;
      }
      n && v(n);
    };
    for (; ; ) {
      const { done: r, value: o } = await h.read();
      if (r) break;
      w += m.decode(o, { stream: !0 });
      const i = w.split(`

`);
      w = i.pop() ?? "";
      for (const a of i)
        p(a);
    }
    w.trim() && p(w), !s && l && y();
  } catch (h) {
    t.onError(
      h instanceof Error ? new re("Stream failed", h) : new re("Stream failed")
    );
  }
}
function te(e) {
  return typeof e == "object" && e !== null;
}
function Te(e) {
  return e.replace(/\/$/, "");
}
function X(e) {
  return e ? e.startsWith("/") ? e : `/${e}` : "/";
}
function V(e, t) {
  return `${Te(e)}${X(t)}`;
}
function se(e, t) {
  const s = new URLSearchParams();
  for (const [d, f] of Object.entries(t))
    f !== void 0 && s.set(d, f);
  const l = s.toString();
  return l ? `${e}${e.includes("?") ? "&" : "?"}${l}` : e;
}
function Ze(e) {
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
async function Ce(e) {
  try {
    return await e.json();
  } catch {
    try {
      const t = await e.text();
      return Ze(t);
    } catch {
      return null;
    }
  }
}
function et(e) {
  if (!te(e))
    throw new Q("Invalid auth response", 500);
  const t = typeof e.accessToken == "string" && e.accessToken || typeof e.token == "string" && e.token || null;
  if (!t)
    throw new Q("Missing access token in auth response", 500);
  const s = typeof e.refreshToken == "string" ? e.refreshToken : void 0;
  let l;
  if (typeof e.expiresAt == "number")
    l = e.expiresAt;
  else if (typeof e.expiresAt == "string") {
    const d = new Date(e.expiresAt).getTime();
    Number.isNaN(d) || (l = d);
  } else typeof e.expiresIn == "number" && (l = Date.now() + e.expiresIn * 1e3);
  return { accessToken: t, refreshToken: s, expiresAt: l };
}
function ue(e, t) {
  const { page: s, pageSize: l, itemsKey: d } = t;
  if (!te(e))
    return { items: [], total: 0, page: s, pageSize: l, hasMore: !1 };
  if (Array.isArray(e.items) && typeof e.total == "number")
    return {
      items: e.items,
      total: e.total,
      page: typeof e.page == "number" ? e.page : s,
      pageSize: typeof e.pageSize == "number" ? e.pageSize : l,
      hasMore: typeof e.hasMore == "boolean" ? e.hasMore : typeof e.page == "number" && typeof e.pageSize == "number" ? e.page * e.pageSize < e.total : s * l < e.total
    };
  const f = d, h = f && Array.isArray(e[f]) ? e[f] : null, m = typeof e.total == "number" ? e.total : h ? h.length : 0;
  return h ? {
    items: h,
    total: m,
    page: typeof e.page == "number" ? e.page : s,
    pageSize: typeof e.pageSize == "number" ? e.pageSize : l,
    hasMore: typeof e.hasMore == "boolean" ? e.hasMore : s * l < m
  } : { items: [], total: 0, page: s, pageSize: l, hasMore: !1 };
}
function tt(e) {
  return e === "erc721" || e === "erc1155" || e === "unknown" ? e : "unknown";
}
function le(e) {
  if (!te(e))
    throw new Q("Invalid NFT collection response", 500);
  const t = te(e.config) ? e.config : void 0;
  return {
    id: typeof e.id == "string" ? e.id : "",
    chainId: typeof e.chainId == "number" ? e.chainId : 0,
    contractAddress: typeof e.contractAddress == "string" ? e.contractAddress : "",
    name: typeof e.name == "string" ? e.name : "",
    tokenStandard: tt(e.tokenStandard),
    ...t ? { config: t } : {},
    createdAt: typeof e.createdAt == "string" ? e.createdAt : "",
    updatedAt: typeof e.updatedAt == "string" ? e.updatedAt : ""
  };
}
function Ft(e) {
  const t = Te(e.baseUrl), s = e.authNoncePath ?? "/auth/nonce", l = e.authVerifyPath ?? "/auth/verify", d = e.charactersPath ?? "/characters", f = e.conversationsPath ?? "/conversations", h = e.chatStreamPath ?? "/chat", m = e.builderChatPath ?? "/chat/builder", w = e.charactersParseSummaryPath ?? "/characters/parse-summary", y = e.nftCollectionsPath ?? "/nft/collections", v = e.nftProvisionPath ?? "/nft/provision", E = e.fetch ?? globalThis.fetch.bind(globalThis), C = e.credentials ?? "include", N = e.getAuthHeader, p = async (r) => {
    const o = {
      Accept: "application/json",
      ...r.body !== void 0 ? { "Content-Type": "application/json" } : {},
      ...r.headers ?? {}
    }, i = N?.();
    i && (o.Authorization = i);
    let a;
    try {
      a = await E(r.url, {
        method: r.method,
        headers: o,
        credentials: C,
        ...r.body !== void 0 ? { body: JSON.stringify(r.body) } : {}
      });
    } catch (n) {
      throw new re(
        "Network request failed",
        n instanceof Error ? n : void 0
      );
    }
    if (!a.ok) {
      const n = await Ce(a);
      throw te(n) ? Q.fromResponse(a.status, n) : new Q(`HTTP ${a.status}`, a.status);
    }
    return await Ce(a);
  };
  return {
    auth: {
      async getNonce() {
        const r = V(t, s), o = await p({ method: "GET", url: r });
        if (!te(o))
          throw new Q("Invalid nonce response", 500);
        const i = typeof o.nonce == "string" ? o.nonce : null, a = typeof o.sessionId == "string" ? o.sessionId : null;
        if (!i || !a)
          throw new Q("Missing nonce/sessionId in nonce response", 500);
        return { nonce: i, sessionId: a };
      },
      async verify(r, o, i) {
        const a = V(t, l), c = await p({
          method: "POST",
          url: a,
          body: { message: r, signature: o, sessionId: i }
        });
        return et(c);
      }
    },
    characters: {
      async listRecords(r) {
        const o = r?.page ?? 1, i = r?.pageSize ?? 20, a = r?.nftCollectionId, c = se(V(t, d), {
          page: String(o),
          pageSize: String(i),
          nftCollectionId: a
        }), n = await p({ method: "GET", url: c });
        return ue(n, {
          page: o,
          pageSize: i,
          itemsKey: "characters"
        });
      },
      async getRecord(r) {
        const o = V(t, `${X(d)}/${encodeURIComponent(r)}`);
        return p({ method: "GET", url: o });
      },
      async createRecord(r) {
        const o = V(t, d);
        return p({
          method: "POST",
          url: o,
          body: {
            externalId: r.externalId,
            character: r.character
          }
        });
      },
      async replaceRecord(r, o) {
        const i = V(t, `${X(d)}/${encodeURIComponent(r)}`);
        return p({
          method: "PUT",
          url: i,
          body: { character: o.character }
        });
      },
      async parseSummary(r) {
        const o = V(t, w);
        return (await p({
          method: "POST",
          url: o,
          body: r
        })).parsed;
      }
    },
    chat: {
      async sendMessageStream(r, o) {
        const i = V(t, h), a = {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        }, c = N?.();
        c && (a.Authorization = c);
        try {
          const n = await E(i, {
            method: "POST",
            headers: a,
            credentials: C,
            body: JSON.stringify({
              characterId: r.characterId,
              message: r.message,
              conversationId: r.conversationId
            })
          });
          await Xe(n, o);
        } catch (n) {
          o.onError(
            n instanceof Error ? new re("Chat stream request failed", n) : new re("Chat stream request failed")
          );
        }
      },
      async sendBuilderMessage(r) {
        const o = V(t, m);
        return p({
          method: "POST",
          url: o,
          body: r
        });
      }
    },
    conversations: {
      async list(r) {
        const o = r?.page ?? 1, i = r?.pageSize ?? 20, a = se(V(t, f), {
          page: String(o),
          pageSize: String(i)
        }), c = await p({ method: "GET", url: a });
        return ue(c, {
          page: o,
          pageSize: i,
          itemsKey: "conversations"
        });
      },
      async listForCharacter(r, o) {
        const i = o?.page ?? 1, a = o?.pageSize ?? 20, c = se(V(t, f), {
          characterId: r,
          page: String(i),
          pageSize: String(a)
        }), n = await p({ method: "GET", url: c });
        return ue(n, {
          page: i,
          pageSize: a,
          itemsKey: "conversations"
        });
      },
      async get(r) {
        const o = V(
          t,
          `${X(f)}/${encodeURIComponent(r)}`
        );
        return p({ method: "GET", url: o });
      },
      async delete(r) {
        const o = V(
          t,
          `${X(f)}/${encodeURIComponent(r)}`
        );
        await p({ method: "DELETE", url: o });
      }
    },
    nft: {
      async listCollections(r) {
        const o = r?.page ?? 1, i = r?.pageSize ?? 20, a = se(V(t, y), {
          page: String(o),
          pageSize: String(i)
        }), c = await p({ method: "GET", url: a });
        if (!te(c))
          return { items: [], total: 0, page: o, pageSize: i, hasMore: !1 };
        const n = Array.isArray(c.collections) ? c.collections : [], b = te(c.pagination) ? c.pagination : null, g = b && typeof b.total == "number" ? b.total : n.length, S = b && typeof b.page == "number" ? b.page : o, L = b && typeof b.pageSize == "number" ? b.pageSize : i;
        return {
          items: n.map((M) => le(M)),
          total: g,
          page: S,
          pageSize: L,
          hasMore: S * L < g
        };
      },
      async getCollection(r) {
        const o = V(
          t,
          `${X(y)}/${encodeURIComponent(r)}`
        ), i = await p({ method: "GET", url: o });
        return le(i);
      },
      async upsertCollection(r) {
        const o = V(t, y), i = await p({ method: "POST", url: o, body: r });
        return le(i);
      },
      async updateCollection(r, o) {
        const i = V(
          t,
          `${X(y)}/${encodeURIComponent(r)}`
        ), a = await p({ method: "PUT", url: i, body: o });
        return le(a);
      },
      async deleteCollection(r) {
        const o = V(
          t,
          `${X(y)}/${encodeURIComponent(r)}`
        );
        await p({ method: "DELETE", url: o });
      },
      async provisionCharacter(r) {
        const o = V(t, v);
        return p({
          method: "POST",
          url: o,
          body: r
        });
      },
      async listCollectionTokens(r) {
        const { collectionId: o, limit: i = 10, cursor: a, ownerAddress: c } = r, n = se(
          V(t, `${X(y)}/${encodeURIComponent(o)}/tokens`),
          {
            limit: String(i),
            cursor: a,
            owner: c
          }
        );
        return p({ method: "GET", url: n });
      }
    }
  };
}
function Ot(e) {
  const { transport: t, signer: s, siwe: l, onAuthenticated: d } = e, f = Z(), h = t ?? f?.transport ?? null, [m, w] = T({ status: "idle" }), y = H(!0), v = H(0), E = H(null);
  G(() => (y.current = !0, () => {
    y.current = !1;
  }), []);
  const C = B((r) => {
    y.current && w(r);
  }, []), N = B(() => {
    v.current += 1, E.current = null, C({ status: "idle" });
  }, [C]), p = B(async () => {
    if (!h) {
      C({
        status: "error",
        error: new Error(
          "useSIWEAuth requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>."
        )
      });
      return;
    }
    if (E.current)
      return E.current;
    const r = ++v.current, o = (async () => {
      try {
        C({ status: "requesting_nonce" });
        const { nonce: i, sessionId: a } = await h.auth.getNonce();
        if (v.current !== r) return;
        const c = await s.getAddress();
        if (v.current !== r) return;
        const n = Ge({
          domain: l.domain,
          address: c,
          statement: l.statement,
          uri: l.uri,
          chainId: l.chainId,
          nonce: i,
          resources: l.resources
        });
        C({ status: "awaiting_signature", message: n, sessionId: a, nonce: i });
        const b = await s.signMessage(n);
        if (v.current !== r) return;
        C({ status: "verifying" });
        const g = await h.auth.verify(n, b, a);
        if (v.current !== r) return;
        C({ status: "authenticated", tokens: g }), d?.(g);
      } catch (i) {
        if (v.current !== r) return;
        C({ status: "error", error: K(i, "SIWE authentication failed") });
      }
    })().finally(() => {
      E.current === o && (E.current = null);
    });
    return E.current = o, o;
  }, [h, s, l, d, C]);
  return { state: m, start: p, reset: N };
}
function rt(e = {}) {
  const { transport: t, pageSize: s, autoLoad: l = !0, nftCollectionId: d } = e, f = Z(), h = t ?? f?.transport ?? null, m = s ?? 20, [w, y] = T([]), [v, E] = T(!1), [C, N] = T(null), [p, r] = T(1), [o, i] = T(!1), a = H(0), c = H(!0);
  G(() => (c.current = !0, () => {
    c.current = !1, a.current += 1;
  }), []);
  const n = J(() => ({
    setItems: (M) => {
      c.current && y(M);
    },
    setIsLoading: (M) => {
      c.current && E(M);
    },
    setError: (M) => {
      c.current && N(M);
    },
    setPage: (M) => {
      c.current && r(M);
    },
    setHasMore: (M) => {
      c.current && i(M);
    }
  }), []), b = B(
    async (M, z) => {
      if (!h) {
        n.setError(
          new Error(
            "useCharacters requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>."
          )
        );
        return;
      }
      const D = ++a.current;
      n.setIsLoading(!0), n.setError(null);
      try {
        const O = {
          page: M,
          pageSize: m,
          nftCollectionId: d
        }, F = await h.characters.listRecords(O);
        if (a.current !== D) return;
        n.setItems((_) => z === "append" ? [..._, ...F.items] : F.items), n.setPage(F.page ?? M), n.setHasMore(!!F.hasMore);
      } catch (O) {
        if (a.current !== D) return;
        n.setError(K(O, "Failed to load characters"));
      } finally {
        if (a.current !== D) return;
        n.setIsLoading(!1);
      }
    },
    [m, n, h, d]
  ), g = B(
    async (M) => {
      await b(M ?? 1, "replace");
    },
    [b]
  ), S = B(async () => {
    if (v || !o && w.length > 0) return;
    const M = Math.max(1, p + 1);
    await b(M, "append");
  }, [o, v, w.length, b, p]), L = B(async () => {
    a.current += 1, n.setItems([]), n.setPage(1), n.setHasMore(!1), n.setError(null), await b(1, "replace");
  }, [b, n]);
  return G(() => {
    l && g(1);
  }, [l, g, d, h]), {
    items: w,
    isLoading: v,
    error: C,
    page: p,
    hasMore: o,
    load: g,
    loadMore: S,
    refresh: L
  };
}
function we(e) {
  return e.trim();
}
function nt(e) {
  if (typeof e != "string") return;
  const t = e.trim();
  return t.length > 0 ? t : void 0;
}
function oe(e) {
  if (!Array.isArray(e)) return;
  const t = e.map((s) => typeof s == "string" ? s.trim() : "").filter((s) => s.length > 0);
  return t.length > 0 ? t : void 0;
}
function st(e) {
  const t = /* @__PURE__ */ new Set(), s = [];
  for (const l of e)
    t.has(l) || (t.add(l), s.push(l));
  return s;
}
function Le(e) {
  const t = we(e.name), s = we(e.backstory), l = nt(e.systemPrompt), d = oe(e.bio), f = oe(e.lore), h = oe(e.topics), m = oe(e.adjectives), w = oe(e.postExamples), y = s.length > 0 && s.length <= R.bio ? [s] : [], v = y.length > 0 || d && d.length > 0 ? st([...y ?? [], ...d ?? []]) : void 0;
  return {
    name: t,
    backstory: s,
    ...l ? { systemPrompt: l } : {},
    ...v ? { bio: v } : {},
    ...f ? { lore: f } : {},
    ...h ? { topics: h } : {},
    ...m ? { adjectives: m } : {},
    ...w ? { postExamples: w } : {}
  };
}
function $e() {
  return {
    name: "",
    backstory: "",
    systemPrompt: "",
    bio: [],
    lore: [],
    topics: [],
    adjectives: [],
    postExamples: []
  };
}
function ot(e, t) {
  if (!t) return e;
  const s = { ...e };
  return Object.keys(t).forEach((l) => {
    const d = t[l];
    d !== void 0 && (s[l] = d);
  }), s;
}
function at(e) {
  switch (e) {
    case "name":
      return { maxLength: R.name };
    case "backstory":
      return { maxLength: 1e4 };
    case "systemPrompt":
      return { maxLength: R.systemPrompt };
    case "bio":
      return { maxLength: R.bio, maxItems: R.maxBioEntries };
    case "lore":
      return { maxLength: R.lore, maxItems: R.maxLoreEntries };
    case "topics":
      return { maxLength: R.topic, maxItems: R.maxTopics };
    case "adjectives":
      return { maxLength: R.adjective, maxItems: R.maxAdjectives };
    case "postExamples":
      return { maxLength: R.postExample, maxItems: R.maxPostExamples };
    default:
      return;
  }
}
function it(e) {
  const t = {}, s = {
    name: "name",
    backstory: "backstory",
    systemPrompt: "systemPrompt",
    bio: "bio",
    lore: "lore",
    topics: "topics",
    adjectives: "adjectives",
    postExamples: "postExamples"
  };
  for (const [l, d] of Object.entries(e.fieldErrors)) {
    const f = l.split(".")[0] || l, h = s[f];
    h && (!Array.isArray(d) || d.length === 0 || (t[h] = d[0]));
  }
  return t;
}
function lt(e) {
  const t = {
    name: e.name
  };
  return typeof e.systemPrompt == "string" && e.systemPrompt.trim().length > 0 && (t.system = e.systemPrompt, t.systemPrompt = e.systemPrompt), Array.isArray(e.bio) && e.bio.length > 0 && (t.bio = e.bio), Array.isArray(e.topics) && e.topics.length > 0 && (t.topics = e.topics), t.backstory = e.backstory, Array.isArray(e.lore) && e.lore.length > 0 && (t.lore = e.lore), Array.isArray(e.adjectives) && e.adjectives.length > 0 && (t.adjectives = e.adjectives), Array.isArray(e.postExamples) && e.postExamples.length > 0 && (t.postExamples = e.postExamples), t;
}
const ct = [
  "name",
  "backstory",
  "systemPrompt",
  "bio",
  "lore",
  "topics",
  "adjectives",
  "postExamples"
];
function Dt(e = {}) {
  const {
    transport: t,
    initialValues: s,
    clientValidate: l = !0,
    onCreated: d,
    onError: f
  } = e, h = Z(), m = t ?? h?.transport ?? null, w = J(() => {
    const b = $e();
    return ot(b, s);
  }, [s]), [y, v] = T(w), [E, C] = T({}), [N, p] = T(null), [r, o] = T(!1), i = B(
    (b, g) => {
      v((S) => ({ ...S, [b]: g })), C((S) => {
        if (!S[b]) return S;
        const L = { ...S };
        return delete L[b], L;
      });
    },
    []
  ), a = B(() => {
    p(null), C({});
  }, []), c = B(() => {
    v(w), C({}), p(null);
  }, [w]), n = B(async () => {
    if (r) return;
    if (p(null), C({}), !m) {
      const S = new Error(
        "useCreateCharacterForm requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>."
      );
      p(S.message), f?.(S);
      return;
    }
    const b = Le(y);
    let g;
    try {
      l ? g = Me(b) : g = b;
    } catch (S) {
      const L = K(S, "Failed to create character");
      if (S instanceof Pe) {
        const M = it(S);
        C(M), Object.keys(M).length === 0 && p(S.message);
      } else
        p(L.message);
      f?.(L);
      return;
    }
    o(!0);
    try {
      const S = lt(g), L = await m.characters.createRecord({ character: S });
      d?.(L);
    } catch (S) {
      const L = K(S, "Failed to create character");
      p(L.message), f?.(L);
    } finally {
      o(!1);
    }
  }, [r, l, d, f, m, y]);
  return {
    values: y,
    setField: i,
    fieldErrors: E,
    formError: N,
    busy: r,
    submit: n,
    reset: c,
    clearErrors: a,
    getFieldLimits: at,
    fieldsOrder: ct
  };
}
const Ee = "__eliza_load_more__";
function dt(e) {
  const t = e.character?.name;
  return typeof t == "string" && t.trim().length > 0 ? t : "(unnamed)";
}
function ut(e) {
  const {
    items: t,
    value: s,
    onChange: l,
    isLoading: d = !1,
    error: f = null,
    hasMore: h = !1,
    onLoadMore: m,
    getLabel: w = dt,
    disabled: y = !1,
    placeholder: v = "Select a character...",
    variant: E = "select",
    renderOption: C,
    renderEmpty: N,
    renderLoading: p,
    className: r,
    classNames: o,
    styles: i,
    unstyled: a = !1
  } = e, c = C ? "listbox" : E, n = {
    display: "flex",
    flexDirection: "column",
    gap: 8
  }, b = a ? {} : {
    padding: "6px 8px",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    border: "1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))",
    background: "var(--eliza-character-selector-bg, transparent)",
    color: "var(--eliza-character-selector-color, inherit)"
  }, g = a ? {} : {
    padding: "6px 8px",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    border: "1px solid var(--eliza-character-selector-error-border, #fca5a5)",
    background: "var(--eliza-character-selector-error-bg, #fee2e2)",
    color: "var(--eliza-character-selector-error-color, #7f1d1d)"
  }, S = a ? { width: "100%" } : {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    border: "1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))",
    background: "var(--eliza-character-selector-bg, transparent)",
    color: "var(--eliza-character-selector-color, inherit)",
    font: "inherit"
  }, L = a ? { display: "flex", flexDirection: "column", gap: 4 } : {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "var(--eliza-character-selector-padding, 8px)",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    border: "1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))",
    background: "var(--eliza-character-selector-bg, transparent)"
  }, M = a ? { width: "100%", textAlign: "left" } : {
    width: "100%",
    textAlign: "left",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--eliza-character-selector-color, inherit)",
    padding: "6px 8px",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    cursor: y ? "not-allowed" : "pointer",
    opacity: y ? 0.6 : 1
  }, z = a ? { alignSelf: "flex-start" } : {
    alignSelf: "flex-start",
    padding: "6px 8px",
    borderRadius: "var(--eliza-character-selector-radius, 6px)",
    border: "1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))",
    background: "var(--eliza-character-selector-bg, transparent)",
    color: "var(--eliza-character-selector-color, inherit)",
    cursor: y || d ? "not-allowed" : "pointer",
    opacity: y || d ? 0.6 : 1
  }, D = () => /* @__PURE__ */ u(
    "div",
    {
      ...j("loading"),
      className: P(o?.loading),
      style: { ...b, ...i?.loading },
      children: p ? p() : /* @__PURE__ */ u("div", { children: "Loading characters..." })
    }
  ), O = () => /* @__PURE__ */ u(
    "div",
    {
      ...j("error"),
      role: "alert",
      className: P(o?.error),
      style: { ...g, ...i?.error },
      children: f?.message ?? "Failed to load characters."
    }
  ), F = () => /* @__PURE__ */ u(
    "div",
    {
      ...j("empty"),
      className: P(o?.empty),
      style: { ...b, ...i?.empty },
      children: N ? N() : /* @__PURE__ */ u("div", { children: "No characters available." })
    }
  ), _ = (I) => {
    const x = I.target.value;
    if (x === Ee) {
      !y && m && !d && m();
      return;
    }
    if (!x) {
      l(null);
      return;
    }
    l(x);
  };
  let k = null;
  return d && t.length === 0 ? k = D() : f ? k = O() : t.length === 0 ? k = F() : c === "select" ? k = /* @__PURE__ */ A(
    "select",
    {
      ...j("select"),
      className: P(o?.select),
      style: { ...S, ...i?.select },
      value: s ?? "",
      onChange: _,
      disabled: y,
      "aria-label": "Select character",
      children: [
        /* @__PURE__ */ u(
          "option",
          {
            className: P(o?.option),
            style: i?.option,
            value: "",
            children: v
          }
        ),
        t.map((I) => {
          const x = w(I);
          return /* @__PURE__ */ u(
            "option",
            {
              className: P(o?.option),
              style: i?.option,
              value: I.id,
              children: x
            },
            I.id
          );
        }),
        h && m ? /* @__PURE__ */ u(
          "option",
          {
            className: P(o?.loadMore),
            style: i?.loadMore,
            value: Ee,
            disabled: y || d,
            children: d ? "Loading..." : "Load more..."
          }
        ) : null
      ]
    }
  ) : k = /* @__PURE__ */ A(
    "div",
    {
      ...j("listbox"),
      role: "listbox",
      "aria-disabled": y ? "true" : void 0,
      className: P(o?.listbox),
      style: { ...L, ...i?.listbox },
      children: [
        t.map((I) => {
          const x = I.id === s;
          return /* @__PURE__ */ We(
            "div",
            {
              ...j("item"),
              key: I.id,
              className: P(o?.item),
              style: i?.item
            },
            /* @__PURE__ */ u(
              "button",
              {
                ...j("itemButton"),
                type: "button",
                role: "option",
                "aria-selected": x ? "true" : void 0,
                onClick: () => l(I.id),
                disabled: y,
                className: P(o?.itemButton),
                style: {
                  ...M,
                  ...x && !a ? {
                    background: "var(--eliza-character-selector-selected-bg, rgba(0,0,0,0.08))"
                  } : {},
                  ...i?.itemButton
                },
                children: C ? C(I, { selected: x }) : w(I)
              }
            )
          );
        }),
        h && m ? /* @__PURE__ */ u(
          "button",
          {
            ...j("loadMore"),
            type: "button",
            onClick: () => {
              y || d || m();
            },
            disabled: y || d,
            className: P(o?.loadMore),
            style: { ...z, ...i?.loadMore },
            children: d ? "Loading..." : "Load more"
          }
        ) : null
      ]
    }
  ), /* @__PURE__ */ u(
    "div",
    {
      ...ne("CharacterSelectorView"),
      className: P(r, o?.root),
      style: { ...n, ...i?.root },
      children: k
    }
  );
}
function mt(e) {
  return e.character.name;
}
function Ut(e) {
  const {
    value: t,
    onChange: s,
    transport: l,
    pageSize: d,
    getLabel: f = mt,
    disabled: h = !1,
    placeholder: m = "Select a character...",
    className: w,
    selectClassName: y,
    optionClassName: v,
    classNames: E,
    styles: C,
    unstyled: N = !1,
    renderOption: p,
    renderEmpty: r,
    renderLoading: o
  } = e, { items: i, isLoading: a, error: c, hasMore: n, loadMore: b } = rt({
    transport: l,
    pageSize: d,
    autoLoad: !0
  }), g = B(
    (M) => {
      s(M);
    },
    [s]
  ), S = B(() => {
    a || !n || b();
  }, [n, a, b]), L = y || v ? {
    ...E,
    ...y ? { select: P(E?.select, y) } : {},
    ...v ? { option: P(E?.option, v) } : {}
  } : E;
  return /* @__PURE__ */ u(
    ut,
    {
      items: i,
      value: t,
      onChange: g,
      isLoading: a,
      error: c,
      hasMore: n,
      onLoadMore: S,
      getLabel: f,
      disabled: h,
      placeholder: m,
      renderOption: p,
      renderEmpty: r,
      renderLoading: o,
      className: w,
      classNames: L,
      styles: C,
      unstyled: N
    }
  );
}
function ht(e) {
  return e.split(`
`).map((t) => t.trim()).filter((t) => t.length > 0);
}
function pt(e) {
  return !Array.isArray(e) || e.length === 0 ? "" : e.join(`
`);
}
function ft(e, t) {
  if (!t) return e;
  const s = { ...e };
  return Object.keys(t).forEach((l) => {
    const d = t[l];
    d !== void 0 && (s[l] = d);
  }), s;
}
function ce(e) {
  switch (e) {
    case "name":
      return { maxLength: R.name };
    case "backstory":
      return { maxLength: 1e4 };
    case "systemPrompt":
      return { maxLength: R.systemPrompt };
    case "bio":
      return { maxLength: R.bio, maxItems: R.maxBioEntries };
    case "lore":
      return { maxLength: R.lore, maxItems: R.maxLoreEntries };
    case "topics":
      return { maxLength: R.topic, maxItems: R.maxTopics };
    case "adjectives":
      return { maxLength: R.adjective, maxItems: R.maxAdjectives };
    case "postExamples":
      return { maxLength: R.postExample, maxItems: R.maxPostExamples };
    default:
      return;
  }
}
function gt(e) {
  const t = {}, s = {
    name: "name",
    backstory: "backstory",
    systemPrompt: "systemPrompt",
    bio: "bio",
    lore: "lore",
    topics: "topics",
    adjectives: "adjectives",
    postExamples: "postExamples"
  };
  for (const [l, d] of Object.entries(e.fieldErrors)) {
    const f = l.split(".")[0] || l, h = s[f];
    h && (!Array.isArray(d) || d.length === 0 || (t[h] = d[0]));
  }
  return t;
}
function yt(e) {
  const t = {
    name: e.name
  };
  return typeof e.systemPrompt == "string" && e.systemPrompt.trim().length > 0 && (t.system = e.systemPrompt, t.systemPrompt = e.systemPrompt), Array.isArray(e.bio) && e.bio.length > 0 && (t.bio = e.bio), Array.isArray(e.topics) && e.topics.length > 0 && (t.topics = e.topics), t.backstory = e.backstory, Array.isArray(e.lore) && e.lore.length > 0 && (t.lore = e.lore), Array.isArray(e.adjectives) && e.adjectives.length > 0 && (t.adjectives = e.adjectives), Array.isArray(e.postExamples) && e.postExamples.length > 0 && (t.postExamples = e.postExamples), t;
}
function Vt(e) {
  const {
    transport: t,
    initialValues: s,
    onCreated: l,
    onError: d,
    clientValidate: f = !0,
    className: h,
    fieldClassName: m,
    buttonClassName: w,
    renderField: y,
    submitLabel: v = "Create Character",
    isSubmitting: E
  } = e, C = Z(), N = t ?? C?.transport ?? null, p = J(() => {
    const k = $e();
    return ft(k, s);
  }, [s]), [r, o] = T(p), [i, a] = T({}), [c, n] = T(null), [b, g] = T(!1), S = typeof E == "boolean" ? E : b, L = B(
    (k, I) => {
      o((x) => ({ ...x, [k]: I })), a((x) => {
        if (!x[k]) return x;
        const $ = { ...x };
        return delete $[k], $;
      });
    },
    []
  ), M = B(
    (k, I) => {
      o((x) => ({ ...x, [k]: I })), a((x) => {
        if (!x[k]) return x;
        const $ = { ...x };
        return delete $[k], $;
      });
    },
    []
  ), z = B(
    async (k) => {
      if (k.preventDefault(), S) return;
      if (n(null), a({}), !N) {
        const U = new Error(
          "CreateCharacterForm requires an ElizaTransport: pass props.transport or wrap in <ElizaProvider>."
        );
        n(U.message), d?.(U);
        return;
      }
      const I = Le(r);
      let x;
      try {
        f ? x = Me(I) : x = I;
      } catch (U) {
        const q = K(U, "Failed to create character");
        if (U instanceof Pe) {
          const Y = gt(U);
          a(Y), Object.keys(Y).length === 0 && n(U.message);
        } else
          n(q.message);
        d?.(q);
        return;
      }
      const $ = typeof E != "boolean";
      $ && g(!0);
      try {
        const U = yt(x), q = await N.characters.createRecord({ character: U });
        l?.(q);
      } catch (U) {
        const q = K(U, "Failed to create character");
        n(q.message), d?.(q);
      } finally {
        $ && g(!1);
      }
    },
    [S, f, E, l, d, N, r]
  ), D = (k, I, x = {}) => {
    const $ = ce(k), U = i[k];
    return /* @__PURE__ */ A("div", { className: m, children: [
      /* @__PURE__ */ A("label", { children: [
        /* @__PURE__ */ u("div", { children: I }),
        /* @__PURE__ */ u(
          "input",
          {
            type: "text",
            value: typeof r[k] == "string" ? r[k] : "",
            onChange: (q) => M(k, q.target.value),
            disabled: x.disabled,
            placeholder: x.placeholder,
            maxLength: $?.maxLength
          }
        )
      ] }),
      U && /* @__PURE__ */ u("div", { role: "alert", children: U })
    ] });
  }, O = (k, I, x = {}) => {
    const $ = ce(k), U = i[k];
    return /* @__PURE__ */ A("div", { className: m, children: [
      /* @__PURE__ */ A("label", { children: [
        /* @__PURE__ */ u("div", { children: I }),
        /* @__PURE__ */ u(
          "textarea",
          {
            value: typeof r[k] == "string" ? r[k] : "",
            onChange: (q) => M(k, q.target.value),
            disabled: x.disabled,
            placeholder: x.placeholder,
            rows: x.rows ?? 4,
            maxLength: $?.maxLength
          }
        )
      ] }),
      U && /* @__PURE__ */ u("div", { role: "alert", children: U })
    ] });
  }, F = (k, I, x = {}) => {
    const $ = ce(k), U = i[k], q = Array.isArray(r[k]) ? r[k] : [];
    return /* @__PURE__ */ A("div", { className: m, children: [
      /* @__PURE__ */ A("label", { children: [
        /* @__PURE__ */ A("div", { children: [
          I,
          typeof $?.maxItems == "number" ? ` (max ${$.maxItems})` : ""
        ] }),
        /* @__PURE__ */ u(
          "textarea",
          {
            value: pt(q),
            onChange: (Y) => {
              const ee = ht(Y.target.value);
              L(k, ee);
            },
            disabled: x.disabled,
            placeholder: x.placeholder,
            rows: x.rows ?? 4
          }
        )
      ] }),
      U && /* @__PURE__ */ u("div", { role: "alert", children: U })
    ] });
  };
  return /* @__PURE__ */ A("form", { className: h, onSubmit: z, children: [
    c && /* @__PURE__ */ u("div", { role: "alert", children: c }),
    y ? /* @__PURE__ */ u(ye, { children: [
      "name",
      "backstory",
      "systemPrompt",
      "bio",
      "lore",
      "topics",
      "adjectives",
      "postExamples"
    ].map((k) => {
      const I = ce(k), x = i[k];
      return /* @__PURE__ */ u("div", { children: y({
        name: k,
        value: r[k],
        setValue: ($) => M(k, $),
        error: x,
        limits: I
      }) }, String(k));
    }) }) : /* @__PURE__ */ A(ye, { children: [
      D("name", "Name", {
        placeholder: `Up to ${R.name} characters`,
        disabled: S
      }),
      O("backstory", "Backstory", {
        placeholder: "A short background story (required)",
        disabled: S,
        rows: 5
      }),
      O("systemPrompt", "System Prompt (optional)", {
        placeholder: `Up to ${R.systemPrompt} characters`,
        disabled: S,
        rows: 5
      }),
      F("bio", "Bio (one per line)", {
        placeholder: `Up to ${R.maxBioEntries} lines, ${R.bio} chars each`,
        disabled: S,
        rows: 4
      }),
      F("lore", "Lore (one per line)", {
        placeholder: `Up to ${R.maxLoreEntries} lines, ${R.lore} chars each`,
        disabled: S,
        rows: 4
      }),
      F("topics", "Topics (one per line)", {
        placeholder: `Up to ${R.maxTopics} lines, ${R.topic} chars each`,
        disabled: S,
        rows: 3
      }),
      F("adjectives", "Adjectives (one per line)", {
        placeholder: `Up to ${R.maxAdjectives} lines, ${R.adjective} chars each`,
        disabled: S,
        rows: 3
      }),
      F("postExamples", "Post Examples (one per line)", {
        placeholder: `Up to ${R.maxPostExamples} lines, ${R.postExample} chars each`,
        disabled: S,
        rows: 4
      })
    ] }),
    /* @__PURE__ */ u("div", { children: /* @__PURE__ */ u(
      "button",
      {
        className: w,
        type: "submit",
        disabled: S,
        children: S ? "Creating…" : v
      }
    ) })
  ] });
}
function Ie() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function Ne(e) {
  const t = globalThis.crypto;
  return t?.randomUUID ? `${e}-${t.randomUUID()}` : `${e}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
function bt(e) {
  const { transport: t, characterId: s, initialConversationId: l = null, onConversationId: d } = e, f = Z(), h = t ?? f?.transport ?? null, [m, w] = T([]), [y, v] = T(l), [E, C] = T(!1), [N, p] = T(""), [r, o] = T(null), i = H(!0), a = H(0), c = H(null);
  G(() => (i.current = !0, () => {
    i.current = !1, a.current += 1, c.current?.controller.abort(), c.current = null;
  }), []);
  const n = J(() => ({
    setMessages: (z) => {
      i.current && w(z);
    },
    setConversationId: (z) => {
      i.current && v(z);
    },
    setIsStreaming: (z) => {
      i.current && C(z);
    },
    setStreamingContent: (z) => {
      i.current && p(z);
    },
    setError: (z) => {
      i.current && o(z);
    }
  }), []), b = B(() => {
    n.setError(null);
  }, [n]), g = B(
    (z) => {
      n.setConversationId(z), d?.(z);
    },
    [d, n]
  ), S = B(() => {
    a.current += 1, c.current?.controller.abort(), c.current = null, n.setIsStreaming(!1), n.setStreamingContent("");
  }, [n]), L = B(() => {
    S(), n.setMessages([]), g(null), n.setError(null);
  }, [S, n, g]), M = B(
    async (z) => {
      const D = z.trim();
      if (!D) return;
      if (!h) {
        n.setError(
          new Error("useChatSession requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.")
        );
        return;
      }
      if (!s || s.trim().length === 0) {
        n.setError(new Error("useChatSession requires a non-empty characterId."));
        return;
      }
      if (E)
        return;
      S();
      const O = ++a.current, F = new AbortController();
      c.current = {
        controller: F,
        assistantContent: "",
        completed: !1
      };
      const _ = {
        id: Ne("user"),
        role: "user",
        content: D,
        createdAt: Ie()
      };
      n.setMessages((I) => [...I, _]), n.setError(null), n.setIsStreaming(!0), n.setStreamingContent("");
      const k = {
        onChunk: (I) => {
          if (a.current !== O) return;
          const x = c.current;
          !x || x.controller.signal.aborted || x.completed || (x.assistantContent += I, n.setStreamingContent(x.assistantContent));
        },
        onComplete: (I, x) => {
          if (a.current !== O) return;
          const $ = c.current;
          !$ || $.controller.signal.aborted || $.completed || ($.completed = !0, n.setMessages((U) => [...U, I]), g(x || null), n.setIsStreaming(!1), n.setStreamingContent(""), c.current = null);
        },
        onError: (I) => {
          if (a.current !== O) return;
          const x = c.current;
          !x || x.controller.signal.aborted || x.completed || (n.setError(K(I, "Chat request failed")), n.setIsStreaming(!1), n.setStreamingContent(""), c.current = null);
        }
      };
      try {
        if (await h.chat.sendMessageStream(
          {
            characterId: s,
            message: D,
            conversationId: y ?? void 0
          },
          k
        ), a.current !== O) return;
        const I = c.current;
        if (!I || I.controller.signal.aborted || I.completed) return;
        if (I.assistantContent) {
          const x = {
            id: Ne("assistant"),
            role: "assistant",
            content: I.assistantContent,
            createdAt: Ie()
          };
          I.completed = !0, n.setMessages(($) => [...$, x]);
        }
        n.setIsStreaming(!1), n.setStreamingContent(""), c.current = null;
      } catch (I) {
        if (a.current !== O) return;
        const x = c.current;
        if (x && x.controller.signal.aborted)
          return;
        n.setError(K(I, "Chat request failed")), n.setIsStreaming(!1), n.setStreamingContent(""), c.current = null;
      }
    },
    [S, s, y, E, n, g, h]
  );
  return {
    messages: m,
    conversationId: y,
    isStreaming: E,
    streamingContent: N,
    sendMessage: M,
    abort: S,
    setConversationId: g,
    reset: L,
    error: r,
    clearError: b
  };
}
function me() {
  const e = globalThis.crypto;
  return e?.randomUUID ? e.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t) => {
    const s = Math.random() * 16 | 0;
    return (t === "x" ? s : s & 3 | 8).toString(16);
  });
}
function he() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function vt(e) {
  return e.filter((t) => t.role === "user").map((t) => t.content).join(`

`);
}
const xt = `You are a friendly character builder assistant helping users create Eliza AI agents. Your job is to have a natural conversation to gather information about the character they want to create.

Ask about:
- Character name and basic identity
- Personality traits and communication style
- Backstory and history
- Skills, knowledge areas, and topics they're interested in
- How they should speak (formal/casual, humor, quirks)
- Example interactions or scenarios

Be conversational and encouraging. Ask one or two questions at a time. When you have enough information, summarize what you've learned.

Keep your responses concise and focused. Don't overwhelm the user with too many questions at once.`, St = "Hello! I'm here to help you create a new Eliza character. Let's start with the basics - what would you like to name your character?";
function Ct(e = {}) {
  const {
    transport: t,
    systemPrompt: s = xt,
    initialMessages: l,
    initialAssistantMessage: d = St,
    buildTranscript: f = vt,
    onParsedValues: h,
    onError: m,
    onParseError: w
  } = e, y = Z(), v = t ?? y?.transport ?? null, E = !!v?.chat?.sendBuilderMessage, C = H(!1), N = J(() => l && l.length > 0 || !d ? null : typeof d == "string" ? {
    id: me(),
    role: "assistant",
    content: d,
    createdAt: he()
  } : d, [l, d]), [p, r] = T(() => l && l.length > 0 ? l : N ? [N] : []), [o, i] = T(!1), [a, c] = T(null), [n, b] = T("idle"), [g, S] = T(null), L = H(p);
  G(() => {
    L.current = p;
  }, [p]);
  const M = J(() => p.filter((I) => I.role === "user").length >= 1, [p]);
  C.current = M;
  const z = B(
    async (k) => {
      const I = k.trim();
      if (!I || o || !v?.chat?.sendBuilderMessage)
        return;
      const x = {
        id: me(),
        role: "user",
        content: I,
        createdAt: he()
      };
      r(($) => [...$, x]), i(!0), c(null);
      try {
        const $ = [...L.current, x].map((ee) => ({
          role: ee.role,
          content: ee.content
        })), U = {
          systemPrompt: s,
          messages: $
        }, q = await v.chat.sendBuilderMessage(U), Y = {
          id: q.message.id || me(),
          role: "assistant",
          content: q.message.content,
          createdAt: q.message.createdAt || he()
        };
        r((ee) => [...ee, Y]);
      } catch ($) {
        const U = K($, "Failed to send message");
        c(U), m?.(U);
      } finally {
        i(!1);
      }
    },
    [o, v, s, m]
  ), D = B(async () => {
    if (!C.current || !v?.characters?.parseSummary)
      return null;
    b("loading"), S(null);
    try {
      const k = f(L.current), I = await v.characters.parseSummary({ summary: k });
      return b("done"), h?.(I), I;
    } catch (k) {
      const I = K(k, "Failed to parse character");
      return S(I), b("error"), w?.(I), null;
    }
  }, [v, f, h, w]), O = B(() => {
    l && l.length > 0 ? r(l) : r(N ? [N] : []), i(!1), c(null), b("idle"), S(null);
  }, [l, N]), F = B(() => {
    c(null);
  }, []), _ = B(() => {
    S(null);
  }, []);
  return {
    messages: p,
    isSending: o,
    error: a,
    parseStatus: n,
    parseError: g,
    isAvailable: E,
    canParse: M,
    sendMessage: z,
    applyToForm: D,
    reset: O,
    clearError: F,
    clearParseError: _
  };
}
function wt(e) {
  return e === "user";
}
function Et(e) {
  const { message: t, isStreaming: s, classNames: l, styles: d, unstyled: f = !1 } = e, h = wt(t.role), m = f ? void 0 : {
    display: "flex",
    justifyContent: h ? "flex-end" : "flex-start",
    marginBottom: 8
  }, w = f ? void 0 : {
    maxWidth: "80%",
    padding: "10px 12px",
    borderRadius: "var(--eliza-chat-bubble-radius, 12px)",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    border: "1px solid var(--eliza-chat-bubble-border, rgba(0,0,0,0.1))",
    opacity: s ? 0.85 : 1,
    background: h ? "var(--eliza-chat-bubble-user-bg, #111827)" : "var(--eliza-chat-bubble-assistant-bg, #f3f4f6)",
    color: h ? "var(--eliza-chat-bubble-user-color, #f9fafb)" : "var(--eliza-chat-bubble-assistant-color, #111827)"
  }, y = m || d?.row ? { ...m, ...d?.row } : void 0, v = w || d?.bubble || (h ? d?.bubbleUser : d?.bubbleAssistant) ? {
    ...w,
    ...d?.bubble,
    ...h ? d?.bubbleUser : d?.bubbleAssistant
  } : void 0;
  return /* @__PURE__ */ u(
    "div",
    {
      ...j("row"),
      role: "listitem",
      className: P(l?.row),
      style: y,
      children: /* @__PURE__ */ A(
        "div",
        {
          ...j(h ? "bubbleUser" : "bubbleAssistant"),
          className: P(
            l?.bubble,
            h ? l?.bubbleUser : l?.bubbleAssistant
          ),
          style: v,
          children: [
            t.content,
            s ? /* @__PURE__ */ u("span", { "aria-hidden": "true", children: " ▍" }) : null
          ]
        }
      )
    }
  );
}
function Re(e) {
  const {
    messages: t,
    streamingContent: s = "",
    isStreaming: l = !1,
    className: d,
    renderMessage: f,
    classNames: h,
    styles: m,
    unstyled: w = !1
  } = e, y = w ? void 0 : { overflowY: "auto", padding: 12 }, v = w ? void 0 : { opacity: 0.7, padding: 8 }, E = w ? void 0 : { opacity: 0.7, padding: 8 }, C = (a, c) => f ? /* @__PURE__ */ u(
    "div",
    {
      ...j("row"),
      role: "listitem",
      className: P(h?.row),
      style: m?.row,
      children: f(a, { isStreaming: c })
    },
    a.id
  ) : /* @__PURE__ */ u(
    Et,
    {
      message: a,
      isStreaming: c,
      classNames: h,
      styles: m,
      unstyled: w
    },
    a.id
  ), p = l && s.trim().length > 0 ? {
    id: "__eliza_streaming__",
    role: "assistant",
    content: s,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  } : null, r = y || m?.root ? { ...y, ...m?.root } : void 0, o = v || m?.empty ? { ...v, ...m?.empty } : void 0, i = E || m?.typing ? { ...E, ...m?.typing } : void 0;
  return /* @__PURE__ */ A(
    "div",
    {
      ...ne("ChatMessages"),
      className: P(d, h?.root),
      role: "log",
      "aria-live": "polite",
      style: r,
      children: [
        t.length === 0 && !p ? /* @__PURE__ */ u(
          "div",
          {
            ...j("empty"),
            className: P(h?.empty),
            style: o,
            children: "No messages yet."
          }
        ) : null,
        /* @__PURE__ */ A(
          "div",
          {
            ...j("list"),
            role: "list",
            className: P(h?.list),
            style: m?.list,
            children: [
              t.map((a) => C(a, !1)),
              p ? C(p, !0) : null,
              l && !p ? /* @__PURE__ */ u(
                "div",
                {
                  ...j("typing"),
                  className: P(h?.typing),
                  style: i,
                  children: "Assistant is typing…"
                }
              ) : null
            ]
          }
        )
      ]
    }
  );
}
function Be(e) {
  const {
    onSend: t,
    disabled: s = !1,
    placeholder: l = "Type a message...",
    className: d,
    sendButtonLabel: f = "Send",
    classNames: h,
    styles: m,
    unstyled: w = !1
  } = e, [y, v] = T(""), E = H(null), C = w ? void 0 : {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))"
  }, N = w ? void 0 : {
    flex: 1,
    resize: "none",
    padding: "10px 12px",
    borderRadius: "var(--eliza-chat-input-radius, 10px)",
    border: "1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))",
    background: "var(--eliza-chat-input-bg, transparent)",
    font: "inherit"
  }, p = w ? void 0 : {
    padding: "10px 12px",
    borderRadius: "var(--eliza-chat-input-radius, 10px)",
    border: "1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))",
    background: s ? "var(--eliza-chat-send-bg-disabled, #e5e7eb)" : "var(--eliza-chat-send-bg, #111827)",
    color: s ? "var(--eliza-chat-send-color-disabled, #6b7280)" : "var(--eliza-chat-send-color, #f9fafb)",
    cursor: s ? "not-allowed" : "pointer"
  };
  G(() => {
    const n = E.current;
    n && (n.style.height = "auto", n.style.height = `${Math.min(n.scrollHeight, 140)}px`);
  }, [y]);
  const r = B(() => {
    if (s) return;
    const n = y.trim();
    if (!n) return;
    t(n), v("");
    const b = E.current;
    b && (b.style.height = "auto", b.focus());
  }, [s, t, y]), o = B(
    (n) => {
      n.key === "Enter" && (n.shiftKey || (n.preventDefault(), r()));
    },
    [r]
  ), i = C || m?.root ? { ...C, ...m?.root } : void 0, a = N || m?.textarea ? { ...N, ...m?.textarea } : void 0, c = p || m?.sendButton ? { ...p, ...m?.sendButton } : void 0;
  return /* @__PURE__ */ A(
    "div",
    {
      ...ne("ChatInput"),
      className: P(d, h?.root),
      style: i,
      children: [
        /* @__PURE__ */ u(
          "textarea",
          {
            ...j("textarea"),
            ref: E,
            value: y,
            onChange: (n) => v(n.target.value),
            onKeyDown: o,
            disabled: s,
            placeholder: l,
            rows: 1,
            "aria-label": "Chat message input",
            className: P(h?.textarea),
            style: a
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            ...j("sendButton"),
            type: "button",
            onClick: r,
            disabled: s || y.trim().length === 0,
            "aria-label": "Send message",
            className: P(h?.sendButton),
            style: c,
            children: f
          }
        )
      ]
    }
  );
}
function It(e) {
  const {
    messages: t,
    streamingContent: s = "",
    isStreaming: l = !1,
    error: d = null,
    onSend: f,
    onClearError: h,
    header: m,
    footer: w,
    renderMessage: y,
    inputPlaceholder: v = "Type a message...",
    sendButtonLabel: E = "Send",
    className: C,
    classNames: N,
    styles: p,
    messagesClassNames: r,
    messagesStyles: o,
    inputClassNames: i,
    inputStyles: a,
    unstyled: c = !1
  } = e, n = H(null), b = J(() => {
    const F = t[t.length - 1];
    return `${t.length}:${F?.id ?? ""}:${s.length}:${l ? "1" : "0"}`;
  }, [l, t, s.length]);
  G(() => {
    n.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [b]);
  const g = c ? void 0 : {
    display: "flex",
    flexDirection: "column"
  }, S = c ? void 0 : {
    marginBottom: 8,
    padding: 8,
    border: "1px solid var(--eliza-chat-error-border, #fca5a5)",
    background: "var(--eliza-chat-error-bg, #fee2e2)",
    color: "var(--eliza-chat-error-color, #7f1d1d)"
  }, L = c ? void 0 : {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  }, M = c ? void 0 : {
    flex: 1,
    minHeight: 0
  }, z = g || p?.root ? { ...g, ...p?.root } : void 0, D = S || p?.error ? { ...S, ...p?.error } : void 0, O = M || p?.messagesContainer ? { ...M, ...p?.messagesContainer } : void 0;
  return /* @__PURE__ */ A(
    "div",
    {
      ...ne("ChatView"),
      className: P(C, N?.root),
      style: z,
      children: [
        m ? /* @__PURE__ */ u(
          "div",
          {
            ...j("header"),
            className: P(N?.header),
            style: p?.header,
            children: m
          }
        ) : null,
        d ? /* @__PURE__ */ u(
          "div",
          {
            ...j("error"),
            role: "alert",
            className: P(N?.error),
            style: D,
            children: /* @__PURE__ */ A("div", { style: L, children: [
              /* @__PURE__ */ u(
                "div",
                {
                  ...j("errorMessage"),
                  className: P(N?.errorMessage),
                  style: p?.errorMessage,
                  children: d.message
                }
              ),
              /* @__PURE__ */ u(
                "button",
                {
                  ...j("errorDismiss"),
                  type: "button",
                  onClick: () => h?.(),
                  disabled: !h,
                  className: P(N?.errorDismiss),
                  style: p?.errorDismiss,
                  children: "Dismiss"
                }
              )
            ] })
          }
        ) : null,
        /* @__PURE__ */ A(
          "div",
          {
            ...j("messagesContainer"),
            className: P(N?.messagesContainer),
            style: O,
            children: [
              /* @__PURE__ */ u(
                Re,
                {
                  messages: t,
                  streamingContent: s,
                  isStreaming: l,
                  renderMessage: y,
                  classNames: r,
                  styles: o,
                  unstyled: c
                }
              ),
              /* @__PURE__ */ u("div", { ref: n })
            ]
          }
        ),
        /* @__PURE__ */ u(
          "div",
          {
            ...j("input"),
            className: P(N?.input),
            style: p?.input,
            children: /* @__PURE__ */ u(
              Be,
              {
                onSend: f,
                disabled: l,
                placeholder: v,
                sendButtonLabel: E,
                classNames: i,
                styles: a,
                unstyled: c
              }
            )
          }
        ),
        w ? /* @__PURE__ */ u(
          "div",
          {
            ...j("footer"),
            className: P(N?.footer),
            style: p?.footer,
            children: w
          }
        ) : null
      ]
    }
  );
}
function qt(e) {
  const {
    transport: t,
    characterId: s,
    header: l,
    footer: d,
    className: f,
    classNames: h,
    styles: m,
    messagesClassNames: w,
    messagesStyles: y,
    inputClassNames: v,
    inputStyles: E,
    unstyled: C = !1,
    initialConversationId: N = null,
    onConversationIdChange: p,
    renderMessage: r,
    inputPlaceholder: o = "Type a message...",
    sendButtonLabel: i = "Send",
    autoStart: a
  } = e, {
    messages: c,
    streamingContent: n,
    isStreaming: b,
    sendMessage: g,
    error: S,
    clearError: L
  } = bt({
    transport: t,
    characterId: s,
    initialConversationId: N,
    onConversationId: p
  }), M = H(!1);
  return G(() => {
    if (!a || M.current || b) return;
    const z = a.when === "always", D = c.length === 0 && !N;
    (z || D) && a.message.trim() && (M.current = !0, g(a.message));
  }, [a, c.length, b, N, g]), G(() => {
    M.current = !1;
  }, [s]), /* @__PURE__ */ u(
    It,
    {
      messages: c,
      streamingContent: n,
      isStreaming: b,
      error: S,
      onClearError: L,
      onSend: (z) => {
        g(z);
      },
      header: l,
      footer: d,
      renderMessage: r,
      inputPlaceholder: o,
      sendButtonLabel: i,
      className: f,
      classNames: h,
      styles: m,
      messagesClassNames: w,
      messagesStyles: y,
      inputClassNames: v,
      inputStyles: E,
      unstyled: C
    }
  );
}
function Ht(e) {
  const {
    transport: t,
    systemPrompt: s,
    initialAssistantMessage: l,
    onParsedValues: d,
    onError: f,
    onParseError: h,
    disabled: m = !1,
    renderMessage: w,
    inputPlaceholder: y = "Describe your character...",
    sendButtonLabel: v = "Send",
    applyButtonLabel: E = "Apply to Form",
    clearButtonLabel: C = "Clear Chat",
    readyHint: N = "Ready! Click to populate the form.",
    needsInfoHint: p = "Describe your character to get started.",
    successMessage: r = "Form populated! Edit and submit when ready.",
    unavailableMessage: o = "Character builder chat is not available. Use the manual form instead.",
    unstyled: i = !1,
    className: a,
    classNames: c,
    styles: n,
    messagesClassNames: b,
    messagesStyles: g,
    inputClassNames: S,
    inputStyles: L
  } = e, {
    messages: M,
    isSending: z,
    error: D,
    parseStatus: O,
    parseError: F,
    isAvailable: _,
    canParse: k,
    sendMessage: I,
    applyToForm: x,
    reset: $,
    clearError: U,
    clearParseError: q
  } = Ct({
    transport: t,
    systemPrompt: s,
    initialAssistantMessage: l,
    onParsedValues: d,
    onError: f,
    onParseError: h
  }), Y = H(null), ee = H(null);
  G(() => {
    Y.current?.scrollIntoView({ behavior: "smooth" });
  }, [M]), G(() => {
    z || ee.current?.focus();
  }, [z]);
  const je = B(
    (_e) => {
      m || I(_e);
    },
    [m, I]
  ), Fe = B(() => {
    m || x();
  }, [m, x]), Oe = B(() => {
    $();
  }, [$]), De = i ? void 0 : {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "300px"
  }, Ue = i ? void 0 : {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    flexWrap: "wrap"
  }, ae = i ? void 0 : {
    padding: "6px 12px",
    cursor: "pointer"
  }, Ve = i ? void 0 : {
    fontSize: "0.875rem",
    opacity: 0.7,
    marginLeft: "auto"
  }, qe = i ? void 0 : {
    padding: "8px",
    marginTop: "8px",
    borderRadius: "4px"
  }, ge = i ? void 0 : {
    padding: "8px",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  }, He = i ? void 0 : {
    padding: "16px",
    textAlign: "center",
    opacity: 0.7
  };
  return _ ? /* @__PURE__ */ A(
    "div",
    {
      ...ne("CharacterBuilderChat"),
      ...j("root"),
      className: P(a, c?.root),
      style: { ...De, ...n?.root },
      children: [
        /* @__PURE__ */ A(
          "div",
          {
            ...j("messages"),
            className: P(c?.messages),
            style: { flex: 1, overflow: "auto", ...n?.messages },
            children: [
              /* @__PURE__ */ u(
                Re,
                {
                  messages: M,
                  streamingContent: "",
                  isStreaming: z,
                  renderMessage: w,
                  classNames: b,
                  styles: g,
                  unstyled: i
                }
              ),
              /* @__PURE__ */ u("div", { ref: Y })
            ]
          }
        ),
        D && /* @__PURE__ */ A(
          "div",
          {
            ...j("error"),
            role: "alert",
            className: P(c?.error),
            style: { ...ge, ...n?.error },
            children: [
              /* @__PURE__ */ u("span", { children: D.message }),
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  onClick: U,
                  className: P(c?.clearButton),
                  style: ae,
                  children: "Dismiss"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ u(
          "div",
          {
            ...j("input"),
            className: P(c?.input),
            style: n?.input,
            children: /* @__PURE__ */ u(
              Be,
              {
                onSend: je,
                disabled: m || z,
                placeholder: y,
                sendButtonLabel: z ? "..." : v,
                classNames: S,
                styles: L,
                unstyled: i
              }
            )
          }
        ),
        /* @__PURE__ */ A(
          "div",
          {
            ...j("actions"),
            className: P(c?.actions),
            style: { ...Ue, ...n?.actions },
            children: [
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  ...j("applyButton"),
                  onClick: Fe,
                  disabled: m || !k || O === "loading",
                  className: P(c?.applyButton),
                  style: { ...ae, ...n?.applyButton },
                  children: O === "loading" ? "Applying..." : E
                }
              ),
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  ...j("clearButton"),
                  onClick: Oe,
                  disabled: m || M.length === 0,
                  className: P(c?.clearButton),
                  style: { ...ae, ...n?.clearButton },
                  children: C
                }
              ),
              /* @__PURE__ */ u(
                "span",
                {
                  ...j("hint"),
                  className: P(c?.hint),
                  style: { ...Ve, ...n?.hint },
                  children: k ? N : p
                }
              )
            ]
          }
        ),
        O === "error" && F && /* @__PURE__ */ A(
          "div",
          {
            ...j("parseError"),
            role: "alert",
            className: P(c?.parseError),
            style: { ...ge, ...n?.parseError },
            children: [
              /* @__PURE__ */ u("span", { children: F.message }),
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  onClick: q,
                  className: P(c?.clearButton),
                  style: ae,
                  children: "Dismiss"
                }
              )
            ]
          }
        ),
        O === "done" && /* @__PURE__ */ u(
          "div",
          {
            ...j("success"),
            className: P(c?.success),
            style: { ...qe, ...n?.success },
            children: r
          }
        )
      ]
    }
  ) : /* @__PURE__ */ u(
    "div",
    {
      ...ne("CharacterBuilderChat"),
      ...j("unavailable"),
      className: P(a, c?.unavailable),
      style: { ...He, ...n?.root, ...n?.unavailable },
      children: o
    }
  );
}
function _t(e) {
  const { collectionId: t, transport: s, limit: l = 10, autoLoad: d = !0, ownerAddress: f } = e, h = Z(), m = s ?? h?.transport ?? null, [w, y] = T([]), [v, E] = T(null), [C, N] = T(!1), [p, r] = T(null), [o, i] = T(null), [a, c] = T(!0), n = H(0), b = H(!0);
  G(() => (b.current = !0, () => {
    b.current = !1, n.current += 1;
  }), []);
  const g = J(() => ({
    setTokens: (z) => {
      b.current && y(z);
    },
    setCollection: (z) => {
      b.current && E(z);
    },
    setIsLoading: (z) => {
      b.current && N(z);
    },
    setError: (z) => {
      b.current && r(z);
    },
    setCursor: (z) => {
      b.current && i(z);
    },
    setHasMore: (z) => {
      b.current && c(z);
    }
  }), []), S = B(
    async (z, D) => {
      if (!m) {
        g.setError(
          new Error(
            "useCollectionTokens requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>."
          )
        );
        return;
      }
      if (!t) {
        g.setError(new Error("collectionId is required"));
        return;
      }
      const O = ++n.current;
      g.setIsLoading(!0), g.setError(null);
      try {
        const F = await m.nft.listCollectionTokens({
          collectionId: t,
          limit: l,
          cursor: z,
          ownerAddress: f
        });
        if (n.current !== O)
          return;
        g.setTokens(
          (_) => D === "append" ? [..._, ...F.tokens] : F.tokens
        ), g.setCollection(F.collection), g.setCursor(F.cursor), g.setHasMore(F.cursor !== null);
      } catch (F) {
        if (n.current !== O) return;
        g.setError(K(F, "Failed to load tokens"));
      } finally {
        if (n.current !== O) return;
        g.setIsLoading(!1);
      }
    },
    [t, l, f, g, m]
  ), L = B(async () => {
    C || a && await S(o ?? void 0, "append");
  }, [o, a, C, S]), M = B(async () => {
    n.current += 1, g.setTokens([]), g.setCollection(null), g.setCursor(null), g.setHasMore(!0), g.setError(null), await S(void 0, "replace");
  }, [S, g]);
  return G(() => {
    d && t && S(void 0, "replace");
  }, [d, t, S, m]), {
    tokens: w,
    collection: v,
    isLoading: C,
    error: p,
    hasMore: a,
    loadMore: L,
    refresh: M
  };
}
const fe = ze(null);
function Wt({
  hasAuth: e,
  walletAddress: t,
  children: s
}) {
  const d = Z()?.transport ?? null, [f, h] = T([]), [m, w] = T(""), [y, v] = T(!1), [E, C] = T(null), [N, p] = T("all"), [r, o] = T(""), [i, a] = T(!1), [c, n] = T(""), [b, g] = T(!1), [S, L] = T(null), [M, z] = T(null);
  G(() => {
    !t && N === "my" && p("all");
  }, [t, N]);
  const D = J(() => m ? f.find((x) => x.id === m) ?? null : null, [f, m]), O = B(async () => {
    if (d) {
      v(!0), C(null);
      try {
        const x = await d.nft.listCollections({ page: 1, pageSize: 50 });
        h(x.items), w(($) => $ || x.items[0]?.id || "");
      } catch (x) {
        h([]), C(K(x, "Failed to load collections").message);
      } finally {
        v(!1);
      }
    }
  }, [d]), F = B(
    async (x) => {
      if (!d || !D || b) return null;
      L(null), z(null), g(!0);
      try {
        const $ = await d.nft.provisionCharacter({
          chainId: D.chainId,
          contractAddress: D.contractAddress,
          tokenId: x,
          regenerate: i
        });
        return z($), $;
      } catch ($) {
        return L(K($, "Provision failed").message), null;
      } finally {
        g(!1);
      }
    },
    [b, i, D, d]
  ), _ = B(() => {
    L(null), z(null);
  }, []), k = !!m && !!c.trim() && !b, I = J(
    () => ({
      collections: f,
      isLoadingCollections: y,
      collectionsError: E,
      reloadCollections: O,
      selectedCollectionId: m,
      setSelectedCollectionId: w,
      selectedCollection: D,
      viewMode: N,
      setViewMode: p,
      searchQuery: r,
      setSearchQuery: o,
      regenerate: i,
      setRegenerate: a,
      manualTokenId: c,
      setManualTokenId: n,
      canManualProvision: k,
      isProvisioning: b,
      provisionError: S,
      lastResult: M,
      provisionByTokenId: F,
      clearProvisionStatus: _,
      hasAuth: e,
      walletAddress: t
    }),
    [
      f,
      y,
      E,
      O,
      m,
      D,
      N,
      r,
      i,
      c,
      k,
      b,
      S,
      M,
      F,
      _,
      e,
      t
    ]
  );
  return /* @__PURE__ */ u(fe.Provider, { value: I, children: s });
}
function Gt() {
  const e = pe(fe);
  if (!e)
    throw new Error("useNftBrowser must be used within an NftBrowserProvider");
  return e;
}
function Kt() {
  return pe(fe);
}
function Nt(e) {
  if (e)
    return e.startsWith("ipfs://") ? e.replace("ipfs://", "https://ipfs.io/ipfs/") : e;
}
function ke(e) {
  return e.length <= 8 ? e : `${e.slice(0, 6)}...`;
}
function Jt(e) {
  const {
    tokens: t,
    collection: s,
    isLoading: l,
    error: d,
    hasMore: f,
    onLoadMore: h,
    onSelectToken: m,
    disabled: w,
    className: y
  } = e;
  return d ? /* @__PURE__ */ A("div", { className: `alertError ${y ?? ""}`, role: "alert", children: [
    /* @__PURE__ */ u("span", { className: "statusErr", children: "[error]" }),
    " ",
    K(d).message
  ] }) : l && t.length === 0 ? /* @__PURE__ */ u("div", { className: `muted ${y ?? ""}`, style: { padding: 12 }, children: "loading tokens..." }) : !l && t.length === 0 ? /* @__PURE__ */ A("div", { className: `notice ${y ?? ""}`, children: [
    /* @__PURE__ */ u("span", { className: "statusWarn", children: "[info]" }),
    " No tokens found in this collection."
  ] }) : /* @__PURE__ */ A("div", { className: y, children: [
    s && /* @__PURE__ */ A("div", { className: "muted", style: { marginBottom: "var(--space-3, 12px)" }, children: [
      s.name,
      " (",
      t.length,
      " loaded)"
    ] }),
    /* @__PURE__ */ u("div", { className: "nft-grid", children: t.map((v) => /* @__PURE__ */ A(
      "button",
      {
        type: "button",
        onClick: () => m(v),
        disabled: w,
        className: "nft-token",
        style: {
          padding: 0,
          cursor: w ? "not-allowed" : "pointer",
          opacity: w ? 0.5 : 1
        },
        children: [
          /* @__PURE__ */ u(
            "div",
            {
              style: {
                width: "100%",
                aspectRatio: "1",
                background: "var(--color-bg-surface, #1a1a1a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              },
              children: v.imageUrl ? /* @__PURE__ */ u(
                "img",
                {
                  src: Nt(v.imageUrl),
                  alt: v.name || `Token ${v.tokenId}`,
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  },
                  onError: (E) => {
                    const C = E.target;
                    C.style.display = "none";
                    const N = C.parentElement;
                    N && (N.innerHTML = `<span style="color: var(--color-text-muted, #888); font-size: 10px;">#${ke(v.tokenId)}</span>`);
                  }
                }
              ) : /* @__PURE__ */ A("span", { className: "nft-token-id", children: [
                "#",
                ke(v.tokenId)
              ] })
            }
          ),
          /* @__PURE__ */ u("div", { className: "nft-token-info", children: /* @__PURE__ */ u("div", { className: "nft-token-name", children: v.name || `#${v.tokenId}` }) })
        ]
      },
      v.tokenId
    )) }),
    f && /* @__PURE__ */ u("div", { style: { marginTop: "var(--space-4, 16px)", textAlign: "center" }, children: /* @__PURE__ */ u(
      "button",
      {
        className: "button",
        type: "button",
        onClick: h,
        disabled: l || w,
        children: l ? "loading..." : "load more"
      }
    ) }),
    !f && t.length > 0 && /* @__PURE__ */ u("div", { className: "muted", style: { marginTop: "var(--space-4, 16px)", textAlign: "center" }, children: "end of collection" })
  ] });
}
function kt(e) {
  const t = e.trim();
  return t ? t.length <= 12 ? t : `${t.slice(0, 8)}...${t.slice(-4)}` : "-";
}
function zt(e) {
  return `${e.name || "(unnamed)"} - ${e.chainId} - ${kt(e.contractAddress)}`;
}
function Qt(e) {
  const {
    collections: t,
    selectedCollectionId: s,
    onCollectionChange: l,
    isLoadingCollections: d,
    viewMode: f,
    onViewModeChange: h,
    walletConnected: m,
    searchQuery: w,
    onSearchChange: y,
    disabled: v,
    className: E
  } = e;
  return /* @__PURE__ */ A("div", { className: `nftSidebarPanel ${E ?? ""}`, children: [
    /* @__PURE__ */ A("section", { className: "sidebar-section", "aria-labelledby": "sidebar-collection-header", children: [
      /* @__PURE__ */ u("h2", { id: "sidebar-collection-header", className: "sidebar-header", children: "COLLECTION" }),
      /* @__PURE__ */ A(
        "select",
        {
          className: "nft-collection-select",
          value: s,
          onChange: (C) => l(C.target.value),
          disabled: d || v,
          "aria-label": "Select NFT collection",
          children: [
            /* @__PURE__ */ u("option", { value: "", children: "(select a collection)" }),
            t.map((C) => /* @__PURE__ */ u("option", { value: C.id, children: zt(C) }, C.id))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ A("section", { className: "sidebar-section", "aria-labelledby": "sidebar-filters-header", children: [
      /* @__PURE__ */ u("h2", { id: "sidebar-filters-header", className: "sidebar-header", children: "FILTERS" }),
      /* @__PURE__ */ A("div", { className: "nft-filter-toggle", role: "group", "aria-label": "Token view mode", children: [
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: f === "my" ? "active" : "",
            onClick: () => h("my"),
            disabled: v || !m,
            title: m ? void 0 : "Connect wallet to view your tokens",
            "aria-pressed": f === "my",
            children: "my tokens"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: f === "all" ? "active" : "",
            onClick: () => h("all"),
            disabled: v,
            "aria-pressed": f === "all",
            children: "all tokens"
          }
        )
      ] }),
      /* @__PURE__ */ u(
        "input",
        {
          type: "text",
          className: "nft-search-input",
          placeholder: "Search by ID or name...",
          value: w,
          onChange: (C) => y(C.target.value),
          disabled: v,
          "aria-label": "Search tokens"
        }
      )
    ] })
  ] });
}
function Mt(e) {
  const t = e.trim();
  return t ? t.length <= 12 ? t : `${t.slice(0, 8)}...${t.slice(-4)}` : "-";
}
function Pt(e) {
  return `${e.name || "(unnamed)"} - ${e.chainId} - ${Mt(e.contractAddress)}`;
}
function Yt(e) {
  const {
    collections: t,
    selectedCollectionId: s,
    onCollectionChange: l,
    isLoadingCollections: d,
    viewMode: f,
    onViewModeChange: h,
    walletConnected: m,
    searchQuery: w,
    onSearchChange: y,
    regenerate: v,
    onRegenerateChange: E,
    manualTokenId: C,
    onManualTokenIdChange: N,
    onManualProvision: p,
    canManualProvision: r,
    isOpen: o,
    onClose: i,
    disabled: a,
    className: c,
    renderCharacters: n
  } = e, b = (g) => {
    g.preventDefault(), r && p();
  };
  return /* @__PURE__ */ A(
    "aside",
    {
      className: `collectionBrowserSidebar ${o ? "sidebarOpen" : ""} ${c ?? ""}`,
      "aria-label": "Collection Browser Filters",
      children: [
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "button sidebarCloseBtn",
            onClick: i,
            "aria-label": "Close filters",
            children: "close"
          }
        ),
        /* @__PURE__ */ A("section", { className: "browser-sidebar-section", "aria-labelledby": "sidebar-collection-header", children: [
          /* @__PURE__ */ u("h2", { id: "sidebar-collection-header", className: "browser-sidebar-header", children: "COLLECTION" }),
          /* @__PURE__ */ A(
            "select",
            {
              className: "browser-collection-select",
              value: s,
              onChange: (g) => l(g.target.value),
              disabled: d || a,
              "aria-label": "Select NFT collection",
              children: [
                /* @__PURE__ */ u("option", { value: "", children: "(select a collection)" }),
                t.map((g) => /* @__PURE__ */ u("option", { value: g.id, children: Pt(g) }, g.id))
              ]
            }
          ),
          /* @__PURE__ */ u("div", { className: "muted", style: { fontSize: "var(--text-xs, 10px)" }, children: d ? "loading..." : `${t.length} collection(s)` })
        ] }),
        /* @__PURE__ */ A("section", { className: "browser-sidebar-section", "aria-labelledby": "sidebar-filters-header", children: [
          /* @__PURE__ */ u("h2", { id: "sidebar-filters-header", className: "browser-sidebar-header", children: "FILTERS" }),
          /* @__PURE__ */ A("div", { className: "browser-filter-toggle", role: "group", "aria-label": "Token view mode", children: [
            /* @__PURE__ */ u(
              "button",
              {
                type: "button",
                className: f === "my" ? "active" : "",
                onClick: () => h("my"),
                disabled: a || !m,
                title: m ? void 0 : "Connect wallet to view your tokens",
                "aria-pressed": f === "my",
                children: "my tokens"
              }
            ),
            /* @__PURE__ */ u(
              "button",
              {
                type: "button",
                className: f === "all" ? "active" : "",
                onClick: () => h("all"),
                disabled: a,
                "aria-pressed": f === "all",
                children: "all tokens"
              }
            )
          ] }),
          /* @__PURE__ */ u(
            "input",
            {
              type: "text",
              className: "browser-search-input",
              placeholder: "Search by ID or name...",
              value: w,
              onChange: (g) => y(g.target.value),
              disabled: a,
              "aria-label": "Search tokens"
            }
          )
        ] }),
        /* @__PURE__ */ A("section", { className: "browser-sidebar-section", "aria-labelledby": "sidebar-settings-header", children: [
          /* @__PURE__ */ u("h2", { id: "sidebar-settings-header", className: "browser-sidebar-header", children: "SETTINGS" }),
          /* @__PURE__ */ A("label", { className: "browser-checkbox-row", children: [
            /* @__PURE__ */ u(
              "input",
              {
                type: "checkbox",
                checked: v,
                onChange: (g) => E(g.target.checked),
                disabled: a
              }
            ),
            /* @__PURE__ */ A("span", { className: "browser-checkbox-label", children: [
              /* @__PURE__ */ u("span", { children: "regenerate" }),
              /* @__PURE__ */ u("span", { className: "browser-checkbox-hint", children: "Rebuild character from fresh metadata" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ A("section", { className: "browser-sidebar-section", "aria-labelledby": "sidebar-quickprovision-header", children: [
          /* @__PURE__ */ u("h2", { id: "sidebar-quickprovision-header", className: "browser-sidebar-header", children: "QUICK PROVISION" }),
          /* @__PURE__ */ A("form", { onSubmit: b, className: "browser-quick-provision", children: [
            /* @__PURE__ */ u(
              "input",
              {
                type: "text",
                className: "browser-search-input",
                placeholder: "Token ID",
                value: C,
                onChange: (g) => N(g.target.value),
                disabled: a || !s,
                "aria-label": "Token ID for quick provision"
              }
            ),
            /* @__PURE__ */ u(
              "button",
              {
                type: "submit",
                className: "button buttonPrimary",
                disabled: a || !r,
                children: "go"
              }
            )
          ] }),
          !s && /* @__PURE__ */ u("div", { className: "muted", style: { fontSize: "var(--text-xs, 10px)" }, children: "Select a collection first" })
        ] }),
        /* @__PURE__ */ A(
          "section",
          {
            className: "browser-sidebar-section browser-characters-section",
            "aria-labelledby": "sidebar-characters-header",
            children: [
              /* @__PURE__ */ u("h2", { id: "sidebar-characters-header", className: "browser-sidebar-header", children: "CHARACTERS" }),
              s ? n ? n(s) : /* @__PURE__ */ u("div", { className: "muted", style: { fontSize: "var(--text-xs, 10px)" }, children: "Use renderCharacters prop to display characters" }) : /* @__PURE__ */ u("div", { className: "muted", style: { fontSize: "var(--text-xs, 10px)" }, children: "Select a collection to see characters" })
            ]
          }
        )
      ]
    }
  );
}
export {
  Ht as CharacterBuilderChat,
  Ut as CharacterSelector,
  ut as CharacterSelectorView,
  Be as ChatInput,
  Re as ChatMessages,
  qt as ChatPanel,
  It as ChatView,
  Qt as CollectionBrowserPanel,
  Yt as CollectionBrowserSidebar,
  Vt as CreateCharacterForm,
  Rt as ElizaProvider,
  R as FIELD_LIMITS,
  Wt as NftBrowserProvider,
  Jt as TokenBrowser,
  P as cn,
  jt as createClientTransport,
  Ft as createFetchTransport,
  $t as dataElizaAttrs,
  ne as dataElizaComponent,
  j as dataElizaSlot,
  $e as getDefaultFormValues,
  Nt as resolveIpfsUrl,
  Le as toCreateCharacterInput,
  K as toError,
  Ct as useBuilderChatSession,
  rt as useCharacters,
  bt as useChatSession,
  _t as useCollectionTokens,
  Dt as useCreateCharacterForm,
  Ke as useEliza,
  Bt as useElizaTransport,
  Gt as useNftBrowser,
  Z as useOptionalEliza,
  Kt as useOptionalNftBrowser,
  Ot as useSIWEAuth
};
//# sourceMappingURL=index.js.map

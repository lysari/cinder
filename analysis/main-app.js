this._encoder.handler(n, n.read())) !== p;) Array.isArray(o) ? r.push.apply(r, o) : r.push(o);
this._encoder = null
}
return new Uint8Array(r)
}
}
class z {
    constructor(e = "utf-8", t = {}) {
        this._encoding = null, this._decoder = null, this._ignoreBOM = !1, this._BOMseen = !1, this._error_mode = "replacement", this._do_not_flush = !1;
        const n = G(e);
        if (null === n || "replacement" == n.name) throw RangeError("Unknown encoding: " + e);
        if (!V[n.name]) throw Error("Decoder not present. Did you forget to include encoding-indexes.js first?");
        this._encoding = n, t.fatal && (this._error_mode = "fatal"), t.ignoreBOM && (this._ignoreBOM = !0)
    }
    get encoding() {
        return this._encoding.name.toLowerCase()
    }
    get fatal() {
        return "fatal" === this._error_mode
    }
    get ignoreBOM() {
        return this._ignoreBOM
    }
    decode(e, t = {}) {
        let n;
        n = "object" == typeof e && e instanceof ArrayBuffer ? new Uint8Array(e) : "object" == typeof e && "buffer" in e && e.buffer instanceof ArrayBuffer ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(0), this._do_not_flush || (this._decoder = V[this._encoding.name]({
            fatal: "fatal" === this._error_mode
        }), this._BOMseen = !1), this._do_not_flush = Boolean(t.stream);
        const r = new q(n),
            o = [];
        let i;
        for (;;) {
            const e = r.read();
            if (e === c) break;
            if (i = this._decoder.handler(r, e), i === p) break;
            null !== i && (Array.isArray(i) ? o.push.apply(o, i) : o.push(i))
        }
        if (!this._do_not_flush) {
            do {
                if (i = this._decoder.handler(r, r.read()), i === p) break;
                null !== i && (Array.isArray(i) ? o.push.apply(o, i) : o.push(i))
            } while (!r.endOfStream());
            this._decoder = null
        }
        return this.serializeStream(o)
    }
    serializeStream(e) {
        return !["UTF-8", "UTF-16LE", "UTF-16BE"].includes(this._encoding.name) || this._ignoreBOM || this._BOMseen || (e.length > 0 && 65279 === e[0] ? (this._BOMseen = !0, e.shift()) : e.length > 0 && (this._BOMseen = !0)),
            function(e) {
                for (var t = "", n = 0; n < e.length; ++n) {
                    var r = e[n];
                    r <= 65535 ? t += String.fromCharCode(r) : (r -= 65536, t += String.fromCharCode(55296 + (r >> 10), 56320 + (1023 & r)))
                }
                return t
            }(e)
    }
}
}, 54742: (e, t, n) => {
        "use strict";
        var r = n(85477),
            o = n(72020),
            i = {
                TRANSITIONAL: 0,
                NONTRANSITIONAL: 1
            };

        function a(e) {
            return e.split("\0").map((function(e) {
                return e.normalize("NFC")
            })).join("\0")
        }

        function s(e) {
            for (var t = 0, n = o.length - 1; t <= n;) {
                var r = Math.floor((t + n) / 2),
                    i = o[r];
                if (i[0][0] <= e && i[0][1] >= e) return i;
                i[0][0] > e ? n = r - 1 : t = r + 1
            }
            return null
        }
        var l = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

        function u(e) {
            return e.replace(l, "_").length
        }
        var c = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2D]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDE2C-\uDE37\uDEDF-\uDEEA\uDF01-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDE30-\uDE40\uDEAB-\uDEB7]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD83A[\uDCD0-\uDCD6]|\uDB40[\uDD00-\uDDEF]/;

        function p(e, t) {
            "xn--" === e.substr(0, 4) && (e = r.toUnicode(e));
            var n = !1;
            (a(e) !== e || "-" === e[3] && "-" === e[4] || "-" === e[0] || "-" === e[e.length - 1] || -1 !== e.indexOf(".") || 0 === e.search(c)) && (n = !0);
            for (var o = u(e), l = 0; l < o; ++l) {
                var p = s(e.codePointAt(l));
                if (d === i.TRANSITIONAL && "valid" !== p[1] || d === i.NONTRANSITIONAL && "valid" !== p[1] && "deviation" !== p[1]) {
                    n = !0;
                    break
                }
            }
            return {
                label: e,
                error: n
            }
        }

        function d(e, t, n) {
            var r = function(e, t, n) {
                for (var r = !1, o = "", a = u(e), l = 0; l < a; ++l) {
                    var c = e.codePointAt(l),
                        p = s(c);
                    switch (p[1]) {
                        case "disallowed":
                            r = !0, o += String.fromCodePoint(c);
                            break;
                        case "ignored":
                            break;
                        case "mapped":
                            o += String.fromCodePoint.apply(String, p[2]);
                            break;
                        case "deviation":
                            o += n === i.TRANSITIONAL ? String.fromCodePoint.apply(String, p[2]) : String.fromCodePoint(c);
                            break;
                        case "valid":
                            o += String.fromCodePoint(c);
                            break;
                        case "disallowed_STD3_mapped":
                            t ? (r = !0, o += String.fromCodePoint(c)) : o += String.fromCodePoint.apply(String, p[2]);
                            break;
                        case "disallowed_STD3_valid":
                            t && (r = !0), o += String.fromCodePoint(c)
                    }
                }
                return {
                    string: o,
                    error: r
                }
            }(e, t, n);
            r.string = a(r.string);
            for (var o = r.string.split("."), l = 0; l < o.length; ++l) try {
                var c = p(o[l]);
                o[l] = c.label, r.error = r.error || c.error
            } catch (e) {
                r.error = !0
            }
            return {
                string: o.join("."),
                error: r.error
            }
        }
        e.exports.toASCII = function(e, t, n, o) {
            var i = d(e, t, n),
                a = i.string.split(".");
            if (a = a.map((function(e) {
                    try {
                        return r.toASCII(e)
                    } catch (t) {
                        return i.error = !0, e
                    }
                })), o) {
                var s = a.slice(0, a.length - 1).join(".").length;
                (s.length > 253 || 0 === s.length) && (i.error = !0);
                for (var l = 0; l < a.length; ++l)
                    if (a.length > 63 || 0 === a.length) {
                        i.error = !0;
                        break
                    }
            }
            return i.error ? null : a.join(".")
        }, e.exports.toUnicode = function(e, t) {
            var n = d(e, t, i.NONTRANSITIONAL);
            return {
                domain: n.string,
                error: n.error
            }
        }, e.exports.PROCESSING_OPTIONS = i
    }, 34727: (e, t, n) => {
        "use strict";
        n.r(t), n.d(t, {
            FIREFOO_RELEASE_CHANNEL: () => tr,
            logoutAndQuit: () => rr,
            mainWindow: () => er,
            newestLinuxVersion: () => cr,
            runAutoUpdater: () => ur
        });
        var r, o, i, a, s, l, u = n(70655),
            c = n(9669),
            p = n.n(c),
            d = n(72298),
            h = n(61572),
            f = n(71017),
            m = n.n(f),
            g = n(81249),
            y = n.n(g),
            v = n(77377),
            b = n.n(v),
            _ = n(32081),
            w = n(51384),
            E = n.n(w),
            O = n(22037),
            S = n.n(O);
        (l = r || (r = {})).Copy = "Copy", l.Rename = "Rename", l.Delete = "Delete", l.FetchOnly = "FetchOnly",
            function(e) {
                e.Running = "Running", e.Finished = "Finished", e.Canceled = "Canceled", e.Error = "Error", e.Pending = "Pending"
            }(o || (o = {})), (s = i || (i = {})).AuthCopy = "AuthCopy", s.Copy = "Copy", s.DataTransfer = "Transfer", s.BulkUpdate = "DocUpdate", s.Export = "Export", s.Import = "Import", s.RunScript = "RunScript", s.RtQuery = "RtQuery", s.AnalyzeCSV = "AnalyzeCSV", s.LoadCSV = "LoadCSV",
            function(e) {
                e.AuthGlobal = "AuthGlobal", e.AuthSpecific = "AuthSpecific", e.CopyGeneral = "CopyGeneral", e.DocUpdateGeneral = "DocUpdateGeneral", e.ImportGeneral = "ImportGeneral"
            }(a || (a = {}));
        var T = function(e, t) {
                return K(e.taskId, t)
            },
            A = n(4400),
            C = n.n(A),
            x = n(6113);
        let k, I, P = e => {
                !k || k.length < e ? (k = Buffer.allocUnsafe(128 * e), x.randomFillSync(k), I = 0) : I + e > k.length && (x.randomFillSync(k), I = 0), I += e
            },
            R = e => (P(e -= 0), k.subarray(I - e, I)),
            N = (e, t = 21) => ((e, t, n) => {
                let r = (2 << 31 - Math.clz32(e.length - 1 | 1)) - 1,
                    o = Math.ceil(1.6 * r * t / e.length);
                return (i = t) => {
                    let a = "";
                    for (;;) {
                        let t = n(o),
                            s = o;
                        for (; s--;)
                            if (a += e[t[s] & r] || "", a.length === i) return a
                    }
                }
            })(e, t, R);
        var j, D, L, B;
        (B = j || (j = {})).Log = "Log", B.Warn = "Warn", B.Error = "Error", (L = D || (D = {})).Sys = "Sys", L.User = "User", (new AbortController).signal;
        const M = require("node:util");
        var U = n.n(M);
        const F = require("node:stream");
        var V = n.n(F),
            q = null != process.platform ? {
                isOSX: "darwin" === process.platform,
                isWin32: "win32" === process.platform,
                isLinux: "linux" === process.platform
            } : {
                isOSX: navigator.platform.startsWith("Mac"),
                isWin32: navigator.platform.startsWith("Win"),
                isLinux: !navigator.platform.startsWith("Mac") && !navigator.platform.startsWith("Win")
            },
            G = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
            H = (new Set(G.split("").concat(["_", "-"])), function(e) {
                var t = N("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 1)();
                return e > 1 && (t += N(G, e - 1)()), t
            }),
            z = (C()({
                useNativeBigInt: !0
            }), function(e) {
                var t, n;
                return $(e), "string" == typeof e ? e : e instanceof Error ? null != e.stack ? null !== (t = e.stack) && void 0 !== t ? t : "Unknown error" : null != e.message ? e.message : "Unknown error" : null != e.stack ? null !== (n = e.stack) && void 0 !== n ? n : "Unknown error" : JSON.stringify(e, null, 2)
            }),
            $ = function(e) {
                var t, n;
                (null === (n = null === (t = null == e ? void 0 : e.config) || void 0 === t ? void 0 : t.headers) || void 0 === n ? void 0 : n.Authorization) && (e.config.headers.Authorization = "[Redacted]")
            };
        U().promisify(V().finished);
        var K = function(e, t) {
                return e.startsWith("".concat(t, "-"))
            },
            W = function(e, t) {
                return K(e.id, t)
            };

        function J(e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
            throw Error("[Immer] minified error nr: " + e + (n.length ? " " + n.map((function(e) {
                return "'" + e + "'"
            })).join(",") : "") + ". Find the full error at: https://bit.ly/3cXEKWf")
        }

        function Y(e) {
            return !!e && !!e[De]
        }

        function Q(e) {
            return !!e && (function(e) {
                if (!e || "object" != typeof e) return !1;
                var t = Object.getPrototypeOf(e);
                if (null === t) return !0;
                var n = Object.hasOwnProperty.call(t, "constructor") && t.constructor;
                return n === Object || "function" == typeof n && Function.toString.call(n) === Le
            }(e) || Array.isArray(e) || !!e[je] || !!e.constructor[je] || ne(e) || re(e))
        }

        function X(e, t, n) {
            void 0 === n && (n = !1), 0 === Z(e) ? (n ? Object.keys : Be)(e).forEach((function(r) {
                n && "symbol" == typeof r || t(r, e[r], e)
            })) : e.forEach((function(n, r) {
                return t(r, n, e)
            }))
        }

        function Z(e) {
            var t = e[De];
            return t ? t.i > 3 ? t.i - 4 : t.i : Array.isArray(e) ? 1 : ne(e) ? 2 : re(e) ? 3 : 0
        }

        function ee(e, t) {
            return 2 === Z(e) ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t)
        }

        function te(e, t, n) {
            var r = Z(e);
            2 === r ? e.set(t, n) : 3 === r ? (e.delete(t), e.add(n)) : e[t] = n
        }

        function ne(e) {
            return Ie && e instanceof Map
        }

        function re(e) {
            return Pe && e instanceof Set
        }

        function oe(e) {
            return e.o || e.t
        }

        function ie(e) {
            if (Array.isArray(e)) return Array.prototype.slice.call(e);
            var t = Me(e);
            delete t[De];
            for (var n = Be(t), r = 0; r < n.length; r++) {
                var o = n[r],
                    i = t[o];
                !1 === i.writable && (i.writable = !0, i.configurable = !0), (i.get || i.set) && (t[o] = {
                    configurable: !0,
                    writable: !0,
                    enumerable: i.enumerable,
                    value: e[o]
                })
            }
            return Object.create(Object.getPrototypeOf(e), t)
        }

        function ae(e, t) {
            return void 0 === t && (t = !1), le(e) || Y(e) || !Q(e) || (Z(e) > 1 && (e.set = e.add = e.clear = e.delete = se), Object.freeze(e), t && X(e, (function(e, t) {
                return ae(t, !0)
            }), !0)), e
        }

        function se() {
            J(2)
        }

        function le(e) {
            return null == e || "object" != typeof e || Object.isFrozen(e)
        }

        function ue(e) {
            var t = Ue[e];
            return t || J(18, e), t
        }

        function ce() {
            return xe
        }

        function pe(e, t) {
            t && (ue("Patches"), e.u = [], e.s = [], e.v = t)
        }

        function de(e) {
            he(e), e.p.forEach(me), e.p = null
        }

        function he(e) {
            e === xe && (xe = e.l)
        }

        function fe(e) {
            return xe = {
                p: [],
                l: xe,
                h: e,
                m: !0,
                _: 0
            }
        }

        function me(e) {
            var t = e[De];
            0 === t.i || 1 === t.i ? t.j() : t.O = !0
        }

        function ge(e, t) {
            t._ = t.p.length;
            var n = t.p[0],
                r = void 0 !== e && e !== n;
            return t.h.g || ue("ES5").S(t, e, r), r ? (n[De].P && (de(t), J(4)), Q(e) && (e = ye(t, e), t.l || be(t, e)), t.u && ue("Patches").M(n[De].t, e, t.u, t.s)) : e = ye(t, n, []), de(t), t.u && t.v(t.u, t.s), e !== Ne ? e : void 0
        }

        function ye(e, t, n) {
            if (le(t)) return t;
            var r = t[De];
            if (!r) return X(t, (function(o, i) {
                return ve(e, r, t, o, i, n)
            }), !0), t;
            if (r.A !== e) return t;
            if (!r.P) return be(e, r.t, !0), r.t;
            if (!r.I) {
                r.I = !0, r.A._--;
                var o = 4 === r.i || 5 === r.i ? r.o = ie(r.k) : r.o;
                X(3 === r.i ? new Set(o) : o, (function(t, i) {
                    return ve(e, r, o, t, i, n)
                })), be(e, o, !1), n && e.u && ue("Patches").R(r, n, e.u, e.s)
            }
            return r.o
        }

        function ve(e, t, n, r, o, i) {
            if (Y(o)) {
                var a = ye(e, o, i && t && 3 !== t.i && !ee(t.D, r) ? i.concat(r) : void 0);
                if (te(n, r, a), !Y(a)) return;
                e.m = !1
            }
            if (Q(o) && !le(o)) {
                if (!e.h.F && e._ < 1) return;
                ye(e, o), t && t.A.l || be(e, o)
            }
        }

        function be(e, t, n) {
            void 0 === n && (n = !1), e.h.F && e.m && ae(t, n)
        }

        function _e(e, t) {
            var n = e[De];
            return (n ? oe(n) : e)[t]
        }

        function we(e, t) {
            if (t in e)
                for (var n = Object.getPrototypeOf(e); n;) {
                    var r = Object.getOwnPropertyDescriptor(n, t);
                    if (r) return r;
                    n = Object.getPrototypeOf(n)
                }
        }

        function Ee(e) {
            e.P || (e.P = !0, e.l && Ee(e.l))
        }

        function Oe(e) {
            e.o || (e.o = ie(e.t))
        }

        function Se(e, t, n) {
            var r = ne(t) ? ue("MapSet").N(t, n) : re(t) ? ue("MapSet").T(t, n) : e.g ? function(e, t) {
                var n = Array.isArray(e),
                    r = {
                        i: n ? 1 : 0,
                        A: t ? t.A : ce(),
                        P: !1,
                        I: !1,
                        D: {},
                        l: t,
                        t: e,
                        k: null,
                        o: null,
                        j: null,
                        C: !1
                    },
                    o = r,
                    i = Fe;
                n && (o = [r], i = Ve);
                var a = Proxy.revocable(o, i),
                    s = a.revoke,
                    l = a.proxy;
                return r.k = l, r.j = s, l
            }(t, n) : ue("ES5").J(t, n);
            return (n ? n.A : ce()).p.push(r), r
        }

        function Te(e) {
            return Y(e) || J(22, e),
                function e(t) {
                    if (!Q(t)) return t;
                    var n, r = t[De],
                        o = Z(t);
                    if (r) {
                        if (!r.P && (r.i < 4 || !ue("ES5").K(r))) return r.t;
                        r.I = !0, n = Ae(t, o), r.I = !1
                    } else n = Ae(t, o);
                    return X(n, (function(t, o) {
                        r && function(e, t) {
                            return 2 === Z(e) ? e.get(t) : e[t]
                        }(r.t, t) === o || te(n, t, e(o))
                    })), 3 === o ? new Set(n) : n
                }(e)
        }

        function Ae(e, t) {
            switch (t) {
                case 2:
                    return new Map(e);
                case 3:
                    return Array.from(e)
            }
            return ie(e)
        }
        var Ce, xe, ke = "undefined" != typeof Symbol && "symbol" == typeof Symbol("x"),
            Ie = "undefined" != typeof Map,
            Pe = "undefined" != typeof Set,
            Re = "undefined" != typeof Proxy && void 0 !== Proxy.revocable && "undefined" != typeof Reflect,
            Ne = ke ? Symbol.for("immer-nothing") : ((Ce = {})["immer-nothing"] = !0, Ce),
            je = ke ? Symbol.for("immer-draftable") : "__$immer_draftable",
            De = ke ? Symbol.for("immer-state") : "__$immer_state",
            Le = ("undefined" != typeof Symbol && Symbol.iterator, "" + Object.prototype.constructor),
            Be = "undefined" != typeof Reflect && Reflect.ownKeys ? Reflect.ownKeys : void 0 !== Object.getOwnPropertySymbols ? function(e) {
                return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))
            } : Object.getOwnPropertyNames,
            Me = Object.getOwnPropertyDescriptors || function(e) {
                var t = {};
                return Be(e).forEach((function(n) {
                    t[n] = Object.getOwnPropertyDescriptor(e, n)
                })), t
            },
            Ue = {},
            Fe = {
                get: function(e, t) {
                    if (t === De) return e;
                    var n = oe(e);
                    if (!ee(n, t)) return function(e, t, n) {
                        var r, o = we(t, n);
                        return o ? "value" in o ? o.value : null === (r = o.get) || void 0 === r ? void 0 : r.call(e.k) : void 0
                    }(e, n, t);
                    var r = n[t];
                    return e.I || !Q(r) ? r : r === _e(e.t, t) ? (Oe(e), e.o[t] = Se(e.A.h, r, e)) : r
                },
                has: function(e, t) {
                    return t in oe(e)
                },
                ownKeys: function(e) {
                    return Reflect.ownKeys(oe(e))
                },
                set: function(e, t, n) {
                    var r = we(oe(e), t);
                    if (null == r ? void 0 : r.set) return r.set.call(e.k, n), !0;
                    if (!e.P) {
                        var o = _e(oe(e), t),
                            i = null == o ? void 0 : o[De];
                        if (i && i.t === n) return e.o[t] = n, e.D[t] = !1, !0;
                        if (function(e, t) {
                                return e === t ? 0 !== e || 1 / e == 1 / t : e != e && t != t
                            }(n, o) && (void 0 !== n || ee(e.t, t))) return !0;
                        Oe(e), Ee(e)
                    }
                    return e.o[t] === n && "number" != typeof n && (void 0 !== n || t in e.o) || (e.o[t] = n, e.D[t] = !0, !0)
                },
                deleteProperty: function(e, t) {
                    return void 0 !== _e(e.t, t) || t in e.t ? (e.D[t] = !1, Oe(e), Ee(e)) : delete e.D[t], e.o && delete e.o[t], !0
                },
                getOwnPropertyDescriptor: function(e, t) {
                    var n = oe(e),
                        r = Reflect.getOwnPropertyDescriptor(n, t);
                    return r ? {
                        writable: !0,
                        configurable: 1 !== e.i || "length" !== t,
                        enumerable: r.enumerable,
                        value: n[t]
                    } : r
                },
                defineProperty: function() {
                    J(11)
                },
                getPrototypeOf: function(e) {
                    return Object.getPrototypeOf(e.t)
                },
                setPrototypeOf: function() {
                    J(12)
                }
            },
            Ve = {};
        X(Fe, (function(e, t) {
            Ve[e] = function() {
                return arguments[0] = arguments[0][0], t.apply(this, arguments)
            }
        })), Ve.deleteProperty = function(e, t) {
            return Ve.set.call(this, e, t, void 0)
        }, Ve.set = function(e, t, n) {
            return Fe.set.call(this, e[0], t, n, e[0])
        };
        var qe = function() {
                function e(e) {
                    var t = this;
                    this.g = Re, this.F = !0, this.produce = function(e, n, r) {
                        if ("function" == typeof e && "function" != typeof n) {
                            var o = n;
                            n = e;
                            var i = t;
                            return function(e) {
                                var t = this;
                                void 0 === e && (e = o);
                                for (var r = arguments.length, a = Array(r > 1 ? r - 1 : 0), s = 1; s < r; s++) a[s - 1] = arguments[s];
                                return i.produce(e, (function(e) {
                                    var r;
                                    return (r = n).call.apply(r, [t, e].concat(a))
                                }))
                            }
                        }
                        var a;
                        if ("function" != typeof n && J(6), void 0 !== r && "function" != typeof r && J(7), Q(e)) {
                            var s = fe(t),
                                l = Se(t, e, void 0),
                                u = !0;
                            try {
                                a = n(l), u = !1
                            } finally {
                                u ? de(s) : he(s)
                            }
                            return "undefined" != typeof Promise && a instanceof Promise ? a.then((function(e) {
                                return pe(s, r), ge(e, s)
                            }), (function(e) {
                                throw de(s), e
                            })) : (pe(s, r), ge(a, s))
                        }
                        if (!e || "object" != typeof e) {
                            if (void 0 === (a = n(e)) && (a = e), a === Ne && (a = void 0), t.F && ae(a, !0), r) {
                                var c = [],
                                    p = [];
                                ue("Patches").M(e, a, c, p), r(c, p)
                            }
                            return a
                        }
                        J(21, e)
                    }, this.produceWithPatches = function(e, n) {
                        if ("function" == typeof e) return function(n) {
                            for (var r = arguments.length, o = Array(r > 1 ? r - 1 : 0), i = 1; i < r; i++) o[i - 1] = arguments[i];
                            return t.produceWithPatches(n, (function(t) {
                                return e.apply(void 0, [t].concat(o))
                            }))
                        };
                        var r, o, i = t.produce(e, n, (function(e, t) {
                            r = e, o = t
                        }));
                        return "undefined" != typeof Promise && i instanceof Promise ? i.then((function(e) {
                            return [e, r, o]
                        })) : [i, r, o]
                    }, "boolean" == typeof(null == e ? void 0 : e.useProxies) && this.setUseProxies(e.useProxies), "boolean" == typeof(null == e ? void 0 : e.autoFreeze) && this.setAutoFreeze(e.autoFreeze)
                }
                var t = e.prototype;
                return t.createDraft = function(e) {
                    Q(e) || J(8), Y(e) && (e = Te(e));
                    var t = fe(this),
                        n = Se(this, e, void 0);
                    return n[De].C = !0, he(t), n
                }, t.finishDraft = function(e, t) {
                    var n = (e && e[De]).A;
                    return pe(n, t), ge(void 0, n)
                }, t.setAutoFreeze = function(e) {
                    this.F = e
                }, t.setUseProxies = function(e) {
                    e && !Re && J(20), this.g = e
                }, t.applyPatches = function(e, t) {
                    var n;
                    for (n = t.length - 1; n >= 0; n--) {
                        var r = t[n];
                        if (0 === r.path.length && "replace" === r.op) {
                            e = r.value;
                            break
                        }
                    }
                    n > -1 && (t = t.slice(n + 1));
                    var o = ue("Patches").$;
                    return Y(e) ? o(e, t) : this.produce(e, (function(e) {
                        return o(e, t)
                    }))
                }, e
            }(),
            Ge = new qe,
            He = Ge.produce;
        Ge.produceWithPatches.bind(Ge), Ge.setAutoFreeze.bind(Ge), Ge.setUseProxies.bind(Ge), Ge.applyPatches.bind(Ge), Ge.createDraft.bind(Ge), Ge.finishDraft.bind(Ge);
        var ze = function(e) {
                return Object.entries(e)
            },
            $e = new qe;
        $e.setAutoFreeze(!1), $e.produce;
        var Ke, We, Je, Ye, Qe = function(e, t) {
                var n = t.payload,
                    r = n.id,
                    o = n.updateState;
                E().has(e.tasks, r) && (e.taskState[r] = (0, u.__assign)((0, u.__assign)({}, e.taskState[r]), o))
            },
            Xe = E().cloneDeep({
                tasks: {},
                taskUpdateQueue: [],
                taskState: {},
                taskSpecialState: {},
                taskSpecialUpdateQueue: []
            }),
            Ze = function(e) {
                var t, n, r, a;
                try {
                    for (var s = (0, u.__values)(e.taskUpdates), l = s.next(); !l.done; l = s.next()) {
                        var c = l.value;
                        Qe(Xe, {
                            type: "",
                            payload: {
                                id: c.taskId,
                                updateState: c.update
                            }
                        })
                    }
                } catch (e) {
                    t = {
                        error: e
                    }
                } finally {
                    try {
                        l && !l.done && (n = s.return) && n.call(s)
                    } finally {
                        if (t) throw t.error
                    }
                }! function(e, t) {
                    var n, r, o, a, s, l, c, p, d, h, f, m, g, y, v, b, _;
                    try {
                        for (var w = (0, u.__values)(t.payload), O = w.next(); !O.done; O = w.next()) {
                            var S = O.value;
                            T(S, i.AuthCopy) ? null !== (o = (p = e.taskSpecialState)[d = S.taskId]) && void 0 !== o || (p[d] = {
                                taskId: S.taskId,
                                errors: []
                            }) : T(S, i.Copy) ? null !== (a = (h = e.taskSpecialState)[f = S.taskId]) && void 0 !== a || (h[f] = {
                                taskId: S.taskId,
                                errors: []
                            }) : T(S, i.BulkUpdate) ? null !== (s = (m = e.taskSpecialState)[g = S.taskId]) && void 0 !== s || (m[g] = {
                                taskId: S.taskId,
                                errors: []
                            }) : T(S, i.Export) ? null !== (l = (y = e.taskSpecialState)[v = S.taskId]) && void 0 !== l || (y[v] = {
                                taskId: S.taskId,
                                errors: []
                            }) : T(S, i.Import) && (null !== (c = (b = e.taskSpecialState)[_ = S.taskId]) && void 0 !== c || (b[_] = {
                                taskId: S.taskId,
                                errors: []
                            }));
                            try {
                                var A = e.taskSpecialState[S.taskId];
                                A.errors = E().takeRight(A.errors.concat(S.errors), 1e4)
                            } catch (e) {
                                console.error("taskHelperApplyTaskSpecialUpdates", e)
                            }
                        }
                    } catch (e) {
                        n = {
                            error: e
                        }
                    } finally {
                        try {
                            O && !O.done && (r = w.return) && r.call(w)
                        } finally {
                            if (n) throw n.error
                        }
                    }
                }(Xe, {
                    type: "",
                    payload: e.taskSpecialUpdates
                });
                try {
                    for (var p = (0, u.__values)(e.taskUpdates), d = p.next(); !d.done; d = p.next())(c = d.value).update.status != o.Finished && c.update.status != o.Error && c.update.status != o.Canceled || (delete Xe.tasks[c.taskId], delete Xe.taskState[c.taskId], delete Xe.taskSpecialState[c.taskId])
                } catch (e) {
                    r = {
                        error: e
                    }
                } finally {
                    try {
                        d && !d.done && (a = p.return) && a.call(p)
                    } finally {
                        if (r) throw r.error
                    }
                }
                var h, f = (h = Xe.tasks, Object.keys(h));
                f.length > 200 && (f.sort((function(e) {
                    return Xe.taskState[e].startTime
                })).slice(), f.forEach((function(e) {
                    delete Xe.tasks[e], delete Xe.taskState[e], delete Xe.taskSpecialState[e]
                })))
            };
        (Ye = Ke || (Ke = {})).UserAccount = "UserAccount", Ye.ServiceAccount = "ServiceAccount",
            function(e) {
                e.Fetching = "Fetching", e.Finished = "Finished", e.Error = "Error"
            }(We || (We = {}));
        var et, tt = ((Je = {})[Ke.UserAccount] = {}, Je[Ke.ServiceAccount] = {}, Je);
        ! function(e) {
            e.Task = "Task", e.CancelProcess = "CancelProcess", e.KillProcess = "KillProcess"
        }(et || (et = {}));
        var nt, rt, ot, it, at, st, lt, ut, ct = function(e, t) {
                return e.type == t
            },
            pt = function() {
                d.ipcMain.on("f2p-message", (function(e, t) {
                    var n, r, i = (n = t, (0, u.__assign)((0, u.__assign)({}, n), {
                        _aux: {
                            accountKeys: tt
                        }
                    }));
                    ct(i, et.CancelProcess) ? vt(i) : ct(i, et.Task) ? (_t(i), r = i.payload, function(e, t) {
                        var n = t.payload.task;
                        e.tasks[n.id] = n, e.taskState[n.id] = {
                            description: t.payload.description,
                            status: o.Pending,
                            startTime: Date.now(),
                            reads: 0,
                            writes: 0,
                            deletes: 0
                        }
                    }(Xe, {
                        type: "",
                        payload: {
                            task: r,
                            description: ""
                        }
                    })) : t.type == et.KillProcess && yt(t.requestId)
                }))
            },
            dt = function(e) {
                try {
                    "TaskBundledUpdate" == e.type && Ze(e), er.webContents.send("b2f-message", e)
                } catch (t) {
                    console.error("could not send message to frontend. ".concat(JSON.stringify(e)))
                }
            },
            ht = S().totalmem() > 1e10 ? 4 : 2,
            ft = [],
            mt = {},
            gt = [],
            yt = function(e) {
                var t = mt[e];
                null != t && (t.process.kill("SIGKILL"), delete mt[e]);
                var n = ft.findIndex((function(t) {
                    return t.payload.id === e
                })); - 1 != n && (ft.splice(n, 1), dt({
                    type: "TaskBundledUpdate",
                    logMessages: [],
                    taskSpecialUpdates: [],
                    taskUpdates: [{
                        taskId: e,
                        update: {
                            status: o.Canceled
                        }
                    }]
                })), bt()
            },
            vt = function(e) {
                var t, n = (t = e.requestId, mt[t]);
                null != n && n.process.send(e);
                var r = ft.findIndex((function(t) {
                    return t.payload.id == e.requestId
                })); - 1 != r && (ft.splice(r, 1), dt({
                    type: "TaskBundledUpdate",
                    logMessages: [],
                    taskSpecialUpdates: [],
                    taskUpdates: [{
                        taskId: e.requestId,
                        update: {
                            status: o.Canceled
                        }
                    }]
                })), bt()
            },
            bt = function() {
                for (; E().size(mt) < ht && 0 != ft.length;) {
                    var e = ft.shift();
                    null != e && wt(e.payload).send(e)
                }
            },
            _t = function(e) {
                (function(e) {
                    return W(e, i.RunScript)
                })(e.payload) || W(e.payload, i.AnalyzeCSV) || W(e.payload, i.LoadCSV) ? wt(e.payload).send(e) : (ft.push(e), bt())
            },
            wt = function(e) {
                var t = Et();
                return E().has(mt, e.id) && mt[e.id].process.kill(), mt[e.id] = {
                    process: t,
                    meta: e
                }, t.on("message", (function(e) {
                    dt(e)
                })), t.on("exit", (function(t, n) {
                    var r = mt[e.id];
                    delete mt[e.id], bt(), 0 != t && null != r && dt({
                        type: "TaskBundledUpdate",
                        logMessages: [],
                        taskSpecialUpdates: [],
                        taskUpdates: [{
                            taskId: e.id,
                            update: {
                                status: o.Error,
                                error: {
                                    message: "Process exited with code: ".concat(t, " Signals: ").concat(JSON.stringify(n), " (Probably ran out of memory)")
                                }
                            }
                        }]
                    })
                })), t.stdout && (t.stdout.setEncoding("utf8"), t.stdout.on("data", (function(e) {
                    E().isString(e) && (e = E().trimEnd(e, "\n")), console.log("ffprocess:" + e)
                }))), t.stderr && (t.stderr.setEncoding("utf8"), t.stderr.on("data", (function(e) {
                    E().isString(e) && (e = E().trimEnd(e, "\n")), console.error("ffprocess:" + e)
                }))), t
            },
            Et = function() {
                for (; gt.length < 1;) Ot();
                return gt.shift()
            },
            Ot = function() {
                var e = (0, _.fork)(m().join(__dirname, "ficoprocess.js"), [], {
                    stdio: ["pipe", "pipe", "pipe", "ipc"],
                    execArgv: ["--experimental-vm-modules", "--max-old-space-size=2048", "--max-semi-space-size=256"]
                });
                gt.push(e)
            },
            St = n(57147),
            Tt = "".concat((0, O.homedir)(), "/.firefoo/session.json"),
            At = {
                width: 1e3,
                height: 700,
                zoomFactor: .9128709291752769,
                h: void 0
            },
            Ct = E().cloneDeep(At),
            xt = (n(85882), {
                currTabIndex: void 0,
                numTabs: [0, 0],
                activeGroup: void 0,
                activeIds: [void 0, void 0]
            });
        ! function(e) {
            e.Script = "Script", e.Data = "Data", e.Log = "Log"
        }(nt || (nt = {})),
        function(e) {
            e[e.Even = 0] = "Even", e[e.Odd = 1] = "Odd"
        }(rt || (rt = {})),
        function(e) {
            e.GUI = "GUI", e.JavaScript = "JavaScript"
        }(ot || (ot = {})),
        function(e) {
            e.Tree = "Tree", e.Table = "Table", e.JSON = "JSON"
        }(it || (it = {})),
        function(e) {
            e.Copy = "Copy", e.Duplicate = "Duplicate", e.Move = "Move", e.Rename = "Rename"
        }(at || (at = {})),
        function(e) {
            e.FocusUiElement = "FocusUiElement"
        }(st || (st = {})),
        function(e) {
            e.Editor = "Editor", e.Result = "Result", e.Sidebar = "Sidebar"
        }(lt || (lt = {})),
        function(e) {
            e.CommandPalette = "CommandPalette"
        }(ut || (ut = {}));
        var kt, It, Pt, Rt, Nt, jt, Dt = {
                1: {
                    type: lt.Editor,
                    element: ot.GUI
                },
                2: {
                    type: lt.Editor,
                    element: ot.JavaScript
                },
                4: {
                    type: lt.Result,
                    element: it.Table
                },
                5: {
                    type: lt.Result,
                    element: it.Tree
                },
                6: {
                    type: lt.Result,
                    element: it.JSON
                },
                7: {
                    type: lt.Result,
                    element: nt.Log
                },
                A: {
                    type: lt.Sidebar,
                    element: "Sidebar"
                },
                S: {
                    type: lt.Sidebar,
                    element: "Favourites"
                },
                D: {
                    type: lt.Sidebar,
                    element: "Tasks"
                }
            },
            Lt = (q.isOSX && (kt = Dt, It = ["A", "S", "D"], E().omit(kt, It)), function(e) {
                return {
                    type: "TabsSwitchToTab",
                    index: e
                }
            }),
            Bt = function(e) {
                return {
                    type: st.FocusUiElement,
                    focus: e
                }
            },
            Mt = function(e) {
                return {
                    type: "OpenModal",
                    modalType: e
                }
            },
            Ut = function(e, t) {
                return {
                    type: "UpdateAvailable",
                    updateState: e,
                    newAppVersion: t
                }
            };
        ! function(e) {
            e.Available = "Available", e.Downloaded = "Downloaded", e.Unavailable = "Unavailable"
        }(Rt || (Rt = {})),
        function(e) {
            e.Always = "Always", e.Cautious = "Cautious", e.Never = "Never"
        }(Nt || (Nt = {})),
        function(e) {
            e.Stable = "Stable", e.Beta = "Beta", e.Newest = "Newest"
        }(jt || (jt = {})), (Pt = {})[jt.Stable] = "The Mainline version of Firefoo", Pt[jt.Beta] = "The Beta version of Firefoo, may be unstable", Pt[jt.Newest] = "The newest version of Firefoo either Stable or Beta, may be unstable";
        var Ft, Vt = n(81354),
            qt = n.n(Vt);
        ! function(e) {
            e[e.Login = 1] = "Login", e[e.Running = 2] = "Running", e[e.Logout = 4] = "Logout"
        }(Ft || (Ft = {}));
        var Gt, Ht, zt = function(e) {
                return new Promise((function(t, n) {
                    function r(e, n) {
                        "normal" != e.type && "radio" != e.type && "checkbox" != e.type && null != e.type || (e.click = function() {
                            return t(n)
                        }), Array.isArray(e.submenu) && e.submenu.forEach((function(e, t) {
                            r(e, n.concat(t))
                        }))
                    }
                    e.menu.forEach((function(e, t) {
                        return r(e, [t])
                    })), d.Menu.buildFromTemplate(e.menu).popup({
                        x: e.x,
                        y: e.y,
                        callback: function() {
                            return n()
                        }
                    })
                }))
            },
            $t = n(73210),
            Kt = {
                clientId: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
                clientSecret: "j9iVZfS8kkCEFUPaAeJV0sAi",
                scopes: ["openid", "email", "https://www.googleapis.com/auth/cloudplatformprojects.readonly", "https://www.googleapis.com/auth/firebase", "https://www.googleapis.com/auth/cloud-platform"]
            };
        (Ht = Gt || (Gt = {})).Online = "Online", Ht.Emulator = "Emulator", Gt.Online, Ke.ServiceAccount;
        var Wt, Jt, Yt = n(37719),
            Qt = ((Wt = {})[Ke.UserAccount] = {}, Wt[Ke.ServiceAccount] = {}, Wt);

        function Xt(e, t, n) {
            var r;
            void 0 === t && (t = {});
            var o = "".concat(function(e) {
                return e.type == Gt.Emulator ? function(e) {
                    return "e".concat(e.emulatorId)
                }(e) : function(e) {
                    return "o".concat(e.projectId)
                }(e)
            }(e), "-").concat(((e = 21) => {
                P(e -= 0);
                let t = "";
                for (let n = I - e; n < I; n++) t += "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict" [63 & k[n]];
                return t
            })(8));
            if (e.cert.type === Ke.ServiceAccount) {
                var i = tt.ServiceAccount[e.cert.email],
                    a = {
                        projectId: i.project_id,
                        clientEmail: i.client_email,
                        privateKey: i.private_key
                    },
                    s = (0, u.__assign)((0, u.__assign)({}, t), {
                        credential: $t.credential.cert(a)
                    });
                r = $t.initializeApp(s, o)
            } else {
                if (e.cert.type !== Ke.UserAccount) throw new Error("unreachable");
                var l = tt.UserAccount[e.cert.email],
                    c = function(e) {
                        if (null != Qt.UserAccount[e.user.email]) return Qt.UserAccount[e.user.email];
                        var t = new Yt.Auth.OAuth2Client({
                            clientId: Kt.clientId,
                            clientSecret: Kt.clientSecret
                        });
                        return t.setCredentials({
                            scope: Kt.scopes.join(" "),
                            access_token: e.tokens.access_token,
                            expiry_date: e.tokens.expires_at,
                            id_token: e.tokens.id_token,
                            refresh_token: e.tokens.refresh_token,
                            token_type: e.tokens.token_type
                        }), Qt.UserAccount[e.user.email] = t, t
                    }(tt.UserAccount[e.cert.email]),
                    p = {
                        clientId: Kt.clientId,
                        clientSecret: Kt.clientSecret,
                        refreshToken: l.tokens.refresh_token,
                        getClient: function() {
                            return Promise.resolve(c)
                        }
                    };
                r = $t.initializeApp((0, u.__assign)((0, u.__assign)({}, t), {
                    projectId: e.projectId,
                    __monkeyPatchedAuth: p
                }), o)
            }
            return e.type == Gt.Emulator && r.firestore().settings({
                host: "".concat(e.hostname, ":").concat(e.port),
                ssl: !1
            }), r
        }(Jt = {})[Ke.UserAccount] = {}, Jt[Ke.ServiceAccount] = {};
        var Zt, en, tn, nn = n(70148),
            rn = n(40940);
        (tn = en || (en = {})).arrayValue = "a", tn.booleanValue = "b", tn.bytesValue = "x", tn.doubleValue = "d", tn.fieldDocRefValue = "fr", tn.geoPointValue = "g", tn.integerValue = "i", tn.mapValue = "m", tn.nullValue = "n", tn.stringValue = "s", tn.timestampValue = "t", tn.collectionReferenceValue = "_cr", tn.documentReferenceValue = "_r", tn.documentSnapshotValue = "_ds", tn.queryDocumentSnapshotValue = "_qds", tn.querySnapshotValue = "_qs", tn.queryValue = "_q";
        var on, an, sn, ln, un, cn, pn, dn, hn = ((Zt = {})[en.arrayValue] = "Array", Zt[en.booleanValue] = "Boolean", Zt[en.bytesValue] = "Bytes", Zt[en.doubleValue] = "Double", Zt[en.fieldDocRefValue] = "Document Reference", Zt[en.geoPointValue] = "Geopoint", Zt[en.integerValue] = "Integer", Zt[en.mapValue] = "Map", Zt[en.nullValue] = "Null", Zt[en.stringValue] = "String", Zt[en.timestampValue] = "Timestamp", Zt[en.collectionReferenceValue] = "Collection Reference", Zt[en.documentReferenceValue] = "Document Reference", Zt[en.documentSnapshotValue] = "Document Snapshot", Zt[en.queryDocumentSnapshotValue] = "Query Document Snapshot", Zt[en.queryValue] = "Query", Zt[en.querySnapshotValue] = "Query Snapshot", Zt),
            fn = ([en.arrayValue, en.booleanValue, en.bytesValue, en.doubleValue, en.fieldDocRefValue, en.geoPointValue, en.integerValue, en.mapValue, en.nullValue, en.stringValue, en.timestampValue].map((function(e) {
                return {
                    value: e,
                    label: hn[e]
                }
            })), function(e) {
                return {
                    t: en.stringValue,
                    v: e
                }
            }),
            mn = function(e) {
                return {
                    t: en.bytesValue,
                    v: e
                }
            },
            gn = function(e) {
                return {
                    t: en.doubleValue,
                    v: e
                }
            },
            yn = function(e) {
                return {
                    t: en.integerValue,
                    v: e
                }
            },
            vn = function(e) {
                return {
                    t: en.booleanValue,
                    v: e
                }
            },
            bn = function() {
                return {
                    t: en.nullValue
                }
            },
            _n = function(e, t) {
                return {
                    t: en.geoPointValue,
                    lat: e,
                    lon: t
                }
            },
            wn = function(e) {
                return {
                    t: en.arrayValue,
                    v: e
                }
            },
            En = function(e) {
                return {
                    t: en.mapValue,
                    v: e
                }
            },
            On = function(e, t) {
                return {
                    t: en.timestampValue,
                    s: e,
                    ns: t
                }
            },
            Sn = function(e) {
                return {
                    t: en.fieldDocRefValue,
                    resourcePath: e.resourcePath,
                    projectId: e.db
                }
            };

        function Tn(e) {
            var t, n, r, o, i, a;
            if (null != e) {
                if (null != e.arrayValue) return wn((null !== (t = e.arrayValue.values) && void 0 !== t ? t : []).map(Tn));
                if (null != e.booleanValue) return vn(e.booleanValue);
                if (null != e.bytesValue) return mn(Buffer.from(e.bytesValue).toString("base64"));
                if (null != e.doubleValue) return gn(e.doubleValue);
                if (null != (null === (n = e.geoPointValue) || void 0 === n ? void 0 : n.latitude) && null != (null === (r = e.geoPointValue) || void 0 === r ? void 0 : r.longitude)) return _n(e.geoPointValue.latitude, e.geoPointValue.longitude);
                if (null != e.integerValue) return "number" == typeof e.integerValue ? yn(e.integerValue.toString()) : yn(e.integerValue);
                if (null != e.mapValue) return En(E().mapValues(null !== (o = e.mapValue.fields) && void 0 !== o ? o : {}, (function(e) {
                    return Tn(e)
                })));
                if (null != e.nullValue) return bn();
                if (null != e.referenceValue) {
                    var s = kn(e.referenceValue),
                        l = s.resourcePath,
                        u = s.projectId;
                    return Sn({
                        db: u,
                        resourcePath: l
                    })
                }
                if (null != e.stringValue) return fn(e.stringValue);
                if (null != (null === (i = e.timestampValue) || void 0 === i ? void 0 : i.seconds)) {
                    var c = "number" == typeof e.timestampValue.seconds ? e.timestampValue.seconds : Number(e.timestampValue.seconds);
                    return On(c, null !== (a = e.timestampValue.nanos) && void 0 !== a ? a : 0)
                }
                throw new Error("Unknown field value: ".concat(JSON.stringify(e)))
            }
        }

        function An(e) {
            if (null != e) return null != e.compositeFilter ? function(e) {
                if (null != e && e.op == sn.And && null != e.filters) return {
                    t: an.Composite,
                    op: sn.And,
                    filters: e.filters.map((function(e) {
                        return An(e)
                    }))
                }
            }(e.compositeFilter) : null != e.fieldFilter ? function(e) {
                if (null != e && null != e.op && null != e.field && "OPERATOR_UNSPECIFIED" != e.op && null != e.value) return {
                    t: an.Field,
                    op: e.op,
                    field: Cn(e.field),
                    value: Tn(e.value)
                }
            }(e.fieldFilter) : null != e.unaryFilter ? function(e) {
                if (null != e && null != e.op && null != e.field && "OPERATOR_UNSPECIFIED" != e.op) return {
                    t: an.Unary,
                    op: e.op,
                    field: Cn(e.field)
                }
            }(e.unaryFilter) : void 0
        }

        function Cn(e) {
            if (null != (null == e ? void 0 : e.fieldPath)) return function(e) {
                for (var t = [], n = "", r = !1, o = 0; o < e.length; ++o)
                    if ("" == n && "`" == e[o] && (r = !0, o += 1), r)
                        if ("\\" == e[o])
                            if ("\\" == e[o + 1]) n += "\\", o += 1;
                            else {
                                if ("`" != e[o + 1]) throw new Error('Invalid sequence "\\'.concat(e[o + 1], '"'));
                                n += "`", o += 1
                            }
                else "`" == e[o] ? r = !1 : n += e[o];
                else "." == e[o] ? (t.push(n), n = "") : n += e[o];
                return 0 != n.length && t.push(n), t
            }(e.fieldPath)
        }

        function xn(e) {
            if (null != (null == e ? void 0 : e.values)) return {
                inclusive: 1 == e.before,
                values: e.values.map((function(e) {
                    return Tn(e)
                }))
            }
        }(on = {})[en.nullValue] = function() {
            return bn()
        }, on[en.booleanValue] = function() {
                return vn(!1)
            }, on[en.bytesValue] = function() {
                return mn("AA==")
            }, on[en.integerValue] = function() {
                return yn("0")
            }, on[en.doubleValue] = function() {
                return gn(0)
            }, on[en.stringValue] = function() {
                return fn("")
            }, on[en.timestampValue] = function() {
                return 0, e = Math.floor(0), t = Math.floor(1e9 * (0 - e)), {
                    t: en.timestampValue,
                    s: e,
                    ns: t
                };
                var e, t
            }, on[en.geoPointValue] = function() {
                return _n(0, 0)
            }, on[en.fieldDocRefValue] = function(e) {
                return Sn({
                    db: e,
                    resourcePath: ["my-coll", "my-doc"]
                })
            }, on[en.arrayValue] = function() {
                return wn([])
            }, on[en.mapValue] = function() {
                return En({})
            },
            function(e) {
                e.Composite = "Composite", e.Field = "Field", e.Unary = "Unary"
            }(an || (an = {})),
            function(e) {
                e.And = "AND"
            }(sn || (sn = {})),
            function(e) {
                e.ArrayContains = "ARRAY_CONTAINS", e.ArrayContainsAny = "ARRAY_CONTAINS_ANY", e.Equal = "EQUAL", e.Greater = "GREATER_THAN", e.GreaterOrEqual = "GREATER_THAN_OR_EQUAL", e.In = "IN", e.Less = "LESS_THAN", e.LessOrEqual = "LESS_THAN_OR_EQUAL", e.NotEqual = "NOT_EQUAL", e.NotIn = "NOT_IN"
            }(ln || (ln = {})),
            function(e) {
                e.IsNan = "IS_NAN", e.IsNotNan = "IS_NOT_NAN", e.IsNotNull = "IS_NOT_NULL", e.IsNull = "IS_NULL"
            }(un || (un = {})),
            function(e) {
                e.Asc = "ASCENDING", e.Desc = "DESCENDING", e.DirUnspecified = "DIRECTION_UNSPECIFIED"
            }(cn || (cn = {})),
            function(e) {
                e.Database = "Database", e.Document = "Document", e.Collection = "Collection", e.Field = "Field"
            }(dn || (dn = {})), (pn = {})[dn.Database] = "Database", pn[dn.Document] = "Document", pn[dn.Collection] = "Collection", pn[dn.Field] = "Field";
        var kn = function(e) {
                var t = "projects/_/databases".length,
                    n = "/(default)/documents/".length,
                    r = e.indexOf("/", "projects/_".length),
                    o = e.slice("projects/".length, r),
                    i = e.indexOf("/(", t);
                return i + n >= e.length ? {
                    projectId: o,
                    resourcePath: []
                } : {
                    projectId: o,
                    resourcePath: e.slice(i + n).split("/")
                }
            },
            In = function(e) {
                if (E().has(e, "segments")) return e.segments
            },
            Pn = function(e, t) {
                var n = E().initial(e.path.split("/")),
                    r = e.id;
                return {
                    t: en.collectionReferenceValue,
                    docs: {},
                    collectionId: r,
                    parentPath: n,
                    db: e._firestore._projectId
                }
            },
            Rn = function(e, t) {
                var n, r, o = e,
                    i = e.toProto(),
                    a = i.structuredQuery,
                    s = i.parent;
                if (null == a || null == a.from || 1 != a.from.length) throw new Error("convertToFicoNodeFromQuery: invalid structuredQuery");
                if (null == a.from[0].collectionId) throw new Error("convertToFicoNodeFromQuery: structuredQuery.from[0].collectionId == null");
                if (null == s) throw new Error("convertToFicoNodeFromQuery: parent == null");
                var l = a.from[0],
                    u = kn(s).resourcePath,
                    c = {
                        isCollectionGroup: 1 == l.allDescendants,
                        resourcePath: u.concat(a.from[0].collectionId)
                    };
                return null != a.where && (c.filter = An(a.where)), null != a.orderBy && (c.orderBy = a.orderBy.map((function(e) {
                    return function(e) {
                        if (null != (null == e ? void 0 : e.direction) && null != (null == e ? void 0 : e.field)) return {
                            field: Cn(e.field),
                            direction: e.direction
                        }
                    }(e)
                }))), null != (null === (n = a.select) || void 0 === n ? void 0 : n.fields) && (c.select = a.select.fields.map((function(e) {
                    return Cn(e)
                }))), null != (null === (r = a.limit) || void 0 === r ? void 0 : r.value) && (c.limit = a.limit.value), null != a.offset && (c.offset = a.offset), null != a.startAt && (c.startCursor = xn(a.startAt)), null != a.endAt && (c.endCursor = xn(a.endAt)), 1 == o.limitType && function(e) {
                    e.limitFromLast = !0, null != e.orderBy && e.orderBy.forEach((function(e) {
                        e.direction = e.direction == cn.Desc ? cn.Asc : cn.Desc
                    }));
                    var t = e.startCursor,
                        n = e.endCursor;
                    null != t && (e.endCursor = {
                        values: t.values,
                        inclusive: !t.inclusive
                    }), null != n && (e.startCursor = {
                        values: n.values,
                        inclusive: !n.inclusive
                    })
                }(c), {
                    t: en.queryValue,
                    db: t.db,
                    query: c
                }
            },
            Nn = function(e) {
                var t = e;
                return {
                    collections: {},
                    t: en.documentReferenceValue,
                    resourcePath: t._path.segments,
                    db: t._firestore._projectId
                }
            },
            jn = function(e) {
                return null != e && (e instanceof nn.DocumentReference || e instanceof nn.QueryDocumentSnapshot || e instanceof nn.DocumentSnapshot || e instanceof nn.GeoPoint || e instanceof nn.Timestamp || e instanceof nn.CollectionReference || e instanceof nn.QuerySnapshot || e instanceof nn.Query || !!Array.isArray(e) && !E().isEmpty(e) && jn(e[0]))
            };

        function Dn(e, t, n, r) {
            if (null == e) return bn();
            var o = typeof e;
            if ("undefined" === o) return bn();
            if ("number" === o) return {
                t: en.doubleValue,
                v: e
            };
            if ("string" === o) return {
                t: en.stringValue,
                v: e
            };
            if ("boolean" === o) return {
                t: en.booleanValue,
                v: e
            };
            if (Array.isArray(e) && null == t) return {
                t: en.arrayValue,
                v: e.map((function(e) {
                    return Dn(e, void 0, 0, r)
                }))
            };
            if (e instanceof nn.CollectionReference) return Pn(e);
            if (e instanceof nn.QuerySnapshot) return function(e, t) {
                var n = e;
                return {
                    t: en.querySnapshotValue,
                    id: H(12),
                    docs: e.docs.map((function(e) {
                        return Dn(e, en.queryDocumentSnapshotValue, 0, t)
                    })),
                    db: n._query._firestore._projectId,
                    query: Rn(n._query, t).query
                }
            }(e, r);
            if (e instanceof nn.DocumentReference) return Nn(e);
            if (Array.isArray(e)) {
                if (t == en.documentReferenceValue) return function(e, t) {
                    return {
                        t: en.documentReferenceValue,
                        collections: Object.fromEntries(e.map((function(e) {
                            var t, n = Pn(e);
                            return [(t = n.collectionId, "~".concat(t)), n]
                        }))),
                        resourcePath: [],
                        db: t.db
                    }
                }(e, r);
                if (t == en.collectionReferenceValue) return wn(e.map((function(e) {
                    return Nn(e)
                })))
            } else {
                if (e instanceof nn.QueryDocumentSnapshot) return function(e) {
                    var t, n, r = e,
                        o = In(r._ref._path);
                    if (null == o) throw new Error("parse error, path is missing");
                    var i = {
                        t: en.queryDocumentSnapshotValue,
                        data: {},
                        resourcePath: o,
                        db: r._ref._firestore._projectId,
                        readTime: Bn(r._readTime)
                    };
                    if (e.exists) {
                        var a = Object.keys(r._fieldsProto);
                        a.sort();
                        try {
                            for (var s = (0, u.__values)(a), l = s.next(); !l.done; l = s.next()) {
                                var c = l.value;
                                i.data[c] = Ln(r._fieldsProto[c])
                            }
                        } catch (e) {
                            t = {
                                error: e
                            }
                        } finally {
                            try {
                                l && !l.done && (n = s.return) && n.call(s)
                            } finally {
                                if (t) throw t.error
                            }
                        }
                        i.updateTime = Bn(r._updateTime), i.createTime = Bn(r._createTime)
                    }
                    return i
                }(e);
                if (e instanceof nn.DocumentSnapshot) return function(e) {
                    var t, n, r = e,
                        o = In(r._ref._path);
                    if (null == o) throw new Error("parse error, path is missing");
                    var i = {
                        t: en.queryDocumentSnapshotValue,
                        data: {},
                        resourcePath: o,
                        db: r._ref._firestore._projectId,
                        readTime: Bn(r._readTime)
                    };
                    if (e.exists) {
                        var a = Object.keys(r._fieldsProto);
                        a.sort();
                        try {
                            for (var s = (0, u.__values)(a), l = s.next(); !l.done; l = s.next()) {
                                var c = l.value;
                                i.data[c] = Ln(r._fieldsProto[c]), i.createTime = Bn(r._createTime), i.updateTime = Bn(r._updateTime)
                            }
                        } catch (e) {
                            t = {
                                error: e
                            }
                        } finally {
                            try {
                                l && !l.done && (n = s.return) && n.call(s)
                            } finally {
                                if (t) throw t.error
                            }
                        }
                    }
                    return i
                }(e);
                if (e instanceof nn.Timestamp) return On(e.seconds, e.nanoseconds);
                if (e instanceof nn.GeoPoint) return _n(e.latitude, e.longitude);
                if (e instanceof rn.Query) return Rn(e, r)
            }
            throw new Error("convertToFicoNode not implemented for ".concat(JSON.stringify(e)))
        }
        var Ln = function(e) {
            var t, n;
            switch (e.valueType) {
                case "integerValue":
                    return yn(e.integerValue);
                case "doubleValue":
                    return gn(e.doubleValue);
                case "stringValue":
                    return fn(e.stringValue);
                case "mapValue":
                    var r = Object.keys(e.mapValue.fields);
                    r.sort();
                    var o = {};
                    try {
                        for (var i = (0, u.__values)(r), a = i.next(); !a.done; a = i.next()) {
                            var s = a.value;
                            o[s] = Ln(e.mapValue.fields[s])
                        }
                    } catch (e) {
                        t = {
                            error: e
                        }
                    } finally {
                        try {
                            a && !a.done && (n = i.return) && n.call(i)
                        } finally {
                            if (t) throw t.error
                        }
                    }
                    return En(o);
                case "arrayValue":
                    return wn(e.arrayValue.values.map(Ln));
                case "booleanValue":
                    return vn(e.booleanValue);
                case "bytesValue":
                    return mn(e.bytesValue.toString("base64"));
                case "timestampValue":
                    return On(Number(e.timestampValue.seconds), Number(e.timestampValue.nanos));
                case "geoPointValue":
                    return _n(e.geoPointValue.latitude, e.geoPointValue.longitude);
                case "nullValue":
                    return bn();
                case "referenceValue":
                    for (var l = e.referenceValue, c = "projects/".length, p = l.slice(c, l.indexOf("/", c + 1)), d = [], h = 0, f = 0; f < l.length; ++f)
                        if ("/" == l[f] && h++, 5 == h) {
                            d = l.slice(f + 1).split("/");
                            break
                        } return Sn({
                        resourcePath: d,
                        db: p
                    })
            }
            return e
        };

        function Bn(e) {
            return 1e3 * e._seconds + e._nanoseconds / 1e6
        }
        var Mn = function(e, t) {
            if (null == e) return bn();
            if (jn(e)) return Dn(e, void 0, 0, t);
            if (E().isArray(e)) return wn(e.map((function(e) {
                return Mn(e, t)
            })));
            if ("boolean" == typeof e) return vn(e);
            if ("number" == typeof e) return gn(e);
            if ("string" == typeof e) return fn(e);
            if ("object" == typeof e) {
                var n = Object.fromEntries(Object.entries(null != e ? e : {}).map((function(e) {
                    var n = (0, u.__read)(e, 2),
                        r = n[0],
                        o = n[1];
                    return [r, Mn(o, t)]
                })));
                return En(n)
            }
            throw new Error("unknown type")
        };
        const Un = require("vm");
        var Fn, Vn = n.n(Un),
            qn = new Map,
            Gn = function(e, t) {
                var n = e.script,
                    r = e.dbToken;
                return void 0 === t && (t = 1e4), (0, u.__awaiter)(void 0, void 0, Promise, (function() {
                    var e, o, i, a, s, l;
                    return (0, u.__generator)(this, (function(u) {
                        switch (u.label) {
                            case 0:
                                return e = JSON.stringify(r), qn.has(e) || qn.set(e, Xt(r)), o = qn.get(e), i = o.firestore(), a = {
                                    clearImmediate,
                                    clearInterval,
                                    clearTimeout,
                                    setImmediate,
                                    setInterval,
                                    setTimeout,
                                    db: i,
                                    FirebaseFirestore: $t.firestore,
                                    admin: $t,
                                    _: E()
                                }, s = Date.now(), [4, Hn(n, a, t)];
                            case 1:
                                return l = u.sent(), [2, Mn(l, {
                                    db: r.projectId,
                                    readTime: s
                                })]
                        }
                    }))
                }))
            },
            Hn = function(e, t, n) {
                return (0, u.__awaiter)(void 0, void 0, Promise, (function() {
                    var r;
                    return (0, u.__generator)(this, (function(o) {
                        switch (o.label) {
                            case 0:
                                return Vn().createContext(t), Vn().runInContext(e, t, {
                                    filename: "script.js",
                                    lineOffset: 0,
                                    timeout: n
                                }), [4, t.run()];
                            case 1:
                                r = o.sent(), o.label = 2;
                            case 2:
                                return r instanceof Promise ? [4, r] : [3, 4];
                            case 3:
                                return r = o.sent(), [3, 2];
                            case 4:
                                return [2, r]
                        }
                    }))
                }))
            },
            zn = function() {
                null == Fn ? ((Fn = new d.BrowserWindow({
                    height: 650,
                    width: 400,
                    resizable: !0,
                    parent: er,
                    title: "Firefoo Support Chat",
                    webPreferences: {}
                })).loadURL("https://app.chaport.com/widget/show.html?appid=607b1fb026c3821e0faa432e&connect=1"), Fn.webContents.on("new-window", (function(e, t) {
                    e.preventDefault(), d.shell.openExternal(t)
                })), Fn.on("page-title-updated", (function(e) {
                    return e.preventDefault()
                })), Fn.on("closed", (function() {
                    Fn = void 0
                }))) : (Fn.moveTop(), Fn.focus())
            },
            $n = function() {
                function e() {
                    this.tabInfo = xt, this.isScriptRunning = !1, this.update()
                }
                return e.prototype.setTabInfo = function(e) {
                        this.tabInfo = e, this.update()
                    }, e.prototype.setIsScriptRunnning = function(e) {
                        this.isScriptRunning = e, this.update()
                    }, e.prototype.getMoveToNextTabGroupLabel = function() {
                        if (0 == this.tabInfo.numTabs[0] && 0 != this.tabInfo.numTabs[1] || 0 == this.tabInfo.numTabs[1] && 0 != this.tabInfo.numTabs[0]) return "Tab Split View";
                        var e = 0 != this.tabInfo.numTabs[0] && 0 != this.tabInfo.numTabs[1] && 0 == this.tabInfo.activeGroup;
                        return "Move to ".concat(e ? "Right" : "Left", " Split View")
                    }, e.prototype.update = function() {
                        var e = this.tabInfo,
                            t = e.activeGroup,
                            n = e.currTabIndex,
                            r = null != t ? this.tabInfo.numTabs[t] : 0,
                            o = 0 !== r,
                            i = 0 === n,
                            a = null != t && n === r - 1,
                            s = function(e, t) {
                                return e ? t : []
                            },
                            l = (0, u.__spreadArray)((0, u.__spreadArray)([], (0, u.__read)(s(q.isOSX, [{
                                    label: d.app.name,
                                    submenu: [{
                                        label: "About ".concat(d.app.name, "…"),
                                        click: function() {
                                            return dt({
                                                type: "OpenAboutModal"
                                            })
                                        }
                                    }, {
                                        type: "separator"
                                    }, {
                                        label: "Settings…",
                                        accelerator: "CmdOrCtrl+,",
                                        click: function() {
                                            return dt({
                                                type: "OpenSettingsModal"
                                            })
                                        }
                                    }, {
                                        type: "separator"
                                    }, {
                                        label: "Services",
                                        role: "services",
                                        submenu: []
                                    }, {
                                        type: "separator"
                                    }, {
                                        label: "Hide ".concat(d.app.name),
                                        role: "hide"
                                    }, {
                                        label: "Hide Others",
                                        role: "hideOthers"
                                    }, {
                                        label: "Show All",
                                        role: "unhide"
                                    }, {
                                        type: "separator"
                                    }, {
                                        label: "Quit ".concat(d.app.name),
                                        accelerator: "Command+Q",
                                        click: function() {
                                            return rr()
                                        }
                                    }]
                                }])), !1), [{
                                        label: "File",
                                        role: "fileMenu",
                                        submenu: (0, u.__spreadArray)((0, u.__spreadArray)((0, u.__spreadArray)([], (0, u.__read)(s(!q.isOSX, [{
                                            label: "Settings…",
                                            accelerator: "CmdOrCtrl+,",
                                            click: function() {
                                                return dt({
                                                    type: "OpenSettingsModal"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }])), !1), [{
                                            label: "Add Firebase Project…",
                                            click: function() {
                                                return dt({
                                                    type: "OpenAddProjectModal"
                                                })
                                            }
                                        }, {
                                            label: "Import Service Account JSON File…",
                                            click: function() {
                                                return dt({
                                                    type: "ImportServiceAccountKey"
                                                })
                                            }
                                        }, {
                                            label: "Discover Local Emulators",
                                            click: function() {
                                                return dt({
                                                    type: "ScanForEmulators"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: "Save Query",
                                            accelerator: "CmdOrCtrl+S",
                                            enabled: null != n,
                                            click: function() {
                                                dt({
                                                    type: "SaveQuery"
                                                })
                                            }
                                        }, {
                                            label: "Run Query",
                                            accelerator: "CmdOrCtrl+Enter",
                                            enabled: null != n && !this.isScriptRunning,
                                            click: function() {
                                                dt({
                                                    type: "RunScript"
                                                })
                                            }
                                        }, {
                                            label: "Stop Query",
                                            accelerator: "Shift+F5",
                                            click: function() {
                                                return dt({
                                                    type: "StopScript"
                                                })
                                            }
                                        }], !1), (0, u.__read)(s(!q.isOSX, [{
                                            label: "Quit ".concat(d.app.name),
                                            click: function() {
                                                return rr()
                                            }
                                        }])), !1)
                                    }, {
                                        label: "Edit",
                                        submenu: [{
                                            label: "Undo",
                                            accelerator: "CmdOrCtrl+Z",
                                            click: function() {
                                                dt({
                                                    type: "Undo"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: "Cut",
                                            accelerator: "CmdOrCtrl+X",
                                            role: "cut"
                                        }, {
                                            label: "Copy",
                                            accelerator: "CmdOrCtrl+C",
                                            role: "copy"
                                        }, {
                                            label: "Paste",
                                            accelerator: "CmdOrCtrl+V",
                                            role: "paste"
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: "Select All",
                                            accelerator: "CmdOrCtrl+A",
                                            role: "selectAll"
                                        }]
                                    }, {
                                        label: "View",
                                        submenu: (0, u.__spreadArray)((0, u.__spreadArray)([{
                                            label: "Toggle Full Screen",
                                            accelerator: q.isOSX ? "Ctrl+Command+F" : "F11",
                                            click: function(e, t) {
                                                t && t.setFullScreen(!t.isFullScreen())
                                            }
                                        }, {
                                            type: "separator"
                                        }], (0, u.__read)(s(!1, [{
                                            label: "Reload",
                                            accelerator: "CmdOrCtrl+R",
                                            click: function(e, t) {
                                                t && t.reload()
                                            }
                                        }, {
                                            label: "Toggle Developer Tools",
                                            accelerator: q.isOSX ? "Alt+Command+I" : "Ctrl+Shift+I",
                                            click: function(e, t) {
                                                t && t.webContents.toggleDevTools()
                                            }
                                        }, {
                                            type: "separator"
                                        }])), !1), [{
                                            label: "Focus",
                                            enabled: o,
                                            submenu: [{
                                                label: "Simple Editor",
                                                accelerator: q.isOSX ? "Ctrl+1" : "Alt+1",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Editor,
                                                        element: ot.GUI
                                                    })
                                                }
                                            }, {
                                                label: "JS Editor",
                                                accelerator: q.isOSX ? "Ctrl+2" : "Alt+2",
                                                click: function() {
                                                    return dt(Bt({
                                                        type: lt.Editor,
                                                        element: ot.JavaScript
                                                    }))
                                                }
                                            }, {
                                                label: "Table Output",
                                                accelerator: q.isOSX ? "Ctrl+4" : "Alt+4",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Result,
                                                        element: it.Table
                                                    })
                                                }
                                            }, {
                                                label: "Tree Output",
                                                accelerator: q.isOSX ? "Ctrl+5" : "Alt+5",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Result,
                                                        element: it.Tree
                                                    })
                                                }
                                            }, {
                                                label: "JSON Output",
                                                accelerator: q.isOSX ? "Ctrl+6" : "Alt+6",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Result,
                                                        element: it.JSON
                                                    })
                                                }
                                            }, {
                                                label: "Logs",
                                                accelerator: q.isOSX ? "Ctrl+7" : "Alt+7",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Result,
                                                        element: nt.Log
                                                    })
                                                }
                                            }, {
                                                label: "Tasks",
                                                accelerator: q.isOSX ? "Ctrl+D" : "Alt+D",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Sidebar,
                                                        element: "Tasks"
                                                    })
                                                }
                                            }, {
                                                label: "Saved Queries",
                                                accelerator: q.isOSX ? "Ctrl+S" : "Alt+S",
                                                click: function() {
                                                    return Kn({
                                                        type: lt.Sidebar,
                                                        element: "Favourites"
                                                    })
                                                }
                                            }]
                                        }, {
                                            label: "Command Palette",
                                            accelerator: "CmdOrCtrl+P",
                                            click: function() {
                                                return dt(Mt(ut.CommandPalette))
                                            }
                                        }, {
                                            label: "Command Palette",
                                            accelerator: "CmdOrCtrl+Shift+P",
                                            visible: !1,
                                            click: function() {
                                                return dt(Mt(ut.CommandPalette))
                                            }
                                        }, {
                                            label: "Clear Logs",
                                            accelerator: "CmdOrCtrl+Shift+B",
                                            click: function() {
                                                return dt({
                                                    type: "MiscClearLogs"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: "Reset Size",
                                            role: "resetZoom",
                                            accelerator: "CmdOrCtrl+0"
                                        }, {
                                            role: "resetZoom",
                                            visible: !1,
                                            accelerator: "CmdOrCtrl+num0"
                                        }, {
                                            label: "Zoom In",
                                            role: "zoomIn",
                                            accelerator: "CmdOrCtrl+="
                                        }, {
                                            role: "zoomIn",
                                            visible: !1,
                                            accelerator: "CmdOrCtrl+numadd"
                                        }, {
                                            label: "Zoom Out",
                                            role: "zoomOut",
                                            accelerator: "CmdOrCtrl+-"
                                        }, {
                                            role: "zoomOut",
                                            visible: !1,
                                            accelerator: "CmdOrCtrl+numsub"
                                        }], !1)
                                    }, {
                                        label: "Tab",
                                        submenu: [{
                                            label: "Close Tab",
                                            enabled: o,
                                            accelerator: "CmdOrCtrl+W",
                                            click: function() {
                                                return dt({
                                                    type: "TabsCloseTab"
                                                })
                                            }
                                        }, {
                                            label: "Close Tabs to the Left",
                                            enabled: o && !i,
                                            click: function() {
                                                return dt({
                                                    type: "TabsCloseTabsToTheLeft"
                                                })
                                            }
                                        }, {
                                            label: "Close Tabs to the Right",
                                            enabled: o && !a,
                                            click: function() {
                                                return dt({
                                                    type: "TabsCloseTabsToTheRight"
                                                })
                                            }
                                        }, {
                                            label: "Close Other Tabs",
                                            enabled: o && o,
                                            click: function() {
                                                return dt({
                                                    type: "TabsCloseOtherTabs"
                                                })
                                            }
                                        }, {
                                            label: "Close All Tabs",
                                            enabled: o,
                                            click: function() {
                                                return dt({
                                                    type: "TabsCloseAllTabs"
                                                })
                                            }
                                        }, {
                                            label: "Restore Closed Tab",
                                            accelerator: "CmdOrCtrl+Shift+T",
                                            click: function() {
                                                return dt({
                                                    type: "TabsRestoreClosedTab"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: this.getMoveToNextTabGroupLabel(),
                                            accelerator: "CmdOrCtrl+'",
                                            click: function() {
                                                return dt({
                                                    type: "TabsMoveToNextTabGroup"
                                                })
                                            }
                                        }, {
                                            label: "Focus Next Tab Group",
                                            enabled: null != t && 0 != this.tabInfo.numTabs[1 - t],
                                            accelerator: "CmdOrCtrl+;",
                                            click: function() {
                                                return dt({
                                                    type: "TabsFocusNextTabGroup"
                                                })
                                            }
                                        }, {
                                            label: "Center Split",
                                            enabled: o && 0 != this.tabInfo.numTabs[1],
                                            click: function() {
                                                return dt({
                                                    type: "TabsCenterSplit"
                                                })
                                            }
                                        }, {
                                            label: "Duplicate Tab",
                                            enabled: o,
                                            click: function() {
                                                return dt({
                                                    type: "TabsDuplicateTab"
                                                })
                                            }
                                        }, {
                                            type: "separator"
                                        }, {
                                            label: "Switch Tabs",
                                            enabled: o,
                                            submenu: (0, u.__spreadArray)([{
                                                label: "Left",
                                                accelerator: "Ctrl+Shift+Tab",
                                                click: function() {
                                                    return dt({
                                                        type: "TabsSwitchToTabLeft"
                                                    })
                                                }
                                            }, {
                                                label: "Right",
                                                accelerator: "Ctrl+Tab",
                                                click: function() {
                                                    return dt({
                                                        type: "TabsSwitchToTabRight"
                                                    })
                                                }
                                            }, {
                                                type: "separator"
                                            }], (0, u.__read)(E().times(r, (function(e) {
                                                return (0, u.__assign)((0, u.__assign)({
                                                    label: "Tab ".concat(e + 1)
                                                }, e + 1 <= 9 ? {
                                                    accelerator: "CmdOrCtrl+".concat(e + 1)
                                                } : {}), {
                                                    click: function() {
                                                        return dt(Lt(e))
                                                    },
                                                    enabled: e !== n
                                                })
                                            }))), !1)
                                        }]
                                    }, {
                                        label: "Window",
                                        role: "window",
                                        submenu: [{
                                            label: "Minimize",
                                            role: "minimize",
                                            accelerator: "CmdOrCtrl+M"
                                        }, {
                                            label: q.isOSX ? "Zoom" : "Maximize",
                                            role: "zoom"
                                        }]
                                    }, {
                                        label: "Help",
                                        role: "help",
                                        submenu: (0, u.__spreadArray)((0, u.__spreadArray)([], (0, u.__read)(s(!q.isOSX, [{
                                                    label: "About ".concat(d.app.name, "…"),
                                                    role: "about",
                                                    click: function() {
                                                        return dt({
                                                            type: "OpenAboutModal"
                                                        })
                                                    }
                                                }])), !1), [{
                                                        label: "Enter License Key",
                                                        click: function() {
                                                            return dt({
                                                                type: "OpenLicenseKeyModal"
                                                            })
                                                        }
                                                    }, {
                                                        label: "Support Chat",
                                                        click: zn
                                                    }, {
                                                        label: "Email the Developers…",
                                                        click: function() {
                                                            return dt({
                                                                type: "OpenContactModal"
                                                            })
                                                        }
                                                    }, {
                                                        label: "Open Documentation",
                                                        click: function() {
                                                            return d.shell.openExternal("https://firefoo.app/docs")
                                                        }
                                                    }, {
                                                        label: "Open Website",
                                                        click: function() {
                                                            return d.shell.openExternal("https://firefoo.app")
                                                        }
                                                    }, {
                                                        label: "Release Notes",
                                                        click: function() {
                                                            d.shell.openExternal("https://firefoo.app/docs/about-firefoo/release-notes")
                                                        }
                                                    }, {
                                                        label: "Update available",
                                                        click: function() {
                                                            return d.shell.openExternal("https://releases.firefoo.app")
                                                        },
                                                        visible: q.isLinux && null != cr && !E(
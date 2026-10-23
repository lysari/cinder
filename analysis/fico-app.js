ate: mn().uniqBy(a, (function(e) {
    return ko(e.fieldPath)
})), resourcePath: e.resourcePath, dbToken: this.dbToken, toDelete: f
}
}
}, t
}(Yo);
! function(e) {
    e.ModifyFields = "ModifyFields"
}(ou || (ou = {}));
var au, su, lu, uu, cu, pu, du = function(e, t, r) {
        return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
            function o() {
                switch (e.req.src.t) {
                    case ka.FromDatabase:
                        return fl(e.id, e.req.src, (0, n.__assign)((0, n.__assign)({}, {
                            isCancelled: function() {
                                return !1
                            },
                            logFunction: mn().noop,
                            updateTaskStatus: mn().noop,
                            appendTaskSpecialStatus: mn().noop,
                            signal: (new AbortController).signal
                        }), {
                            signal: t.signal
                        }), r);
                    case ka.FromMemory:
                        return gl(e.req.src.materialized, !0);
                    case ka.SelectedDocs:
                        return yl(e.req.src);
                    default:
                        throw new Error("Unsupported data source type")
                }
            }
            var i, a, s, l;
            return (0, n.__generator)(this, (function(r) {
                switch (r.label) {
                    case 0:
                        return i = {
                            writes: 0,
                            reads: 0
                        }, a = hu(e.req), s = new Jo((function() {
                            return Sr
                        }), e.req.dbToken, t.signal), l = s.createBulkWriterForRest((function(e) {
                            i.writes += e.length, t.updateTaskStatus(i)
                        }), (function(e, n, r, o) {
                            var i = Oo.getResourcePath(e);
                            console.error("Error in:", i.join("/"), null == o ? void 0 : o.message), t.onUploadError(i, "Upload error: ".concat(null == o ? void 0 : o.message))
                        })), [4, o()((function(r) {
                            return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
                                var o;
                                return (0, n.__generator)(this, (function(n) {
                                    switch (n.label) {
                                        case 0:
                                            return e.req.src.t == ka.FromDatabase && i.reads++, t.updateTaskStatus(i), null == (o = a.getUpdate(r)) || o.type != Lo.UpdateDoc ? [3, 2] : [4, l.pushAsync({
                                                type: mo.UpdateDoc,
                                                update: o
                                            })];
                                        case 1:
                                            n.sent(), n.label = 2;
                                        case 2:
                                            return [2]
                                    }
                                }))
                            }))
                        }), (function(e) {
                            console.error(e)
                        }))];
                    case 1:
                        return r.sent(), [4, l.flush()];
                    case 2:
                        return r.sent(), [2]
                }
            }))
        }))
    },
    hu = function(e) {
        if (e.type === ou.ModifyFields) return new iu(e);
        throw new Error("Not Implemented")
    };
! function(e) {
    e.GUI = "GUI", e.JavaScript = "JavaScript"
}(au || (au = {})),
function(e) {
    e.Tree = "Tree", e.Table = "Table", e.JSON = "JSON"
}(su || (su = {})),
function(e) {
    e.Copy = "Copy", e.Duplicate = "Duplicate", e.Move = "Move", e.Rename = "Rename"
}(lu || (lu = {})),
function(e) {
    e.FocusUiElement = "FocusUiElement"
}(uu || (uu = {})),
function(e) {
    e.Editor = "Editor", e.Result = "Result", e.Sidebar = "Sidebar"
}(cu || (cu = {})),
function(e) {
    e.CommandPalette = "CommandPalette"
}(pu || (pu = {}));
var fu, mu, gu = {
        1: {
            type: cu.Editor,
            element: au.GUI
        },
        2: {
            type: cu.Editor,
            element: au.JavaScript
        },
        4: {
            type: cu.Result,
            element: su.Table
        },
        5: {
            type: cu.Result,
            element: su.Tree
        },
        6: {
            type: cu.Result,
            element: su.JSON
        },
        7: {
            type: cu.Result,
            element: ws.Log
        },
        A: {
            type: cu.Sidebar,
            element: "Sidebar"
        },
        S: {
            type: cu.Sidebar,
            element: "Favourites"
        },
        D: {
            type: cu.Sidebar,
            element: "Tasks"
        }
    },
    yu = (Br.isOSX && (fu = gu, mu = ["A", "S", "D"], mn().omit(fu, mu)), function(e, t, n) {
        return {
            type: "ProcessExecuteScriptResult",
            ficoNodeJsonSafe: e,
            taskId: t,
            dbToken: n
        }
    }),
    vu = function(e, t, n) {
        return void 0 === t && (t = []), void 0 === n && (n = []), {
            type: "TaskBundledUpdate",
            logMessages: e,
            taskUpdates: t,
            taskSpecialUpdates: n
        }
    },
    bu = function(e, t) {
        return {
            type: "RtQueryResult",
            taskId: e,
            result: t
        }
    },
    _u = function(e, t) {
        return {
            type: "CsvAnalysisResult",
            taskId: e,
            result: t
        }
    },
    wu = function(e, t) {
        return {
            type: "LoadCsvResult",
            taskId: e,
            result: t
        }
    },
    Eu = __webpack_require__(9669),
    Tu = __webpack_require__.n(Eu);
const Su = function(e = {}) {
        return e.seed ? e.seed = e.seed * Math.PI * 100 % 100 / 100 : Math.random()
    },
    Ou = {
        ascii: function({
            options: e
        }) {
            const t = [],
                n = Math.ceil(Su(e) * e.maxWordLength);
            for (let r = 0; r < n; r++) {
                const n = Math.floor(32 * Su(e));
                t.push(String.fromCharCode(n + (n < 16 ? 65 : 81)))
            }
            return t.join("")
        },
        int: function({
            options: e
        }) {
            return Math.floor(Su(e) * Math.pow(2, 52))
        },
        bool: function({
            options: e
        }) {
            return Math.floor(2 * Su(e))
        }
    },
    Au = function(e = {}) {
        return this.options = (e => {
            e.high_water_mark && (e.highWaterMark = e.high_water_mark), e.object_mode && (e.objectMode = e.object_mode);
            const t = {};
            for (const r in e) t[(n = r, n.replace(/_([a-z])/gi, (function(e, t) {
                return t.toUpperCase()
            })))] = e[r];
            var n;
            const r = {
                columns: 8,
                delimiter: ",",
                duration: null,
                encoding: null,
                end: null,
                eof: !1,
                fixedSize: !1,
                length: -1,
                maxWordLength: 16,
                rowDelimiter: "\n",
                seed: !1,
                sleep: 0
            };
            for (const e in r) void 0 === t[e] && (t[e] = r[e]);
            !0 === t.eof && (t.eof = t.rowDelimiter), "number" == typeof t.columns && (t.columns = new Array(t.columns));
            const o = Object.keys(Ou).filter((e => !["super_", "camelize"].includes(e)));
            for (let e = 0; e < t.columns.length; e++) {
                const n = t.columns[e] || "ascii";
                if ("string" == typeof n) {
                    if (!o.includes(n)) throw Error(`Invalid column type: got "${n}", default values are ${JSON.stringify(o)}`);
                    t.columns[e] = Ou[n]
                }
            }
            return t
        })(e), Qe.Readable.call(this, this.options), this.state = (e => ({
            start_time: this.options.duration ? Date.now() : null,
            fixed_size_buffer: "",
            count_written: 0,
            count_created: 0
        }))(), this
    };
uo.inherits(Au, Qe.Readable), Au.prototype.end = function() {
    this.push(null)
}, Au.prototype._read = function(e) {
    const t = this,
        n = ((e, n, r, o, i) => {
            const a = [];
            let s = n.fixed_size_buffer.length;
            for (0 !== s && a.push(n.fixed_size_buffer);;) {
                if (n.count_created === e.length || e.end && Date.now() > e.end || e.duration && Date.now() > n.start_time + e.duration) {
                    if (a.length) {
                        if (e.objectMode)
                            for (const e of a) o(e);
                        else o(a.join("") + (e.eof ? e.eof : ""));
                        n.end = !0
                    } else t.push(null);
                    return
                }
                let i, l = [];
                for (const t of e.columns) {
                    const r = t({
                            options: e,
                            state: n
                        }),
                        o = typeof r;
                    if (null !== r && "string" !== o && "number" !== o) return Error(["INVALID_VALUE:", "values returned by column function must be", "a string, a number or null,", `got ${JSON.stringify(r)}`].join(" "));
                    l.push(r)
                }
                if (e.objectMode) {
                    i = 0;
                    for (const e of l) i += e.length
                } else l = (0 === n.count_created ? "" : e.rowDelimiter) + l.join(e.delimiter), i = l.length;
                if (n.count_created++, s + i > r) {
                    if (e.objectMode) {
                        a.push(l);
                        for (const e of a) o(e)
                    } else e.fixedSize ? (n.fixed_size_buffer = l.substr(r - s), a.push(l.substr(0, r - s))) : a.push(l), o(a.join(""));
                    return
                }
                s += i, a.push(l)
            }
        })(this.options, this.state, e, (function(e) {
            t.__push(e)
        }));
    n && this.destroy(n)
}, Au.prototype.__push = function(e) {
    const t = () => {
        if (this.state.count_written++, this.push(e), !0 === this.state.end) return this.push(null)
    };
    this.options.sleep > 0 ? setTimeout(t, this.options.sleep) : t()
};
const ku = function() {
        let e, t;
        2 === arguments.length ? (e = arguments[0], t = arguments[1]) : 1 === arguments.length ? "function" == typeof arguments[0] ? (e = {}, t = arguments[0]) : e = arguments[0] : 0 === arguments.length && (e = {});
        const n = new Au(e);
        if (t) {
            const e = [];
            n.on("readable", (function() {
                let t;
                for (; null !== (t = n.read());) e.push(t)
            })), n.on("error", t), n.on("end", (function() {
                n.options.objectMode ? t(null, e) : n.options.encoding ? t(null, e.join("")) : t(null, Buffer.concat(e))
            }))
        }
        return n
    },
    xu = function(e = {}, t) {
        return this.options = e, void 0 !== e.consume && null !== e.consume || (this.options.consume = !1), this.options.objectMode = !0, void 0 !== e.parallel && null !== e.parallel || (this.options.parallel = 100), void 0 !== e.params && null !== e.params || (e.params = null), this.handler = t, Qe.Transform.call(this, this.options), this.state = {
            running: 0,
            started: 0,
            finished: 0
        }, this
    };
uo.inherits(xu, Qe.Transform), xu.prototype._transform = function(e, t, n) {
    this.state.started++, this.state.running++, this.state.running < this.options.parallel && (n(), n = null);
    try {
        let t = this.handler.length;
        if (null !== this.options.params && t--, 1 === t) this.__done(null, [this.handler.call(this, e, this.options.params)], n);
        else {
            if (2 !== t) throw Error("Invalid handler arguments");
            {
                const t = (e, ...t) => this.__done(e, t, n);
                this.handler.call(this, e, t, this.options.params)
            }
        }
        return !1
    } catch (e) {
        this.__done(e)
    }
}, xu.prototype._flush = function(e) {
    0 === this.state.running ? e() : this._ending = function() {
        e()
    }
}, xu.prototype.__done = function(e, t, n) {
    if (this.state.running--, e) return this.emit("error", e);
    this.state.finished++;
    for (let e of t) "number" == typeof e && (e = `${e}`), null != e && "" !== e && this.push(e);
    n && n(), this._ending && 0 === this.state.running && this._ending()
};
const Cu = function() {
    let e, t, n, r = {};
    for (let o = 0; o < arguments.length; o++) {
        const i = arguments[o];
        let a = typeof i;
        if (null === i ? a = "null" : "object" === a && Array.isArray(i) && (a = "array"), "array" === a) n = i;
        else if ("object" === a) r = {
            ...i
        };
        else if ("function" === a) t && o === arguments.length - 1 ? e = i : t = i;
        else if ("null" !== a) throw new Error(`Invalid Arguments: got ${JSON.stringify(i)} at position ${o}`)
    }
    const o = new xu(r, t);
    let i = !1;
    if (n) {
        const e = function() {
            for (const e of n) {
                if (i) break;
                o.write(e)
            }
            o.end()
        };
        "function" == typeof setImmediate ? setImmediate(e) : setTimeout(e, 0)
    }
    if (e || r.consume) {
        const t = [];
        o.on("readable", (function() {
            let n;
            for (; null !== (n = o.read());) e && t.push(n)
        })), o.on("error", (function(t) {
            i = !0, e && e(t)
        })), o.on("end", (function() {
            e && !i && e(null, t)
        }))
    }
    return o
};

function Pu(e) {
    if (null === e || !0 === e || !1 === e) return NaN;
    var t = Number(e);
    return isNaN(t) ? t : t < 0 ? Math.ceil(t) : Math.floor(t)
}

function Iu(e, t) {
    if (t.length < e) throw new TypeError(e + " argument" + (e > 1 ? "s" : "") + " required, but only " + t.length + " present")
}

function Ru(e) {
    Iu(1, arguments);
    var t = Object.prototype.toString.call(e);
    return e instanceof Date || "object" == typeof e && "[object Date]" === t ? new Date(e.getTime()) : "number" == typeof e || "[object Number]" === t ? new Date(e) : ("string" != typeof e && "[object String]" !== t || "undefined" == typeof console || (console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments"), console.warn((new Error).stack)), new Date(NaN))
}

function Du(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return isNaN(r) ? new Date(NaN) : r ? (n.setDate(n.getDate() + r), n) : n
}

function Nu(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    if (isNaN(r)) return new Date(NaN);
    if (!r) return n;
    var o = n.getDate(),
        i = new Date(n.getTime());
    i.setMonth(n.getMonth() + r + 1, 0);
    var a = i.getDate();
    return o >= a ? i : (n.setFullYear(i.getFullYear(), i.getMonth(), o), n)
}

function ju(e, t) {
    if (Iu(2, arguments), !t || "object" != typeof t) return new Date(NaN);
    var n = t.years ? Pu(t.years) : 0,
        r = t.months ? Pu(t.months) : 0,
        o = t.weeks ? Pu(t.weeks) : 0,
        i = t.days ? Pu(t.days) : 0,
        a = t.hours ? Pu(t.hours) : 0,
        s = t.minutes ? Pu(t.minutes) : 0,
        l = t.seconds ? Pu(t.seconds) : 0,
        u = Ru(e),
        c = r || n ? Nu(u, r + 12 * n) : u,
        p = i || o ? Du(c, i + 7 * o) : c,
        d = s + 60 * a,
        h = l + 60 * d,
        f = 1e3 * h,
        m = new Date(p.getTime() + f);
    return m
}

function Lu(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getDay();
    return 0 === n || 6 === n
}

function Mu(e) {
    return Iu(1, arguments), 0 === Ru(e).getDay()
}

function Fu(e) {
    return Iu(1, arguments), 6 === Ru(e).getDay()
}

function Uu(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Lu(n),
        o = Pu(t);
    if (isNaN(o)) return new Date(NaN);
    var i = n.getHours(),
        a = o < 0 ? -1 : 1,
        s = Pu(o / 5);
    n.setDate(n.getDate() + 7 * s);
    for (var l = Math.abs(o % 5); l > 0;) n.setDate(n.getDate() + a), Lu(n) || (l -= 1);
    return r && Lu(n) && 0 !== o && (Fu(n) && n.setDate(n.getDate() + (a < 0 ? 2 : -1)), Mu(n) && n.setDate(n.getDate() + (a < 0 ? 1 : -2))), n.setHours(i), n
}

function Bu(e, t) {
    Iu(2, arguments);
    var n = Ru(e).getTime(),
        r = Pu(t);
    return new Date(n + r)
}
var Vu = 36e5;

function qu(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Bu(e, n * Vu)
}
var Yu = {};

function Hu() {
    return Yu
}

function Gu(e) {
    Yu = e
}

function zu(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.weekStartsOn) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.weekStartsOn) && void 0 !== o ? o : c.weekStartsOn) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.weekStartsOn) && void 0 !== n ? n : 0);
    if (!(p >= 0 && p <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var d = Ru(e),
        h = d.getDay(),
        f = (h < p ? 7 : 0) + h - p;
    return d.setDate(d.getDate() - f), d.setHours(0, 0, 0, 0), d
}

function $u(e) {
    return Iu(1, arguments), zu(e, {
        weekStartsOn: 1
    })
}

function Wu(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = new Date(0);
    r.setFullYear(n + 1, 0, 4), r.setHours(0, 0, 0, 0);
    var o = $u(r),
        i = new Date(0);
    i.setFullYear(n, 0, 4), i.setHours(0, 0, 0, 0);
    var a = $u(i);
    return t.getTime() >= o.getTime() ? n + 1 : t.getTime() >= a.getTime() ? n : n - 1
}

function Ju(e) {
    Iu(1, arguments);
    var t = Wu(e),
        n = new Date(0);
    n.setFullYear(t, 0, 4), n.setHours(0, 0, 0, 0);
    var r = $u(n);
    return r
}

function Ku(e) {
    var t = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds(), e.getMilliseconds()));
    return t.setUTCFullYear(e.getFullYear()), e.getTime() - t.getTime()
}

function Qu(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setHours(0, 0, 0, 0), t
}
var Xu = 864e5;

function Zu(e, t) {
    Iu(2, arguments);
    var n = Qu(e),
        r = Qu(t),
        o = n.getTime() - Ku(n),
        i = r.getTime() - Ku(r);
    return Math.round((o - i) / Xu)
}

function ec(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t),
        o = Zu(n, Ju(n)),
        i = new Date(0);
    return i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0), (n = Ju(i)).setDate(n.getDate() + o), n
}

function tc(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return ec(e, Wu(e) + n)
}

function nc(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Bu(e, 6e4 * n)
}

function rc(e, t) {
    Iu(2, arguments);
    var n = Pu(t),
        r = 3 * n;
    return Nu(e, r)
}

function oc(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Bu(e, 1e3 * n)
}

function ic(e, t) {
    Iu(2, arguments);
    var n = Pu(t),
        r = 7 * n;
    return Du(e, r)
}

function ac(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Nu(e, 12 * n)
}

function sc(e, t, n) {
    Iu(2, arguments);
    var r = Ru(null == e ? void 0 : e.start).getTime(),
        o = Ru(null == e ? void 0 : e.end).getTime(),
        i = Ru(null == t ? void 0 : t.start).getTime(),
        a = Ru(null == t ? void 0 : t.end).getTime();
    if (!(r <= o && i <= a)) throw new RangeError("Invalid interval");
    return null != n && n.inclusive ? r <= a && i <= o : r < a && i < o
}

function lc(e) {
    var t, n;
    if (Iu(1, arguments), e && "function" == typeof e.forEach) t = e;
    else {
        if ("object" != typeof e || null === e) return new Date(NaN);
        t = Array.prototype.slice.call(e)
    }
    return t.forEach((function(e) {
        var t = Ru(e);
        (void 0 === n || n < t || isNaN(Number(t))) && (n = t)
    })), n || new Date(NaN)
}

function uc(e) {
    var t, n;
    if (Iu(1, arguments), e && "function" == typeof e.forEach) t = e;
    else {
        if ("object" != typeof e || null === e) return new Date(NaN);
        t = Array.prototype.slice.call(e)
    }
    return t.forEach((function(e) {
        var t = Ru(e);
        (void 0 === n || n > t || isNaN(t.getDate())) && (n = t)
    })), n || new Date(NaN)
}

function cc(e, t) {
    var n = t.start,
        r = t.end;
    return Iu(2, arguments), uc([lc([e, n]), r])
}

function pc(e, t) {
    Iu(2, arguments);
    var n = Ru(e);
    if (isNaN(Number(n))) return NaN;
    var r, o, i = n.getTime();
    return (null == t ? [] : "function" == typeof t.forEach ? t : Array.prototype.slice.call(t)).forEach((function(e, t) {
        var n = Ru(e);
        if (isNaN(Number(n))) return r = NaN, void(o = NaN);
        var a = Math.abs(i - n.getTime());
        (null == r || a < Number(o)) && (r = t, o = a)
    })), r
}

function dc(e, t) {
    Iu(2, arguments);
    var n = Ru(e);
    if (isNaN(Number(n))) return new Date(NaN);
    var r, o, i = n.getTime();
    return (null == t ? [] : "function" == typeof t.forEach ? t : Array.prototype.slice.call(t)).forEach((function(e) {
        var t = Ru(e);
        if (isNaN(Number(t))) return r = new Date(NaN), void(o = NaN);
        var n = Math.abs(i - t.getTime());
        (null == r || n < Number(o)) && (r = t, o = n)
    })), r
}

function hc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = n.getTime() - r.getTime();
    return o < 0 ? -1 : o > 0 ? 1 : o
}

function fc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = n.getTime() - r.getTime();
    return o > 0 ? -1 : o < 0 ? 1 : o
}
var mc = 7,
    gc = 365.2425,
    yc = 24 * Math.pow(10, 8) * 60 * 60 * 1e3,
    vc = 6e4,
    bc = 36e5,
    _c = 1e3,
    wc = -yc,
    Ec = 60,
    Tc = 3,
    Sc = 12,
    Oc = 4,
    Ac = 3600,
    kc = 60,
    xc = 24 * Ac,
    Cc = 7 * xc,
    Pc = xc * gc,
    Ic = Pc / 12,
    Rc = 3 * Ic;

function Dc(e) {
    Iu(1, arguments);
    var t = e / mc;
    return Math.floor(t)
}

function Nc(e, t) {
    Iu(2, arguments);
    var n = Qu(e),
        r = Qu(t);
    return n.getTime() === r.getTime()
}

function jc(e) {
    return Iu(1, arguments), e instanceof Date || "object" == typeof e && "[object Date]" === Object.prototype.toString.call(e)
}

function Lc(e) {
    if (Iu(1, arguments), !jc(e) && "number" != typeof e) return !1;
    var t = Ru(e);
    return !isNaN(Number(t))
}

function Mc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    if (!Lc(n) || !Lc(r)) return NaN;
    var o = Zu(n, r),
        i = o < 0 ? -1 : 1,
        a = Pu(o / 7),
        s = 5 * a;
    for (r = Du(r, 7 * a); !Nc(n, r);) s += Lu(r) ? 0 : i, r = Du(r, i);
    return 0 === s ? 0 : s
}

function Fc(e, t) {
    return Iu(2, arguments), Wu(e) - Wu(t)
}
var Uc = 6048e5;

function Bc(e, t) {
    Iu(2, arguments);
    var n = $u(e),
        r = $u(t),
        o = n.getTime() - Ku(n),
        i = r.getTime() - Ku(r);
    return Math.round((o - i) / Uc)
}

function Vc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = n.getFullYear() - r.getFullYear(),
        i = n.getMonth() - r.getMonth();
    return 12 * o + i
}

function qc(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = Math.floor(t.getMonth() / 3) + 1;
    return n
}

function Yc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = n.getFullYear() - r.getFullYear(),
        i = qc(n) - qc(r);
    return 4 * o + i
}
var Hc = 6048e5;

function Gc(e, t, n) {
    Iu(2, arguments);
    var r = zu(e, n),
        o = zu(t, n),
        i = r.getTime() - Ku(r),
        a = o.getTime() - Ku(o);
    return Math.round((i - a) / Hc)
}

function zc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getFullYear() - r.getFullYear()
}

function $c(e, t) {
    var n = e.getFullYear() - t.getFullYear() || e.getMonth() - t.getMonth() || e.getDate() - t.getDate() || e.getHours() - t.getHours() || e.getMinutes() - t.getMinutes() || e.getSeconds() - t.getSeconds() || e.getMilliseconds() - t.getMilliseconds();
    return n < 0 ? -1 : n > 0 ? 1 : n
}

function Wc(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = $c(n, r),
        i = Math.abs(Zu(n, r));
    n.setDate(n.getDate() - o * i);
    var a = Number($c(n, r) === -o),
        s = o * (i - a);
    return 0 === s ? 0 : s
}

function Jc(e, t) {
    return Iu(2, arguments), Ru(e).getTime() - Ru(t).getTime()
}
var Kc = {
    ceil: Math.ceil,
    round: Math.round,
    floor: Math.floor,
    trunc: function(e) {
        return e < 0 ? Math.ceil(e) : Math.floor(e)
    }
};

function Qc(e) {
    return e ? Kc[e] : Kc.trunc
}

function Xc(e, t, n) {
    Iu(2, arguments);
    var r = Jc(e, t) / bc;
    return Qc(null == n ? void 0 : n.roundingMethod)(r)
}

function Zc(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return tc(e, -n)
}

function ep(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = hc(n, r),
        i = Math.abs(Fc(n, r));
    n = Zc(n, o * i);
    var a = Number(hc(n, r) === -o),
        s = o * (i - a);
    return 0 === s ? 0 : s
}

function tp(e, t, n) {
    Iu(2, arguments);
    var r = Jc(e, t) / vc;
    return Qc(null == n ? void 0 : n.roundingMethod)(r)
}

function np(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setHours(23, 59, 59, 999), t
}

function rp(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth();
    return t.setFullYear(t.getFullYear(), n + 1, 0), t.setHours(23, 59, 59, 999), t
}

function op(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return np(t).getTime() === rp(t).getTime()
}

function ip(e, t) {
    Iu(2, arguments);
    var n, r = Ru(e),
        o = Ru(t),
        i = hc(r, o),
        a = Math.abs(Vc(r, o));
    if (a < 1) n = 0;
    else {
        1 === r.getMonth() && r.getDate() > 27 && r.setDate(30), r.setMonth(r.getMonth() - i * a);
        var s = hc(r, o) === -i;
        op(Ru(e)) && 1 === a && 1 === hc(e, o) && (s = !1), n = i * (a - Number(s))
    }
    return 0 === n ? 0 : n
}

function ap(e, t, n) {
    Iu(2, arguments);
    var r = ip(e, t) / 3;
    return Qc(null == n ? void 0 : n.roundingMethod)(r)
}

function sp(e, t, n) {
    Iu(2, arguments);
    var r = Jc(e, t) / 1e3;
    return Qc(null == n ? void 0 : n.roundingMethod)(r)
}

function lp(e, t, n) {
    Iu(2, arguments);
    var r = Wc(e, t) / 7;
    return Qc(null == n ? void 0 : n.roundingMethod)(r)
}

function up(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t),
        o = hc(n, r),
        i = Math.abs(zc(n, r));
    n.setFullYear(1584), r.setFullYear(1584);
    var a = hc(n, r) === -o,
        s = o * (i - Number(a));
    return 0 === s ? 0 : s
}

function cp(e, t) {
    var n;
    Iu(1, arguments);
    var r = e || {},
        o = Ru(r.start),
        i = Ru(r.end),
        a = i.getTime();
    if (!(o.getTime() <= a)) throw new RangeError("Invalid interval");
    var s = [],
        l = o;
    l.setHours(0, 0, 0, 0);
    var u = Number(null !== (n = null == t ? void 0 : t.step) && void 0 !== n ? n : 1);
    if (u < 1 || isNaN(u)) throw new RangeError("`options.step` must be a number greater than 1");
    for (; l.getTime() <= a;) s.push(Ru(l)), l.setDate(l.getDate() + u), l.setHours(0, 0, 0, 0);
    return s
}

function pp(e, t) {
    var n;
    Iu(1, arguments);
    var r = e || {},
        o = Ru(r.start),
        i = Ru(r.end),
        a = o.getTime(),
        s = i.getTime();
    if (!(a <= s)) throw new RangeError("Invalid interval");
    var l = [],
        u = o;
    u.setMinutes(0, 0, 0);
    var c = Number(null !== (n = null == t ? void 0 : t.step) && void 0 !== n ? n : 1);
    if (c < 1 || isNaN(c)) throw new RangeError("`options.step` must be a number greater than 1");
    for (; u.getTime() <= s;) l.push(Ru(u)), u = qu(u, c);
    return l
}

function dp(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setSeconds(0, 0), t
}

function hp(e, t) {
    var n;
    Iu(1, arguments);
    var r = dp(Ru(e.start)),
        o = Ru(e.end),
        i = r.getTime(),
        a = o.getTime();
    if (i >= a) throw new RangeError("Invalid interval");
    var s = [],
        l = r,
        u = Number(null !== (n = null == t ? void 0 : t.step) && void 0 !== n ? n : 1);
    if (u < 1 || isNaN(u)) throw new RangeError("`options.step` must be a number equal to or greater than 1");
    for (; l.getTime() <= a;) s.push(Ru(l)), l = nc(l, u);
    return s
}

function fp(e) {
    Iu(1, arguments);
    var t = e || {},
        n = Ru(t.start),
        r = Ru(t.end),
        o = r.getTime(),
        i = [];
    if (!(n.getTime() <= o)) throw new RangeError("Invalid interval");
    var a = n;
    for (a.setHours(0, 0, 0, 0), a.setDate(1); a.getTime() <= o;) i.push(Ru(a)), a.setMonth(a.getMonth() + 1);
    return i
}

function mp(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth(),
        r = n - n % 3;
    return t.setMonth(r, 1), t.setHours(0, 0, 0, 0), t
}

function gp(e) {
    Iu(1, arguments);
    var t = e || {},
        n = Ru(t.start),
        r = Ru(t.end),
        o = r.getTime();
    if (!(n.getTime() <= o)) throw new RangeError("Invalid interval");
    var i = mp(n),
        a = mp(r);
    o = a.getTime();
    for (var s = [], l = i; l.getTime() <= o;) s.push(Ru(l)), l = rc(l, 1);
    return s
}

function yp(e, t) {
    Iu(1, arguments);
    var n = e || {},
        r = Ru(n.start),
        o = Ru(n.end),
        i = o.getTime();
    if (!(r.getTime() <= i)) throw new RangeError("Invalid interval");
    var a = zu(r, t),
        s = zu(o, t);
    a.setHours(15), s.setHours(15), i = s.getTime();
    for (var l = [], u = a; u.getTime() <= i;) u.setHours(0), l.push(Ru(u)), (u = ic(u, 1)).setHours(15);
    return l
}

function vp(e) {
    Iu(1, arguments);
    for (var t = cp(e), n = [], r = 0; r < t.length;) {
        var o = t[r++];
        Lu(o) && (n.push(o), Mu(o) && (r += 5))
    }
    return n
}

function bp(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setDate(1), t.setHours(0, 0, 0, 0), t
}

function _p(e) {
    Iu(1, arguments);
    var t = bp(e);
    if (isNaN(t.getTime())) throw new RangeError("The passed date is invalid");
    var n = rp(e);
    return vp({
        start: t,
        end: n
    })
}

function wp(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear();
    return t.setFullYear(n + 1, 0, 0), t.setHours(23, 59, 59, 999), t
}

function Ep(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = new Date(0);
    return n.setFullYear(t.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n
}

function Tp(e) {
    Iu(1, arguments);
    var t = Ep(e),
        n = wp(e);
    return vp({
        start: t,
        end: n
    })
}

function Sp(e) {
    Iu(1, arguments);
    var t = e || {},
        n = Ru(t.start),
        r = Ru(t.end),
        o = r.getTime();
    if (!(n.getTime() <= o)) throw new RangeError("Invalid interval");
    var i = [],
        a = n;
    for (a.setHours(0, 0, 0, 0), a.setMonth(0, 1); a.getTime() <= o;) i.push(Ru(a)), a.setFullYear(a.getFullYear() + 1);
    return i
}

function Op(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = 9 + 10 * Math.floor(n / 10);
    return t.setFullYear(r, 11, 31), t.setHours(23, 59, 59, 999), t
}

function Ap(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setMinutes(59, 59, 999), t
}

function kp(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.weekStartsOn) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.weekStartsOn) && void 0 !== o ? o : c.weekStartsOn) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.weekStartsOn) && void 0 !== n ? n : 0);
    if (!(p >= 0 && p <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var d = Ru(e),
        h = d.getDay(),
        f = 6 + (h < p ? -7 : 0) - (h - p);
    return d.setDate(d.getDate() + f), d.setHours(23, 59, 59, 999), d
}

function xp(e) {
    return Iu(1, arguments), kp(e, {
        weekStartsOn: 1
    })
}

function Cp(e) {
    Iu(1, arguments);
    var t = Wu(e),
        n = new Date(0);
    n.setFullYear(t + 1, 0, 4), n.setHours(0, 0, 0, 0);
    var r = $u(n);
    return r.setMilliseconds(r.getMilliseconds() - 1), r
}

function Pp(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setSeconds(59, 999), t
}

function Ip(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth(),
        r = n - n % 3 + 3;
    return t.setMonth(r, 0), t.setHours(23, 59, 59, 999), t
}

function Rp(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setMilliseconds(999), t
}

function Dp() {
    return np(Date.now())
}

function Np() {
    var e = new Date,
        t = e.getFullYear(),
        n = e.getMonth(),
        r = e.getDate(),
        o = new Date(0);
    return o.setFullYear(t, n, r + 1), o.setHours(23, 59, 59, 999), o
}

function jp() {
    var e = new Date,
        t = e.getFullYear(),
        n = e.getMonth(),
        r = e.getDate(),
        o = new Date(0);
    return o.setFullYear(t, n, r - 1), o.setHours(23, 59, 59, 999), o
}

function Lp(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Bu(e, -n)
}
var Mp = 864e5;

function Fp(e) {
    Iu(1, arguments);
    var t = 1,
        n = Ru(e),
        r = n.getUTCDay(),
        o = (r < t ? 7 : 0) + r - t;
    return n.setUTCDate(n.getUTCDate() - o), n.setUTCHours(0, 0, 0, 0), n
}

function Up(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getUTCFullYear(),
        r = new Date(0);
    r.setUTCFullYear(n + 1, 0, 4), r.setUTCHours(0, 0, 0, 0);
    var o = Fp(r),
        i = new Date(0);
    i.setUTCFullYear(n, 0, 4), i.setUTCHours(0, 0, 0, 0);
    var a = Fp(i);
    return t.getTime() >= o.getTime() ? n + 1 : t.getTime() >= a.getTime() ? n : n - 1
}

function Bp(e) {
    Iu(1, arguments);
    var t = Up(e),
        n = new Date(0);
    n.setUTCFullYear(t, 0, 4), n.setUTCHours(0, 0, 0, 0);
    var r = Fp(n);
    return r
}
var Vp = 6048e5;

function qp(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = Fp(t).getTime() - Bp(t).getTime();
    return Math.round(n / Vp) + 1
}

function Yp(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.weekStartsOn) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.weekStartsOn) && void 0 !== o ? o : c.weekStartsOn) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.weekStartsOn) && void 0 !== n ? n : 0);
    if (!(p >= 0 && p <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var d = Ru(e),
        h = d.getUTCDay(),
        f = (h < p ? 7 : 0) + h - p;
    return d.setUTCDate(d.getUTCDate() - f), d.setUTCHours(0, 0, 0, 0), d
}

function Hp(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Ru(e),
        p = c.getUTCFullYear(),
        d = Hu(),
        h = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.firstWeekContainsDate) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.firstWeekContainsDate) && void 0 !== o ? o : d.firstWeekContainsDate) && void 0 !== r ? r : null === (l = d.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.firstWeekContainsDate) && void 0 !== n ? n : 1);
    if (!(h >= 1 && h <= 7)) throw new RangeError("firstWeekContainsDate must be between 1 and 7 inclusively");
    var f = new Date(0);
    f.setUTCFullYear(p + 1, 0, h), f.setUTCHours(0, 0, 0, 0);
    var m = Yp(f, t),
        g = new Date(0);
    g.setUTCFullYear(p, 0, h), g.setUTCHours(0, 0, 0, 0);
    var y = Yp(g, t);
    return c.getTime() >= m.getTime() ? p + 1 : c.getTime() >= y.getTime() ? p : p - 1
}

function Gp(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.firstWeekContainsDate) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.firstWeekContainsDate) && void 0 !== o ? o : c.firstWeekContainsDate) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.firstWeekContainsDate) && void 0 !== n ? n : 1),
        d = Hp(e, t),
        h = new Date(0);
    h.setUTCFullYear(d, 0, p), h.setUTCHours(0, 0, 0, 0);
    var f = Yp(h, t);
    return f
}
var zp = 6048e5;

function $p(e, t) {
    Iu(1, arguments);
    var n = Ru(e),
        r = Yp(n, t).getTime() - Gp(n, t).getTime();
    return Math.round(r / zp) + 1
}

function Wp(e, t) {
    for (var n = e < 0 ? "-" : "", r = Math.abs(e).toString(); r.length < t;) r = "0" + r;
    return n + r
}
var Jp = {
    y: function(e, t) {
        var n = e.getUTCFullYear(),
            r = n > 0 ? n : 1 - n;
        return Wp("yy" === t ? r % 100 : r, t.length)
    },
    M: function(e, t) {
        var n = e.getUTCMonth();
        return "M" === t ? String(n + 1) : Wp(n + 1, 2)
    },
    d: function(e, t) {
        return Wp(e.getUTCDate(), t.length)
    },
    a: function(e, t) {
        var n = e.getUTCHours() / 12 >= 1 ? "pm" : "am";
        switch (t) {
            case "a":
            case "aa":
                return n.toUpperCase();
            case "aaa":
                return n;
            case "aaaaa":
                return n[0];
            default:
                return "am" === n ? "a.m." : "p.m."
        }
    },
    h: function(e, t) {
        return Wp(e.getUTCHours() % 12 || 12, t.length)
    },
    H: function(e, t) {
        return Wp(e.getUTCHours(), t.length)
    },
    m: function(e, t) {
        return Wp(e.getUTCMinutes(), t.length)
    },
    s: function(e, t) {
        return Wp(e.getUTCSeconds(), t.length)
    },
    S: function(e, t) {
        var n = t.length,
            r = e.getUTCMilliseconds();
        return Wp(Math.floor(r * Math.pow(10, n - 3)), t.length)
    }
};
const Kp = Jp;

function Qp(e, t) {
    var n = e > 0 ? "-" : "+",
        r = Math.abs(e),
        o = Math.floor(r / 60),
        i = r % 60;
    if (0 === i) return n + String(o);
    var a = t || "";
    return n + String(o) + a + Wp(i, 2)
}

function Xp(e, t) {
    return e % 60 == 0 ? (e > 0 ? "-" : "+") + Wp(Math.abs(e) / 60, 2) : Zp(e, t)
}

function Zp(e, t) {
    var n = t || "",
        r = e > 0 ? "-" : "+",
        o = Math.abs(e);
    return r + Wp(Math.floor(o / 60), 2) + n + Wp(o % 60, 2)
}
const ed = {
    G: function(e, t, n) {
        var r = e.getUTCFullYear() > 0 ? 1 : 0;
        switch (t) {
            case "G":
            case "GG":
            case "GGG":
                return n.era(r, {
                    width: "abbreviated"
                });
            case "GGGGG":
                return n.era(r, {
                    width: "narrow"
                });
            default:
                return n.era(r, {
                    width: "wide"
                })
        }
    },
    y: function(e, t, n) {
        if ("yo" === t) {
            var r = e.getUTCFullYear(),
                o = r > 0 ? r : 1 - r;
            return n.ordinalNumber(o, {
                unit: "year"
            })
        }
        return Kp.y(e, t)
    },
    Y: function(e, t, n, r) {
        var o = Hp(e, r),
            i = o > 0 ? o : 1 - o;
        return "YY" === t ? Wp(i % 100, 2) : "Yo" === t ? n.ordinalNumber(i, {
            unit: "year"
        }) : Wp(i, t.length)
    },
    R: function(e, t) {
        return Wp(Up(e), t.length)
    },
    u: function(e, t) {
        return Wp(e.getUTCFullYear(), t.length)
    },
    Q: function(e, t, n) {
        var r = Math.ceil((e.getUTCMonth() + 1) / 3);
        switch (t) {
            case "Q":
                return String(r);
            case "QQ":
                return Wp(r, 2);
            case "Qo":
                return n.ordinalNumber(r, {
                    unit: "quarter"
                });
            case "QQQ":
                return n.quarter(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "QQQQQ":
                return n.quarter(r, {
                    width: "narrow",
                    context: "formatting"
                });
            default:
                return n.quarter(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    q: function(e, t, n) {
        var r = Math.ceil((e.getUTCMonth() + 1) / 3);
        switch (t) {
            case "q":
                return String(r);
            case "qq":
                return Wp(r, 2);
            case "qo":
                return n.ordinalNumber(r, {
                    unit: "quarter"
                });
            case "qqq":
                return n.quarter(r, {
                    width: "abbreviated",
                    context: "standalone"
                });
            case "qqqqq":
                return n.quarter(r, {
                    width: "narrow",
                    context: "standalone"
                });
            default:
                return n.quarter(r, {
                    width: "wide",
                    context: "standalone"
                })
        }
    },
    M: function(e, t, n) {
        var r = e.getUTCMonth();
        switch (t) {
            case "M":
            case "MM":
                return Kp.M(e, t);
            case "Mo":
                return n.ordinalNumber(r + 1, {
                    unit: "month"
                });
            case "MMM":
                return n.month(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "MMMMM":
                return n.month(r, {
                    width: "narrow",
                    context: "formatting"
                });
            default:
                return n.month(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    L: function(e, t, n) {
        var r = e.getUTCMonth();
        switch (t) {
            case "L":
                return String(r + 1);
            case "LL":
                return Wp(r + 1, 2);
            case "Lo":
                return n.ordinalNumber(r + 1, {
                    unit: "month"
                });
            case "LLL":
                return n.month(r, {
                    width: "abbreviated",
                    context: "standalone"
                });
            case "LLLLL":
                return n.month(r, {
                    width: "narrow",
                    context: "standalone"
                });
            default:
                return n.month(r, {
                    width: "wide",
                    context: "standalone"
                })
        }
    },
    w: function(e, t, n, r) {
        var o = $p(e, r);
        return "wo" === t ? n.ordinalNumber(o, {
            unit: "week"
        }) : Wp(o, t.length)
    },
    I: function(e, t, n) {
        var r = qp(e);
        return "Io" === t ? n.ordinalNumber(r, {
            unit: "week"
        }) : Wp(r, t.length)
    },
    d: function(e, t, n) {
        return "do" === t ? n.ordinalNumber(e.getUTCDate(), {
            unit: "date"
        }) : Kp.d(e, t)
    },
    D: function(e, t, n) {
        var r = function(e) {
            Iu(1, arguments);
            var t = Ru(e),
                n = t.getTime();
            t.setUTCMonth(0, 1), t.setUTCHours(0, 0, 0, 0);
            var r = t.getTime(),
                o = n - r;
            return Math.floor(o / Mp) + 1
        }(e);
        return "Do" === t ? n.ordinalNumber(r, {
            unit: "dayOfYear"
        }) : Wp(r, t.length)
    },
    E: function(e, t, n) {
        var r = e.getUTCDay();
        switch (t) {
            case "E":
            case "EE":
            case "EEE":
                return n.day(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "EEEEE":
                return n.day(r, {
                    width: "narrow",
                    context: "formatting"
                });
            case "EEEEEE":
                return n.day(r, {
                    width: "short",
                    context: "formatting"
                });
            default:
                return n.day(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    e: function(e, t, n, r) {
        var o = e.getUTCDay(),
            i = (o - r.weekStartsOn + 8) % 7 || 7;
        switch (t) {
            case "e":
                return String(i);
            case "ee":
                return Wp(i, 2);
            case "eo":
                return n.ordinalNumber(i, {
                    unit: "day"
                });
            case "eee":
                return n.day(o, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "eeeee":
                return n.day(o, {
                    width: "narrow",
                    context: "formatting"
                });
            case "eeeeee":
                return n.day(o, {
                    width: "short",
                    context: "formatting"
                });
            default:
                return n.day(o, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    c: function(e, t, n, r) {
        var o = e.getUTCDay(),
            i = (o - r.weekStartsOn + 8) % 7 || 7;
        switch (t) {
            case "c":
                return String(i);
            case "cc":
                return Wp(i, t.length);
            case "co":
                return n.ordinalNumber(i, {
                    unit: "day"
                });
            case "ccc":
                return n.day(o, {
                    width: "abbreviated",
                    context: "standalone"
                });
            case "ccccc":
                return n.day(o, {
                    width: "narrow",
                    context: "standalone"
                });
            case "cccccc":
                return n.day(o, {
                    width: "short",
                    context: "standalone"
                });
            default:
                return n.day(o, {
                    width: "wide",
                    context: "standalone"
                })
        }
    },
    i: function(e, t, n) {
        var r = e.getUTCDay(),
            o = 0 === r ? 7 : r;
        switch (t) {
            case "i":
                return String(o);
            case "ii":
                return Wp(o, t.length);
            case "io":
                return n.ordinalNumber(o, {
                    unit: "day"
                });
            case "iii":
                return n.day(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "iiiii":
                return n.day(r, {
                    width: "narrow",
                    context: "formatting"
                });
            case "iiiiii":
                return n.day(r, {
                    width: "short",
                    context: "formatting"
                });
            default:
                return n.day(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    a: function(e, t, n) {
        var r = e.getUTCHours() / 12 >= 1 ? "pm" : "am";
        switch (t) {
            case "a":
            case "aa":
                return n.dayPeriod(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "aaa":
                return n.dayPeriod(r, {
                    width: "abbreviated",
                    context: "formatting"
                }).toLowerCase();
            case "aaaaa":
                return n.dayPeriod(r, {
                    width: "narrow",
                    context: "formatting"
                });
            default:
                return n.dayPeriod(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    b: function(e, t, n) {
        var r, o = e.getUTCHours();
        switch (r = 12 === o ? "noon" : 0 === o ? "midnight" : o / 12 >= 1 ? "pm" : "am", t) {
            case "b":
            case "bb":
                return n.dayPeriod(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "bbb":
                return n.dayPeriod(r, {
                    width: "abbreviated",
                    context: "formatting"
                }).toLowerCase();
            case "bbbbb":
                return n.dayPeriod(r, {
                    width: "narrow",
                    context: "formatting"
                });
            default:
                return n.dayPeriod(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    B: function(e, t, n) {
        var r, o = e.getUTCHours();
        switch (r = o >= 17 ? "evening" : o >= 12 ? "afternoon" : o >= 4 ? "morning" : "night", t) {
            case "B":
            case "BB":
            case "BBB":
                return n.dayPeriod(r, {
                    width: "abbreviated",
                    context: "formatting"
                });
            case "BBBBB":
                return n.dayPeriod(r, {
                    width: "narrow",
                    context: "formatting"
                });
            default:
                return n.dayPeriod(r, {
                    width: "wide",
                    context: "formatting"
                })
        }
    },
    h: function(e, t, n) {
        if ("ho" === t) {
            var r = e.getUTCHours() % 12;
            return 0 === r && (r = 12), n.ordinalNumber(r, {
                unit: "hour"
            })
        }
        return Kp.h(e, t)
    },
    H: function(e, t, n) {
        return "Ho" === t ? n.ordinalNumber(e.getUTCHours(), {
            unit: "hour"
        }) : Kp.H(e, t)
    },
    K: function(e, t, n) {
        var r = e.getUTCHours() % 12;
        return "Ko" === t ? n.ordinalNumber(r, {
            unit: "hour"
        }) : Wp(r, t.length)
    },
    k: function(e, t, n) {
        var r = e.getUTCHours();
        return 0 === r && (r = 24), "ko" === t ? n.ordinalNumber(r, {
            unit: "hour"
        }) : Wp(r, t.length)
    },
    m: function(e, t, n) {
        return "mo" === t ? n.ordinalNumber(e.getUTCMinutes(), {
            unit: "minute"
        }) : Kp.m(e, t)
    },
    s: function(e, t, n) {
        return "so" === t ? n.ordinalNumber(e.getUTCSeconds(), {
            unit: "second"
        }) : Kp.s(e, t)
    },
    S: function(e, t) {
        return Kp.S(e, t)
    },
    X: function(e, t, n, r) {
        var o = (r._originalDate || e).getTimezoneOffset();
        if (0 === o) return "Z";
        switch (t) {
            case "X":
                return Xp(o);
            case "XXXX":
            case "XX":
                return Zp(o);
            default:
                return Zp(o, ":")
        }
    },
    x: function(e, t, n, r) {
        var o = (r._originalDate || e).getTimezoneOffset();
        switch (t) {
            case "x":
                return Xp(o);
            case "xxxx":
            case "xx":
                return Zp(o);
            default:
                return Zp(o, ":")
        }
    },
    O: function(e, t, n, r) {
        var o = (r._originalDate || e).getTimezoneOffset();
        switch (t) {
            case "O":
            case "OO":
            case "OOO":
                return "GMT" + Qp(o, ":");
            default:
                return "GMT" + Zp(o, ":")
        }
    },
    z: function(e, t, n, r) {
        var o = (r._originalDate || e).getTimezoneOffset();
        switch (t) {
            case "z":
            case "zz":
            case "zzz":
                return "GMT" + Qp(o, ":");
            default:
                return "GMT" + Zp(o, ":")
        }
    },
    t: function(e, t, n, r) {
        var o = r._originalDate || e;
        return Wp(Math.floor(o.getTime() / 1e3), t.length)
    },
    T: function(e, t, n, r) {
        return Wp((r._originalDate || e).getTime(), t.length)
    }
};
var td = function(e, t) {
        switch (e) {
            case "P":
                return t.date({
                    width: "short"
                });
            case "PP":
                return t.date({
                    width: "medium"
                });
            case "PPP":
                return t.date({
                    width: "long"
                });
            default:
                return t.date({
                    width: "full"
                })
        }
    },
    nd = function(e, t) {
        switch (e) {
            case "p":
                return t.time({
                    width: "short"
                });
            case "pp":
                return t.time({
                    width: "medium"
                });
            case "ppp":
                return t.time({
                    width: "long"
                });
            default:
                return t.time({
                    width: "full"
                })
        }
    };
const rd = {
    p: nd,
    P: function(e, t) {
        var n, r = e.match(/(P+)(p+)?/) || [],
            o = r[1],
            i = r[2];
        if (!i) return td(e, t);
        switch (o) {
            case "P":
                n = t.dateTime({
                    width: "short"
                });
                break;
            case "PP":
                n = t.dateTime({
                    width: "medium"
                });
                break;
            case "PPP":
                n = t.dateTime({
                    width: "long"
                });
                break;
            default:
                n = t.dateTime({
                    width: "full"
                })
        }
        return n.replace("{{date}}", td(o, t)).replace("{{time}}", nd(i, t))
    }
};
var od = ["D", "DD"],
    id = ["YY", "YYYY"];

function ad(e) {
    return -1 !== od.indexOf(e)
}

function sd(e) {
    return -1 !== id.indexOf(e)
}

function ld(e, t, n) {
    if ("YYYY" === e) throw new RangeError("Use `yyyy` instead of `YYYY` (in `".concat(t, "`) for formatting years to the input `").concat(n, "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"));
    if ("YY" === e) throw new RangeError("Use `yy` instead of `YY` (in `".concat(t, "`) for formatting years to the input `").concat(n, "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"));
    if ("D" === e) throw new RangeError("Use `d` instead of `D` (in `".concat(t, "`) for formatting days of the month to the input `").concat(n, "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"));
    if ("DD" === e) throw new RangeError("Use `dd` instead of `DD` (in `".concat(t, "`) for formatting days of the month to the input `").concat(n, "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"))
}
var ud = {
    lessThanXSeconds: {
        one: "less than a second",
        other: "less than {{count}} seconds"
    },
    xSeconds: {
        one: "1 second",
        other: "{{count}} seconds"
    },
    halfAMinute: "half a minute",
    lessThanXMinutes: {
        one: "less than a minute",
        other: "less than {{count}} minutes"
    },
    xMinutes: {
        one: "1 minute",
        other: "{{count}} minutes"
    },
    aboutXHours: {
        one: "about 1 hour",
        other: "about {{count}} hours"
    },
    xHours: {
        one: "1 hour",
        other: "{{count}} hours"
    },
    xDays: {
        one: "1 day",
        other: "{{count}} days"
    },
    aboutXWeeks: {
        one: "about 1 week",
        other: "about {{count}} weeks"
    },
    xWeeks: {
        one: "1 week",
        other: "{{count}} weeks"
    },
    aboutXMonths: {
        one: "about 1 month",
        other: "about {{count}} months"
    },
    xMonths: {
        one: "1 month",
        other: "{{count}} months"
    },
    aboutXYears: {
        one: "about 1 year",
        other: "about {{count}} years"
    },
    xYears: {
        one: "1 year",
        other: "{{count}} years"
    },
    overXYears: {
        one: "over 1 year",
        other: "over {{count}} years"
    },
    almostXYears: {
        one: "almost 1 year",
        other: "almost {{count}} years"
    }
};

function cd(e) {
    return function() {
        var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            n = t.width ? String(t.width) : e.defaultWidth,
            r = e.formats[n] || e.formats[e.defaultWidth];
        return r
    }
}
const pd = {
    date: cd({
        formats: {
            full: "EEEE, MMMM do, y",
            long: "MMMM do, y",
            medium: "MMM d, y",
            short: "MM/dd/yyyy"
        },
        defaultWidth: "full"
    }),
    time: cd({
        formats: {
            full: "h:mm:ss a zzzz",
            long: "h:mm:ss a z",
            medium: "h:mm:ss a",
            short: "h:mm a"
        },
        defaultWidth: "full"
    }),
    dateTime: cd({
        formats: {
            full: "{{date}} 'at' {{time}}",
            long: "{{date}} 'at' {{time}}",
            medium: "{{date}}, {{time}}",
            short: "{{date}}, {{time}}"
        },
        defaultWidth: "full"
    })
};
var dd = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: "P"
};

function hd(e) {
    return function(t, n) {
        var r;
        if ("formatting" === (null != n && n.context ? String(n.context) : "standalone") && e.formattingValues) {
            var o = e.defaultFormattingWidth || e.defaultWidth,
                i = null != n && n.width ? String(n.width) : o;
            r = e.formattingValues[i] || e.formattingValues[o]
        } else {
            var a = e.defaultWidth,
                s = null != n && n.width ? String(n.width) : e.defaultWidth;
            r = e.values[s] || e.values[a]
        }
        return r[e.argumentCallback ? e.argumentCallback(t) : t]
    }
}
const fd = {
    ordinalNumber: function(e, t) {
        var n = Number(e),
            r = n % 100;
        if (r > 20 || r < 10) switch (r % 10) {
            case 1:
                return n + "st";
            case 2:
                return n + "nd";
            case 3:
                return n + "rd"
        }
        return n + "th"
    },
    era: hd({
        values: {
            narrow: ["B", "A"],
            abbreviated: ["BC", "AD"],
            wide: ["Before Christ", "Anno Domini"]
        },
        defaultWidth: "wide"
    }),
    quarter: hd({
        values: {
            narrow: ["1", "2", "3", "4"],
            abbreviated: ["Q1", "Q2", "Q3", "Q4"],
            wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
        },
        defaultWidth: "wide",
        argumentCallback: function(e) {
            return e - 1
        }
    }),
    month: hd({
        values: {
            narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
            abbreviated: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            wide: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        defaultWidth: "wide"
    }),
    day: hd({
        values: {
            narrow: ["S", "M", "T", "W", "T", "F", "S"],
            short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            wide: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        defaultWidth: "wide"
    }),
    dayPeriod: hd({
        values: {
            narrow: {
                am: "a",
                pm: "p",
                midnight: "mi",
                noon: "n",
                morning: "morning",
                afternoon: "afternoon",
                evening: "evening",
                night: "night"
            },
            abbreviated: {
                am: "AM",
                pm: "PM",
                midnight: "midnight",
                noon: "noon",
                morning: "morning",
                afternoon: "afternoon",
                evening: "evening",
                night: "night"
            },
            wide: {
                am: "a.m.",
                pm: "p.m.",
                midnight: "midnight",
                noon: "noon",
                morning: "morning",
                afternoon: "afternoon",
                evening: "evening",
                night: "night"
            }
        },
        defaultWidth: "wide",
        formattingValues: {
            narrow: {
                am: "a",
                pm: "p",
                midnight: "mi",
                noon: "n",
                morning: "in the morning",
                afternoon: "in the afternoon",
                evening: "in the evening",
                night: "at night"
            },
            abbreviated: {
                am: "AM",
                pm: "PM",
                midnight: "midnight",
                noon: "noon",
                morning: "in the morning",
                afternoon: "in the afternoon",
                evening: "in the evening",
                night: "at night"
            },
            wide: {
                am: "a.m.",
                pm: "p.m.",
                midnight: "midnight",
                noon: "noon",
                morning: "in the morning",
                afternoon: "in the afternoon",
                evening: "in the evening",
                night: "at night"
            }
        },
        defaultFormattingWidth: "wide"
    })
};

function md(e) {
    return function(t) {
        var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
            r = n.width,
            o = r && e.matchPatterns[r] || e.matchPatterns[e.defaultMatchWidth],
            i = t.match(o);
        if (!i) return null;
        var a, s = i[0],
            l = r && e.parsePatterns[r] || e.parsePatterns[e.defaultParseWidth],
            u = Array.isArray(l) ? yd(l, (function(e) {
                return e.test(s)
            })) : gd(l, (function(e) {
                return e.test(s)
            }));
        a = e.valueCallback ? e.valueCallback(u) : u, a = n.valueCallback ? n.valueCallback(a) : a;
        var c = t.slice(s.length);
        return {
            value: a,
            rest: c
        }
    }
}

function gd(e, t) {
    for (var n in e)
        if (e.hasOwnProperty(n) && t(e[n])) return n
}

function yd(e, t) {
    for (var n = 0; n < e.length; n++)
        if (t(e[n])) return n
}
var vd, bd = {
    ordinalNumber: (vd = {
        matchPattern: /^(\d+)(th|st|nd|rd)?/i,
        parsePattern: /\d+/i,
        valueCallback: function(e) {
            return parseInt(e, 10)
        }
    }, function(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
            n = e.match(vd.matchPattern);
        if (!n) return null;
        var r = n[0],
            o = e.match(vd.parsePattern);
        if (!o) return null;
        var i = vd.valueCallback ? vd.valueCallback(o[0]) : o[0];
        i = t.valueCallback ? t.valueCallback(i) : i;
        var a = e.slice(r.length);
        return {
            value: i,
            rest: a
        }
    }),
    era: md({
        matchPatterns: {
            narrow: /^(b|a)/i,
            abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
            wide: /^(before christ|before common era|anno domini|common era)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
            any: [/^b/i, /^(a|c)/i]
        },
        defaultParseWidth: "any"
    }),
    quarter: md({
        matchPatterns: {
            narrow: /^[1234]/i,
            abbreviated: /^q[1234]/i,
            wide: /^[1234](th|st|nd|rd)? quarter/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
            any: [/1/i, /2/i, /3/i, /4/i]
        },
        defaultParseWidth: "any",
        valueCallback: function(e) {
            return e + 1
        }
    }),
    month: md({
        matchPatterns: {
            narrow: /^[jfmasond]/i,
            abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
            wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
            narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
            any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
        },
        defaultParseWidth: "any"
    }),
    day: md({
        matchPatterns: {
            narrow: /^[smtwf]/i,
            short: /^(su|mo|tu|we|th|fr|sa)/i,
            abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
            wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
            narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
            any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
        },
        defaultParseWidth: "any"
    }),
    dayPeriod: md({
        matchPatterns: {
            narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
            any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
        },
        defaultMatchWidth: "any",
        parsePatterns: {
            any: {
                am: /^a/i,
                pm: /^p/i,
                midnight: /^mi/i,
                noon: /^no/i,
                morning: /morning/i,
                afternoon: /afternoon/i,
                evening: /evening/i,
                night: /night/i
            }
        },
        defaultParseWidth: "any"
    })
};
const _d = {
    code: "en-US",
    formatDistance: function(e, t, n) {
        var r, o = ud[e];
        return r = "string" == typeof o ? o : 1 === t ? o.one : o.other.replace("{{count}}", t.toString()), null != n && n.addSuffix ? n.comparison && n.comparison > 0 ? "in " + r : r + " ago" : r
    },
    formatLong: pd,
    formatRelative: function(e, t, n, r) {
        return dd[e]
    },
    localize: fd,
    match: bd,
    options: {
        weekStartsOn: 0,
        firstWeekContainsDate: 1
    }
};
var wd = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
    Ed = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
    Td = /^'([^]*?)'?$/,
    Sd = /''/g,
    Od = /[a-zA-Z]/;

function Ad(e, t, n) {
    var r, o, i, a, s, l, u, c, p, d, h, f, m, g, y, v, b, _;
    Iu(2, arguments);
    var w = String(t),
        E = Hu(),
        T = null !== (r = null !== (o = null == n ? void 0 : n.locale) && void 0 !== o ? o : E.locale) && void 0 !== r ? r : _d,
        S = Pu(null !== (i = null !== (a = null !== (s = null !== (l = null == n ? void 0 : n.firstWeekContainsDate) && void 0 !== l ? l : null == n || null === (u = n.locale) || void 0 === u || null === (c = u.options) || void 0 === c ? void 0 : c.firstWeekContainsDate) && void 0 !== s ? s : E.firstWeekContainsDate) && void 0 !== a ? a : null === (p = E.locale) || void 0 === p || null === (d = p.options) || void 0 === d ? void 0 : d.firstWeekContainsDate) && void 0 !== i ? i : 1);
    if (!(S >= 1 && S <= 7)) throw new RangeError("firstWeekContainsDate must be between 1 and 7 inclusively");
    var O = Pu(null !== (h = null !== (f = null !== (m = null !== (g = null == n ? void 0 : n.weekStartsOn) && void 0 !== g ? g : null == n || null === (y = n.locale) || void 0 === y || null === (v = y.options) || void 0 === v ? void 0 : v.weekStartsOn) && void 0 !== m ? m : E.weekStartsOn) && void 0 !== f ? f : null === (b = E.locale) || void 0 === b || null === (_ = b.options) || void 0 === _ ? void 0 : _.weekStartsOn) && void 0 !== h ? h : 0);
    if (!(O >= 0 && O <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    if (!T.localize) throw new RangeError("locale must contain localize property");
    if (!T.formatLong) throw new RangeError("locale must contain formatLong property");
    var A = Ru(e);
    if (!Lc(A)) throw new RangeError("Invalid time value");
    var k = Ku(A),
        x = Lp(A, k),
        C = {
            firstWeekContainsDate: S,
            weekStartsOn: O,
            locale: T,
            _originalDate: A
        },
        P = w.match(Ed).map((function(e) {
            var t = e[0];
            return "p" === t || "P" === t ? (0, rd[t])(e, T.formatLong) : e
        })).join("").match(wd).map((function(r) {
            if ("''" === r) return "'";
            var o = r[0];
            if ("'" === o) return kd(r);
            var i = ed[o];
            if (i) return null != n && n.useAdditionalWeekYearTokens || !sd(r) || ld(r, t, String(e)), null != n && n.useAdditionalDayOfYearTokens || !ad(r) || ld(r, t, String(e)), i(x, r, T.localize, C);
            if (o.match(Od)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + o + "`");
            return r
        })).join("");
    return P
}

function kd(e) {
    var t = e.match(Td);
    return t ? t[1].replace(Sd, "'") : e
}

function xd(e, t) {
    if (null == e) throw new TypeError("assign requires that input parameter not be null or undefined");
    for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
    return e
}

function Cd(e) {
    return xd({}, e)
}
var Pd = 1440,
    Id = 43200;

function Rd(e, t, n) {
    var r, o;
    Iu(2, arguments);
    var i = Hu(),
        a = null !== (r = null !== (o = null == n ? void 0 : n.locale) && void 0 !== o ? o : i.locale) && void 0 !== r ? r : _d;
    if (!a.formatDistance) throw new RangeError("locale must contain formatDistance property");
    var s = hc(e, t);
    if (isNaN(s)) throw new RangeError("Invalid time value");
    var l, u, c = xd(Cd(n), {
        addSuffix: Boolean(null == n ? void 0 : n.addSuffix),
        comparison: s
    });
    s > 0 ? (l = Ru(t), u = Ru(e)) : (l = Ru(e), u = Ru(t));
    var p, d = sp(u, l),
        h = (Ku(u) - Ku(l)) / 1e3,
        f = Math.round((d - h) / 60);
    if (f < 2) return null != n && n.includeSeconds ? d < 5 ? a.formatDistance("lessThanXSeconds", 5, c) : d < 10 ? a.formatDistance("lessThanXSeconds", 10, c) : d < 20 ? a.formatDistance("lessThanXSeconds", 20, c) : d < 40 ? a.formatDistance("halfAMinute", 0, c) : d < 60 ? a.formatDistance("lessThanXMinutes", 1, c) : a.formatDistance("xMinutes", 1, c) : 0 === f ? a.formatDistance("lessThanXMinutes", 1, c) : a.formatDistance("xMinutes", f, c);
    if (f < 45) return a.formatDistance("xMinutes", f, c);
    if (f < 90) return a.formatDistance("aboutXHours", 1, c);
    if (f < Pd) {
        var m = Math.round(f / 60);
        return a.formatDistance("aboutXHours", m, c)
    }
    if (f < 2520) return a.formatDistance("xDays", 1, c);
    if (f < Id) {
        var g = Math.round(f / Pd);
        return a.formatDistance("xDays", g, c)
    }
    if (f < 86400) return p = Math.round(f / Id), a.formatDistance("aboutXMonths", p, c);
    if ((p = ip(u, l)) < 12) {
        var y = Math.round(f / Id);
        return a.formatDistance("xMonths", y, c)
    }
    var v = p % 12,
        b = Math.floor(p / 12);
    return v < 3 ? a.formatDistance("aboutXYears", b, c) : v < 9 ? a.formatDistance("overXYears", b, c) : a.formatDistance("almostXYears", b + 1, c)
}
var Dd = 6e4,
    Nd = 1440,
    jd = 43200,
    Ld = 525600;

function Md(e, t, n) {
    var r, o, i;
    Iu(2, arguments);
    var a = Hu(),
        s = null !== (r = null !== (o = null == n ? void 0 : n.locale) && void 0 !== o ? o : a.locale) && void 0 !== r ? r : _d;
    if (!s.formatDistance) throw new RangeError("locale must contain localize.formatDistance property");
    var l = hc(e, t);
    if (isNaN(l)) throw new RangeError("Invalid time value");
    var u, c, p = xd(Cd(n), {
        addSuffix: Boolean(null == n ? void 0 : n.addSuffix),
        comparison: l
    });
    l > 0 ? (u = Ru(t), c = Ru(e)) : (u = Ru(e), c = Ru(t));
    var d, h = String(null !== (i = null == n ? void 0 : n.roundingMethod) && void 0 !== i ? i : "round");
    if ("floor" === h) d = Math.floor;
    else if ("ceil" === h) d = Math.ceil;
    else {
        if ("round" !== h) throw new RangeError("roundingMethod must be 'floor', 'ceil' or 'round'");
        d = Math.round
    }
    var f, m = c.getTime() - u.getTime(),
        g = m / Dd,
        y = Ku(c) - Ku(u),
        v = (m - y) / Dd,
        b = null == n ? void 0 : n.unit;
    if ("second" === (f = b ? String(b) : g < 1 ? "second" : g < 60 ? "minute" : g < Nd ? "hour" : v < jd ? "day" : v < Ld ? "month" : "year")) {
        var _ = d(m / 1e3);
        return s.formatDistance("xSeconds", _, p)
    }
    if ("minute" === f) {
        var w = d(g);
        return s.formatDistance("xMinutes", w, p)
    }
    if ("hour" === f) {
        var E = d(g / 60);
        return s.formatDistance("xHours", E, p)
    }
    if ("day" === f) {
        var T = d(v / Nd);
        return s.formatDistance("xDays", T, p)
    }
    if ("month" === f) {
        var S = d(v / jd);
        return 12 === S && "month" !== b ? s.formatDistance("xYears", 1, p) : s.formatDistance("xMonths", S, p)
    }
    if ("year" === f) {
        var O = d(v / Ld);
        return s.formatDistance("xYears", O, p)
    }
    throw new RangeError("unit must be 'second', 'minute', 'hour', 'day', 'month' or 'year'")
}

function Fd(e, t) {
    return Iu(1, arguments), Rd(e, Date.now(), t)
}

function Ud(e, t) {
    return Iu(1, arguments), Md(e, Date.now(), t)
}
var Bd = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

function Vd(e, t) {
    var n, r, o, i, a;
    if (arguments.length < 1) throw new TypeError("1 argument required, but only ".concat(arguments.length, " present"));
    var s = Hu(),
        l = null !== (n = null !== (r = null == t ? void 0 : t.locale) && void 0 !== r ? r : s.locale) && void 0 !== n ? n : _d,
        u = null !== (o = null == t ? void 0 : t.format) && void 0 !== o ? o : Bd,
        c = null !== (i = null == t ? void 0 : t.zero) && void 0 !== i && i,
        p = null !== (a = null == t ? void 0 : t.delimiter) && void 0 !== a ? a : " ";
    if (!l.formatDistance) return "";
    var d = u.reduce((function(t, n) {
        var r = "x".concat(n.replace(/(^.)/, (function(e) {
                return e.toUpperCase()
            }))),
            o = e[n];
        return "number" == typeof o && (c || e[n]) ? t.concat(l.formatDistance(r, o)) : t
    }), []).join(p);
    return d
}

function qd(e, t) {
    var n, r;
    Iu(1, arguments);
    var o = Ru(e);
    if (isNaN(o.getTime())) throw new RangeError("Invalid time value");
    var i = String(null !== (n = null == t ? void 0 : t.format) && void 0 !== n ? n : "extended"),
        a = String(null !== (r = null == t ? void 0 : t.representation) && void 0 !== r ? r : "complete");
    if ("extended" !== i && "basic" !== i) throw new RangeError("format must be 'extended' or 'basic'");
    if ("date" !== a && "time" !== a && "complete" !== a) throw new RangeError("representation must be 'date', 'time', or 'complete'");
    var s = "",
        l = "",
        u = "extended" === i ? "-" : "",
        c = "extended" === i ? ":" : "";
    if ("time" !== a) {
        var p = Wp(o.getDate(), 2),
            d = Wp(o.getMonth() + 1, 2),
            h = Wp(o.getFullYear(), 4);
        s = "".concat(h).concat(u).concat(d).concat(u).concat(p)
    }
    if ("date" !== a) {
        var f = o.getTimezoneOffset();
        if (0 !== f) {
            var m = Math.abs(f),
                g = Wp(Math.floor(m / 60), 2),
                y = Wp(m % 60, 2),
                v = f < 0 ? "+" : "-";
            l = "".concat(v).concat(g, ":").concat(y)
        } else l = "Z";
        var b = Wp(o.getHours(), 2),
            _ = Wp(o.getMinutes(), 2),
            w = Wp(o.getSeconds(), 2),
            E = "" === s ? "" : "T",
            T = [b, _, w].join(c);
        s = "".concat(s).concat(E).concat(T).concat(l)
    }
    return s
}

function Yd(e, t) {
    var n, r;
    if (arguments.length < 1) throw new TypeError("1 argument required, but only ".concat(arguments.length, " present"));
    var o = Ru(e);
    if (!Lc(o)) throw new RangeError("Invalid time value");
    var i = String(null !== (n = null == t ? void 0 : t.format) && void 0 !== n ? n : "extended"),
        a = String(null !== (r = null == t ? void 0 : t.representation) && void 0 !== r ? r : "complete");
    if ("extended" !== i && "basic" !== i) throw new RangeError("format must be 'extended' or 'basic'");
    if ("date" !== a && "time" !== a && "complete" !== a) throw new RangeError("representation must be 'date', 'time', or 'complete'");
    var s = "",
        l = "extended" === i ? "-" : "",
        u = "extended" === i ? ":" : "";
    if ("time" !== a) {
        var c = Wp(o.getDate(), 2),
            p = Wp(o.getMonth() + 1, 2),
            d = Wp(o.getFullYear(), 4);
        s = "".concat(d).concat(l).concat(p).concat(l).concat(c)
    }
    if ("date" !== a) {
        var h = Wp(o.getHours(), 2),
            f = Wp(o.getMinutes(), 2),
            m = Wp(o.getSeconds(), 2),
            g = "" === s ? "" : " ";
        s = "".concat(s).concat(g).concat(h).concat(u).concat(f).concat(u).concat(m)
    }
    return s
}

function Hd(e) {
    if (Iu(1, arguments), "object" != typeof e) throw new Error("Duration must be an object");
    var t = e.years,
        n = void 0 === t ? 0 : t,
        r = e.months,
        o = void 0 === r ? 0 : r,
        i = e.days,
        a = void 0 === i ? 0 : i,
        s = e.hours,
        l = void 0 === s ? 0 : s,
        u = e.minutes,
        c = void 0 === u ? 0 : u,
        p = e.seconds,
        d = void 0 === p ? 0 : p;
    return "P".concat(n, "Y").concat(o, "M").concat(a, "DT").concat(l, "H").concat(c, "M").concat(d, "S")
}

function Gd(e, t) {
    var n;
    if (arguments.length < 1) throw new TypeError("1 arguments required, but only ".concat(arguments.length, " present"));
    var r = Ru(e);
    if (!Lc(r)) throw new RangeError("Invalid time value");
    var o = Number(null !== (n = null == t ? void 0 : t.fractionDigits) && void 0 !== n ? n : 0);
    if (!(o >= 0 && o <= 3)) throw new RangeError("fractionDigits must be between 0 and 3 inclusively");
    var i = Wp(r.getDate(), 2),
        a = Wp(r.getMonth() + 1, 2),
        s = r.getFullYear(),
        l = Wp(r.getHours(), 2),
        u = Wp(r.getMinutes(), 2),
        c = Wp(r.getSeconds(), 2),
        p = "";
    if (o > 0) {
        var d = r.getMilliseconds(),
            h = Math.floor(d * Math.pow(10, o - 3));
        p = "." + Wp(h, o)
    }
    var f = "",
        m = r.getTimezoneOffset();
    if (0 !== m) {
        var g = Math.abs(m),
            y = Wp(Pu(g / 60), 2),
            v = Wp(g % 60, 2),
            b = m < 0 ? "+" : "-";
        f = "".concat(b).concat(y, ":").concat(v)
    } else f = "Z";
    return "".concat(s, "-").concat(a, "-").concat(i, "T").concat(l, ":").concat(u, ":").concat(c).concat(p).concat(f)
}
var zd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    $d = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Wd(e) {
    if (arguments.length < 1) throw new TypeError("1 arguments required, but only ".concat(arguments.length, " present"));
    var t = Ru(e);
    if (!Lc(t)) throw new RangeError("Invalid time value");
    var n = zd[t.getUTCDay()],
        r = Wp(t.getUTCDate(), 2),
        o = $d[t.getUTCMonth()],
        i = t.getUTCFullYear(),
        a = Wp(t.getUTCHours(), 2),
        s = Wp(t.getUTCMinutes(), 2),
        l = Wp(t.getUTCSeconds(), 2);
    return "".concat(n, ", ").concat(r, " ").concat(o, " ").concat(i, " ").concat(a, ":").concat(s, ":").concat(l, " GMT")
}

function Jd(e, t, n) {
    var r, o, i, a, s, l, u, c, p, d;
    Iu(2, arguments);
    var h = Ru(e),
        f = Ru(t),
        m = Hu(),
        g = null !== (r = null !== (o = null == n ? void 0 : n.locale) && void 0 !== o ? o : m.locale) && void 0 !== r ? r : _d,
        y = Pu(null !== (i = null !== (a = null !== (s = null !== (l = null == n ? void 0 : n.weekStartsOn) && void 0 !== l ? l : null == n || null === (u = n.locale) || void 0 === u || null === (c = u.options) || void 0 === c ? void 0 : c.weekStartsOn) && void 0 !== s ? s : m.weekStartsOn) && void 0 !== a ? a : null === (p = m.locale) || void 0 === p || null === (d = p.options) || void 0 === d ? void 0 : d.weekStartsOn) && void 0 !== i ? i : 0);
    if (!g.localize) throw new RangeError("locale must contain localize property");
    if (!g.formatLong) throw new RangeError("locale must contain formatLong property");
    if (!g.formatRelative) throw new RangeError("locale must contain formatRelative property");
    var v, b = Zu(h, f);
    if (isNaN(b)) throw new RangeError("Invalid time value");
    v = b < -6 ? "other" : b < -1 ? "lastWeek" : b < 0 ? "yesterday" : b < 1 ? "today" : b < 2 ? "tomorrow" : b < 7 ? "nextWeek" : "other";
    var _ = Lp(h, Ku(h)),
        w = Lp(f, Ku(f)),
        E = g.formatRelative(v, _, w, {
            locale: g,
            weekStartsOn: y
        });
    return Ad(h, E, {
        locale: g,
        weekStartsOn: y
    })
}

function Kd(e) {
    Iu(1, arguments);
    var t = Pu(e);
    return Ru(1e3 * t)
}

function Qd(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getDate();
    return n
}

function Xd(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getDay();
    return n
}

function Zd(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = Zu(t, Ep(t)),
        r = n + 1;
    return r
}

function eh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = t.getMonth(),
        o = new Date(0);
    return o.setFullYear(n, r + 1, 0), o.setHours(0, 0, 0, 0), o.getDate()
}

function th(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear();
    return n % 400 == 0 || n % 4 == 0 && n % 100 != 0
}

function nh(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return "Invalid Date" === String(new Date(t)) ? NaN : th(t) ? 366 : 365
}

function rh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = 10 * Math.floor(n / 10);
    return r
}

function oh() {
    return xd({}, Hu())
}

function ih(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getHours();
    return n
}

function ah(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getDay();
    return 0 === n && (n = 7), n
}
var sh = 6048e5;

function lh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = $u(t).getTime() - Ju(t).getTime();
    return Math.round(n / sh) + 1
}
var uh = 6048e5;

function ch(e) {
    Iu(1, arguments);
    var t = Ju(e),
        n = Ju(ic(t, 60)),
        r = n.valueOf() - t.valueOf();
    return Math.round(r / uh)
}

function ph(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMilliseconds();
    return n
}

function dh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMinutes();
    return n
}

function hh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth();
    return n
}
var fh = 864e5;

function mh(e, t) {
    Iu(2, arguments);
    var n = e || {},
        r = t || {},
        o = Ru(n.start).getTime(),
        i = Ru(n.end).getTime(),
        a = Ru(r.start).getTime(),
        s = Ru(r.end).getTime();
    if (!(o <= i && a <= s)) throw new RangeError("Invalid interval");
    var l = o < s && a < i;
    if (!l) return 0;
    var u = a < o ? o : a,
        c = s > i ? i : s,
        p = c - u;
    return Math.ceil(p / fh)
}

function gh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getSeconds();
    return n
}

function yh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getTime();
    return n
}

function vh(e) {
    return Iu(1, arguments), Math.floor(yh(e) / 1e3)
}

function bh(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Ru(e),
        p = c.getFullYear(),
        d = Hu(),
        h = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.firstWeekContainsDate) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.firstWeekContainsDate) && void 0 !== o ? o : d.firstWeekContainsDate) && void 0 !== r ? r : null === (l = d.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.firstWeekContainsDate) && void 0 !== n ? n : 1);
    if (!(h >= 1 && h <= 7)) throw new RangeError("firstWeekContainsDate must be between 1 and 7 inclusively");
    var f = new Date(0);
    f.setFullYear(p + 1, 0, h), f.setHours(0, 0, 0, 0);
    var m = zu(f, t),
        g = new Date(0);
    g.setFullYear(p, 0, h), g.setHours(0, 0, 0, 0);
    var y = zu(g, t);
    return c.getTime() >= m.getTime() ? p + 1 : c.getTime() >= y.getTime() ? p : p - 1
}

function _h(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.firstWeekContainsDate) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.firstWeekContainsDate) && void 0 !== o ? o : c.firstWeekContainsDate) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.firstWeekContainsDate) && void 0 !== n ? n : 1),
        d = bh(e, t),
        h = new Date(0);
    h.setFullYear(d, 0, p), h.setHours(0, 0, 0, 0);
    var f = zu(h, t);
    return f
}
var wh = 6048e5;

function Eh(e, t) {
    Iu(1, arguments);
    var n = Ru(e),
        r = zu(n, t).getTime() - _h(n, t).getTime();
    return Math.round(r / wh) + 1
}

function Th(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.weekStartsOn) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.weekStartsOn) && void 0 !== o ? o : c.weekStartsOn) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.weekStartsOn) && void 0 !== n ? n : 0);
    if (!(p >= 0 && p <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var d = Qd(e);
    if (isNaN(d)) return NaN;
    var h = Xd(bp(e)),
        f = p - h;
    f <= 0 && (f += 7);
    var m = d - f;
    return Math.ceil(m / 7) + 1
}

function Sh(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth();
    return t.setFullYear(t.getFullYear(), n + 1, 0), t.setHours(0, 0, 0, 0), t
}

function Oh(e, t) {
    return Iu(1, arguments), Gc(Sh(e), bp(e), t) + 1
}

function Ah(e) {
    return Iu(1, arguments), Ru(e).getFullYear()
}

function kh(e) {
    return Iu(1, arguments), Math.floor(e * bc)
}

function xh(e) {
    return Iu(1, arguments), Math.floor(e * Ec)
}

function Ch(e) {
    return Iu(1, arguments), Math.floor(e * Ac)
}

function Ph(e) {
    Iu(1, arguments);
    var t = Ru(e.start),
        n = Ru(e.end);
    if (isNaN(t.getTime())) throw new RangeError("Start Date is invalid");
    if (isNaN(n.getTime())) throw new RangeError("End Date is invalid");
    var r = {};
    r.years = Math.abs(up(n, t));
    var o = hc(n, t),
        i = ju(t, {
            years: o * r.years
        });
    r.months = Math.abs(ip(n, i));
    var a = ju(i, {
        months: o * r.months
    });
    r.days = Math.abs(Wc(n, a));
    var s = ju(a, {
        days: o * r.days
    });
    r.hours = Math.abs(Xc(n, s));
    var l = ju(s, {
        hours: o * r.hours
    });
    r.minutes = Math.abs(tp(n, l));
    var u = ju(l, {
        minutes: o * r.minutes
    });
    return r.seconds = Math.abs(sp(n, u)), r
}

function Ih(e, t, n) {
    var r, o;
    return Iu(1, arguments), Rh(t) ? o = t : n = t, new Intl.DateTimeFormat(null === (r = n) || void 0 === r ? void 0 : r.locale, o).format(e)
}

function Rh(e) {
    return void 0 !== e && !("locale" in e)
}

function Dh(e, t, n) {
    Iu(2, arguments);
    var r, o = 0,
        i = Ru(e),
        a = Ru(t);
    if (null != n && n.unit) "second" === (r = null == n ? void 0 : n.unit) ? o = sp(i, a) : "minute" === r ? o = tp(i, a) : "hour" === r ? o = Xc(i, a) : "day" === r ? o = Zu(i, a) : "week" === r ? o = Gc(i, a) : "month" === r ? o = Vc(i, a) : "quarter" === r ? o = Yc(i, a) : "year" === r && (o = zc(i, a));
    else {
        var s = sp(i, a);
        Math.abs(s) < kc ? (o = sp(i, a), r = "second") : Math.abs(s) < Ac ? (o = tp(i, a), r = "minute") : Math.abs(s) < xc && Math.abs(Zu(i, a)) < 1 ? (o = Xc(i, a), r = "hour") : Math.abs(s) < Cc && (o = Zu(i, a)) && Math.abs(o) < 7 ? r = "day" : Math.abs(s) < Ic ? (o = Gc(i, a), r = "week") : Math.abs(s) < Rc ? (o = Vc(i, a), r = "month") : Math.abs(s) < Pc && Yc(i, a) < 4 ? (o = Yc(i, a), r = "quarter") : (o = zc(i, a), r = "year")
    }
    var l = new Intl.RelativeTimeFormat(null == n ? void 0 : n.locale, {
        localeMatcher: null == n ? void 0 : n.localeMatcher,
        numeric: (null == n ? void 0 : n.numeric) || "auto",
        style: null == n ? void 0 : n.style
    });
    return l.format(o, r)
}

function Nh(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getTime() > r.getTime()
}

function jh(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getTime() < r.getTime()
}

function Lh(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getTime() === r.getTime()
}

function Mh(e, t, n) {
    if (arguments.length < 3) throw new TypeError("3 argument required, but only " + arguments.length + " present");
    var r = new Date(e, t, n);
    return r.getFullYear() === e && r.getMonth() === t && r.getDate() === n
}

function Fh(e) {
    return Iu(1, arguments), 1 === Ru(e).getDate()
}

function Uh(e) {
    return Iu(1, arguments), 5 === Ru(e).getDay()
}

function Bh(e) {
    return Iu(1, arguments), Ru(e).getTime() > Date.now()
}

function Vh(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}
class qh {
    constructor() {
        Vh(this, "priority", void 0), Vh(this, "subPriority", 0)
    }
    validate(e, t) {
        return !0
    }
}
class Yh extends qh {
    constructor(e, t, n, r, o) {
        super(), this.value = e, this.validateValue = t, this.setValue = n, this.priority = r, o && (this.subPriority = o)
    }
    validate(e, t) {
        return this.validateValue(e, this.value, t)
    }
    set(e, t, n) {
        return this.setValue(e, t, this.value, n)
    }
}
class Hh extends qh {
    constructor() {
        super(...arguments), Vh(this, "priority", 10), Vh(this, "subPriority", -1)
    }
    set(e, t) {
        if (t.timestampIsSet) return e;
        var n = new Date(0);
        return n.setFullYear(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()), n.setHours(e.getUTCHours(), e.getUTCMinutes(), e.getUTCSeconds(), e.getUTCMilliseconds()), n
    }
}

function Gh(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}
class zh {
    constructor() {
        Gh(this, "incompatibleTokens", void 0), Gh(this, "priority", void 0), Gh(this, "subPriority", void 0)
    }
    run(e, t, n, r) {
        var o = this.parse(e, t, n, r);
        return o ? {
            setter: new Yh(o.value, this.validate, this.set, this.priority, this.subPriority),
            rest: o.rest
        } : null
    }
    validate(e, t, n) {
        return !0
    }
}

function $h(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}
var Wh = /^(1[0-2]|0?\d)/,
    Jh = /^(3[0-1]|[0-2]?\d)/,
    Kh = /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
    Qh = /^(5[0-3]|[0-4]?\d)/,
    Xh = /^(2[0-3]|[0-1]?\d)/,
    Zh = /^(2[0-4]|[0-1]?\d)/,
    ef = /^(1[0-1]|0?\d)/,
    tf = /^(1[0-2]|0?\d)/,
    nf = /^[0-5]?\d/,
    rf = /^[0-5]?\d/,
    of = /^\d/,
    af = /^\d{1,2}/,
    sf = /^\d{1,3}/,
    lf = /^\d{1,4}/,
    uf = /^-?\d+/,
    cf = /^-?\d/,
    pf = /^-?\d{1,2}/,
    df = /^-?\d{1,3}/,
    hf = /^-?\d{1,4}/,
    ff = /^([+-])(\d{2})(\d{2})?|Z/,
    mf = /^([+-])(\d{2})(\d{2})|Z/,
    gf = /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
    yf = /^([+-])(\d{2}):(\d{2})|Z/,
    vf = /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/;

function bf(e, t) {
    return e ? {
        value: t(e.value),
        rest: e.rest
    } : e
}

function _f(e, t) {
    var n = t.match(e);
    return n ? {
        value: parseInt(n[0], 10),
        rest: t.slice(n[0].length)
    } : null
}

function wf(e, t) {
    var n = t.match(e);
    if (!n) return null;
    if ("Z" === n[0]) return {
        value: 0,
        rest: t.slice(1)
    };
    var r = "+" === n[1] ? 1 : -1,
        o = n[2] ? parseInt(n[2], 10) : 0,
        i = n[3] ? parseInt(n[3], 10) : 0,
        a = n[5] ? parseInt(n[5], 10) : 0;
    return {
        value: r * (o * bc + i * vc + a * _c),
        rest: t.slice(n[0].length)
    }
}

function Ef(e) {
    return _f(uf, e)
}

function Tf(e, t) {
    switch (e) {
        case 1:
            return _f(of, t);
        case 2:
            return _f(af, t);
        case 3:
            return _f(sf, t);
        case 4:
            return _f(lf, t);
        default:
            return _f(new RegExp("^\\d{1," + e + "}"), t)
    }
}

function Sf(e, t) {
    switch (e) {
        case 1:
            return _f(cf, t);
        case 2:
            return _f(pf, t);
        case 3:
            return _f(df, t);
        case 4:
            return _f(hf, t);
        default:
            return _f(new RegExp("^-?\\d{1," + e + "}"), t)
    }
}

function Of(e) {
    switch (e) {
        case "morning":
            return 4;
        case "evening":
            return 17;
        case "pm":
        case "noon":
        case "afternoon":
            return 12;
        default:
            return 0
    }
}

function Af(e, t) {
    var n, r = t > 0,
        o = r ? t : 1 - t;
    if (o <= 50) n = e || 100;
    else {
        var i = o + 50;
        n = e + 100 * Math.floor(i / 100) - (e >= i % 100 ? 100 : 0)
    }
    return r ? n : 1 - n
}

function kf(e) {
    return e % 400 == 0 || e % 4 == 0 && e % 100 != 0
}

function xf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Cf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Pf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function If(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Rf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Df(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Nf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function jf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Lf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Mf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Ff(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}
var Uf = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    Bf = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function Vf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function qf(e, t, n) {
    var r, o, i, a, s, l, u, c;
    Iu(2, arguments);
    var p = Hu(),
        d = Pu(null !== (r = null !== (o = null !== (i = null !== (a = null == n ? void 0 : n.weekStartsOn) && void 0 !== a ? a : null == n || null === (s = n.locale) || void 0 === s || null === (l = s.options) || void 0 === l ? void 0 : l.weekStartsOn) && void 0 !== i ? i : p.weekStartsOn) && void 0 !== o ? o : null === (u = p.locale) || void 0 === u || null === (c = u.options) || void 0 === c ? void 0 : c.weekStartsOn) && void 0 !== r ? r : 0);
    if (!(d >= 0 && d <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var h = Ru(e),
        f = Pu(t),
        m = h.getUTCDay(),
        g = f % 7,
        y = (g + 7) % 7,
        v = (y < d ? 7 : 0) + f - m;
    return h.setUTCDate(h.getUTCDate() + v), h
}

function Yf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Hf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Gf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function zf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function $f(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Wf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Jf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Kf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Qf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Xf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Zf(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function em(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function tm(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function nm(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function rm(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function om(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function im(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function am(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}
var sm = {
        G: new class extends zh {
            constructor() {
                super(...arguments), $h(this, "priority", 140), $h(this, "incompatibleTokens", ["R", "u", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "G":
                    case "GG":
                    case "GGG":
                        return n.era(e, {
                            width: "abbreviated"
                        }) || n.era(e, {
                            width: "narrow"
                        });
                    case "GGGGG":
                        return n.era(e, {
                            width: "narrow"
                        });
                    default:
                        return n.era(e, {
                            width: "wide"
                        }) || n.era(e, {
                            width: "abbreviated"
                        }) || n.era(e, {
                            width: "narrow"
                        })
                }
            }
            set(e, t, n) {
                return t.era = n, e.setUTCFullYear(n, 0, 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        y: new class extends zh {
            constructor() {
                super(...arguments), xf(this, "priority", 130), xf(this, "incompatibleTokens", ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                var r = function(e) {
                    return {
                        year: e,
                        isTwoDigitYear: "yy" === t
                    }
                };
                switch (t) {
                    case "y":
                        return bf(Tf(4, e), r);
                    case "yo":
                        return bf(n.ordinalNumber(e, {
                            unit: "year"
                        }), r);
                    default:
                        return bf(Tf(t.length, e), r)
                }
            }
            validate(e, t) {
                return t.isTwoDigitYear || t.year > 0
            }
            set(e, t, n) {
                var r = e.getUTCFullYear();
                if (n.isTwoDigitYear) {
                    var o = Af(n.year, r);
                    return e.setUTCFullYear(o, 0, 1), e.setUTCHours(0, 0, 0, 0), e
                }
                var i = "era" in t && 1 !== t.era ? 1 - n.year : n.year;
                return e.setUTCFullYear(i, 0, 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        Y: new class extends zh {
            constructor() {
                super(...arguments), Cf(this, "priority", 130), Cf(this, "incompatibleTokens", ["y", "R", "u", "Q", "q", "M", "L", "I", "d", "D", "i", "t", "T"])
            }
            parse(e, t, n) {
                var r = function(e) {
                    return {
                        year: e,
                        isTwoDigitYear: "YY" === t
                    }
                };
                switch (t) {
                    case "Y":
                        return bf(Tf(4, e), r);
                    case "Yo":
                        return bf(n.ordinalNumber(e, {
                            unit: "year"
                        }), r);
                    default:
                        return bf(Tf(t.length, e), r)
                }
            }
            validate(e, t) {
                return t.isTwoDigitYear || t.year > 0
            }
            set(e, t, n, r) {
                var o = Hp(e, r);
                if (n.isTwoDigitYear) {
                    var i = Af(n.year, o);
                    return e.setUTCFullYear(i, 0, r.firstWeekContainsDate), e.setUTCHours(0, 0, 0, 0), Yp(e, r)
                }
                var a = "era" in t && 1 !== t.era ? 1 - n.year : n.year;
                return e.setUTCFullYear(a, 0, r.firstWeekContainsDate), e.setUTCHours(0, 0, 0, 0), Yp(e, r)
            }
        },
        R: new class extends zh {
            constructor() {
                super(...arguments), Pf(this, "priority", 130), Pf(this, "incompatibleTokens", ["G", "y", "Y", "u", "Q", "q", "M", "L", "w", "d", "D", "e", "c", "t", "T"])
            }
            parse(e, t) {
                return Sf("R" === t ? 4 : t.length, e)
            }
            set(e, t, n) {
                var r = new Date(0);
                return r.setUTCFullYear(n, 0, 4), r.setUTCHours(0, 0, 0, 0), Fp(r)
            }
        },
        u: new class extends zh {
            constructor() {
                super(...arguments), If(this, "priority", 130), If(this, "incompatibleTokens", ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"])
            }
            parse(e, t) {
                return Sf("u" === t ? 4 : t.length, e)
            }
            set(e, t, n) {
                return e.setUTCFullYear(n, 0, 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        Q: new class extends zh {
            constructor() {
                super(...arguments), Rf(this, "priority", 120), Rf(this, "incompatibleTokens", ["Y", "R", "q", "M", "L", "w", "I", "d", "D", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "Q":
                    case "QQ":
                        return Tf(t.length, e);
                    case "Qo":
                        return n.ordinalNumber(e, {
                            unit: "quarter"
                        });
                    case "QQQ":
                        return n.quarter(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.quarter(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "QQQQQ":
                        return n.quarter(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.quarter(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.quarter(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.quarter(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 4
            }
            set(e, t, n) {
                return e.setUTCMonth(3 * (n - 1), 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        q: new class extends zh {
            constructor() {
                super(...arguments), Df(this, "priority", 120), Df(this, "incompatibleTokens", ["Y", "R", "Q", "M", "L", "w", "I", "d", "D", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "q":
                    case "qq":
                        return Tf(t.length, e);
                    case "qo":
                        return n.ordinalNumber(e, {
                            unit: "quarter"
                        });
                    case "qqq":
                        return n.quarter(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.quarter(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    case "qqqqq":
                        return n.quarter(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    default:
                        return n.quarter(e, {
                            width: "wide",
                            context: "standalone"
                        }) || n.quarter(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.quarter(e, {
                            width: "narrow",
                            context: "standalone"
                        })
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 4
            }
            set(e, t, n) {
                return e.setUTCMonth(3 * (n - 1), 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        M: new class extends zh {
            constructor() {
                super(...arguments), Nf(this, "incompatibleTokens", ["Y", "R", "q", "Q", "L", "w", "I", "D", "i", "e", "c", "t", "T"]), Nf(this, "priority", 110)
            }
            parse(e, t, n) {
                var r = function(e) {
                    return e - 1
                };
                switch (t) {
                    case "M":
                        return bf(_f(Wh, e), r);
                    case "MM":
                        return bf(Tf(2, e), r);
                    case "Mo":
                        return bf(n.ordinalNumber(e, {
                            unit: "month"
                        }), r);
                    case "MMM":
                        return n.month(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.month(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "MMMMM":
                        return n.month(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.month(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.month(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.month(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 11
            }
            set(e, t, n) {
                return e.setUTCMonth(n, 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        L: new class extends zh {
            constructor() {
                super(...arguments), jf(this, "priority", 110), jf(this, "incompatibleTokens", ["Y", "R", "q", "Q", "M", "w", "I", "D", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                var r = function(e) {
                    return e - 1
                };
                switch (t) {
                    case "L":
                        return bf(_f(Wh, e), r);
                    case "LL":
                        return bf(Tf(2, e), r);
                    case "Lo":
                        return bf(n.ordinalNumber(e, {
                            unit: "month"
                        }), r);
                    case "LLL":
                        return n.month(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.month(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    case "LLLLL":
                        return n.month(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    default:
                        return n.month(e, {
                            width: "wide",
                            context: "standalone"
                        }) || n.month(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.month(e, {
                            width: "narrow",
                            context: "standalone"
                        })
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 11
            }
            set(e, t, n) {
                return e.setUTCMonth(n, 1), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        w: new class extends zh {
            constructor() {
                super(...arguments), Lf(this, "priority", 100), Lf(this, "incompatibleTokens", ["y", "R", "u", "q", "Q", "M", "L", "I", "d", "D", "i", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "w":
                        return _f(Qh, e);
                    case "wo":
                        return n.ordinalNumber(e, {
                            unit: "week"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 53
            }
            set(e, t, n, r) {
                return Yp(function(e, t, n) {
                    Iu(2, arguments);
                    var r = Ru(e),
                        o = Pu(t),
                        i = $p(r, n) - o;
                    return r.setUTCDate(r.getUTCDate() - 7 * i), r
                }(e, n, r), r)
            }
        },
        I: new class extends zh {
            constructor() {
                super(...arguments), Mf(this, "priority", 100), Mf(this, "incompatibleTokens", ["y", "Y", "u", "q", "Q", "M", "L", "w", "d", "D", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "I":
                        return _f(Qh, e);
                    case "Io":
                        return n.ordinalNumber(e, {
                            unit: "week"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 53
            }
            set(e, t, n) {
                return Fp(function(e, t) {
                    Iu(2, arguments);
                    var n = Ru(e),
                        r = Pu(t),
                        o = qp(n) - r;
                    return n.setUTCDate(n.getUTCDate() - 7 * o), n
                }(e, n))
            }
        },
        d: new class extends zh {
            constructor() {
                super(...arguments), Ff(this, "priority", 90), Ff(this, "subPriority", 1), Ff(this, "incompatibleTokens", ["Y", "R", "q", "Q", "w", "I", "D", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "d":
                        return _f(Jh, e);
                    case "do":
                        return n.ordinalNumber(e, {
                            unit: "date"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                var n = kf(e.getUTCFullYear()),
                    r = e.getUTCMonth();
                return n ? t >= 1 && t <= Bf[r] : t >= 1 && t <= Uf[r]
            }
            set(e, t, n) {
                return e.setUTCDate(n), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        D: new class extends zh {
            constructor() {
                super(...arguments), Vf(this, "priority", 90), Vf(this, "subpriority", 1), Vf(this, "incompatibleTokens", ["Y", "R", "q", "Q", "M", "L", "w", "I", "d", "E", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "D":
                    case "DD":
                        return _f(Kh, e);
                    case "Do":
                        return n.ordinalNumber(e, {
                            unit: "date"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return kf(e.getUTCFullYear()) ? t >= 1 && t <= 366 : t >= 1 && t <= 365
            }
            set(e, t, n) {
                return e.setUTCMonth(0, n), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        E: new class extends zh {
            constructor() {
                super(...arguments), Yf(this, "priority", 90), Yf(this, "incompatibleTokens", ["D", "i", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "E":
                    case "EE":
                    case "EEE":
                        return n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "EEEEE":
                        return n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "EEEEEE":
                        return n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.day(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 6
            }
            set(e, t, n, r) {
                return (e = qf(e, n, r)).setUTCHours(0, 0, 0, 0), e
            }
        },
        e: new class extends zh {
            constructor() {
                super(...arguments), Hf(this, "priority", 90), Hf(this, "incompatibleTokens", ["y", "R", "u", "q", "Q", "M", "L", "I", "d", "D", "E", "i", "c", "t", "T"])
            }
            parse(e, t, n, r) {
                var o = function(e) {
                    var t = 7 * Math.floor((e - 1) / 7);
                    return (e + r.weekStartsOn + 6) % 7 + t
                };
                switch (t) {
                    case "e":
                    case "ee":
                        return bf(Tf(t.length, e), o);
                    case "eo":
                        return bf(n.ordinalNumber(e, {
                            unit: "day"
                        }), o);
                    case "eee":
                        return n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "eeeee":
                        return n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "eeeeee":
                        return n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.day(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 6
            }
            set(e, t, n, r) {
                return (e = qf(e, n, r)).setUTCHours(0, 0, 0, 0), e
            }
        },
        c: new class extends zh {
            constructor() {
                super(...arguments), Gf(this, "priority", 90), Gf(this, "incompatibleTokens", ["y", "R", "u", "q", "Q", "M", "L", "I", "d", "D", "E", "i", "e", "t", "T"])
            }
            parse(e, t, n, r) {
                var o = function(e) {
                    var t = 7 * Math.floor((e - 1) / 7);
                    return (e + r.weekStartsOn + 6) % 7 + t
                };
                switch (t) {
                    case "c":
                    case "cc":
                        return bf(Tf(t.length, e), o);
                    case "co":
                        return bf(n.ordinalNumber(e, {
                            unit: "day"
                        }), o);
                    case "ccc":
                        return n.day(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "short",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    case "ccccc":
                        return n.day(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    case "cccccc":
                        return n.day(e, {
                            width: "short",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "standalone"
                        });
                    default:
                        return n.day(e, {
                            width: "wide",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "abbreviated",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "short",
                            context: "standalone"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "standalone"
                        })
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 6
            }
            set(e, t, n, r) {
                return (e = qf(e, n, r)).setUTCHours(0, 0, 0, 0), e
            }
        },
        i: new class extends zh {
            constructor() {
                super(...arguments), zf(this, "priority", 90), zf(this, "incompatibleTokens", ["y", "Y", "u", "q", "Q", "M", "L", "w", "d", "D", "E", "e", "c", "t", "T"])
            }
            parse(e, t, n) {
                var r = function(e) {
                    return 0 === e ? 7 : e
                };
                switch (t) {
                    case "i":
                    case "ii":
                        return Tf(t.length, e);
                    case "io":
                        return n.ordinalNumber(e, {
                            unit: "day"
                        });
                    case "iii":
                        return bf(n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        }), r);
                    case "iiiii":
                        return bf(n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        }), r);
                    case "iiiiii":
                        return bf(n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        }), r);
                    default:
                        return bf(n.day(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "short",
                            context: "formatting"
                        }) || n.day(e, {
                            width: "narrow",
                            context: "formatting"
                        }), r)
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 7
            }
            set(e, t, n) {
                return e = function(e, t) {
                    Iu(2, arguments);
                    var n = Pu(t);
                    n % 7 == 0 && (n -= 7);
                    var r = 1,
                        o = Ru(e),
                        i = o.getUTCDay(),
                        a = ((n % 7 + 7) % 7 < r ? 7 : 0) + n - i;
                    return o.setUTCDate(o.getUTCDate() + a), o
                }(e, n), e.setUTCHours(0, 0, 0, 0), e
            }
        },
        a: new class extends zh {
            constructor() {
                super(...arguments), $f(this, "priority", 80), $f(this, "incompatibleTokens", ["b", "B", "H", "k", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "a":
                    case "aa":
                    case "aaa":
                        return n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "aaaaa":
                        return n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.dayPeriod(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            set(e, t, n) {
                return e.setUTCHours(Of(n), 0, 0, 0), e
            }
        },
        b: new class extends zh {
            constructor() {
                super(...arguments), Wf(this, "priority", 80), Wf(this, "incompatibleTokens", ["a", "B", "H", "k", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "b":
                    case "bb":
                    case "bbb":
                        return n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "bbbbb":
                        return n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.dayPeriod(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            set(e, t, n) {
                return e.setUTCHours(Of(n), 0, 0, 0), e
            }
        },
        B: new class extends zh {
            constructor() {
                super(...arguments), Jf(this, "priority", 80), Jf(this, "incompatibleTokens", ["a", "b", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "B":
                    case "BB":
                    case "BBB":
                        return n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    case "BBBBB":
                        return n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        });
                    default:
                        return n.dayPeriod(e, {
                            width: "wide",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "abbreviated",
                            context: "formatting"
                        }) || n.dayPeriod(e, {
                            width: "narrow",
                            context: "formatting"
                        })
                }
            }
            set(e, t, n) {
                return e.setUTCHours(Of(n), 0, 0, 0), e
            }
        },
        h: new class extends zh {
            constructor() {
                super(...arguments), Kf(this, "priority", 70), Kf(this, "incompatibleTokens", ["H", "K", "k", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "h":
                        return _f(tf, e);
                    case "ho":
                        return n.ordinalNumber(e, {
                            unit: "hour"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 12
            }
            set(e, t, n) {
                var r = e.getUTCHours() >= 12;
                return r && n < 12 ? e.setUTCHours(n + 12, 0, 0, 0) : r || 12 !== n ? e.setUTCHours(n, 0, 0, 0) : e.setUTCHours(0, 0, 0, 0), e
            }
        },
        H: new class extends zh {
            constructor() {
                super(...arguments), Qf(this, "priority", 70), Qf(this, "incompatibleTokens", ["a", "b", "h", "K", "k", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "H":
                        return _f(Xh, e);
                    case "Ho":
                        return n.ordinalNumber(e, {
                            unit: "hour"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 23
            }
            set(e, t, n) {
                return e.setUTCHours(n, 0, 0, 0), e
            }
        },
        K: new class extends zh {
            constructor() {
                super(...arguments), Xf(this, "priority", 70), Xf(this, "incompatibleTokens", ["h", "H", "k", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "K":
                        return _f(ef, e);
                    case "Ko":
                        return n.ordinalNumber(e, {
                            unit: "hour"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 11
            }
            set(e, t, n) {
                return e.getUTCHours() >= 12 && n < 12 ? e.setUTCHours(n + 12, 0, 0, 0) : e.setUTCHours(n, 0, 0, 0), e
            }
        },
        k: new class extends zh {
            constructor() {
                super(...arguments), Zf(this, "priority", 70), Zf(this, "incompatibleTokens", ["a", "b", "h", "H", "K", "t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "k":
                        return _f(Zh, e);
                    case "ko":
                        return n.ordinalNumber(e, {
                            unit: "hour"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 1 && t <= 24
            }
            set(e, t, n) {
                var r = n <= 24 ? n % 24 : n;
                return e.setUTCHours(r, 0, 0, 0), e
            }
        },
        m: new class extends zh {
            constructor() {
                super(...arguments), em(this, "priority", 60), em(this, "incompatibleTokens", ["t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "m":
                        return _f(nf, e);
                    case "mo":
                        return n.ordinalNumber(e, {
                            unit: "minute"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 59
            }
            set(e, t, n) {
                return e.setUTCMinutes(n, 0, 0), e
            }
        },
        s: new class extends zh {
            constructor() {
                super(...arguments), tm(this, "priority", 50), tm(this, "incompatibleTokens", ["t", "T"])
            }
            parse(e, t, n) {
                switch (t) {
                    case "s":
                        return _f(rf, e);
                    case "so":
                        return n.ordinalNumber(e, {
                            unit: "second"
                        });
                    default:
                        return Tf(t.length, e)
                }
            }
            validate(e, t) {
                return t >= 0 && t <= 59
            }
            set(e, t, n) {
                return e.setUTCSeconds(n, 0), e
            }
        },
        S: new class extends zh {
            constructor() {
                super(...arguments), nm(this, "priority", 30), nm(this, "incompatibleTokens", ["t", "T"])
            }
            parse(e, t) {
                return bf(Tf(t.length, e), (function(e) {
                    return Math.floor(e * Math.pow(10, 3 - t.length))
                }))
            }
            set(e, t, n) {
                return e.setUTCMilliseconds(n), e
            }
        },
        X: new class extends zh {
            constructor() {
                super(...arguments), rm(this, "priority", 10), rm(this, "incompatibleTokens", ["t", "T", "x"])
            }
            parse(e, t) {
                switch (t) {
                    case "X":
                        return wf(ff, e);
                    case "XX":
                        return wf(mf, e);
                    case "XXXX":
                        return wf(gf, e);
                    case "XXXXX":
                        return wf(vf, e);
                    default:
                        return wf(yf, e)
                }
            }
            set(e, t, n) {
                return t.timestampIsSet ? e : new Date(e.getTime() - n)
            }
        },
        x: new class extends zh {
            constructor() {
                super(...arguments), om(this, "priority", 10), om(this, "incompatibleTokens", ["t", "T", "X"])
            }
            parse(e, t) {
                switch (t) {
                    case "x":
                        return wf(ff, e);
                    case "xx":
                        return wf(mf, e);
                    case "xxxx":
                        return wf(gf, e);
                    case "xxxxx":
                        return wf(vf, e);
                    default:
                        return wf(yf, e)
                }
            }
            set(e, t, n) {
                return t.timestampIsSet ? e : new Date(e.getTime() - n)
            }
        },
        t: new class extends zh {
            constructor() {
                super(...arguments), im(this, "priority", 40), im(this, "incompatibleTokens", "*")
            }
            parse(e) {
                return Ef(e)
            }
            set(e, t, n) {
                return [new Date(1e3 * n), {
                    timestampIsSet: !0
                }]
            }
        },
        T: new class extends zh {
            constructor() {
                super(...arguments), am(this, "priority", 20), am(this, "incompatibleTokens", "*")
            }
            parse(e) {
                return Ef(e)
            }
            set(e, t, n) {
                return [new Date(n), {
                    timestampIsSet: !0
                }]
            }
        }
    },
    lm = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
    um = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
    cm = /^'([^]*?)'?$/,
    pm = /''/g,
    dm = /\S/,
    hm = /[a-zA-Z]/;

function fm(e, t, n, r) {
    var o, i, a, s, l, u, c, p, d, h, f, m, g, y, v, b, _, w;
    Iu(3, arguments);
    var E = String(e),
        T = String(t),
        S = Hu(),
        O = null !== (o = null !== (i = null == r ? void 0 : r.locale) && void 0 !== i ? i : S.locale) && void 0 !== o ? o : _d;
    if (!O.match) throw new RangeError("locale must contain match property");
    var A = Pu(null !== (a = null !== (s = null !== (l = null !== (u = null == r ? void 0 : r.firstWeekContainsDate) && void 0 !== u ? u : null == r || null === (c = r.locale) || void 0 === c || null === (p = c.options) || void 0 === p ? void 0 : p.firstWeekContainsDate) && void 0 !== l ? l : S.firstWeekContainsDate) && void 0 !== s ? s : null === (d = S.locale) || void 0 === d || null === (h = d.options) || void 0 === h ? void 0 : h.firstWeekContainsDate) && void 0 !== a ? a : 1);
    if (!(A >= 1 && A <= 7)) throw new RangeError("firstWeekContainsDate must be between 1 and 7 inclusively");
    var k = Pu(null !== (f = null !== (m = null !== (g = null !== (y = null == r ? void 0 : r.weekStartsOn) && void 0 !== y ? y : null == r || null === (v = r.locale) || void 0 === v || null === (b = v.options) || void 0 === b ? void 0 : b.weekStartsOn) && void 0 !== g ? g : S.weekStartsOn) && void 0 !== m ? m : null === (_ = S.locale) || void 0 === _ || null === (w = _.options) || void 0 === w ? void 0 : w.weekStartsOn) && void 0 !== f ? f : 0);
    if (!(k >= 0 && k <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    if ("" === T) return "" === E ? Ru(n) : new Date(NaN);
    var x = {
            firstWeekContainsDate: A,
            weekStartsOn: k,
            locale: O
        },
        C = [new Hh],
        P = T.match(um).map((function(e) {
            var t = e[0];
            return t in rd ? (0, rd[t])(e, O.formatLong) : e
        })).join("").match(lm),
        I = [],
        R = function(t) {
            null != r && r.useAdditionalWeekYearTokens || !sd(t) || ld(t, T, e), null != r && r.useAdditionalDayOfYearTokens || !ad(t) || ld(t, T, e);
            var n = t[0],
                o = sm[n];
            if (o) {
                var i = o.incompatibleTokens;
                if (Array.isArray(i)) {
                    var a = I.find((function(e) {
                        return i.includes(e.token) || e.token === n
                    }));
                    if (a) throw new RangeError("The format string mustn't contain `".concat(a.fullToken, "` and `").concat(t, "` at the same time"))
                } else if ("*" === o.incompatibleTokens && I.length > 0) throw new RangeError("The format string mustn't contain `".concat(t, "` and any other token at the same time"));
                I.push({
                    token: n,
                    fullToken: t
                });
                var s = o.run(E, t, O.match, x);
                if (!s) return D = t, {
                    v: new Date(NaN)
                };
                C.push(s.setter), E = s.rest
            } else {
                if (n.match(hm)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + n + "`");
                if ("''" === t ? t = "'" : "'" === n && (t = mm(t)), 0 !== E.indexOf(t)) return D = t, {
                    v: new Date(NaN)
                };
                E = E.slice(t.length)
            }
            D = t
        };
    for (var D of P) {
        var N = R(D);
        if ("object" == typeof N) return N.v
    }
    if (E.length > 0 && dm.test(E)) return new Date(NaN);
    var j = C.map((function(e) {
            return e.priority
        })).sort((function(e, t) {
            return t - e
        })).filter((function(e, t, n) {
            return n.indexOf(e) === t
        })).map((function(e) {
            return C.filter((function(t) {
                return t.priority === e
            })).sort((function(e, t) {
                return t.subPriority - e.subPriority
            }))
        })).map((function(e) {
            return e[0]
        })),
        L = Ru(n);
    if (isNaN(L.getTime())) return new Date(NaN);
    var M = Lp(L, Ku(L)),
        F = {};
    for (var U of j) {
        if (!U.validate(M, x)) return new Date(NaN);
        var B = U.set(M, F, x);
        Array.isArray(B) ? (M = B[0], xd(F, B[1])) : M = B
    }
    return M
}

function mm(e) {
    return e.match(cm)[1].replace(pm, "'")
}

function gm(e, t, n) {
    return Iu(2, arguments), Lc(fm(e, t, new Date, n))
}

function ym(e) {
    return Iu(1, arguments), 1 === Ru(e).getDay()
}

function vm(e) {
    return Iu(1, arguments), Ru(e).getTime() < Date.now()
}

function bm(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setMinutes(0, 0, 0), t
}

function _m(e, t) {
    Iu(2, arguments);
    var n = bm(e),
        r = bm(t);
    return n.getTime() === r.getTime()
}

function wm(e, t, n) {
    Iu(2, arguments);
    var r = zu(e, n),
        o = zu(t, n);
    return r.getTime() === o.getTime()
}

function Em(e, t) {
    return Iu(2, arguments), wm(e, t, {
        weekStartsOn: 1
    })
}

function Tm(e, t) {
    Iu(2, arguments);
    var n = Ju(e),
        r = Ju(t);
    return n.getTime() === r.getTime()
}

function Sm(e, t) {
    Iu(2, arguments);
    var n = dp(e),
        r = dp(t);
    return n.getTime() === r.getTime()
}

function Om(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getFullYear() === r.getFullYear() && n.getMonth() === r.getMonth()
}

function Am(e, t) {
    Iu(2, arguments);
    var n = mp(e),
        r = mp(t);
    return n.getTime() === r.getTime()
}

function km(e) {
    Iu(1, arguments);
    var t = Ru(e);
    return t.setMilliseconds(0), t
}

function xm(e, t) {
    Iu(2, arguments);
    var n = km(e),
        r = km(t);
    return n.getTime() === r.getTime()
}

function Cm(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Ru(t);
    return n.getFullYear() === r.getFullYear()
}

function Pm(e) {
    return Iu(1, arguments), _m(Date.now(), e)
}

function Im(e) {
    return Iu(1, arguments), Em(e, Date.now())
}

function Rm(e) {
    return Iu(1, arguments), Sm(Date.now(), e)
}

function Dm(e) {
    return Iu(1, arguments), Om(Date.now(), e)
}

function Nm(e) {
    return Iu(1, arguments), Am(Date.now(), e)
}

function jm(e) {
    return Iu(1, arguments), xm(Date.now(), e)
}

function Lm(e, t) {
    return Iu(1, arguments), wm(e, Date.now(), t)
}

function Mm(e) {
    return Iu(1, arguments), Cm(e, Date.now())
}

function Fm(e) {
    return Iu(1, arguments), 4 === Ru(e).getDay()
}

function Um(e) {
    return Iu(1, arguments), Nc(e, Date.now())
}

function Bm(e) {
    return Iu(1, arguments), Nc(e, Du(Date.now(), 1))
}

function Vm(e) {
    return Iu(1, arguments), 2 === Ru(e).getDay()
}

function qm(e) {
    return Iu(1, arguments), 3 === Ru(e).getDay()
}

function Ym(e, t) {
    Iu(2, arguments);
    var n = Ru(e).getTime(),
        r = Ru(t.start).getTime(),
        o = Ru(t.end).getTime();
    if (!(r <= o)) throw new RangeError("Invalid interval");
    return n >= r && n <= o
}

function Hm(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Du(e, -n)
}

function Gm(e) {
    return Iu(1, arguments), Nc(e, Hm(Date.now(), 1))
}

function zm(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = 9 + 10 * Math.floor(n / 10);
    return t.setFullYear(r + 1, 0, 0), t.setHours(0, 0, 0, 0), t
}

function $m(e, t) {
    var n, r, o, i, a, s, l, u;
    Iu(1, arguments);
    var c = Hu(),
        p = Pu(null !== (n = null !== (r = null !== (o = null !== (i = null == t ? void 0 : t.weekStartsOn) && void 0 !== i ? i : null == t || null === (a = t.locale) || void 0 === a || null === (s = a.options) || void 0 === s ? void 0 : s.weekStartsOn) && void 0 !== o ? o : c.weekStartsOn) && void 0 !== r ? r : null === (l = c.locale) || void 0 === l || null === (u = l.options) || void 0 === u ? void 0 : u.weekStartsOn) && void 0 !== n ? n : 0);
    if (!(p >= 0 && p <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6");
    var d = Ru(e),
        h = d.getDay(),
        f = 6 + (h < p ? -7 : 0) - (h - p);
    return d.setHours(0, 0, 0, 0), d.setDate(d.getDate() + f), d
}

function Wm(e) {
    return Iu(1, arguments), $m(e, {
        weekStartsOn: 1
    })
}

function Jm(e) {
    Iu(1, arguments);
    var t = Wu(e),
        n = new Date(0);
    n.setFullYear(t + 1, 0, 4), n.setHours(0, 0, 0, 0);
    var r = $u(n);
    return r.setDate(r.getDate() - 1), r
}

function Km(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getMonth(),
        r = n - n % 3 + 3;
    return t.setMonth(r, 0), t.setHours(0, 0, 0, 0), t
}

function Qm(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear();
    return t.setFullYear(n + 1, 0, 0), t.setHours(0, 0, 0, 0), t
}
var Xm = /(\w)\1*|''|'(''|[^'])+('|$)|./g,
    Zm = /^'([^]*?)'?$/,
    eg = /''/g,
    tg = /[a-zA-Z]/;

function ng(e, t) {
    Iu(2, arguments);
    var n = Ru(e);
    if (!Lc(n)) throw new RangeError("Invalid time value");
    var r = Ku(n),
        o = Lp(n, r),
        i = t.match(Xm);
    if (!i) return "";
    var a = i.map((function(e) {
        if ("''" === e) return "'";
        var t = e[0];
        if ("'" === t) return rg(e);
        var n = Kp[t];
        if (n) return n(o, e);
        if (t.match(tg)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + t + "`");
        return e
    })).join("");
    return a
}

function rg(e) {
    var t = e.match(Zm);
    return t ? t[1].replace(eg, "'") : e
}
var og = 365.2425;

function ig(e) {
    var t = e.years,
        n = e.months,
        r = e.weeks,
        o = e.days,
        i = e.hours,
        a = e.minutes,
        s = e.seconds;
    Iu(1, arguments);
    var l = 0;
    t && (l += t * og), n && (l += 30.436875 * n), r && (l += 7 * r), o && (l += o);
    var u = 24 * l * 60 * 60;
    return i && (u += 60 * i * 60), a && (u += 60 * a), s && (u += s), Math.round(1e3 * u)
}

function ag(e) {
    Iu(1, arguments);
    var t = e / bc;
    return Math.floor(t)
}

function sg(e) {
    Iu(1, arguments);
    var t = e / vc;
    return Math.floor(t)
}

function lg(e) {
    Iu(1, arguments);
    var t = e / _c;
    return Math.floor(t)
}

function ug(e) {
    Iu(1, arguments);
    var t = e / Ec;
    return Math.floor(t)
}

function cg(e) {
    return Iu(1, arguments), Math.floor(e * vc)
}

function pg(e) {
    return Iu(1, arguments), Math.floor(e * kc)
}

function dg(e) {
    Iu(1, arguments);
    var t = e / Tc;
    return Math.floor(t)
}

function hg(e) {
    Iu(1, arguments);
    var t = e / Sc;
    return Math.floor(t)
}

function fg(e, t) {
    Iu(2, arguments);
    var n = t - Xd(e);
    return n <= 0 && (n += 7), Du(e, n)
}

function mg(e) {
    return Iu(1, arguments), fg(e, 5)
}

function gg(e) {
    return Iu(1, arguments), fg(e, 1)
}

function yg(e) {
    return Iu(1, arguments), fg(e, 6)
}

function vg(e) {
    return Iu(1, arguments), fg(e, 0)
}

function bg(e) {
    return Iu(1, arguments), fg(e, 4)
}

function _g(e) {
    return Iu(1, arguments), fg(e, 2)
}

function wg(e) {
    return Iu(1, arguments), fg(e, 3)
}

function Eg(e, t) {
    var n;
    Iu(1, arguments);
    var r = Pu(null !== (n = null == t ? void 0 : t.additionalDigits) && void 0 !== n ? n : 2);
    if (2 !== r && 1 !== r && 0 !== r) throw new RangeError("additionalDigits must be 0, 1 or 2");
    if ("string" != typeof e && "[object String]" !== Object.prototype.toString.call(e)) return new Date(NaN);
    var o, i = kg(e);
    if (i.date) {
        var a = xg(i.date, r);
        o = Cg(a.restDateString, a.year)
    }
    if (!o || isNaN(o.getTime())) return new Date(NaN);
    var s, l = o.getTime(),
        u = 0;
    if (i.time && (u = Ig(i.time), isNaN(u))) return new Date(NaN);
    if (!i.timezone) {
        var c = new Date(l + u),
            p = new Date(0);
        return p.setFullYear(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate()), p.setHours(c.getUTCHours(), c.getUTCMinutes(), c.getUTCSeconds(), c.getUTCMilliseconds()), p
    }
    return s = Dg(i.timezone), isNaN(s) ? new Date(NaN) : new Date(l + u + s)
}
var Tg = {
        dateTimeDelimiter: /[T ]/,
        timeZoneDelimiter: /[Z ]/i,
        timezone: /([Z+-].*)$/
    },
    Sg = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/,
    Og = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/,
    Ag = /^([+-])(\d{2})(?::?(\d{2}))?$/;

function kg(e) {
    var t, n = {},
        r = e.split(Tg.dateTimeDelimiter);
    if (r.length > 2) return n;
    if (/:/.test(r[0]) ? t = r[0] : (n.date = r[0], t = r[1], Tg.timeZoneDelimiter.test(n.date) && (n.date = e.split(Tg.timeZoneDelimiter)[0], t = e.substr(n.date.length, e.length))), t) {
        var o = Tg.timezone.exec(t);
        o ? (n.time = t.replace(o[1], ""), n.timezone = o[1]) : n.time = t
    }
    return n
}

function xg(e, t) {
    var n = new RegExp("^(?:(\\d{4}|[+-]\\d{" + (4 + t) + "})|(\\d{2}|[+-]\\d{" + (2 + t) + "})$)"),
        r = e.match(n);
    if (!r) return {
        year: NaN,
        restDateString: ""
    };
    var o = r[1] ? parseInt(r[1]) : null,
        i = r[2] ? parseInt(r[2]) : null;
    return {
        year: null === i ? o : 100 * i,
        restDateString: e.slice((r[1] || r[2]).length)
    }
}

function Cg(e, t) {
    if (null === t) return new Date(NaN);
    var n = e.match(Sg);
    if (!n) return new Date(NaN);
    var r = !!n[4],
        o = Pg(n[1]),
        i = Pg(n[2]) - 1,
        a = Pg(n[3]),
        s = Pg(n[4]),
        l = Pg(n[5]) - 1;
    if (r) return function(e, t, n) {
        return t >= 1 && t <= 53 && n >= 0 && n <= 6
    }(0, s, l) ? function(e, t, n) {
        var r = new Date(0);
        r.setUTCFullYear(e, 0, 4);
        var o = 7 * (t - 1) + n + 1 - (r.getUTCDay() || 7);
        return r.setUTCDate(r.getUTCDate() + o), r
    }(t, s, l) : new Date(NaN);
    var u = new Date(0);
    return function(e, t, n) {
        return t >= 0 && t <= 11 && n >= 1 && n <= (Ng[t] || (jg(e) ? 29 : 28))
    }(t, i, a) && function(e, t) {
        return t >= 1 && t <= (jg(e) ? 366 : 365)
    }(t, o) ? (u.setUTCFullYear(t, i, Math.max(o, a)), u) : new Date(NaN)
}

function Pg(e) {
    return e ? parseInt(e) : 1
}

function Ig(e) {
    var t = e.match(Og);
    if (!t) return NaN;
    var n = Rg(t[1]),
        r = Rg(t[2]),
        o = Rg(t[3]);
    return function(e, t, n) {
        return 24 === e ? 0 === t && 0 === n : n >= 0 && n < 60 && t >= 0 && t < 60 && e >= 0 && e < 25
    }(n, r, o) ? n * bc + r * vc + 1e3 * o : NaN
}

function Rg(e) {
    return e && parseFloat(e.replace(",", ".")) || 0
}

function Dg(e) {
    if ("Z" === e) return 0;
    var t = e.match(Ag);
    if (!t) return 0;
    var n = "+" === t[1] ? -1 : 1,
        r = parseInt(t[2]),
        o = t[3] && parseInt(t[3]) || 0;
    return function(e, t) {
        return t >= 0 && t <= 59
    }(0, o) ? n * (r * bc + o * vc) : NaN
}
var Ng = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function jg(e) {
    return e % 400 == 0 || e % 4 == 0 && e % 100 != 0
}

function Lg(e) {
    if (Iu(1, arguments), "string" == typeof e) {
        var t = e.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/);
        return t ? new Date(Date.UTC(+t[1], +t[2] - 1, +t[3], +t[4] - (+t[9] || 0) * ("-" == t[8] ? -1 : 1), +t[5] - (+t[10] || 0) * ("-" == t[8] ? -1 : 1), +t[6], +((t[7] || "0") + "00").substring(0, 3))) : new Date(NaN)
    }
    return Ru(e)
}

function Mg(e, t) {
    Iu(2, arguments);
    var n = Xd(e) - t;
    return n <= 0 && (n += 7), Hm(e, n)
}

function Fg(e) {
    return Iu(1, arguments), Mg(e, 5)
}

function Ug(e) {
    return Iu(1, arguments), Mg(e, 1)
}

function Bg(e) {
    return Iu(1, arguments), Mg(e, 6)
}

function Vg(e) {
    return Iu(1, arguments), Mg(e, 0)
}

function qg(e) {
    return Iu(1, arguments), Mg(e, 4)
}

function Yg(e) {
    return Iu(1, arguments), Mg(e, 2)
}

function Hg(e) {
    return Iu(1, arguments), Mg(e, 3)
}

function Gg(e) {
    return Iu(1, arguments), Math.floor(e * Tc)
}

function zg(e) {
    Iu(1, arguments);
    var t = e / Oc;
    return Math.floor(t)
}

function $g(e, t) {
    var n;
    if (arguments.length < 1) throw new TypeError("1 argument required, but only none provided present");
    var r = Pu(null !== (n = null == t ? void 0 : t.nearestTo) && void 0 !== n ? n : 1);
    if (r < 1 || r > 30) throw new RangeError("`options.nearestTo` must be between 1 and 30");
    var o = Ru(e),
        i = o.getSeconds(),
        a = o.getMinutes() + i / 60,
        s = Qc(null == t ? void 0 : t.roundingMethod),
        l = s(a / r) * r,
        u = a % r,
        c = Math.round(u / r) * r;
    return new Date(o.getFullYear(), o.getMonth(), o.getDate(), o.getHours(), l + c)
}

function Wg(e) {
    Iu(1, arguments);
    var t = e / Ac;
    return Math.floor(t)
}

function Jg(e) {
    return Iu(1, arguments), e * _c
}

function Kg(e) {
    Iu(1, arguments);
    var t = e / kc;
    return Math.floor(t)
}

function Qg(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t),
        o = n.getFullYear(),
        i = n.getDate(),
        a = new Date(0);
    a.setFullYear(o, r, 15), a.setHours(0, 0, 0, 0);
    var s = eh(a);
    return n.setMonth(r, Math.min(i, s)), n
}

function Xg(e, t) {
    if (Iu(2, arguments), "object" != typeof t || null === t) throw new RangeError("values parameter must be an object");
    var n = Ru(e);
    return isNaN(n.getTime()) ? new Date(NaN) : (null != t.year && n.setFullYear(t.year), null != t.month && (n = Qg(n, t.month)), null != t.date && n.setDate(Pu(t.date)), null != t.hours && n.setHours(Pu(t.hours)), null != t.minutes && n.setMinutes(Pu(t.minutes)), null != t.seconds && n.setSeconds(Pu(t.seconds)), null != t.milliseconds && n.setMilliseconds(Pu(t.milliseconds)), n)
}

function Zg(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setDate(r), n
}

function ey(e, t, n) {
    var r, o, i, a, s, l, u, c;
    Iu(2, arguments);
    var p = Hu(),
        d = Pu(null !== (r = null !== (o = null !== (i = null !== (a = null == n ? void 0 : n.weekStartsOn) && void 0 !== a ? a : null == n || null === (s = n.locale) || void 0 === s || null === (l = s.options) || void 0 === l ? void 0 : l.weekStartsOn) && void 0 !== i ? i : p.weekStartsOn) && void 0 !== o ? o : null === (u = p.locale) || void 0 === u || null === (c = u.options) || void 0 === c ? void 0 : c.weekStartsOn) && void 0 !== r ? r : 0);
    if (!(d >= 0 && d <= 6)) throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
    var h = Ru(e),
        f = Pu(t),
        m = h.getDay(),
        g = f % 7,
        y = (g + 7) % 7,
        v = 7 - d,
        b = f < 0 || f > 6 ? f - (m + v) % 7 : (y + v) % 7 - (m + v) % 7;
    return Du(h, b)
}

function ty(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setMonth(0), n.setDate(r), n
}

function ny(e) {
    Iu(1, arguments);
    var t = {},
        n = Hu();
    for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (t[r] = n[r]);
    for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && (void 0 === e[o] ? delete t[o] : t[o] = e[o]);
    Gu(t)
}

function ry(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setHours(r), n
}

function oy(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t),
        o = ah(n),
        i = r - o;
    return Du(n, i)
}

function iy(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t),
        o = lh(n) - r;
    return n.setDate(n.getDate() - 7 * o), n
}

function ay(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setMilliseconds(r), n
}

function sy(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setMinutes(r), n
}

function ly(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t),
        o = Math.floor(n.getMonth() / 3) + 1,
        i = r - o;
    return Qg(n, n.getMonth() + 3 * i)
}

function uy(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return n.setSeconds(r), n
}

function cy(e, t, n) {
    Iu(2, arguments);
    var r = Ru(e),
        o = Pu(t),
        i = Eh(r, n) - o;
    return r.setDate(r.getDate() - 7 * i), r
}

function py(e, t, n) {
    var r, o, i, a, s, l, u, c;
    Iu(2, arguments);
    var p = Hu(),
        d = Pu(null !== (r = null !== (o = null !== (i = null !== (a = null == n ? void 0 : n.firstWeekContainsDate) && void 0 !== a ? a : null == n || null === (s = n.locale) || void 0 === s || null === (l = s.options) || void 0 === l ? void 0 : l.firstWeekContainsDate) && void 0 !== i ? i : p.firstWeekContainsDate) && void 0 !== o ? o : null === (u = p.locale) || void 0 === u || null === (c = u.options) || void 0 === c ? void 0 : c.firstWeekContainsDate) && void 0 !== r ? r : 1),
        h = Ru(e),
        f = Pu(t),
        m = Zu(h, _h(h, n)),
        g = new Date(0);
    return g.setFullYear(f, 0, d), g.setHours(0, 0, 0, 0), (h = _h(g, n)).setDate(h.getDate() + m), h
}

function dy(e, t) {
    Iu(2, arguments);
    var n = Ru(e),
        r = Pu(t);
    return isNaN(n.getTime()) ? new Date(NaN) : (n.setFullYear(r), n)
}

function hy(e) {
    Iu(1, arguments);
    var t = Ru(e),
        n = t.getFullYear(),
        r = 10 * Math.floor(n / 10);
    return t.setFullYear(r, 0, 1), t.setHours(0, 0, 0, 0), t
}

function fy() {
    return Qu(Date.now())
}

function my() {
    var e = new Date,
        t = e.getFullYear(),
        n = e.getMonth(),
        r = e.getDate(),
        o = new Date(0);
    return o.setFullYear(t, n, r + 1), o.setHours(0, 0, 0, 0), o
}

function gy() {
    var e = new Date,
        t = e.getFullYear(),
        n = e.getMonth(),
        r = e.getDate(),
        o = new Date(0);
    return o.setFullYear(t, n, r - 1), o.setHours(0, 0, 0, 0), o
}

function yy(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Nu(e, -n)
}

function vy(e, t) {
    if (Iu(2, arguments), !t || "object" != typeof t) return new Date(NaN);
    var n = t.years ? Pu(t.years) : 0,
        r = t.months ? Pu(t.months) : 0,
        o = t.weeks ? Pu(t.weeks) : 0,
        i = t.days ? Pu(t.days) : 0,
        a = t.hours ? Pu(t.hours) : 0,
        s = t.minutes ? Pu(t.minutes) : 0,
        l = t.seconds ? Pu(t.seconds) : 0,
        u = yy(e, r + 12 * n),
        c = Hm(u, i + 7 * o),
        p = s + 60 * a,
        d = l + 60 * p,
        h = 1e3 * d,
        f = new Date(c.getTime() - h);
    return f
}

function by(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return Uu(e, -n)
}

function _y(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return qu(e, -n)
}

function wy(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return nc(e, -n)
}

function Ey(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return rc(e, -n)
}

function Ty(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return oc(e, -n)
}

function Sy(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return ic(e, -n)
}

function Oy(e, t) {
    Iu(2, arguments);
    var n = Pu(t);
    return ac(e, -n)
}

function Ay(e) {
    return Iu(1, arguments), Math.floor(e * mc)
}

function ky(e) {
    return Iu(1, arguments), Math.floor(e * Sc)
}

function xy(e) {
    return Iu(1, arguments), Math.floor(e * Oc)
}
var Cy = __webpack_require__(49704),
    Py = __webpack_require__.n(Cy);
const Iy = require("node:http"),
    Ry = require("node:https"),
    Dy = require("node:zlib"),
    Ny = require("node:buffer");
var jy = __webpack_require__(55006),
    Ly = __webpack_require__(39951);
class My extends Error {
    constructor(e, t) {
        super(e), Error.captureStackTrace(this, this.constructor), this.type = t
    }
    get name() {
        return this.constructor.name
    }
    get[Symbol.toStringTag]() {
        return this.constructor.name
    }
}
class Fy extends My {
    constructor(e, t, n) {
        super(e, t), n && (this.code = this.errno = n.code, this.erroredSysCall = n.syscall)
    }
}
const Uy = Symbol.toStringTag,
    By = e => "object" == typeof e && "function" == typeof e.append && "function" == typeof e.delete && "function" == typeof e.get && "function" == typeof e.getAll && "function" == typeof e.has && "function" == typeof e.set && "function" == typeof e.sort && "URLSearchParams" === e[Uy],
    Vy = e => e && "object" == typeof e && "function" == typeof e.arrayBuffer && "string" == typeof e.type && "function" == typeof e.stream && "function" == typeof e.constructor && /^(Blob|File)$/.test(e[Uy]),
    qy = (0, Nr.promisify)(Lr.pipeline),
    Yy = Symbol("Body internals");
class Hy {
    constructor(e, {
        size: t = 0
    } = {}) {
        let n = null;
        null === e ? e = null : By(e) ? e = Ny.Buffer.from(e.toString()) : Vy(e) || Ny.Buffer.isBuffer(e) || (Nr.types.isAnyArrayBuffer(e) ? e = Ny.Buffer.from(e) : ArrayBuffer.isView(e) ? e = Ny.Buffer.from(e.buffer, e.byteOffset, e.byteLength) : e instanceof Lr || (e instanceof Ly.Ct ? n = (e = (0, Ly.au)(e)).type.split("=")[1] : e = Ny.Buffer.from(String(e))));
        let r = e;
        Ny.Buffer.isBuffer(e) ? r = Lr.Readable.from(e) : Vy(e) && (r = Lr.Readable.from(e.stream())), this[Yy] = {
            body: e,
            stream: r,
            boundary: n,
            disturbed: !1,
            error: null
        }, this.size = t, e instanceof Lr && e.on("error", (e => {
            const t = e instanceof My ? e : new Fy(`Invalid response body while trying to fetch ${this.url}: ${e.message}`, "system", e);
            this[Yy].error = t
        }))
    }
    get body() {
        return this[Yy].stream
    }
    get bodyUsed() {
        return this[Yy].disturbed
    }
    async arrayBuffer() {
        const {
            buffer: e,
            byteOffset: t,
            byteLength: n
        } = await Gy(this);
        return e.slice(t, t + n)
    }
    async formData() {
        const e = this.headers.get("content-type");
        if (e.startsWith("application/x-www-form-urlencoded")) {
            const e = new Ly.Ct,
                t = new URLSearchParams(await this.text());
            for (const [n, r] of t) e.append(n, r);
            return e
        }
        const {
            toFormData: t
        } = await __webpack_require__.e(713).then(__webpack_require__.bind(__webpack_require__, 51713));
        return t(this.body, e)
    }
    async blob() {
        const e = this.headers && this.headers.get("content-type") || this[Yy].body && this[Yy].body.type || "",
            t = await this.arrayBuffer();
        return new jy.Z([t], {
            type: e
        })
    }
    async json() {
        const e = await this.text();
        return JSON.parse(e)
    }
    async text() {
        const e = await Gy(this);
        return (new TextDecoder).decode(e)
    }
    buffer() {
        return Gy(this)
    }
}
async function Gy(e) {
    if (e[Yy].disturbed) throw new TypeError(`body used already for: ${e.url}`);
    if (e[Yy].disturbed = !0, e[Yy].error) throw e[Yy].error;
    const {
        body: t
    } = e;
    if (null === t) return Ny.Buffer.alloc(0);
    if (!(t instanceof Lr)) return Ny.Buffer.alloc(0);
    const n = [];
    let r = 0;
    try {
        for await (const o of t) {
            if (e.size > 0 && r + o.length > e.size) {
                const n = new Fy(`content size at ${e.url} over limit: ${e.size}`, "max-size");
                throw t.destroy(n), n
            }
            r += o.length, n.push(o)
        }
    } catch (t) {
        throw t instanceof My ? t : new Fy(`Invalid response body while trying to fetch ${e.url}: ${t.message}`, "system", t)
    }
    if (!0 !== t.readableEnded && !0 !== t._readableState.ended) throw new Fy(`Premature close of server response while trying to fetch ${e.url}`);
    try {
        return n.every((e => "string" == typeof e)) ? Ny.Buffer.from(n.join("")) : Ny.Buffer.concat(n, r)
    } catch (t) {
        throw new Fy(`Could not create Buffer from response body for ${e.url}: ${t.message}`, "system", t)
    }
}
Hy.prototype.buffer = (0, Nr.deprecate)(Hy.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer"), Object.defineProperties(Hy.prototype, {
    body: {
        enumerable: !0
    },
    bodyUsed: {
        enumerable: !0
    },
    arrayBuffer: {
        enumerable: !0
    },
    blob: {
        enumerable: !0
    },
    json: {
        enumerable: !0
    },
    text: {
        enumerable: !0
    },
    data: {
        get: (0, Nr.deprecate)((() => {}), "data doesn't exist, use json(), text(), arrayBuffer(), or body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (response)")
    }
});
const zy = (e, t) => {
        let n, r, {
            body: o
        } = e[Yy];
        if (e.bodyUsed) throw new Error("cannot clone body after it is used");
        return o instanceof Lr && "function" != typeof o.getBoundary && (n = new Lr.PassThrough({
            highWaterMark: t
        }), r = new Lr.PassThrough({
            highWaterMark: t
        }), o.pipe(n), o.pipe(r), e[Yy].stream = n, o = r), o
    },
    $y = (0, Nr.deprecate)((e => e.getBoundary()), "form-data doesn't follow the spec and requires special treatment. Use alternative package", "https://github.com/node-fetch/node-fetch/issues/1167"),
    Wy = (e, t) => null === e ? null : "string" == typeof e ? "text/plain;charset=UTF-8" : By(e) ? "application/x-www-form-urlencoded;charset=UTF-8" : Vy(e) ? e.type || null : Ny.Buffer.isBuffer(e) || Nr.types.isAnyArrayBuffer(e) || ArrayBuffer.isView(e) ? null : e instanceof Ly.Ct ? `multipart/form-data; boundary=${t[Yy].boundary}` : e && "function" == typeof e.getBoundary ? `multipart/form-data;boundary=${$y(e)}` : e instanceof Lr ? null : "text/plain;charset=UTF-8",
    Jy = "function" == typeof Iy.validateHeaderName ? Iy.validateHeaderName : e => {
        if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(e)) {
            const t = new TypeError(`Header name must be a valid HTTP token [${e}]`);
            throw Object.defineProperty(t, "code", {
                value: "ERR_INVALID_HTTP_TOKEN"
            }), t
        }
    },
    Ky = "function" == typeof Iy.validateHeaderValue ? Iy.validateHeaderValue : (e, t) => {
        if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(t)) {
            const t = new TypeError(`Invalid character in header content ["${e}"]`);
            throw Object.defineProperty(t, "code", {
                value: "ERR_INVALID_CHAR"
            }), t
        }
    };
class Qy extends URLSearchParams {
    constructor(e) {
        let t = [];
        if (e instanceof Qy) {
            const n = e.raw();
            for (const [e, r] of Object.entries(n)) t.push(...r.map((t => [e, t])))
        } else if (null == e);
        else {
            if ("object" != typeof e || Nr.types.isBoxedPrimitive(e)) throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
            {
                const n = e[Symbol.iterator];
                if (null == n) t.push(...Object.entries(e));
                else {
                    if ("function" != typeof n) throw new TypeError("Header pairs must be iterable");
                    t = [...e].map((e => {
                        if ("object" != typeof e || Nr.types.isBoxedPrimitive(e)) throw new TypeError("Each header pair must be an iterable object");
                        return [...e]
                    })).map((e => {
                        if (2 !== e.length) throw new TypeError("Each header pair must be a name/value tuple");
                        return [...e]
                    }))
                }
            }
        }
        return t = t.length > 0 ? t.map((([e, t]) => (Jy(e), Ky(e, String(t)), [String(e).toLowerCase(), String(t)]))) : void 0, super(t), new Proxy(this, {
            get(e, t, n) {
                switch (t) {
                    case "append":
                    case "set":
                        return (n, r) => (Jy(n), Ky(n, String(r)), URLSearchParams.prototype[t].call(e, String(n).toLowerCase(), String(r)));
                    case "delete":
                    case "has":
                    case "getAll":
                        return n => (Jy(n), URLSearchParams.prototype[t].call(e, String(n).toLowerCase()));
                    case "keys":
                        return () => (e.sort(), new Set(URLSearchParams.prototype.keys.call(e)).keys());
                    default:
                        return Reflect.get(e, t, n)
                }
            }
        })
    }
    get[Symbol.toStringTag]() {
        return this.constructor.name
    }
    toString() {
        return Object.prototype.toString.call(this)
    }
    get(e) {
        const t = this.getAll(e);
        if (0 === t.length) return null;
        let n = t.join(", ");
        return /^content-encoding$/i.test(e) && (n = n.toLowerCase()), n
    }
    forEach(e, t) {
        for (const n of this.keys()) Reflect.apply(e, t, [this.get(n), n, this])
    }* values() {
        for (const e of this.keys()) yield this.get(e)
    }* entries() {
        for (const e of this.keys()) yield [e, this.get(e)]
    } [Symbol.iterator]() {
        return this.entries()
    }
    raw() {
        return [...this.keys()].reduce(((e, t) => (e[t] = this.getAll(t), e)), {})
    } [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce(((e, t) => {
            const n = this.getAll(t);
            return e[t] = "host" === t ? n[0] : n.length > 1 ? n : n[0], e
        }), {})
    }
}
Object.defineProperties(Qy.prototype, ["get", "entries", "forEach", "values"].reduce(((e, t) => (e[t] = {
    enumerable: !0
}, e)), {}));
const Xy = new Set([301, 302, 303, 307, 308]),
    Zy = e => Xy.has(e),
    ev = Symbol("Response internals");
class tv extends Hy {
    constructor(e = null, t = {}) {
        super(e, t);
        const n = null != t.status ? t.status : 200,
            r = new Qy(t.headers);
        if (null !== e && !r.has("Content-Type")) {
            const t = Wy(e, this);
            t && r.append("Content-Type", t)
        }
        this[ev] = {
            type: "default",
            url: t.url,
            status: n,
            statusText: t.statusText || "",
            headers: r,
            counter: t.counter,
            highWaterMark: t.highWaterMark
        }
    }
    get type() {
        return this[ev].type
    }
    get url() {
        return this[ev].url || ""
    }
    get status() {
        return this[ev].status
    }
    get ok() {
        return this[ev].status >= 200 && this[ev].status < 300
    }
    get redirected() {
        return this[ev].counter > 0
    }
    get statusText() {
        return this[ev].statusText
    }
    get headers() {
        return this[ev].headers
    }
    get highWaterMark() {
        return this[ev].highWaterMark
    }
    clone() {
        return new tv(zy(this, this.highWaterMark), {
            type: this.type,
            url: this.url,
            status: this.status,
            statusText: this.statusText,
            headers: this.headers,
            ok: this.ok,
            redirected: this.redirected,
            size: this.size,
            highWaterMark: this.highWaterMark
        })
    }
    static redirect(e, t = 302) {
        if (!Zy(t)) throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        return new tv(null, {
            headers: {
                location: new URL(e).toString()
            },
            status: t
        })
    }
    static error() {
        const e = new tv(null, {
            status: 0,
            statusText: ""
        });
        return e[ev].type = "error", e
    }
    get[Symbol.toStringTag]() {
        return "Response"
    }
}
Object.defineProperties(tv.prototype, {
    type: {
        enumerable: !0
    },
    url: {
        enumerable: !0
    },
    status: {
        enumerable: !0
    },
    ok: {
        enumerable: !0
    },
    redirected: {
        enumerable: !0
    },
    statusText: {
        enumerable: !0
    },
    headers: {
        enumerable: !0
    },
    clone: {
        enumerable: !0
    }
});
const nv = require("node:url"),
    rv = require("node:net");

function ov(e, t = !1) {
    return null == e ? "no-referrer" : (e = new URL(e), /^(about|blob|data):$/.test(e.protocol) ? "no-referrer" : (e.username = "", e.password = "", e.hash = "", t && (e.pathname = "", e.search = ""), e))
}
const iv = new Set(["", "no-referrer", "no-referrer-when-downgrade", "same-origin", "origin", "strict-origin", "origin-when-cross-origin", "strict-origin-when-cross-origin", "unsafe-url"]);

function av(e) {
    return !!/^about:(blank|srcdoc)$/.test(e) || "data:" === e.protocol || !!/^(blob|filesystem):$/.test(e.protocol) || function(e) {
        if (/^(http|ws)s:$/.test(e.protocol)) return !0;
        const t = e.host.replace(/(^\[)|(]$)/g, ""),
            n = (0, rv.isIP)(t);
        return !(4 !== n || !/^127\./.test(t)) || !(6 !== n || !/^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(t)) || "localhost" !== e.host && !e.host.endsWith(".localhost") && "file:" === e.protocol
    }(e)
}
const sv = Symbol("Request internals"),
    lv = e => "object" == typeof e && "object" == typeof e[sv],
    uv = (0, Nr.deprecate)((() => {}), ".data is not a valid RequestInit property, use .body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (request)");
class cv extends Hy {
    constructor(e, t = {}) {
        let n;
        if (lv(e) ? n = new URL(e.url) : (n = new URL(e), e = {}), "" !== n.username || "" !== n.password) throw new TypeError(`${n} is an url with embedded credentials.`);
        let r = t.method || e.method || "GET";
        if (/^(delete|get|head|options|post|put)$/i.test(r) && (r = r.toUpperCase()), !lv(t) && "data" in t && uv(), (null != t.body || lv(e) && null !== e.body) && ("GET" === r || "HEAD" === r)) throw new TypeError("Request with GET/HEAD method cannot have body");
        const o = t.body ? t.body : lv(e) && null !== e.body ? zy(e) : null;
        super(o, {
            size: t.size || e.size || 0
        });
        const i = new Qy(t.headers || e.headers || {});
        if (null !== o && !i.has("Content-Type")) {
            const e = Wy(o, this);
            e && i.set("Content-Type", e)
        }
        let a = lv(e) ? e.signal : null;
        if ("signal" in t && (a = t.signal), null != a && ("object" != typeof(s = a) || "AbortSignal" !== s[Uy] && "EventTarget" !== s[Uy])) throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        var s;
        let l = null == t.referrer ? e.referrer : t.referrer;
        if ("" === l) l = "no-referrer";
        else if (l) {
            const e = new URL(l);
            l = /^about:(\/\/)?client$/.test(e) ? "client" : e
        } else l = void 0;
        this[sv] = {
            method: r,
            redirect: t.redirect || e.redirect || "follow",
            headers: i,
            parsedURL: n,
            signal: a,
            referrer: l
        }, this.follow = void 0 === t.follow ? void 0 === e.follow ? 20 : e.follow : t.follow, this.compress = void 0 === t.compress ? void 0 === e.compress || e.compress : t.compress, this.counter = t.counter || e.counter || 0, this.agent = t.agent || e.agent, this.highWaterMark = t.highWaterMark || e.highWaterMark || 16384, this.insecureHTTPParser = t.insecureHTTPParser || e.insecureHTTPParser || !1, this.referrerPolicy = t.referrerPolicy || e.referrerPolicy || ""
    }
    get method() {
        return this[sv].method
    }
    get url() {
        return (0, nv.format)(this[sv].parsedURL)
    }
    get headers() {
        return this[sv].headers
    }
    get redirect() {
        return this[sv].redirect
    }
    get signal() {
        return this[sv].signal
    }
    get referrer() {
        return "no-referrer" === this[sv].referrer ? "" : "client" === this[sv].referrer ? "about:client" : this[sv].referrer ? this[sv].referrer.toString() : void 0
    }
    get referrerPolicy() {
        return this[sv].referrerPolicy
    }
    set referrerPolicy(e) {
        this[sv].referrerPolicy = function(e) {
            if (!iv.has(e)) throw new TypeError(`Invalid referrerPolicy: ${e}`);
            return e
        }(e)
    }
    clone() {
        return new cv(this)
    }
    get[Symbol.toStringTag]() {
        return "Request"
    }
}
Object.defineProperties(cv.prototype, {
    method: {
        enumerable: !0
    },
    url: {
        enumerable: !0
    },
    headers: {
        enumerable: !0
    },
    redirect: {
        enumerable: !0
    },
    clone: {
        enumerable: !0
    },
    signal: {
        enumerable: !0
    },
    referrer: {
        enumerable: !0
    },
    referrerPolicy: {
        enumerable: !0
    }
});
class pv extends My {
    constructor(e, t = "aborted") {
        super(e, t)
    }
}
__webpack_require__(40749);
const dv = new Set(["data:", "http:", "https:"]);
async function hv(e, t) {
    return new Promise(((n, r) => {
        const o = new cv(e, t),
            {
                parsedURL: i,
                options: a
            } = (e => {
                const {
                    parsedURL: t
                } = e[sv], n = new Qy(e[sv].headers);
                n.has("Accept") || n.set("Accept", "*/*");
                let r = null;
                if (null === e.body && /^(post|put)$/i.test(e.method) && (r = "0"), null !== e.body) {
                    const t = (e => {
                        const {
                            body: t
                        } = e[Yy];
                        return null === t ? 0 : Vy(t) ? t.size : Ny.Buffer.isBuffer(t) ? t.length : t && "function" == typeof t.getLengthSync && t.hasKnownLength && t.hasKnownLength() ? t.getLengthSync() : null
                    })(e);
                    "number" != typeof t || Number.isNaN(t) || (r = String(t))
                }
                r && n.set("Content-Length", r), "" === e.referrerPolicy && (e.referrerPolicy = "strict-origin-when-cross-origin"), e.referrer && "no-referrer" !== e.referrer ? e[sv].referrer = function(e, {
                    referrerURLCallback: t,
                    referrerOriginCallback: n
                } = {}) {
                    if ("no-referrer" === e.referrer || "" === e.referrerPolicy) return null;
                    const r = e.referrerPolicy;
                    if ("about:client" === e.referrer) return "no-referrer";
                    const o = e.referrer;
                    let i = ov(o),
                        a = ov(o, !0);
                    i.toString().length > 4096 && (i = a), t && (i = t(i)), n && (a = n(a));
                    const s = new URL(e.url);
                    switch (r) {
                        case "no-referrer":
                            return "no-referrer";
                        case "origin":
                            return a;
                        case "unsafe-url":
                            return i;
                        case "strict-origin":
                            return av(i) && !av(s) ? "no-referrer" : a.toString();
                        case "strict-origin-when-cross-origin":
                            return i.origin === s.origin ? i : av(i) && !av(s) ? "no-referrer" : a;
                        case "same-origin":
                            return i.origin === s.origin ? i : "no-referrer";
                        case "origin-when-cross-origin":
                            return i.origin === s.origin ? i : a;
                        case "no-referrer-when-downgrade":
                            return av(i) && !av(s) ? "no-referrer" : i;
                        default:
                            throw new TypeError(`Invalid referrerPolicy: ${r}`)
                    }
                }(e) : e[sv].referrer = "no-referrer", e[sv].referrer instanceof URL && n.set("Referer", e.referrer), n.has("User-Agent") || n.set("User-Agent", "node-fetch"), e.compress && !n.has("Accept-Encoding") && n.set("Accept-Encoding", "gzip, deflate, br");
                let {
                    agent: o
                } = e;
                "function" == typeof o && (o = o(t)), n.has("Connection") || o || n.set("Connection", "close");
                const i = (e => {
                    if (e.search) return e.search;
                    const t = e.href.length - 1,
                        n = e.hash || ("#" === e.href[t] ? "#" : "");
                    return "?" === e.href[t - n.length] ? "?" : ""
                })(t);
                return {
                    parsedURL: t,
                    options: {
                        path: t.pathname + i,
                        method: e.method,
                        headers: n[Symbol.for("nodejs.util.inspect.custom")](),
                        insecureHTTPParser: e.insecureHTTPParser,
                        agent: o
                    }
                }
            })(o);
        if (!dv.has(i.protocol)) throw new TypeError(`node-fetch cannot load ${e}. URL scheme "${i.protocol.replace(/:$/,"")}" is not supported.`);
        if ("data:" === i.protocol) {
            const e = function(e) {
                    if (!/^data:/i.test(e)) throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
                    const t = (e = e.replace(/\r?\n/g, "")).indexOf(",");
                    if (-1 === t || t <= 4) throw new TypeError("malformed data: URI");
                    const n = e.substring(5, t).split(";");
                    let r = "",
                        o = !1;
                    const i = n[0] || "text/plain";
                    let a = i;
                    for (let e = 1; e < n.length; e++) "base64" === n[e] ? o = !0 : (a += `;${n[e]}`, 0 === n[e].indexOf("charset=") && (r = n[e].substring(8)));
                    n[0] || r.length || (a += ";charset=US-ASCII", r = "US-ASCII");
                    const s = o ? "base64" : "ascii",
                        l = unescape(e.substring(t + 1)),
                        u = Buffer.from(l, s);
                    return u.type = i, u.typeFull = a, u.charset = r, u
                }(o.url),
                t = new tv(e, {
                    headers: {
                        "Content-Type": e.typeFull
                    }
                });
            return void n(t)
        }
        const s = ("https:" === i.protocol ? Ry : Iy).request,
            {
                signal: l
            } = o;
        let u = null;
        const c = () => {
            const e = new pv("The operation was aborted.");
            r(e), o.body && o.body instanceof Lr.Readable && o.body.destroy(e), u && u.body && u.body.emit("error", e)
        };
        if (l && l.aborted) return void c();
        const p = () => {
                c(), h()
            },
            d = s(i.toString(), a);
        l && l.addEventListener("abort", p);
        const h = () => {
            d.abort(), l && l.removeEventListener("abort", p)
        };
        d.on("error", (e => {
                r(new Fy(`request to ${o.url} failed, reason: ${e.message}`, "system", e)), h()
            })),
            function(e, t) {
                const n = Ny.Buffer.from("0\r\n\r\n");
                let r, o = !1,
                    i = !1;
                e.on("response", (e => {
                    const {
                        headers: t
                    } = e;
                    o = "chunked" === t["transfer-encoding"] && !t["content-length"]
                })), e.on("socket", (t => {
                    const a = () => {
                            if (o && !i) {
                                const e = new Error("Premature close");
                                e.code = "ERR_STREAM_PREMATURE_CLOSE", (e => {
                                    u && u.body && u.body.destroy(e)
                                })(e)
                            }
                        },
                        s = e => {
                            i = 0 === Ny.Buffer.compare(e.slice(-5), n), !i && r && (i = 0 === Ny.Buffer.compare(r.slice(-3), n.slice(0, 3)) && 0 === Ny.Buffer.compare(e.slice(-2), n.slice(3))), r = e
                        };
                    t.prependListener("close", a), t.on("data", s), e.on("close", (() => {
                        t.removeListener("close", a), t.removeListener("data", s)
                    }))
                }))
            }(d), process.version < "v14" && d.on("socket", (e => {
                let t;
                e.prependListener("end", (() => {
                    t = e._eventsCount
                })), e.prependListener("close", (n => {
                    if (u && t < e._eventsCount && !n) {
                        const e = new Error("Premature close");
                        e.code = "ERR_STREAM_PREMATURE_CLOSE", u.body.emit("error", e)
                    }
                }))
            })), d.on("response", (e => {
                d.setTimeout(0);
                const i = function(e = []) {
                    return new Qy(e.reduce(((e, t, n, r) => (n % 2 == 0 && e.push(r.slice(n, n + 2)), e)), []).filter((([e, t]) => {
                        try {
                            return Jy(e), Ky(e, String(t)), !0
                        } catch {
                            return !1
                        }
                    })))
                }(e.rawHeaders);
                if (Zy(e.statusCode)) {
                    const s = i.get("Location");
                    let l = null;
                    try {
                        l = null === s ? null : new URL(s, o.url)
                    } catch {
                        if ("manual" !== o.redirect) return r(new Fy(`uri requested responds with an invalid redirect URL: ${s}`, "invalid-redirect")), void h()
                    }
                    switch (o.redirect) {
                        case "error":
                            return r(new Fy(`uri requested responds with a redirect, redirect mode is set to error: ${o.url}`, "no-redirect")), void h();
                        case "manual":
                            break;
                        case "follow": {
                            if (null === l) break;
                            if (o.counter >= o.follow) return r(new Fy(`maximum redirect reached at: ${o.url}`, "max-redirect")), void h();
                            const s = {
                                headers: new Qy(o.headers),
                                follow: o.follow,
                                counter: o.counter + 1,
                                agent: o.agent,
                                compress: o.compress,
                                method: o.method,
                                body: zy(o),
                                signal: o.signal,
                                size: o.size,
                                referrer: o.referrer,
                                referrerPolicy: o.referrerPolicy
                            };
                            if (!((e, t) => {
                                    const n = new URL(t).hostname,
                                        r = new URL(e).hostname;
                                    return n === r || n.endsWith(`.${r}`)
                                })(o.url, l) || (a = o.url, new URL(l).protocol !== new URL(a).protocol))
                                for (const e of ["authorization", "www-authenticate", "cookie", "cookie2"]) s.headers.delete(e);
                            if (303 !== e.statusCode && o.body && t.body instanceof Lr.Readable) return r(new Fy("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), void h();
                            303 !== e.statusCode && (301 !== e.statusCode && 302 !== e.statusCode || "POST" !== o.method) || (s.method = "GET", s.body = void 0, s.headers.delete("content-length"));
                            const u = function(e) {
                                const t = (e.get("referrer-policy") || "").split(/[,\s]+/);
                                let n = "";
                                for (const e of t) e && iv.has(e) && (n = e);
                                return n
                            }(i);
                            return u && (s.referrerPolicy = u), n(hv(new cv(l, s))), void h()
                        }
                        default:
                            return r(new TypeError(`Redirect option '${o.redirect}' is not a valid value of RequestRedirect`))
                    }
                }
                var a;
                l && e.once("end", (() => {
                    l.removeEventListener("abort", p)
                }));
                let s = (0, Lr.pipeline)(e, new Lr.PassThrough, (e => {
                    e && r(e)
                }));
                process.version < "v12.10" && e.on("aborted", p);
                const c = {
                        url: o.url,
                        status: e.statusCode,
                        statusText: e.statusMessage,
                        headers: i,
                        size: o.size,
                        counter: o.counter,
                        highWaterMark: o.highWaterMark
                    },
                    f = i.get("Content-Encoding");
                if (!o.compress || "HEAD" === o.method || null === f || 204 === e.statusCode || 304 === e.statusCode) return u = new tv(s, c), void n(u);
                const m = {
                    flush: Dy.Z_SYNC_FLUSH,
                    finishFlush: Dy.Z_SYNC_FLUSH
                };
                if ("gzip" === f || "x-gzip" === f) return s = (0, Lr.pipeline)(s, Dy.createGunzip(m), (e => {
                    e && r(e)
                })), u = new tv(s, c), void n(u);
                if ("deflate" === f || "x-deflate" === f) {
                    const t = (0, Lr.pipeline)(e, new Lr.PassThrough, (e => {
                        e && r(e)
                    }));
                    return t.once("data", (e => {
                        s = 8 == (15 & e[0]) ? (0, Lr.pipeline)(s, Dy.createInflate(), (e => {
                            e && r(e)
                        })) : (0, Lr.pipeline)(s, Dy.createInflateRaw(), (e => {
                            e && r(e)
                        })), u = new tv(s, c), n(u)
                    })), void t.once("end", (() => {
                        u || (u = new tv(s, c), n(u))
                    }))
                }
                if ("br" === f) return s = (0, Lr.pipeline)(s, Dy.createBrotliDecompress(), (e => {
                    e && r(e)
                })), u = new tv(s, c), void n(u);
                u = new tv(s, c), n(u)
            })), (async (e, {
                body: t
            }) => {
                null === t ? e.end() : await qy(t, e)
            })(d, o).catch(r)
    }))
}
var fv = __webpack_require__(71017),
    mv = __webpack_require__.n(fv),
    gv = function(e) {
        var t = function(e) {
            return "string" == typeof e ? e : "number" == typeof e ? e.toString() : e instanceof Error ? e.message : JSON.stringify(e)
        };
        return 1 === e.length ? t(e[0]) : e.map(t).join(" ")
    },
    yv = __webpack_require__(42277);
const vv = require("vm");
var bv, _v = __webpack_require__.n(vv),
    wv = __webpack_require__(68706).Z,
    Ev = function(r, i) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var s, l, u, c, p;
            return (0, n.__generator)(this, (function(n) {
                switch (n.label) {
                    case 0:
                        return s = function(e) {
                            var t = function(t) {
                                e.logFunction(t)
                            };
                            return {
                                error: function(e) {
                                    return t({
                                        time: Date.now(),
                                        level: Wn.Error,
                                        msg: gv(e),
                                        type: Jn.User
                                    })
                                },
                                info: function(e) {
                                    return t({
                                        time: Date.now(),
                                        level: Wn.Log,
                                        msg: gv(e),
                                        type: Jn.User
                                    })
                                },
                                log: function(e) {
                                    return t({
                                        time: Date.now(),
                                        level: Wn.Log,
                                        msg: gv(e),
                                        type: Jn.User
                                    })
                                },
                                warn: function(e) {
                                    return t({
                                        time: Date.now(),
                                        level: Wn.Warn,
                                        msg: gv(e),
                                        type: Jn.User
                                    })
                                }
                            }
                        }(i), l = fo(r.req.dbToken), u = l.firestore(), c = {
                            auth: function() {
                                return l.auth()
                            },
                            firestore: ho.firestore
                        }, p = {
                            clearImmediate,
                            clearInterval,
                            clearTimeout,
                            setImmediate,
                            setInterval,
                            setTimeout,
                            db: u,
                            consoleWrapped: s,
                            FirebaseFirestore: ho.firestore,
                            admin: c,
                            _: mn(),
                            axios: Tu(),
                            fetch: hv,
                            uuid: yv,
                            async: Ke,
                            jwt: Py(),
                            moment: a(),
                            dateFns: t,
                            produce: cn,
                            fs: o(),
                            path: mv(),
                            csv: e,
                            stream: Xe(),
                            zlib: Bs()
                        }, [4, Tv(r.req.script, p)];
                    case 1:
                        return [2, n.sent()]
                }
            }))
        }))
    },
    Tv = function(e, t) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var r, o;
            return (0, n.__generator)(this, (function(n) {
                switch (n.label) {
                    case 0:
                        return r = {
                            filename: "script.js",
                            lineOffset: 0
                        }, _v().createContext(t), e += wv, _v().runInContext(e, t, r), [4, t.run()];
                    case 1:
                        o = n.sent(), n.label = 2;
                    case 2:
                        return o instanceof Promise ? [4, o] : [3, 4];
                    case 3:
                        return o = n.sent(), [3, 2];
                    case 4:
                        return [2, o]
                }
            }))
        }))
    },
    Sv = function() {
        function e(e, t) {
            var n = this;
            this._numWrites = 0, this.bulkWriter = e.createBulkWriterForRest((function(e) {
                n._numWrites += e.length, t.updateTaskStatus({
                    writes: n._numWrites
                })
            }), (function(e, n, r, o) {
                var i = Oo.getResourcePath(e);
                console.error("Upload error:", i.join("/"), null == o ? void 0 : o.message), t.onUploadError(i, "Upload error: ".concat(null == o ? void 0 : o.message))
            }))
        }
        return e.prototype.pushDoc = function(e) {
            return (0, n.__awaiter)(this, void 0, void 0, (function() {
                return (0, n.__generator)(this, (function(t) {
                    switch (t.label) {
                        case 0:
                            return [4, this.bulkWriter.pushAsync({
                                type: mo.SetFicoDoc,
                                doc: e
                            })];
                        case 1:
                            return t.sent(), [2]
                    }
                }))
            }))
        }, e.prototype.close = function() {
            return (0, n.__awaiter)(this, void 0, void 0, (function() {
                return (0, n.__generator)(this, (function(e) {
                    switch (e.label) {
                        case 0:
                            return [4, this.bulkWriter.flush()];
                        case 1:
                            return e.sent(), [2]
                    }
                }))
            }))
        }, e.prototype.terminate = function() {
            return (0, n.__awaiter)(this, void 0, void 0, (function() {
                return (0, n.__generator)(this, (function(e) {
                    switch (e.label) {
                        case 0:
                            return e.trys.push([0, 2, , 3]), [4, this.bulkWriter.flush()];
                        case 1:
                        case 2:
                            return e.sent(), [3, 3];
                        case 3:
                            return [2]
                    }
                }))
            }))
        }, e
    }();
! function(e) {
    e.Auto = "Auto", e.Key = "Key", e.Field = "Field"
}(bv || (bv = {})), bv.Auto;
var Ov = function(e, t) {
        if (1 != t.length) throw new Error("Character must be a single character");
        for (var n = 0, r = e.length - 1; r >= 0; --r) e[r] == t && n++;
        return n
    },
    Av = __webpack_require__(47937),
    kv = __webpack_require__(61892),
    xv = __webpack_require__.n(kv);
var Cv, Pv = function(e) {
        return "Document path ".concat(e.join("/"), " occurs twice in import. ") + "Only the first document will be uploaded."
    },
    Iv = function(e) {
        switch (e.t) {
            case To.stringValue:
            case To.integerValue:
                return e.v;
            case To.doubleValue:
                return e.v.toString();
            case To.arrayValue:
                return e.v.map((function(e) {
                    switch (e.t) {
                        case To.stringValue:
                        case To.integerValue:
                            return e.v;
                        case To.doubleValue:
                            return e.v.toString();
                        default:
                            throw new Error("Invalid node type: ".concat(e.t))
                    }
                })).join("/")
        }
    },
    Rv = function(e, t, o) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var i, a, s, l, u, c, p, d, h;
            return (0, n.__generator)(this, (function(f) {
                switch (f.label) {
                    case 0:
                        i = new Jo((function() {
                            return Sr
                        }), t.db, o.signal), a = new Sv(i, o), s = (0, r.createReadStream)(t.filePath), f.label = 1;
                    case 1:
                        f.trys.push([1, , 14, 15]), f.label = 2;
                    case 2:
                        f.trys.push([2, 7, 8, 13]), l = (0, n.__asyncValues)(function(e, t, r) {
                            return (0, n.__asyncGenerator)(this, arguments, (function() {
                                function o(e, o) {
                                    var l, u, c, p, d, h, f, m, g;
                                    return (0, n.__generator)(this, (function(y) {
                                        switch (y.label) {
                                            case 0:
                                                if (r.aborted) throw new Vo;
                                                y.label = 1;
                                            case 1:
                                                y.trys.push([1, 16, , 18]), l = function(e, n) {
                                                    var r, o, l, u = rl(e, !1, [], To.queryDocumentSnapshotValue, {
                                                            projectId: t.db.projectId,
                                                            validate: !1
                                                        }),
                                                        c = function(e, n) {
                                                            if (t.rawJsonOptions.docIdGenerator.type == bv.Auto) return t.newResourcePrefix.concat(bl());
                                                            if (t.rawJsonOptions.docIdGenerator.type == bv.Key && null != n && !mn().isEmpty(n)) return t.newResourcePrefix.concat(n);
                                                            if (t.rawJsonOptions.docIdGenerator.type == bv.Field && null != a) {
                                                                var r = va(e, a);
                                                                switch (null == r ? void 0 : r.t) {
                                                                    case To.stringValue:
                                                                    case To.doubleValue:
                                                                    case To.integerValue:
                                                                    case To.arrayValue:
                                                                        var o = Iv(r).split("/");
                                                                        if (s) {
                                                                            var i = e.__exportPath__,
                                                                                l = 1;
                                                                            (null == i ? void 0 : i.t) == To.stringValue && (l = "" == i.v ? 0 : Ov(i.v, "/") + 1);
                                                                            var u = o;
                                                                            if (u.length < l) throw new Error('Absolute path "'.concat(o.join("/"), '" is shorter than export path ').concat(JSON.stringify(i)));
                                                                            var c = (t.newResourcePrefix.length + u.length - l) % 2;
                                                                            return 0 == l && (c = -c), t.newResourcePrefix.concat(u.slice(l - c))
                                                                        }
                                                                        return t.newResourcePrefix.concat(o)
                                                                }
                                                                throw new Error('Invalid document ID at docIdFieldPath "'.concat(ko(a), '": ').concat(JSON.stringify(r)))
                                                            }
                                                            throw new Error("Invalid Document ID. key = ".concat(n))
                                                        }(u.data, n);
                                                    if (Ki(c), !Oi(i, c)) throw new Error(Pv(c));
                                                    return null === (r = null == u ? void 0 : u.data) || void 0 === r || delete r.__path__, null === (o = null == u ? void 0 : u.data) || void 0 === o || delete o.__exportPath__, null === (l = null == u ? void 0 : u.data) || void 0 === l || delete l.__id__, u.resourcePath = c, u
                                                }(e.value, e.key), y.label = 2;
                                            case 2:
                                                y.trys.push([2, 13, 14, 15]), u = (0, n.__values)(wa(l, [])), c = u.next(), y.label = 3;
                                            case 3:
                                                if (c.done) return [3, 12];
                                                p = c.value, y.label = 4;
                                            case 4:
                                                return y.trys.push([4, 9, , 11]), Xl(p.doc.data), 0 != p.relativePath.length ? [3, 6] : [4, {
                                                    t: ol.Doc,
                                                    doc: p.doc,
                                                    idx: o
                                                }];
                                            case 5:
                                                return y.sent(), [3, 8];
                                            case 6:
                                                return [4, {
                                                    t: ol.Doc,
                                                    doc: (0, n.__assign)((0, n.__assign)({}, p.doc), {
                                                        resourcePath: l.resourcePath.concat(p.relativePath)
                                                    }),
                                                    idx: o
                                                }];
                                            case 7:
                                                y.sent(), y.label = 8;
                                            case 8:
                                                return [3, 11];
                                            case 9:
                                                return d = y.sent(), [4, {
                                                    t: ol.Error,
                                                    error: d instanceof Error ? d : new Error("unknown error"),
                                                    idx: o
                                                }];
                                            case 10:
                                                return y.sent(), [3, 11];
                                            case 11:
                                                return c = u.next(), [3, 3];
                                            case 12:
                                                return [3, 15];
                                            case 13:
                                                return h = y.sent(), m = {
                                                    error: h
                                                }, [3, 15];
                                            case 14:
                                                try {
                                                    c && !c.done && (g = u.return) && g.call(u)
                                                } finally {
                                                    if (m) throw m.error
                                                }
                                                return [7];
                                            case 15:
                                                return [3, 18];
                                            case 16:
                                                return f = y.sent(), [4, {
                                                    t: ol.Error,
                                                    error: f instanceof Error ? f : new Error,
                                                    idx: o
                                                }];
                                            case 17:
                                                return y.sent(), [3, 18];
                                            case 18:
                                                return [2]
                                        }
                                    }))
                                }
                                var i, a, s, l, u, c, p, d, h, f, m, g, y, v, b, _, w, E, T, S, O;
                                return (0, n.__generator)(this, (function(r) {
                                    switch (r.label) {
                                        case 0:
                                            i = {
                                                c: {}
                                            }, a = t.rawJsonOptions.docIdGenerator.type == bv.Field ? Co(t.rawJsonOptions.docIdGenerator.fieldPath) : void 0, s = t.rawJsonOptions.docIdGenerator.type == bv.Field && t.rawJsonOptions.docIdGenerator.fieldPath == is, r.label = 1;
                                        case 1:
                                            switch (r.trys.push([1, 57, , 60]), l = 0, t.inspectionResult.rootType) {
                                                case jl.Array:
                                                    return [3, 2];
                                                case jl.Object:
                                                    return [3, 20];
                                                case jl.NewLineSeparated:
                                                case jl.FicoNewLineSeparated:
                                                    return [3, 38]
                                            }
                                            return [3, 56];
                                        case 2:
                                            r.trys.push([2, 12, 13, 18]), u = (0, n.__asyncValues)(e.pipe(br().withParser())), r.label = 3;
                                        case 3:
                                            return [4, (0, n.__await)(u.next())];
                                        case 4:
                                            return (c = r.sent()).done ? [3, 11] : (y = c.value, null == t.limit || l != t.limit ? [3, 7] : [4, (0, n.__await)({
                                                t: ol.EOF,
                                                limitReached: !0
                                            })]);
                                        case 5:
                                            return [4, r.sent()];
                                        case 6:
                                            return r.sent(), [3, 11];
                                        case 7:
                                            return [5, (0, n.__values)((0, n.__asyncDelegator)((0, n.__asyncValues)(o(y, l))))];
                                        case 8:
                                            return [4, n.__await.apply(void 0, [r.sent()])];
                                        case 9:
                                            r.sent(), l++, r.label = 10;
                                        case 10:
                                            return [3, 3];
                                        case 11:
                                            return [3, 18];
                                        case 12:
                                            return p = r.sent(), _ = {
                                                error: p
                                            }, [3, 18];
                                        case 13:
                                            return r.trys.push([13, , 16, 17]), c && !c.done && (w = u.return) ? [4, (0, n.__await)(w.call(u))] : [3, 15];
                                        case 14:
                                            r.sent(), r.label = 15;
                                        case 15:
                                            return [3, 17];
                                        case 16:
                                            if (_) throw _.error;
                                            return [7];
                                        case 17:
                                            return [7];
                                        case 18:
                                            return [4, (0, n.__await)(void 0)];
                                        case 19:
                                            return [2, r.sent()];
                                        case 20:
                                            r.trys.push([20, 30, 31, 36]), d = (0, n.__asyncValues)(e.pipe(xv().withParser())), r.label = 21;
                                        case 21:
                                            return [4, (0, n.__await)(d.next())];
                                        case 22:
                                            return (h = r.sent()).done ? [3, 29] : (y = h.value, null == t.limit || l != t.limit ? [3, 25] : [4, (0, n.__await)({
                                                t: ol.EOF,
                                                limitReached: !0
                                            })]);
                                        case 23:
                                            return [4, r.sent()];
                                        case 24:
                                            return r.sent(), [3, 29];
                                        case 25:
                                            return [5, (0, n.__values)((0, n.__asyncDelegator)((0, n.__asyncValues)(o(y, l))))];
                                        case 26:
                                            return [4, n.__await.apply(void 0, [r.sent()])];
                                        case 27:
                                            r.sent(), l++, r.label = 28;
                                        case 28:
                                            return [3, 21];
                                        case 29:
                                            return [3, 36];
                                        case 30:
                                            return f = r.sent(), E = {
                                                error: f
                                            }, [3, 36];
                                        case 31:
                                            return r.trys.push([31, , 34, 35]), h && !h.done && (T = d.return) ? [4, (0, n.__await)(T.call(d))] : [3, 33];
                                        case 32:
                                            r.sent(), r.label = 33;
                                        case 33:
                                            return [3, 35];
                                        case 34:
                                            if (E) throw E.error;
                                            return [7];
                                        case 35:
                                            return [7];
                                        case 36:
                                            return [4, (0, n.__await)(void 0)];
                                        case 37:
                                            return [2, r.sent()];
                                        case 38:
                                            r.trys.push([38, 48, 49, 54]), m = (0, n.__asyncValues)(e.pipe((0, Av.parser)())), r.label = 39;
                                        case 39:
                                            return [4, (0, n.__await)(m.next())];
                                        case 40:
                                            return (g = r.sent()).done ? [3, 47] : (y = g.value, null == t.limit || l != t.limit ? [3, 43] : [4, (0, n.__await)({
                                                t: ol.EOF,
                                                limitReached: !0
                                            })]);
                                        case 41:
                                            return [4, r.sent()];
                                        case 42:
                                            return r.sent(), [3, 47];
                                        case 43:
                                            return [5, (0, n.__values)((0, n.__asyncDelegator)((0, n.__asyncValues)(o(y, l))))];
                                        case 44:
                                            return [4, n.__await.apply(void 0, [r.sent()])];
                                        case 45:
                                            r.sent(), l++, r.label = 46;
                                        case 46:
                                            return [3, 39];
                                        case 47:
                                            return [3, 54];
                                        case 48:
                                            return v = r.sent(), S = {
                                                error: v
                                            }, [3, 54];
                                        case 49:
                                            return r.trys.push([49, , 52, 53]), g && !g.done && (O = m.return) ? [4, (0, n.__await)(O.call(m))] : [3, 51];
                                        case 50:
                                            r.sent(), r.label = 51;
                                        case 51:
                                            return [3, 53];
                                        case 52:
                                            if (S) throw S.error;
                                            return [7];
                                        case 53:
                                            return [7];
                                        case 54:
                                            return [4, (0, n.__await)(void 0)];
                                        case 55:
                                            return [2, r.sent()];
                                        case 56:
                                            return [3, 60];
                                        case 57:
                                            return b = r.sent(), qo(b) ? [4, (0, n.__await)(void 0)] : [3, 59];
                                        case 58:
                                            return [2, r.sent()];
                                        case 59:
                                            throw console.warn(b), b;
                                        case 60:
                                            return [2]
                                    }
                                }))
                            }))
                        }(s, t, o.signal)), f.label = 3;
                    case 3:
                        return [4, l.next()];
                    case 4:
                        if ((u = f.sent()).done) return [3, 6];
                        switch ((c = u.value).t) {
                            case ol.Doc:
                                return a.pushDoc(c.doc), [3, 5];
                            case ol.Error:
                                return o.appendTaskSpecialStatus({
                                    taskId: e,
                                    errors: [{
                                        type: Xr.ImportGeneral,
                                        resourcePath: [],
                                        error: c.error.message
                                    }]
                                }), [3, 5]
                        }
                        f.label = 5;
                    case 5:
                        return [3, 3];
                    case 6:
                        return [3, 13];
                    case 7:
                        return p = f.sent(), d = {
                            error: p
                        }, [3, 13];
                    case 8:
                        return f.trys.push([8, , 11, 12]), u && !u.done && (h = l.return) ? [4, h.call(l)] : [3, 10];
                    case 9:
                        f.sent(), f.label = 10;
                    case 10:
                        return [3, 12];
                    case 11:
                        if (d) throw d.error;
                        return [7];
                    case 12:
                        return [7];
                    case 13:
                        return [3, 15];
                    case 14:
                        return s.destroy(), [7];
                    case 15:
                        return [4, a.close()];
                    case 16:
                        return f.sent(), [2, {
                            success: !0
                        }]
                }
            }))
        }))
    },
    Dv = function(e, t) {
        return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
            var o, i, a, s, l, u, c, p, d, h, f;
            return (0, n.__generator)(this, (function(m) {
                switch (m.label) {
                    case 0:
                        if ((o = e.req).type != Nl.CSV) return [2, {
                            success: !1
                        }];
                        if (i = o.filePath, a = o.newResourcePrefix, s = o.csvOptions, l = o.csvParams, null == s) throw new Error("csvOptions are null");
                        u = (0, r.createReadStream)(i, {
                            encoding: null !== (h = l.ficoFileEncoding) && void 0 !== h ? h : "utf8"
                        }), c = new Jo((function() {
                            return Sr
                        }), o.db, t.signal), p = new Sv(c, t), d = function(n, r, o) {
                            return t.appendTaskSpecialStatus({
                                taskId: e.id,
                                errors: [{
                                    type: Xr.ImportGeneral,
                                    error: n,
                                    resourcePath: r,
                                    level: o
                                }]
                            })
                        }, m.label = 1;
                    case 1:
                        return m.trys.push([1, , 3, 5]), [4, nu({
                            readStream: u,
                            projectId: o.db.projectId,
                            csvOptions: s,
                            csvParams: l,
                            newResourcePrefix: a,
                            onSuccess: function(e) {
                                return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
                                    return (0, n.__generator)(this, (function(t) {
                                        switch (t.label) {
                                            case 0:
                                                return [4, p.pushDoc(e)];
                                            case 1:
                                                return t.sent(), [2]
                                        }
                                    }))
                                }))
                            },
                            onError: function(e, t) {
                                return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
                                    return (0, n.__generator)(this, (function(n) {
                                        return console.error(e), d("Row ".concat(t + 1, ": ").concat(e.message), [], Wn.Error), [2]
                                    }))
                                }))
                            }
                        })];
                    case 2:
                        return m.sent(), [3, 5];
                    case 3:
                        return u.destroy(), [4, p.close()];
                    case 4:
                        return m.sent(), [7];
                    case 5:
                        return [2, {
                            success: !(null === (f = t.signal) || void 0 === f ? void 0 : f.aborted)
                        }]
                }
            }))
        }))
    },
    Nv = function(e, t) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var r, o, i, a, s, l, u, c, p, d, h, f, m, g;
            return (0, n.__generator)(this, (function(y) {
                switch (y.label) {
                    case 0:
                        r = e.req, o = r.db, i = r.newResourcePrefix, a = new Jo((function() {
                            return Sr
                        }), r.db, t.signal), s = new Sv(a, t), l = Ws(r.filePath), y.label = 1;
                    case 1:
                        y.trys.push([1, , 16, 18]), y.label = 2;
                    case 2:
                        y.trys.push([2, 9, 10, 15]), u = (0, n.__asyncValues)(ul({
                            instream: l,
                            transformToDst: {
                                db: o,
                                newResourcePrefix: i
                            },
                            signal: t.signal
                        })), y.label = 3;
                    case 3:
                        return [4, u.next()];
                    case 4:
                        return (c = y.sent()).done ? [3, 8] : (p = c.value, (null === (m = t.signal) || void 0 === m ? void 0 : m.aborted) ? [2, {
                            success: !1
                        }] : p.t != ol.Doc ? [3, 6] : [4, s.pushDoc(p.doc)]);
                    case 5:
                        return y.sent(), [3, 7];
                    case 6:
                        p.t == ol.Error && t.onUploadError([], "Line ".concat(p.line, ": ").concat(p.error.message)), y.label = 7;
                    case 7:
                        return [3, 3];
                    case 8:
                        return [3, 15];
                    case 9:
                        return d = y.sent(), h = {
                            error: d
                        }, [3, 15];
                    case 10:
                        return y.trys.push([10, , 13, 14]), c && !c.done && (f = u.return) ? [4, f.call(u)] : [3, 12];
                    case 11:
                        y.sent(), y.label = 12;
                    case 12:
                        return [3, 14];
                    case 13:
                        if (h) throw h.error;
                        return [7];
                    case 14:
                        return [7];
                    case 15:
                        return [3, 18];
                    case 16:
                        return [4, s.close()];
                    case 17:
                        return y.sent(), l.close(), [7];
                    case 18:
                        return [2, {
                            success: !(null === (g = t.signal) || void 0 === g ? void 0 : g.aborted)
                        }]
                }
            }))
        }))
    },
    jv = function(e, t) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var o, i, a, s, l, u, c, p, d, h, f, m, g, y, v, b, _, w, E, T, S, O, A, k, x, C, P, I, R, D, N, j, L, M, F, U, B, V, q;
            return (0, n.__generator)(this, (function(Y) {
                switch (Y.label) {
                    case 0:
                        return o = e.req, i = new Jo((function() {
                            return Sr
                        }), o.db, t.signal), a = new Sv(i, t), [4, r.promises.readFile(o.filePath, "utf8")];
                    case 1:
                        if (s = Y.sent(), l = Gr.parse(s), u = l.meta, c = l.data, p = null !== (U = u.resourcePath) && void 0 !== U ? U : ["query_result"], d = rl(c, !1, p, p.length % 2 == 0 ? To.queryDocumentSnapshotValue : To.collectionReferenceValue, {
                                projectId: o.db.projectId,
                                validate: !0
                            }), h = [], d.t === To.queryDocumentSnapshotValue) h.push(d);
                        else if (d.t === To.collectionReferenceValue) try {
                            for (f = (0, n.__values)(Object.values(d.docs)), m = f.next(); !m.done; m = f.next())(w = m.value).t == To.queryDocumentSnapshotValue && h.push(w)
                        } catch (e) {
                            C = {
                                error: e
                            }
                        } finally {
                            try {
                                m && !m.done && (P = f.return) && P.call(f)
                            } finally {
                                if (C) throw C.error
                            }
                        } else if (d.t === To.mapValue) try {
                            for (g = (0, n.__values)(Object.values(d.v)), y = g.next(); !y.done; y = g.next())
                                if ((v = y.value).t === To.queryDocumentSnapshotValue && h.push(v), v.t === To.collectionReferenceValue) try {
                                    for (D = void 0, b = (0, n.__values)(Object.values(v.docs)), _ = b.next(); !_.done; _ = b.next())(w = _.value).t == To.queryDocumentSnapshotValue && h.push(w)
                                } catch (e) {
                                    D = {
                                        error: e
                                    }
                                } finally {
                                    try {
                                        _ && !_.done && (N = b.return) && N.call(b)
                                    } finally {
                                        if (D) throw D.error
                                    }
                                }
                        } catch (e) {
                            I = {
                                error: e
                            }
                        } finally {
                            try {
                                y && !y.done && (R = g.return) && R.call(g)
                            } finally {
                                if (I) throw I.error
                            }
                        } else {
                            if (d.t != To.documentReferenceValue) throw new Error("can't import json object of type ".concat(d.t));
                            h.push(d)
                        }
                        Y.label = 2;
                    case 2:
                        return 0 == h.length ? [3, 7] : (w = h.shift(), (null === (B = t.signal) || void 0 === B ? void 0 : B.aborted) ? [4, a.close()] : [3, 4]);
                    case 3:
                        return Y.sent(), [2, {
                            success: !1
                        }];
                    case 4:
                        return null == w ? [3, 2] : w.t != To.queryDocumentSnapshotValue || mn().isEmpty(w.resourcePath) || o.dryRun ? [3, 6] : null == (E = Is(o.newResourcePrefix, p, w.resourcePath)) ? (console.error("Import error. Invalid resourcePath: ", JSON.stringify({
                            newResourcePrefix: o.newResourcePrefix,
                            metaResourcePath: p,
                            docResourcePath: w.resourcePath
                        }, null, 2)), [3, 2]) : (w.resourcePath = E, [4, a.pushDoc(w)]);
                    case 5:
                        Y.sent(), Y.label = 6;
                    case 6:
                        null === (V = t.documentProcessed) || void 0 === V || V.call(t, w);
                        try {
                            for (j = void 0, T = (0, n.__values)(Object.values(null !== (q = w.collections) && void 0 !== q ? q : {})), S = T.next(); !S.done; S = T.next()) {
                                O = S.value;
                                try {
                                    for (M = void 0, A = (0, n.__values)(Object.values(O.docs)), k = A.next(); !k.done; k = A.next())(x = k.value).t == To.queryDocumentSnapshotValue && h.push(x)
                                } catch (e) {
                                    M = {
                                        error: e
                                    }
                                } finally {
                                    try {
                                        k && !k.done && (F = A.return) && F.call(A)
                                    } finally {
                                        if (M) throw M.error
                                    }
                                }
                            }
                        } catch (e) {
                            j = {
                                error: e
                            }
                        } finally {
                            try {
                                S && !S.done && (L = T.return) && L.call(T)
                            } finally {
                                if (j) throw j.error
                            }
                        }
                        return [3, 2];
                    case 7:
                        return [4, a.close()];
                    case 8:
                        return Y.sent(), [2, {
                            success: !0
                        }]
                }
            }))
        }))
    },
    Lv = function(e, t) {
        return (0, n.__awaiter)(void 0, void 0, Promise, (function() {
            var r;
            return (0, n.__generator)(this, (function(n) {
                switch (n.label) {
                    case 0:
                        return r = e.req, e.req.type != Nl.CompressedArchive ? [3, 2] : [4, Nv(e, t)];
                    case 1:
                    case 3:
                    case 5:
                    case 7:
                        return [2, n.sent()];
                    case 2:
                        return e.req.type != Nl.FineJsonArchive ? [3, 4] : [4, jv(e, t)];
                    case 4:
                        return e.req.type != Nl.CSV ? [3, 6] : [4, Dv(e, t)];
                    case 6:
                        return r.type != Nl.RawJson ? [3, 8] : [4, Rv(e.id, e.req, t)];
                    case 8:
                        throw new Error("not implemented")
                }
            }))
        }))
    };
a().suppressDeprecationWarnings = !0;
var Mv = function(e) {
        return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, n.__generator)(this, (function(t) {
                switch (t.label) {
                    case 0:
                        return null == Cv ? [3, 2] : [4, Cv];
                    case 1:
                        t.sent(), t.label = 2;
                    case 2:
                        return Cv = new Promise((function(t, n) {
                            var r;
                            return null === (r = null === process || void 0 === process ? void 0 : process.send) || void 0 === r ? void 0 : r.call(process, e, (function(e) {
                                null != e && (console.error("sendFromFicoProcessError", e.message), n()), t(), Cv = void 0
                            }))
                        })), [2, Cv]
                }
            }))
        }))
    },
    Fv = function(e) {
        process.on("uncaughtException", (function(t) {
            Mv(vu([{
                logEntry: Vr(t),
                taskId: e
            }]))
        })), process.on("unhandledRejection", (function(t) {
            Mv(vu([{
                logEntry: Vr(t),
                taskId: e
            }]))
        }))
    },
    Uv = {
        logEntries: [],
        taskUpdates: [],
        taskSpecialUpdates: []
    },
    Bv = __webpack_require__(82361);
Bv.defaultMaxListeners = 100, Bv.EventEmitter.prototype._maxListeners = 100, Bv.setMaxListeners(100);
var Vv = new AbortController;
process.on("message", (function(e) {
    return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
        return (0, n.__generator)(this, (function(t) {
            switch (t.label) {
                case 0:
                    if ("CancelProcess" == e.type) return Vv.abort(), Uv.taskUpdates.push({
                        taskId: e.requestId,
                        update: {
                            status: Kr.Canceled
                        }
                    }), [2];
                    if (n = e._aux.accountKeys, Sr.ServiceAccount = n.ServiceAccount, Sr.UserAccount = n.UserAccount, "Task" != e.type) return [3, 6];
                    Fv(e.payload.id), t.label = 1;
                case 1:
                    return t.trys.push([1, 3, , 4]), [4, qv(e.payload)];
                case 2:
                case 3:
                    return t.sent(), [3, 4];
                case 4:
                    return [4, Yv(0)];
                case 5:
                    t.sent(), t.label = 6;
                case 6:
                    return [2]
            }
            var n
        }))
    }))
})), setInterval((function() {
    return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
        return (0, n.__generator)(this, (function(e) {
            switch (e.label) {
                case 0:
                    return [4, Hv()];
                case 1:
                    return e.sent(), [2]
            }
        }))
    }))
}), 500);
var qv = function(e) {
    return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
        function t(e, t) {
            i.updateTaskStatus({
                status: e,
                endTime: Date.now(),
                error: null != t ? {
                    message: t
                } : void 0
            })
        }
        var o, i, a, s, l, u, c, p, d, h, f, m, g, y;
        return (0, n.__generator)(this, (function(v) {
            switch (v.label) {
                case 0:
                    o = e.id, Uv.taskUpdates.push({
                        taskId: o,
                        update: {
                            status: Kr.Running
                        }
                    }), Fv(o), i = {
                        updateTaskStatus: function(e) {
                            return (0, n.__awaiter)(void 0, void 0, void 0, (function() {
                                return (0, n.__generator)(this, (function(t) {
                                    return Uv.taskUpdates.push({
                                        taskId: o,
                                        update: e
                                    }), [2]
                                }))
                            }))
                        },
                        logFunction: function(e) {
                            return Uv.logEntries.push({
                                logEntry: e,
                                taskId: o
                            })
                        },
                        appendTaskSpecialStatus: function(e) {
                            Uv.taskSpecialUpdates.push(e)
                        },
                        signal: Vv.signal
                    }, v.label = 1;
                case 1:
                    if (v.trys.push([1, 33, , 34]), ! function(e) {
                            return ao(e, Qr.RunScript)
                        }(e)) return [3, 7];
                    a = Date.now(), v.label = 2;
                case 2:
                    return v.trys.push([2, 5, , 6]), s = Date.now(), [4, Ev(e, i)];
                case 3:
                    return m = v.sent(), l = null != m ? ns(m, {
                        db: e.req.dbToken.projectId,
                        readTime: s
                    }) : void 0, u = l ? js(l) : void 0, [4, Mv(yu(u, e.id, e.req.dbToken))];
                case 4:
                    return v.sent(), Uv.logEntries.push({
                        logEntry: {
                            level: Wn.Log,
                            msg: "Script finished in ".concat(Date.now() - a, "ms"),
                            time: Date.now(),
                            type: Jn.Sys
                        },
                        taskId: o
                    }), [3, 6];
                case 5:
                    throw c = v.sent(), Uv.logEntries.push({
                        taskId: o,
                        logEntry: Vr(c)
                    }, {
                        taskId: o,
                        logEntry: {
                            level: Wn.Log,
                            msg: "Script failed after ".concat(Date.now() - a, "ms"),
                            time: Date.now(),
                            type: Jn.Sys
                        }
                    }), c;
                case 6:
                    return [3, 32];
                case 7:
                    if (!to(e)) return [3, 13];
                    p = (0, r.createWriteStream)(e.req.destinationFilepath), v.label = 8;
                case 8:
                    return v.trys.push([8, , 10, 12]), [4, Tl(e, p, i, Gv(e))];
                case 9:
                    return v.sent(), [3, 12];
                case 10:
                    return [4, new Promise((function(e) {
                        return p.end(e)
                    }))];
                case 11:
                    return v.sent(), [7];
                case 12:
                    return [3, 32];
                case 13:
                    return function(e) {
                        return ao(e, Qr.Import)
                    }(e) ? [4, Lv(e, (0, n.__assign)((0, n.__assign)({}, i), {
                        onUploadError: function(t, n) {
                            Uv.taskSpecialUpdates.push({
                                taskId: e.id,
                                errors: [{
                                    type: Xr.ImportGeneral,
                                    resourcePath: t,
                                    error: n
                                }]
                            })
                        }
                    }))] : [3, 15];
                case 14:
                    return v.sent(), [3, 32];
                case 15:
                    return function(e) {
                        return ao(e, Qr.AuthCopy)
                    }(e) ? [4, po(e, (0, n.__assign)((0, n.__assign)({}, i), {
                        logUploadErrors: function(t) {
                            return Uv.taskSpecialUpdates.push({
                                taskId: e.id,
                                errors: t
                            })
                        }
                    }))] : [3, 17];
                case 16:
                    return v.sent(), [3, 32];
                case 17:
                    return no(e) ? (d = (0, n.__assign)((0, n.__assign)({}, i), {
                        documentFetched: Jr,
                        collectionFetched: Jr
                    }), [4, La(e.id, e.req, d, Gv(e))]) : [3, 19];
                case 18:
                    return v.sent(), [3, 32];
                case 19:
                    return ro(e) ? [4, Ma(e, i, Gv(e))] : [3, 21];
                case 20:
                    return v.sent(), [3, 32];
                case 21:
                    return oo(e) ? (h = (0, n.__assign)((0, n.__assign)({}, i), {
                        onUploadError: function(t, n) {
                            Uv.taskSpecialUpdates.push({
                                taskId: e.id,
                                errors: [{
                                    type: Xr.DocUpdateGeneral,
                                    resourcePath: t,
                                    message: n
                                }]
                            })
                        }
                    }), [4, du(e, h, Gv(e))]) : [3, 23];
                case 22:
                    return v.sent(), [3, 32];
                case 23:
                    return function(e) {
                        return ao(e, Qr.AnalyzeCSV)
                    }(e) ? [4, Ul((0, r.createReadStream)(e.req.filename, {
                        encoding: e.req.csvParseParams.ficoFileEncoding
                    }), e.req.csvParseParams, i.signal)] : [3, 26];
                case 24:
                    return f = v.sent(), [4, Mv(_u(e.id, {
                        ana: f,
                        fileName: e.req.filename
                    }))];
                case 25:
                    return v.sent(), [3, 32];
                case 26:
                    return function(e) {
                        return ao(e, Qr.RtQuery)
                    }(e) ? [4, (b = e.req, (0, n.__awaiter)(void 0, void 0, Promise, (function() {
                        var e;
                        return (0, n.__generator)(this, (function(t) {
                            switch (t.label) {
                                case 0:
                                    return e = b.path, [4, Promise.race([go(b), Fr(1e3).then((function() {
                                        return {
                                            timeout: !0,
                                            path: e
                                        }
                                    }))])];
                                case 1:
                                    return [2, t.sent()]
                            }
                        }))
                    })))] : [3, 29];
                case 27:
                    return m = v.sent(), [4, Mv(bu(e.id, m))];
                case 28:
                    return v.sent(), [3, 32];
                case 29:
                    return ao(e, Qr.LoadCSV) ? (process.env.TZ = e.req.csvOptions.timezone, [4, ru({
                        filename: e.req.filePath,
                        projectId: e.req.db.projectId,
                        csvParams: e.req.csvParams,
                        csvOptions: e.req.csvOptions,
                        newResourcePrefix: e.req.newResourcePrefix
                    })]) : [3, 32];
                case 30:
                    return m = v.sent(), g = function(e) {
                        var t = [];
                        return t.push.apply(t, (0, n.__spreadArray)([], (0, n.__read)(e.docs.map((function(e) {
                            return (0, n.__assign)({
                                t: ol.Doc
                            }, e)
                        }))), !1)), t.push.apply(t, (0, n.__spreadArray)([], (0, n.__read)(e.errors.map((function(e) {
                            return (0, n.__assign)({
                                t: ol.Error
                            }, e)
                        }))), !1)), t.sort((function(e, t) {
                            return e.dataRow - t.dataRow
                        })), t
                    }(m), [4, Mv(wu(e.id, g))];
                case 31:
                    v.sent(), v.label = 32;
                case 32:
                    return t(Vv.signal.aborted ? Kr.Canceled : Kr.Finished, Vv.signal.aborted ? "Task was canceled by user" : void 0), [3, 34];
                case 33:
                    return y = v.sent(), qo(y) ? t(Kr.Canceled, "Canceled by user") : (console.error(zr(y)), t(Kr.Error, zr(y))), [3, 34];
                case 34:
                    return Yv(0), [2]
            }
            var b
        }))
    }))
};

function Yv(e) {
    return (0, n.__awaiter)(this, void 0, void 0, (function() {
        return (0, n.__generator)(this, (function(t) {
            switch (t.label) {
                case 0:
                    return [4, Hv()];
                case 1:
                    return t.sent(), Cv ? [4, Cv] : [3, 3];
                case 2:
                    t.sent(), t.label = 3;
                case 3:
                    return process.exit(e), [2]
            }
        }))
    }))
}

function Hv() {
    return (0, n.__awaiter)(this, void 0, void 0, (function() {
        var e, t, r, o;
        return (0, n.__generator)(this, (function(i) {
            switch (i.label) {
                case 0:
                    return e = [], t = [], r = [], Uv.logEntries.length > 0 && (e = Uv.logEntries, Uv.logEntries = []), Uv.taskUpdates.length > 0 && (o = {}, Uv.taskUpdates.forEach((function(e) {
                        o[e.taskId] = (0, n.__assign)((0, n.__assign)({}, o[e.taskId]), e.update)
                    })), t = Cn(o).map((function(e) {
                        var t = (0, n.__read)(e, 2);
                        return {
                            taskId: t[0],
                            update: t[1]
                        }
                    })), Uv.taskUpdates = []), Uv.taskSpecialUpdates.length > 0 && (r = Uv.taskSpecialUpdates, Uv.taskSpecialUpdates = []), 0 == e.length && 0 == t.length && 0 == r.length ? [2] : [4, Mv(vu(e, t, r))];
                case 1:
                    return i.sent(), [2]
            }
        }))
    }))
}
var Gv = function(e) {
var t, r, o = {};
if (to(e)) e.req.dbToken.type == wn.Emulator && u(e.req.dbToken);
else if (no(e)) e.req.mode != Er.Delete && e.req.src.db.type == wn.Emulator && u(e.req.src.db);
else if (ro(e)) {
    var i = new Set;
    try {
        for (var a = (0, n.__values)(Object.values(e.req.transfers).map((function(e) {
                return e.src.db
            }))), s = a.next(); !s.done; s = a.next()) {
            var l = s.value;
            l.type != wn.Emulator || i.has(l.emulatorId) || (i.add(l.emulatorId), u(l))
        }
    } catch (e) {
        t = {
            error: e
        }
    } finally {
        try {
            s && !s.done && (r = a.return) && r.call(a)
        } finally {
            if (t) throw t.error
        }
    }
} else oo(e) && e.req.dbToken.type == wn.Emulator && u(e.req.dbToken);
return o;

function u(e) {
    var t;
    null !== (t = o.emulatorFsApiGetDocumentsEmuWorkaround) && void 0 !== t || (o.emulatorFsApiGetDocumentsEmuWorkaround = {}), o.emulatorFsApiGetDocumentsEmuWorkaround[e.emulatorId] = function(e) {
        var t = fo(e).firestore(),
            r = new Map;
        return function(e) {
            var o, i;
            return (0, n.__asyncGenerator)(this, arguments, (function() {
                var a, s, l, u, c, p, d, h, f, m, g, y, v;
                return (0, n.__generator)(this, (function(b) {
                    switch (b.label) {
                        case 0:
                            return a = e.join("/"), r.has(a) ? [3, 2] : (l = (s = r).set, u = [a], [4, (0, n.__await)(t.collection(e.join("/")).listDocuments())]);
                        case 1:
                            l.apply(s, u.concat([b.sent()])), b.label = 2;
                        case 2:
                            return null != (c = null === (i = null === (o = r.get(a)) || void 0 === o ? void 0 : o.splice) || void 0 === i ? void 0 : i.call(o, 0, 10)) && 0 != c.length ? [3, 6] : [4, (0, n.__await)({
                                docs: [],
                                nextPageToken: void 0
                            })];
                        case 3:
                            return [4, b.sent()];
                        case 4:
                            return [4, n.__await.apply(void 0, [b.sent()])];
                        case 5:
                            return [2, b.sent()];
                        case 6:
                            p = [], b.label = 7;
                        case 7:
                            b.trys.push([7, 12, 13, 14]), d = (0, n.__values)(c), h = d.next(), b.label = 8;
                        case 8:
                            return h.done ? [3, 11] : (f = h.value, [4, (0, n.__await)(f.get())]);
                        case 9:
                            (m = b.sent()).exists ? p.push(Ja(m)) : p.push(Wa(f)), b.label = 10;
                        case 10:
                            return h = d.next(), [3, 8];
                        case 11:
                            return [3, 14];
                        case 12:
                            return g = b.sent(), y = {
                                error: g
                            }, [3, 14];
                        case 13:
                            try {
                                h && !h.done && (v = d.return) && v.call(d)
                            } finally {
                                if (y) throw y.error
                            }
                            return [7];
                        case 14:
                            return [4, (0, n.__await)({
                                docs: p,
                                nextPageToken: "dummy"
                            })];
                        case 15:
                            return [4, b.sent()];
                        case 16:
                            return b.sent(), [2]
                    }
                }))
            }))
        }
    }(e)
}
}
})(), module.exports = __webpack_exports__
})();
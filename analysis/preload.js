(() => {
    "use strict";
    var e = {
            51255: (e, t, r) => {
                var n = r(91882),
                    o = r(63477),
                    i = !1;
                e.exports = function(e) {
                    return i || (i = !0, "renderer" === process.type ? (window.addEventListener("error", a), window.addEventListener("unhandledrejection", s)) : (process.on("uncaughtException", t), process.on("unhandledRejection", r))), {
                        stop: function() {
                            i = !1, "renderer" === process.type ? (window.removeEventListener("error", a), window.removeEventListener("unhandledrejection", s)) : (process.removeListener("uncaughtException", t), process.removeListener("unhandledRejection", r))
                        }
                    };

                    function t(t) {
                        try {
                            if ("function" == typeof e.onError) {
                                var r = n.getVersions();
                                if (!1 === e.onError(t, r, c)) return
                            }
                            if (e.log("Unhandled Exception", t), e.showDialog && t.name.indexOf("UnhandledRejection") < 0) {
                                var o = process.type || "main";
                                n.showErrorBox("A JavaScript error occurred in the " + o + " process", t.stack)
                            }
                        } catch (e) {
                            console.error(t)
                        }
                    }

                    function r(e) {
                        if (e instanceof Error) {
                            try {
                                Object.defineProperty(e, "name", {
                                    value: "UnhandledRejection " + e.name
                                })
                            } catch (e) {}
                            t(e)
                        } else {
                            var r = new Error(JSON.stringify(e));
                            r.name = "UnhandledRejection", t(r)
                        }
                    }

                    function a(e) {
                        e.preventDefault(), t(e.error)
                    }

                    function s(e) {
                        e.preventDefault(), r(e.reason)
                    }

                    function c(t, r) {
                        var i = t + "?" + o.stringify(r);
                        n.openUrl(i, e.log)
                    }
                }
            },
            91882: (e, t, r) => {
                var n, o = r(71017);
                try {
                    n = r(72298)
                } catch (e) {
                    n = null
                }
                var i = r(22037);

                function a() {
                    return c("app")
                }

                function s() {
                    var e = a();
                    return e ? "name" in e ? e.name : e.getName() : null
                }

                function c(e) {
                    return n ? n[e] ? n[e] : n.remote ? n.remote[e] : null : null
                }

                function l() {
                    return "browser" === process.type && n && n.ipcMain ? n.ipcMain : "renderer" === process.type && n && n.ipcRenderer ? n.ipcRenderer : null
                }

                function u() {
                    var e = a();
                    return e ? "version" in e ? e.version : e.getVersion() : null
                }
                e.exports = {
                    getName: s,
                    getPath: function(e) {
                        var t = a();
                        if (!t) return null;
                        try {
                            return t.getPath(e)
                        } catch (e) {
                            return null
                        }
                    },
                    getVersion: u,
                    getVersions: function() {
                        return {
                            app: s() + " " + u(),
                            electron: "Electron " + process.versions.electron,
                            os: (e = i.type().replace("_", " "), t = i.release(), "Darwin" === e && (e = "macOS", t = "10." + (Number(i.release().split(".")[0]) - 4)), e + " " + t)
                        };
                        var e, t
                    },
                    isDev: function() {
                        var e = a();
                        return e && void 0 !== e.isPackaged ? !e.isPackaged : "string" == typeof process.execPath ? o.basename(process.execPath).toLowerCase().startsWith("electron") : "1" === process.env.ELECTRON_IS_DEV
                    },
                    isElectron: function() {
                        return "browser" === process.type || "renderer" === process.type
                    },
                    isIpcChannelListened: function(e) {
                        var t = l();
                        return !!t && t.listenerCount(e) > 0
                    },
                    loadRemoteModule: function(e) {
                        "browser" === process.type ? a().on("web-contents-created", (function(t, r) {
                            var n = r.executeJavaScript('try {require("' + e + '")} catch(e){}; void 0;');
                            n && "function" == typeof n.catch && n.catch((function() {}))
                        })) : process.type
                    },
                    onIpc: function(e, t) {
                        var r = l();
                        r && r.on(e, t)
                    },
                    openUrl: function(e, t) {
                        t = t || console.error;
                        var r = c("shell");
                        r && r.openExternal(e).catch(t)
                    },
                    sendIpc: function(e, t) {
                        "browser" === process.type ? function(e, t) {
                            n && n.BrowserWindow && n.BrowserWindow.getAllWindows().forEach((function(r) {
                                r.webContents && !r.webContents.isDestroyed() && r.webContents.send(e, t)
                            }))
                        }(e, t) : "renderer" === process.type && function(e, t) {
                            var r = l();
                            r && r.send(e, t)
                        }(e, t)
                    },
                    showErrorBox: function(e, t) {
                        var r = c("dialog");
                        r && r.showErrorBox(e, t)
                    }
                }
            },
            77377: (e, t, r) => {
                var n = r(51255),
                    o = r(91882),
                    i = r(73308),
                    a = r(79163),
                    s = r(52669),
                    c = r(33508),
                    l = r(65651),
                    u = r(61459);
                e.exports = function e(t) {
                    var r = {
                        catchErrors: function(e) {
                            var t = Object.assign({}, {
                                log: r.error,
                                showDialog: "browser" === process.type
                            }, e || {});
                            n(t)
                        },
                        create: e,
                        functions: {},
                        hooks: [],
                        isDev: o.isDev(),
                        levels: [],
                        logId: t,
                        variables: {
                            processType: process.type
                        }
                    };
                    return r.scope = a(r), r.transports = {
                        console: s(r),
                        file: c(r),
                        remote: u(r),
                        ipc: l(r)
                    }, Object.defineProperty(r.levels, "add", {
                        enumerable: !1,
                        value: function(e, t) {
                            t = void 0 === t ? r.levels.length : t, r.levels.splice(t, 0, e), r[e] = i.log.bind(null, r, {
                                level: e
                            }), r.functions[e] = r[e]
                        }
                    }), ["error", "warn", "info", "verbose", "debug", "silly"].forEach((function(e) {
                        r.levels.add(e)
                    })), r.log = i.log.bind(null, r, {
                        level: "info"
                    }), r.functions.log = r.log, r.logMessageWithTransports = function(e, t) {
                        return void 0 === e.date && (e.date = new Date), void 0 === e.variables && (e.variables = r.variables), i.runTransports(t, e, r)
                    }, r
                }("default"), e.exports.default = e.exports
            },
            73308: e => {
                function t(e, t, n) {
                    for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && r(e[o], t, n)
                }

                function r(e, t, r) {
                    "function" == typeof e && !1 !== e.level && n(r.levels, e.level, t.level) && (t = function(e, t, r) {
                        if (!e || !e.length) return r;
                        for (var n = 0; n < e.length && (r = e[n](r, t)); n++);
                        return r
                    }(r.hooks, e, t), t && e(t))
                }

                function n(e, t, r) {
                    var n = e.indexOf(t),
                        o = e.indexOf(r);
                    return -1 === o || -1 === n || o <= n
                }
                e.exports = {
                    compareLevels: n,
                    log: function(e, r) {
                        var n = e.transports,
                            o = {
                                data: Array.prototype.slice.call(arguments, 2),
                                date: new Date,
                                level: r.level,
                                scope: r.scope ? r.scope.toJSON() : null,
                                variables: e.variables
                            };
                        t(n, o, e)
                    },
                    runTransport: r,
                    runTransports: t
                }
            },
            79163: (e, t, r) => {
                var n = r(73308).log;
                e.exports = function(e) {
                    return t.labelPadding = !0, t.defaultLabel = "", t.maxLabelLength = 0, t.getOptions = function() {
                        return {
                            defaultLabel: t.defaultLabel,
                            labelLength: !0 === t.labelPadding ? t.maxLabelLength : !1 === t.labelPadding ? 0 : "number" == typeof t.labelPadding ? t.labelPadding : 0
                        }
                    }, t;

                    function t(r) {
                        var o = {
                            label: r,
                            toJSON: function() {
                                return {
                                    label: this.label
                                }
                            }
                        };
                        return e.levels.forEach((function(t) {
                            o[t] = n.bind(null, e, {
                                level: t,
                                scope: o
                            })
                        })), o.log = o.info, t.maxLabelLength = Math.max(t.maxLabelLength, r.length), o
                    }
                }
            },
            23063: (e, t, r) => {
                var n = r(86074),
                    o = r(38708),
                    i = r(87695);

                function a(e, t, r) {
                    return t.reduce((function(t, r) {
                        return "function" == typeof r ? r(t, e) : t
                    }), r || e.data)
                }
                e.exports = {
                    applyAnsiStyles: o.applyAnsiStyles,
                    concatFirstStringElements: i.concatFirstStringElements,
                    customFormatterFactory: function(e, t, r) {
                        return "string" == typeof e ? function(n, o) {
                            return a(o, [i.templateVariables, i.templateScopeFactory(r), i.templateDate, i.templateText, t && i.concatFirstStringElements], [e].concat(n))
                        } : "function" == typeof e ? function(t, r) {
                            var n = Object.assign({}, r, {
                                    data: t
                                }),
                                o = e(n, t);
                            return [].concat(o)
                        } : function(e) {
                            return [].concat(e)
                        }
                    },
                    maxDepthFactory: n.maxDepthFactory,
                    removeStyles: o.removeStyles,
                    toJSON: n.toJSON,
                    toStringFactory: n.toStringFactory,
                    transform: a
                }
            },
            86074: (e, t, r) => {
                var n = r(73837);

                function o(e) {
                    var t = function() {
                        if ("undefined" != typeof WeakSet) return new WeakSet;
                        var e = [];
                        return {
                            add: function(t) {
                                e.push(t)
                            },
                            has: function(t) {
                                return -1 !== e.indexOf(t)
                            }
                        }
                    }();
                    return function(r, n) {
                        if ("object" == typeof n && null !== n) {
                            if (t.has(n)) return;
                            t.add(n)
                        }
                        return a(0, n, e)
                    }
                }

                function i(e, t) {
                    if (!e) return e;
                    if (t < 1) return s(e) ? "[array]" : "object" == typeof e && e ? "[object]" : e;
                    if (s(e)) return e.map((function(e) {
                        return i(e, t - 1)
                    }));
                    if ("object" != typeof e) return e;
                    if (e && "function" == typeof e.toISOString) return e;
                    if (null === e) return null;
                    if (e instanceof Error) return e;
                    var r = {};
                    for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (r[n] = i(e[n], t - 1));
                    return r
                }

                function a(e, t, r) {
                    var n = !r || !1 !== r.serializeMapAndSet;
                    return t instanceof Error ? t.stack : t ? "function" == typeof t.toJSON ? t.toJSON() : "function" == typeof t ? "[function] " + t.toString() : n && t instanceof Map && Object.fromEntries ? Object.fromEntries(t) : n && t instanceof Set && Array.from ? Array.from(t) : t : t
                }

                function s(e) {
                    return "[object Array]" === Object.prototype.toString.call(e)
                }
                e.exports = {
                    maxDepthFactory: function(e) {
                        return e = e || 6,
                            function(t) {
                                return i(t, e)
                            }
                    },
                    serialize: a,
                    toJSON: function(e) {
                        return JSON.parse(JSON.stringify(e, o()))
                    },
                    toStringFactory: function(e) {
                        return function(t) {
                            var r = t.map((function(e) {
                                if (void 0 !== e) try {
                                    var t = JSON.stringify(e, o(), "  ");
                                    return void 0 === t ? void 0 : JSON.parse(t)
                                } catch (t) {
                                    return e
                                }
                            }));
                            return n.formatWithOptions ? (r.unshift(e || {}), n.formatWithOptions.apply(n, r)) : n.format.apply(n, r)
                        }
                    }
                }
            },
            38708: e => {
                e.exports = {
                    applyAnsiStyles: function(e) {
                        return o(e, r, n)
                    },
                    removeStyles: function(e) {
                        return o(e, (function() {
                            return ""
                        }))
                    },
                    transformStyles: o
                };
                var t = {
                    unset: "[0m",
                    black: "[30m",
                    red: "[31m",
                    green: "[32m",
                    yellow: "[33m",
                    blue: "[34m",
                    magenta: "[35m",
                    cyan: "[36m",
                    white: "[37m"
                };

                function r(e) {
                    var r = e.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
                    return t[r] || ""
                }

                function n(e) {
                    return e + t.unset
                }

                function o(e, t, r) {
                    var n = {};
                    return e.reduce((function(e, o, i, a) {
                        if (n[i]) return e;
                        if ("string" == typeof o) {
                            var s = i,
                                c = !1;
                            o = o.replace(/%[1cdfiOos]/g, (function(e) {
                                if (s += 1, "%c" !== e) return e;
                                var r = a[s];
                                return "string" == typeof r ? (n[s] = !0, c = !0, t(r, o)) : e
                            })), c && r && (o = r(o))
                        }
                        return e.push(o), e
                    }), [])
                }
            },
            87695: e => {
                function t(e, t) {
                    return e.replace("{y}", String(t.getFullYear())).replace("{m}", n(t.getMonth() + 1)).replace("{d}", n(t.getDate())).replace("{h}", n(t.getHours())).replace("{i}", n(t.getMinutes())).replace("{s}", n(t.getSeconds())).replace("{ms}", n(t.getMilliseconds(), 3)).replace("{z}", r(t.getTimezoneOffset())).replace("{iso}", t.toISOString())
                }

                function r(e) {
                    var t = Math.abs(e);
                    return (e >= 0 ? "-" : "+") + n(Math.floor(t / 60)) + ":" + n(t % 60)
                }

                function n(e, t) {
                    return t = t || 2, (new Array(t + 1).join("0") + e).substr(-t, t)
                }

                function o(e, t) {
                    return t = Math.max(t, e.length), (e + Array(t + 1).join(" ")).substring(0, t)
                }
                e.exports = {
                    concatFirstStringElements: function(e) {
                        return "string" != typeof e[0] || "string" != typeof e[1] || e[0].match(/%[1cdfiOos]/) || (e[1] = e[0] + " " + e[1], e.shift()), e
                    },
                    formatDate: t,
                    formatTimeZone: r,
                    pad: n,
                    padString: o,
                    templateDate: function(e, r) {
                        var n = e[0];
                        return "string" != typeof n || (e[0] = t(n, r.date)), e
                    },
                    templateVariables: function(e, t) {
                        var r = e[0],
                            n = t.variables;
                        if ("string" != typeof r || !t.variables) return e;
                        for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (r = r.replace("{" + i + "}", n[i]));
                        return r = (r = r.replace("{level}]", o(t.level + "]", 6))).replace("{level}", t.level), e[0] = r, e
                    },
                    templateScopeFactory: function(e) {
                        var t = (e = e || {}).labelLength || 0;
                        return function(r, n) {
                            var i, a = r[0],
                                s = n.scope && n.scope.label;
                            return s || (s = e.defaultLabel), i = "" === s ? t > 0 ? o("", t + 3) : "" : "string" == typeof s ? o(" (" + s + ")", t + 3) : "", r[0] = a.replace("{scope}", i), r
                        }
                    },
                    templateText: function(e) {
                        var t = e[0];
                        if ("string" != typeof t) return e;
                        if (t.lastIndexOf("{text}") === t.length - 6) return e[0] = t.replace(/\s?{text}/, ""), "" === e[0] && e.shift(), e;
                        var r = t.split("{text}"),
                            n = [];
                        return "" !== r[0] && n.push(r[0]), n = n.concat(e.slice(1)), "" !== r[1] && n.push(r[1]), n
                    }
                }
            },
            52669: (e, t, r) => {
                var n = r(23063),
                    o = {
                        context: console,
                        error: console.error,
                        warn: console.warn,
                        info: console.info,
                        verbose: console.verbose,
                        debug: console.debug,
                        silly: console.silly,
                        log: console.log
                    };
                e.exports = function(e) {
                    return t.level = "silly", t.useStyles = process.env.FORCE_STYLES, t.format = i[process.type] || i.browser, t;

                    function t(r) {
                        var n, i, c, l, u = e.scope.getOptions();
                        n = "renderer" === process.type || "worker" === process.type ? a(r, t, u) : s(r, t, u), i = r.level, c = n, l = o[i] || o.info, "renderer" !== process.type ? l.apply(o.context, c) : setTimeout(l.bind.apply(l, [l.context].concat(c)))
                    }
                }, e.exports.transformRenderer = a, e.exports.transformMain = s;
                var i = {
                    browser: "%c{h}:{i}:{s}.{ms}{scope}%c " + ("win32" === process.platform ? ">" : "›") + " {text}",
                    renderer: "{h}:{i}:{s}.{ms}{scope} › {text}",
                    worker: "{h}:{i}:{s}.{ms}{scope} › {text}"
                };

                function a(e, t, r) {
                    return n.transform(e, [n.customFormatterFactory(t.format, !0, r)])
                }

                function s(e, t, r) {
                    var o, a = function(e, t) {
                        if (!0 === e || !1 === e) return e;
                        var r = "error" === t || "warn" === t ? process.stderr : process.stdout;
                        return r && r.isTTY
                    }(t.useStyles, e.level);
                    return n.transform(e, [(o = t.format, function(e, t) {
                        return o !== i.browser ? e : ["color:" + c(t.level), "color:unset"].concat(e)
                    }), n.customFormatterFactory(t.format, !1, r), a ? n.applyAnsiStyles : n.removeStyles, n.concatFirstStringElements, n.maxDepthFactory(4), n.toJSON])
                }

                function c(e) {
                    switch (e) {
                        case "error":
                            return "red";
                        case "warn":
                            return "yellow";
                        case "info":
                            return "cyan";
                        default:
                            return "unset"
                    }
                }
            },
            21048: (e, t, r) => {
                var n = r(82361),
                    o = r(57147),
                    i = r(22037),
                    a = r(71017),
                    s = r(57310),
                    c = r(73837);

                function l(e, t, r) {
                    n.call(this), this.path = e, this.initialSize = void 0, this.bytesWritten = 0, this.writeAsync = Boolean(r), this.asyncWriteQueue = [], this.hasActiveAsyncWritting = !1, this.writeOptions = t || {
                        flag: "a",
                        mode: 438,
                        encoding: "utf8"
                    }, Object.defineProperty(this, "size", {
                        get: this.getSize.bind(this)
                    })
                }

                function u(e) {
                    l.call(this, e)
                }

                function p() {
                    n.call(this), this.store = {}, this.emitError = this.emitError.bind(this)
                }

                function f(e) {
                    if (Boolean(s.fileURLToPath)) return o.mkdirSync(e, {
                        recursive: !0
                    }), !0;
                    try {
                        return o.mkdirSync(e), !0
                    } catch (t) {
                        if ("ENOENT" === t.code) return f(a.dirname(e)) && f(e);
                        try {
                            if (o.statSync(e).isDirectory()) return !0;
                            throw t
                        } catch (e) {
                            throw e
                        }
                    }
                }
                e.exports = {
                    File: l,
                    FileRegistry: p,
                    NullFile: u
                }, c.inherits(l, n), l.prototype.clear = function() {
                    try {
                        return o.writeFileSync(this.path, "", {
                            mode: this.writeOptions.mode,
                            flag: "w"
                        }), this.reset(), !0
                    } catch (e) {
                        return "ENOENT" === e.code || (this.emit("error", e, this), !1)
                    }
                }, l.prototype.crop = function(e) {
                    try {
                        var t = (r = this.path, n = e || 4096, a = Buffer.alloc(n), s = o.statSync(r), c = Math.min(s.size, n), l = Math.max(0, s.size - n), u = o.openSync(r, "r"), p = o.readSync(u, a, 0, c, l), o.closeSync(u), a.toString("utf8", 0, p));
                        this.clear(), this.writeLine("[log cropped]" + i.EOL + t)
                    } catch (e) {
                        this.emit("error", new Error("Couldn't crop file " + this.path + ". " + e.message), this)
                    }
                    var r, n, a, s, c, l, u, p
                }, l.prototype.toString = function() {
                    return this.path
                }, l.prototype.reset = function() {
                    this.initialSize = void 0, this.bytesWritten = 0
                }, l.prototype.writeLine = function(e) {
                    if (e += i.EOL, this.writeAsync) return this.asyncWriteQueue.push(e), void this.nextAsyncWrite();
                    try {
                        o.writeFileSync(this.path, e, this.writeOptions), this.increaseBytesWrittenCounter(e)
                    } catch (e) {
                        this.emit("error", new Error("Couldn't write to " + this.path + ". " + e.message), this)
                    }
                }, l.prototype.getSize = function() {
                    if (void 0 === this.initialSize) try {
                        var e = o.statSync(this.path);
                        this.initialSize = e.size
                    } catch (e) {
                        this.initialSize = 0
                    }
                    return this.initialSize + this.bytesWritten
                }, l.prototype.isNull = function() {
                    return !1
                }, l.prototype.increaseBytesWrittenCounter = function(e) {
                    this.bytesWritten += Buffer.byteLength(e, this.writeOptions.encoding)
                }, l.prototype.nextAsyncWrite = function() {
                    var e = this;
                    if (!(this.hasActiveAsyncWritting || this.asyncWriteQueue.length < 1)) {
                        var t = this.asyncWriteQueue.shift();
                        this.hasActiveAsyncWritting = !0, o.writeFile(this.path, t, this.writeOptions, (function(r) {
                            e.hasActiveAsyncWritting = !1, r ? e.emit("error", new Error("Couldn't write to " + e.path + ". " + r.message), this) : e.increaseBytesWrittenCounter(t), e.nextAsyncWrite()
                        }))
                    }
                }, c.inherits(u, l), u.prototype.clear = function() {}, u.prototype.crop = function() {}, u.prototype.writeLine = function() {}, u.prototype.getSize = function() {
                    return 0
                }, u.prototype.isNull = function() {
                    return !0
                }, c.inherits(p, n), p.prototype.provide = function(e, t, r) {
                    var n;
                    try {
                        if (e = a.resolve(e), this.store[e]) return this.store[e];
                        n = this.createFile(e, t, Boolean(r))
                    } catch (t) {
                        n = new u(e), this.emitError(t, n)
                    }
                    return n.on("error", this.emitError), this.store[e] = n, n
                }, p.prototype.createFile = function(e, t, r) {
                    return this.testFileWriting(e), new l(e, t, r)
                }, p.prototype.emitError = function(e, t) {
                    this.emit("error", e, t)
                }, p.prototype.testFileWriting = function(e) {
                    f(a.dirname(e)), o.writeFileSync(e, "", {
                        flag: "a"
                    })
                }
            },
            33508: (e, t, r) => {
                var n = r(57147),
                    o = r(71017),
                    i = r(22037),
                    a = r(73837),
                    s = r(23063),
                    c = r(21048).FileRegistry,
                    l = r(11129);
                e.exports = function(e, t) {
                    var r = l.getPathVariables(process.platform),
                        c = t || u;
                    return c.listenerCount("error") < 1 && c.on("error", (function(e, t) {
                            f("Can't write to " + t, e)
                        })), p.archiveLog = function(e) {
                            var t = e.toString(),
                                r = o.parse(t);
                            try {
                                n.renameSync(t, o.join(r.dir, r.name + ".old" + r.ext))
                            } catch (t) {
                                f("Could not rotate log", t);
                                var i = Math.round(p.maxSize / 4);
                                e.crop(Math.min(i, 262144))
                            }
                        }, p.depth = 5, p.fileName = function() {
                            switch (process.type) {
                                case "renderer":
                                    return "renderer.log";
                                case "worker":
                                    return "worker.log";
                                default:
                                    return "main.log"
                            }
                        }(), p.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}", p.getFile = d, p.level = "silly", p.maxSize = 1048576, p.readAllLogs = function(e) {
                            var t = e && "function" == typeof e.fileFilter ? e.fileFilter : function(e) {
                                    return e.endsWith(".log")
                                },
                                a = Object.assign({}, r, {
                                    fileName: p.fileName
                                }),
                                s = o.dirname(p.resolvePath(a));
                            return n.readdirSync(s).map((function(e) {
                                return o.join(s, e)
                            })).filter(t).map((function(e) {
                                try {
                                    return {
                                        path: e,
                                        lines: n.readFileSync(e, "utf8").split(i.EOL)
                                    }
                                } catch (e) {
                                    return null
                                }
                            })).filter(Boolean)
                        }, p.resolvePath = function(e) {
                            return o.join(e.libraryDefaultDir, e.fileName)
                        }, p.sync = !0, p.writeOptions = {
                            flag: "a",
                            mode: 438,
                            encoding: "utf8"
                        }, p.inspectOptions = {},
                        function() {
                            var e = " is deprecated and will be removed in v5.",
                                t = " property" + e;

                            function r() {
                                return d().path
                            }
                            Object.defineProperties(p, {
                                bytesWritten: {
                                    get: a.deprecate((function() {
                                        return d().bytesWritten
                                    }), "bytesWritten" + t)
                                },
                                file: {
                                    get: a.deprecate(r, "file" + t),
                                    set: a.deprecate((function(e) {
                                        p.resolvePath = function() {
                                            return e
                                        }
                                    }), "file" + t)
                                },
                                fileSize: {
                                    get: a.deprecate((function() {
                                        return d().size
                                    }), "file" + t)
                                }
                            }), p.clear = a.deprecate((function() {
                                d().clear()
                            }), "clear()" + e), p.findLogPath = a.deprecate(r, "findLogPath()" + e), p.init = a.deprecate((function() {}), "init()" + e)
                        }(), p;

                    function p(t) {
                        var r = d(t);
                        p.maxSize > 0 && r.size > p.maxSize && (p.archiveLog(r), r.reset());
                        var n = e.scope.getOptions(),
                            o = Object.assign({
                                depth: p.depth
                            }, p.inspectOptions),
                            i = s.transform(t, [s.removeStyles, s.customFormatterFactory(p.format, !1, n), s.concatFirstStringElements, s.toStringFactory(o)]);
                        r.writeLine(i)
                    }

                    function f(t, r) {
                        var n = ["electron-log.transports.file: " + t];
                        r && n.push(r), e.transports.console({
                            data: n,
                            date: new Date,
                            level: "warn"
                        })
                    }

                    function d(e) {
                        var t = Object.assign({}, r, {
                                fileName: p.fileName
                            }),
                            n = p.resolvePath(t, e);
                        return c.provide(n, p.writeOptions, !p.sync)
                    }
                };
                var u = new c
            },
            14928: (e, t, r) => {
                var n = r(57147),
                    o = r(71017);

                function i(e) {
                    if (!e) return null;
                    try {
                        var t = a("package.json", e = o.join.apply(o, arguments));
                        if (!t) return null;
                        var r = JSON.parse(n.readFileSync(t, "utf8")),
                            i = r.productName || r.name;
                        if (!i || "electron" === i.toLowerCase()) return null;
                        if (r.productName || r.name) return {
                            name: i,
                            version: r.version
                        }
                    } catch (e) {
                        return null
                    }
                }

                function a(e, t) {
                    for (var r = t;;) {
                        var i = o.parse(r),
                            a = i.root,
                            s = i.dir;
                        if (n.existsSync(o.join(r, e))) return o.resolve(o.join(r, e));
                        if (r === a) return null;
                        r = s
                    }
                }
                e.exports = {
                    readPackageJson: function() {
                        return i(r.c[r.s] && r.c[r.s].filename) || i(0 === (e = process.argv.filter((function(e) {
                            return 0 === e.indexOf("--user-data-dir=")
                        }))).length || "string" != typeof e[0] ? null : e[0].replace("--user-data-dir=", "")) || i(process.resourcesPath, "app.asar") || i(process.resourcesPath, "app") || i(process.cwd()) || {
                            name: null,
                            version: null
                        };
                        var e
                    },
                    tryReadJsonAt: i
                }
            },
            11129: (e, t, r) => {
                var n = r(22037),
                    o = r(71017),
                    i = r(91882),
                    a = r(14928);

                function s(e) {
                    var t = i.getPath("appData");
                    if (t) return t;
                    var r = c();
                    switch (e) {
                        case "darwin":
                            return o.join(r, "Library/Application Support");
                        case "win32":
                            return process.env.APPDATA || o.join(r, "AppData/Roaming");
                        default:
                            return process.env.XDG_CONFIG_HOME || o.join(r, ".config")
                    }
                }

                function c() {
                    return n.homedir ? n.homedir() : process.env.HOME
                }

                function l(e, t) {
                    return "darwin" === e ? o.join(c(), "Library/Logs", t) : o.join(f(e, t), "logs")
                }

                function u(e) {
                    return "darwin" === e ? o.join(c(), "Library/Logs", "{appName}") : o.join(s(e), "{appName}", "logs")
                }

                function p() {
                    var e = i.getName() || "",
                        t = i.getVersion();
                    if ("electron" === e.toLowerCase() && (e = "", t = ""), e && t) return {
                        name: e,
                        version: t
                    };
                    var r = a.readPackageJson();
                    return e || (e = r.name), t || (t = r.version), e || (e = "Electron"), {
                        name: e,
                        version: t
                    }
                }

                function f(e, t) {
                    return i.getName() !== t ? o.join(s(e), t) : i.getPath("userData") || o.join(s(e), t)
                }
                e.exports = {
                    getAppData: s,
                    getLibraryDefaultDir: l,
                    getLibraryTemplate: u,
                    getNameAndVersion: p,
                    getPathVariables: function(e) {
                        var t = p(),
                            r = t.name,
                            o = t.version;
                        return {
                            appData: s(e),
                            appName: r,
                            appVersion: o,
                            electronDefaultDir: i.getPath("logs"),
                            home: c(),
                            libraryDefaultDir: l(e, r),
                            libraryTemplate: u(e),
                            temp: i.getPath("temp") || n.tmpdir(),
                            userData: f(e, r)
                        }
                    },
                    getUserData: f
                }
            },
            65651: (e, t, r) => {
                var n = r(23063),
                    o = r(91882),
                    i = r(73308);
                e.exports = function(e) {
                    return t.eventId = "__ELECTRON_LOG_IPC_" + e.logId + "__", t.level = !!e.isDev && "silly", o.isIpcChannelListened(t.eventId) ? function() {} : (o.onIpc(t.eventId, (function(t, r) {
                        r.date = new Date(r.date), i.runTransport(e.transports.console, r, e)
                    })), o.loadRemoteModule("electron-log"), o.isElectron() ? t : null);

                    function t(e) {
                        var r = Object.assign({}, e, {
                            data: n.transform(e, [n.toJSON, n.maxDepthFactory(3)])
                        });
                        o.sendIpc(t.eventId, r)
                    }
                }
            },
            61459: (e, t, r) => {
                var n = r(13685),
                    o = r(95687),
                    i = r(57310),
                    a = r(23063);
                e.exports = function(e) {
                    return t.client = {
                        name: "electron-application"
                    }, t.depth = 6, t.level = !1, t.requestOptions = {}, t.url = null, t.onError = null, t.transformBody = function(e) {
                        return JSON.stringify(e)
                    }, t;

                    function t(r) {
                        if (t.url) {
                            var s = t.transformBody({
                                    client: t.client,
                                    data: a.transform(r, [a.removeStyles, a.toJSON, a.maxDepthFactory(t.depth + 1)]),
                                    date: r.date.getTime(),
                                    level: r.level,
                                    variables: r.variables
                                }),
                                c = function(e, t, r) {
                                    var a = i.parse(e),
                                        s = "https:" === a.protocol ? o : n,
                                        c = {
                                            hostname: a.hostname,
                                            port: a.port,
                                            path: a.path,
                                            method: "POST",
                                            headers: {}
                                        };
                                    Object.assign(c, t), c.headers["Content-Length"] = r.length, c.headers["Content-Type"] || (c.headers["Content-Type"] = "application/json");
                                    var l = s.request(c);
                                    return l.write(r), l.end(), l
                                }(t.url, t.requestOptions, Buffer.from(s, "utf8"));
                            c.on("error", t.onError || function(r) {
                                e.logMessageWithTransports({
                                    data: ["electron-log.transports.remote: cannot send HTTP request to " + t.url, r],
                                    level: "warn"
                                }, [e.transports.console, e.transports.ipc, e.transports.file])
                            })
                        }
                    }
                }
            },
            60942: (e, t, r) => {
                r.r(t);
                var n = r(77377);
                n.transports.file.maxSize = 5e7, n.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms} {z}] [{level}] {text}", window.api = {
                    log: n.functions,
                    appVersion: "1.5.11"
                }
            },
            72298: e => {
                e.exports = require("electron")
            },
            82361: e => {
                e.exports = require("events")
            },
            57147: e => {
                e.exports = require("fs")
            },
            13685: e => {
                e.exports = require("http")
            },
            95687: e => {
                e.exports = require("https")
            },
            22037: e => {
                e.exports = require("os")
            },
            71017: e => {
                e.exports = require("path")
            },
            63477: e => {
                e.exports = require("querystring")
            },
            57310: e => {
                e.exports = require("url")
            },
            73837: e => {
                e.exports = require("util")
            }
        },
        t = {};

    function r(n) {
        var o = t[n];
        if (void 0 !== o) return o.exports;
        var i = t[n] = {
            exports: {}
        };
        return e[n](i, i.exports, r), i.exports
    }
    r.c = t, r.n = e => {
        var t = e && e.__esModule ? () => e.default : () => e;
        return r.d(t, {
            a: t
        }), t
    }, r.d = (e, t) => {
        for (var n in t) r.o(t, n) && !r.o(e, n) && Object.defineProperty(e, n, {
            enumerable: !0,
            get: t[n]
        })
    }, r.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t), r.r = e => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, r.ab = __dirname + "/native_modules/";
    var n = r(r.s = 60942);
    module.exports = n
})();
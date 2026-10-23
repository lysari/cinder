).isEmpty(cr) && y().compare(cr, d.app.getVersion()) >= 1
}], !1)
}], !1);
d.Menu.setApplicationMenu(d.Menu.buildFromTemplate(l))
}, e
}();

function Kn(e) {
    dt(Bt(e))
}
var Wn = new $n,
    Jn = n(13685),
    Yn = n(49704),
    Qn = n(78318),
    Xn = n.n(Qn);

function Zn(e, t) {
    d.ipcMain.handle(e, t)
}
var er;
"true" === process.env.DEBUG_PROD && (d.crashReporter.start({
    uploadToServer: !1
}), console.error("Storing dumps inside", d.app.getPath("crashDumps")));
var tr = "Stable",
    nr = function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            var e, t, n, r, o;
            return (0, u.__generator)(this, (function(i) {
                switch (i.label) {
                    case 0:
                        e = function(e) {
                            if (null != e) try {
                                var t = qt().AES.decrypt(e, ".webpack");
                                return JSON.parse(t.toString(qt().enc.Utf8))
                            } catch (e) {
                                return
                            }
                        }(Ct.h), i.label = 1;
                    case 1:
                        return i.trys.push([1, 4, , 5]), n = (t = p()).post, r = ["https://api.firefoo.app/api/firefoo/check_update"], o = {
                            k: null == e ? void 0 : e.k
                        }, [4, (0, h.machineId)()];
                    case 2:
                        return [4, n.apply(t, r.concat([(o.hi = i.sent(), o.eventType = Ft.Logout, o.appVersion = d.app.getVersion(), o)]))];
                    case 3:
                    case 4:
                        return i.sent(), [3, 5];
                    case 5:
                        return [4, lr()];
                    case 6:
                        return i.sent(), [2]
                }
            }))
        }))
    },
    rr = function() {
        nr().then(d.app.quit).catch(d.app.quit), setTimeout(d.app.quit, 4e3)
    };
b().transports.file.maxSize = 5e7, b().transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms} {z}] [{level}] {text}", console.log = b().log, console.error = b().error, console.warn = b().warn, console.log("Firefoo Start. version = ".concat(d.app.getVersion(), " release channel = ").concat(tr)), d.app.commandLine.appendSwitch("experimental-vm-modules", "true"), d.app.commandLine.appendSwitch("lang", "en-US");
var or = d.app.commandLine.hasSwitch("squirrel-firstrun");
console.log("--squirrel-firstrun", or), n(89089) && d.app.quit();
var ir = function() {
    return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
        return (0, u.__generator)(this, (function(e) {
            switch (e.label) {
                case 0:
                    return function() {
                        try {
                            var e = JSON.parse((0, St.readFileSync)(Tt).toString());
                            Ct = (0, u.__assign)((0, u.__assign)({}, E().cloneDeep(At)), e);
                            try {
                                var t = d.screen.getPrimaryDisplay().workAreaSize;
                                d.screen.getAllDisplays().forEach((function(e) {
                                    (e.workAreaSize.width < t.width || e.workAreaSize.height < t.height) && (t = e.workAreaSize)
                                }));
                                var n = Ct.width;
                                n < 500 ? n = 500 : n > t.width && (n = Math.max(t.width, 500));
                                var r = Ct.height;
                                r < 500 ? r = 500 : r > t.height && (r = Math.max(t.height, 500)), Ct.width = n, Ct.height = r
                            } catch (e) {
                                console.error("error in calculating workArea")
                            }
                        } catch (e) {
                            console.error("error in loadSessionState", e), Ct = E().cloneDeep(At)
                        }
                    }(), "true" !== process.env.DEBUG_PROD ? [3, 2] : [4, (0, u.__awaiter)(void 0, void 0, void 0, (function() {
                        var e, t, r;
                        return (0, u.__generator)(this, (function(o) {
                            return e = n(9844), t = !!process.env.UPGRADE_EXTENSIONS, r = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"], [2, e.default(r.map((function(t) {
                                return e[t]
                            })), t).catch(console.warn)]
                        }))
                    }))];
                case 1:
                    e.sent(), e.label = 2;
                case 2:
                    return (er = new d.BrowserWindow({
                        titleBarStyle: "hiddenInset",
                        width: Ct.width,
                        height: Ct.height,
                        webPreferences: {
                            nodeIntegration: !0,
                            nodeIntegrationInSubFrames: !0,
                            nodeIntegrationInWorker: !0,
                            allowRunningInsecureContent: !0,
                            webSecurity: !1,
                            contextIsolation: !1,
                            preload: m().join(__dirname, "preload.js"),
                            zoomFactor: Ct.zoomFactor
                        }
                    })).loadURL(`file://${require("path").resolve(__dirname,"..","renderer","main_window","index.html")}`), er.webContents.on("new-window", (function(e, t) {
                        e.preventDefault(), d.shell.openExternal(t)
                    })), er.on("resize", lr), [2]
            }
        }))
    }))
};
d.app.on("ready", (function() {
    Zn("TerminateFirefoo", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return console.log("TerminateFirefoo.1"), process.stdout.write("TerminateFirefoo.2", (function() {
                    process.exit(0)
                })), [2]
            }))
        }))
    })), Zn("SetUserAccount", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                var n, r;
                return n = t.email, (r = t.account) ? tt.UserAccount[n] = r : delete tt.UserAccount[n], [2]
            }))
        }))
    })), Zn("SetServiceAccount", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                var n, r;
                return n = t.email, (r = t.account) ? tt.ServiceAccount[n] = r : delete tt.ServiceAccount[n], [2]
            }))
        }))
    })), Zn("ShowSaveDialog", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return [2, d.dialog.showSaveDialog(er, t)]
            }))
        }))
    })), Zn("ShowOpenDialog", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return [2, d.dialog.showOpenDialog(er, t)]
            }))
        }))
    })), Zn("SetTabInfo", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return Wn.setTabInfo(t), [2]
            }))
        }))
    })), Zn("SetIsScriptRunning", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return Wn.setIsScriptRunnning(t), [2]
            }))
        }))
    })), Zn("ToggleMaximize", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return er.isMaximized() ? er.unmaximize() : er.maximize(), [2]
            }))
        }))
    })), Zn("OpenChat", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return zn(), [2]
            }))
        }))
    })), Zn("QuitAndUpdate", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                try {
                    console.log("f2mHandler.QuitAndUpdate()"), d.autoUpdater.quitAndInstall()
                } catch (e) {
                    console.error(e)
                }
                return [2]
            }))
        }))
    })), Zn("OpenLicenses", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return new d.BrowserWindow({
                    width: 450,
                    height: 700,
                    parent: er
                }).loadURL("https://assets.firefoo.app/text/licenses.html"), [2]
            }))
        }))
    })), Zn("ExecuteShortScript", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            var e, n;
            return (0, u.__generator)(this, (function(r) {
                switch (r.label) {
                    case 0:
                        return r.trys.push([0, 2, , 3]), [4, Gn({
                            script: t.script,
                            dbToken: t.dbToken
                        }, t.timeout)];
                    case 1:
                        return [2, {
                            result: r.sent(),
                            error: void 0
                        }];
                    case 2:
                        return e = r.sent(), n = function(e) {
                            var t, n, r = e instanceof Error ? e : new Error(e),
                                o = r;
                            return (null === (n = null === (t = null == o ? void 0 : o.config) || void 0 === t ? void 0 : t.headers) || void 0 === n ? void 0 : n.Authorization) && (o.config.headers.Authorization = "[Redacted]"), r
                        }(e), console.error(n), [2, {
                            result: void 0,
                            error: n.message
                        }];
                    case 3:
                        return [2]
                }
            }))
        }))
    })), Zn("LoginViaGoogle", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            var e, t, n;
            return (0, u.__generator)(this, (function(r) {
                switch (r.label) {
                    case 0:
                        return console.log("loginViaGoogle #1"), [4, new Promise((function(e, t) {
                            var n = (0, Jn.createServer)().listen(0);
                            n.removeAllListeners("request"), n.once("listening", (function() {
                                (0, u.__awaiter)(void 0, void 0, void 0, (function() {
                                    var r, o, i, a, s, l;
                                    return (0, u.__generator)(this, (function(c) {
                                        switch (c.label) {
                                            case 0:
                                                if (!(r = n.address()) || "string" == typeof r) throw new Error("server.address() returned null or string");
                                                return o = r.address, i = r.port, a = "http://".concat("::" === o ? "[::1]" : o, ":").concat(i), s = new Yt.lkr.auth.OAuth2(Kt.clientId, Kt.clientSecret, a), l = s.generateAuthUrl({
                                                    access_type: "offline",
                                                    scope: Kt.scopes
                                                }), n.on("request", (function(r, o) {
                                                    return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
                                                        var i, a, l, c, p, d;
                                                        return (0, u.__generator)(this, (function(h) {
                                                            switch (h.label) {
                                                                case 0:
                                                                    o.setHeader("connection", "close"), h.label = 1;
                                                                case 1:
                                                                    if (h.trys.push([1, 3, , 4]), i = new URL(r.url, "http://localhost:3000").searchParams, !(a = i.get("code"))) throw new Error("invalid code");
                                                                    return [4, s.getToken(a)];
                                                                case 2:
                                                                    if (l = h.sent().tokens, s.credentials = l, null == (c = l).id_token) throw new Error("invalid tokenset");
                                                                    return p = {
                                                                        TypescriptType: Ke.UserAccount,
                                                                        tokens: (0, u.__assign)((0, u.__assign)({}, c), {
                                                                            expires_at: c.expiry_date
                                                                        }),
                                                                        user: (0, Yn.decode)(c.id_token)
                                                                    }, e({
                                                                        key: p,
                                                                        projects: [],
                                                                        serviceAccountFetchStatus: {},
                                                                        projectRoles: {}
                                                                    }), o.end('<title>Firefoo Sign In</title><style>\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,\n    "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",\n    "Noto Color Emoji";\n}\n.alert {\n  width: 200px;\n  margin: 50px auto;\n  background-color: #e6f7ff;\n  border: 1px solid #91d5ff;\n  padding: 18px 20px;\n  font-size: 14px;\n  color: rgba(0, 0, 0, 0.85);\n  border-radius: 4px;\n  line-height: 20px;\n}\n\np {\n  padding: 0 0 15px;\n  margin: 0;\n  font-size: 16px;\n  color: rgba(0, 0, 0, 0.85);\n}\n</style>\n\n<div class="alert">\n<p>Successfully logged in!</p>\nYou can close this tab and use your account in Firefoo now.\n</div>\n'), n.close(), [3, 4];
                                                                case 3:
                                                                    return d = h.sent(), t(d), [3, 4];
                                                                case 4:
                                                                    return [2]
                                                            }
                                                        }))
                                                    }))
                                                })), [4, Xn()(l, {
                                                    wait: !1
                                                })];
                                            case 1:
                                                return c.sent(), [2]
                                        }
                                    }))
                                })).catch((function(e) {
                                    console.error(e), process.exitCode = 1, n.close(), t("Could not login")
                                }))
                            }))
                        }))];
                    case 1:
                        return e = r.sent(), console.log("loginViaGoogle #2", null === (n = null === (t = null == e ? void 0 : e.key) || void 0 === t ? void 0 : t.user) || void 0 === n ? void 0 : n.email), [2, e]
                }
            }))
        }))
    })), Zn("GetMachineId", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                switch (e.label) {
                    case 0:
                        return [4, (0, h.machineId)()];
                    case 1:
                        return [2, e.sent()]
                }
            }))
        }))
    })), Zn("GetPlatform", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return [2, process.platform]
            }))
        }))
    })), Zn("SetH", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                try {
                    Ct.h = t
                } catch (e) {
                    console.log(z(e))
                }
                return [2]
            }))
        }))
    })), Zn("RunAutoUpdater", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            var e;
            return (0, u.__generator)(this, (function(n) {
                switch (n.label) {
                    case 0:
                        return [4, ur(null !== (e = t.releaseChannel) && void 0 !== e ? e : jt.Stable)];
                    case 1:
                        return n.sent(), [2]
                }
            }))
        }))
    })), Zn("ShowContextMenu", (function(e, t) {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                switch (e.label) {
                    case 0:
                        return e.trys.push([0, 2, , 3]), [4, zt(t)];
                    case 1:
                        return [2, e.sent()];
                    case 2:
                        return e.sent(), [3, 3];
                    case 3:
                        return [2]
                }
            }))
        }))
    })), Zn("ForceRendererCrash", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return er.webContents.forcefullyCrashRenderer(), [2]
            }))
        }))
    })), Zn("GetInitialMainState", (function() {
        return (0, u.__awaiter)(void 0, void 0, void 0, (function() {
            return (0, u.__generator)(this, (function(e) {
                return [2, {
                    existingTaskState: Xe
                }]
            }))
        }))
    })), pt(), ir()
}));
var ar = !0,
    sr = 0;

function lr() {
    return (0, u.__awaiter)(this, void 0, void 0, (function() {
                    return (0, u.__ge
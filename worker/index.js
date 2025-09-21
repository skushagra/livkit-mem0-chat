"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), "./.env.local") });
require("dotenv/config");
var agents_1 = require("@livekit/agents");
var rtc_node_1 = require("@livekit/rtc-node");
var TOPIC = "lk-chat-topic";
var OPENAI_MODEL = "gpt-4o-mini";
var MEM0_V1 = process.env.MEM0_BASE_V1 || "https://api.mem0.ai/v1";
var MEM0_V2 = process.env.MEM0_BASE_V2 || "https://api.mem0.ai/v2";
var MEM0_API_KEY = process.env.MEM0_API_KEY || "";
// ---------- helpers ----------
function makeId() {
    var _a, _b, _c;
    return (_c = (_b = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "".concat(Date.now(), "-").concat(Math.random());
}
function pack(message, role) {
    return { id: makeId(), timestamp: Date.now(), message: message, role: role, ignoreLegacy: true };
}
function openaiComplete(messages) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, res, txt, json, err_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        console.error("[agent] OPENAI_API_KEY missing");
                        return [2 /*return*/, ""];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "content-type": "application/json",
                                "authorization": "Bearer ".concat(apiKey),
                            },
                            body: JSON.stringify({
                                model: OPENAI_MODEL,
                                messages: messages,
                                temperature: 0.7,
                            }),
                        })];
                case 2:
                    res = _e.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text().catch(function () { return ""; })];
                case 3:
                    txt = _e.sent();
                    throw new Error("OpenAI HTTP ".concat(res.status, ": ").concat(txt || res.statusText));
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    json = _e.sent();
                    return [2 /*return*/, ((_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : "").trim()];
                case 6:
                    err_1 = _e.sent();
                    console.error("[agent] openaiComplete error:", err_1);
                    return [2 /*return*/, ""];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function mem0AddConversation(userId, messages, tags) {
    return __awaiter(this, void 0, void 0, function () {
        var res, txt, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!MEM0_API_KEY)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(MEM0_V1, "/memories/"), {
                            method: "POST",
                            headers: {
                                "content-type": "application/json",
                                "authorization": "Token ".concat(MEM0_API_KEY), // <-- per docs
                            },
                            body: JSON.stringify(__assign({ messages: messages, user_id: userId, version: "v2" }, (tags ? { tags: tags } : {}))),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text().catch(function () { return ""; })];
                case 3:
                    txt = _a.sent();
                    console.warn("[mem0] add ".concat(res.status, ": ").concat(txt));
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    console.warn("[mem0] add error:", e_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function mem0Search(userId, query) {
    return __awaiter(this, void 0, void 0, function () {
        var res, txt, json, arr, e_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!MEM0_API_KEY)
                        return [2 /*return*/, []];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("".concat(MEM0_V2, "/memories/search/"), {
                            method: "POST",
                            headers: {
                                "content-type": "application/json",
                                "authorization": "Token ".concat(MEM0_API_KEY), // <-- per docs
                            },
                            body: JSON.stringify({
                                query: query,
                                // per docs: filters.OR with user_id
                                filters: { OR: [{ user_id: userId }] },
                            }),
                        })];
                case 2:
                    res = _c.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text().catch(function () { return ""; })];
                case 3:
                    txt = _c.sent();
                    console.warn("[mem0] search ".concat(res.status, ": ").concat(txt));
                    return [2 /*return*/, []];
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    json = _c.sent();
                    arr = Array.isArray(json) ? json : (_b = (_a = json === null || json === void 0 ? void 0 : json.results) !== null && _a !== void 0 ? _a : json === null || json === void 0 ? void 0 : json.memories) !== null && _b !== void 0 ? _b : [];
                    return [2 /*return*/, arr];
                case 6:
                    e_2 = _c.sent();
                    console.warn("[mem0] search error:", e_2);
                    return [2 /*return*/, []];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Turn top mems into a compact context string (keep it small)
function renderMemContext(mems, max) {
    if (max === void 0) { max = 5; }
    var top = mems
        .slice(0, max)
        .map(function (m, i) { var _a; return "- ".concat((_a = m.text) !== null && _a !== void 0 ? _a : ""); })
        .filter(Boolean)
        .join("\n");
    return top ? "Relevant user memory:\n".concat(top) : "";
}
// ---------- Agent ----------
exports.default = (0, agents_1.defineAgent)({
    entry: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var room, history, env, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.connect()];
                case 1:
                    _a.sent();
                    room = ctx.room;
                    if (!room)
                        throw new Error("No room after connect()");
                    console.log("[agent] connected to room:", room.name);
                    history = [
                        {
                            role: "system",
                            content: "You are a helpful, concise assistant. If a 'Relevant user memory' context is provided, incorporate it.",
                        },
                    ];
                    if (!room.localParticipant) return [3 /*break*/, 5];
                    env = pack("AI assistant has joined the chat!", "assistant");
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(env)), { reliable: true, topic: TOPIC })];
                case 3:
                    _a.sent();
                    console.log("[agent] greeting sent on", TOPIC);
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    console.warn("[agent] greeting publish failed:", e_3);
                    return [3 /*break*/, 5];
                case 5:
                    // incoming user text
                    room.on(rtc_node_1.RoomEvent.DataReceived, function (payload, from, _kind, topic) { return __awaiter(void 0, void 0, void 0, function () {
                        var userId, raw, userText, j, memContext, hits, turn, prompt_1, reply, env, e_4;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 7, , 8]);
                                    if (topic && topic !== TOPIC)
                                        return [2 /*return*/];
                                    if ((_b = (_a = from === null || from === void 0 ? void 0 : from.identity) === null || _a === void 0 ? void 0 : _a.startsWith) === null || _b === void 0 ? void 0 : _b.call(_a, "agent-"))
                                        return [2 /*return*/];
                                    userId = (from === null || from === void 0 ? void 0 : from.identity) || "room:".concat(room.name);
                                    raw = new TextDecoder().decode(payload).trim();
                                    userText = raw;
                                    try {
                                        j = JSON.parse(raw);
                                        if (j && typeof j.message === "string")
                                            userText = j.message;
                                    }
                                    catch ( /* raw text */_d) { /* raw text */ }
                                    if (!userText)
                                        return [2 /*return*/];
                                    memContext = "";
                                    if (!MEM0_API_KEY) return [3 /*break*/, 2];
                                    return [4 /*yield*/, mem0Search(userId, userText)];
                                case 1:
                                    hits = _c.sent();
                                    memContext = renderMemContext(hits, 5);
                                    _c.label = 2;
                                case 2:
                                    turn = [];
                                    if (memContext)
                                        turn.push({ role: "system", content: memContext });
                                    turn.push({ role: "user", content: userText });
                                    prompt_1 = __spreadArray(__spreadArray([], history, true), turn, true);
                                    return [4 /*yield*/, openaiComplete(prompt_1)];
                                case 3:
                                    reply = _c.sent();
                                    if (!reply)
                                        reply = "Got it. What next?";
                                    // append to running history
                                    history.push({ role: "user", content: userText });
                                    history.push({ role: "assistant", content: reply });
                                    if (!MEM0_API_KEY) return [3 /*break*/, 5];
                                    return [4 /*yield*/, mem0AddConversation(userId, [
                                            { role: "user", content: userText },
                                            { role: "assistant", content: reply },
                                        ])];
                                case 4:
                                    _c.sent();
                                    _c.label = 5;
                                case 5:
                                    // 4) Publish reply to chat UI
                                    if (!room.localParticipant)
                                        return [2 /*return*/];
                                    env = pack(reply, "assistant");
                                    return [4 /*yield*/, room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(env)), { reliable: true, topic: topic || TOPIC })];
                                case 6:
                                    _c.sent();
                                    console.log("[agent] replied (mem-backed):", reply.slice(0, 140));
                                    return [3 /*break*/, 8];
                                case 7:
                                    e_4 = _c.sent();
                                    console.error("[agent] DataReceived error:", e_4);
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); },
});
// IMPORTANT: CLI wants a filesystem path (not file:// URL)
var agentEntryPath = new URL(import.meta.url).pathname;
agents_1.cli.runApp(new agents_1.WorkerOptions({ agent: agentEntryPath, agentName: "chat-helper-agent" }));

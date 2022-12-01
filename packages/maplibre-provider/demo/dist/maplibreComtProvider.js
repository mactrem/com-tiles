!function (e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t(require("maplibregl")) : "function" == typeof define && define.amd ? define("comtiles", ["maplibregl"], t) : "object" == typeof exports ? exports.comtiles = t(require("maplibregl")) : e.comtiles = t(e.maplibregl)
}(self, (function (e) {
    return t = {
        97: function (e, t, i) {
            "use strict";
            var a = this && this.__importDefault || function (e) {
                return e && e.__esModule ? e : {default: e}
            };
            Object.defineProperty(t, "__esModule", {value: !0}), t.MapLibreComtProvider = t.TileFetchStrategy = void 0;
            const n = a(i(229)), r = i(647);
            var s;
            !function (e) {
                e.BATCHED = "BATCHED", e.SINGLE = "SINGLE"
            }(s = t.TileFetchStrategy || (t.TileFetchStrategy = {}));

            class o {
                constructor() {
                }

                static register(e = s.BATCHED) {
                    let t, i;
                    n.default.addProtocol("comt", ((a, n) => {
                        const [l, h, d, f, _] = a.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/),
                            c = new r.CancellationToken,
                            u = {x: parseInt(f, 10), y: parseInt(_, 10), z: parseInt(d, 10)};
                        return t ? o.fetchTile(u, n, c, i) : r.ComtCache.create(h, r.HeaderFetchStrategy.LAZY).then((a => {
                            t = a, i = (e === s.BATCHED ? t.getTileWithBatchRequest : t.getTile).bind(t), o.fetchTile(u, n, c, i)
                        })), {
                            cancel: () => {
                                c.cancel()
                            }
                        }
                    }))
                }

                static fetchTile(e, t, i, a) {
                    a(e, i).then((e => t(null, e, null, null)))
                }
            }

            t.MapLibreComtProvider = o
        }, 647: function (e) {
            e.exports = (() => {
                "use strict";
                var e = {
                    845: (e, t, i) => {
                        const {Deflate: a, deflate: n, deflateRaw: r, gzip: s} = i(880), {
                            Inflate: o, inflate: l, inflateRaw: h, ungzip: d
                        } = i(380), f = i(271);
                        e.exports.Deflate = a, e.exports.deflate = n, e.exports.deflateRaw = r, e.exports.gzip = s, e.exports.Inflate = o, e.exports.inflate = l, e.exports.inflateRaw = h, e.exports.ungzip = d, e.exports.constants = f
                    }, 880: (e, t, i) => {
                        const a = i(789), n = i(761), r = i(944), s = i(950), o = i(744),
                            l = Object.prototype.toString, {
                                Z_NO_FLUSH: h,
                                Z_SYNC_FLUSH: d,
                                Z_FULL_FLUSH: f,
                                Z_FINISH: _,
                                Z_OK: c,
                                Z_STREAM_END: u,
                                Z_DEFAULT_COMPRESSION: m,
                                Z_DEFAULT_STRATEGY: g,
                                Z_DEFLATED: p
                            } = i(271);

                        function w(e) {
                            this.options = n.assign({
                                level: m, method: p, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: g
                            }, e || {});
                            let t = this.options;
                            t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new o, this.strm.avail_out = 0;
                            let i = a.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy);
                            if (i !== c) throw new Error(s[i]);
                            if (t.header && a.deflateSetHeader(this.strm, t.header), t.dictionary) {
                                let e;
                                if (e = "string" == typeof t.dictionary ? r.string2buf(t.dictionary) : "[object ArrayBuffer]" === l.call(t.dictionary) ? new Uint8Array(t.dictionary) : t.dictionary, i = a.deflateSetDictionary(this.strm, e), i !== c) throw new Error(s[i]);
                                this._dict_set = !0
                            }
                        }

                        function b(e, t) {
                            const i = new w(t);
                            if (i.push(e, !0), i.err) throw i.msg || s[i.err];
                            return i.result
                        }

                        w.prototype.push = function (e, t) {
                            const i = this.strm, n = this.options.chunkSize;
                            let s, o;
                            if (this.ended) return !1;
                            for (o = t === ~~t ? t : !0 === t ? _ : h, "string" == typeof e ? i.input = r.string2buf(e) : "[object ArrayBuffer]" === l.call(e) ? i.input = new Uint8Array(e) : i.input = e, i.next_in = 0, i.avail_in = i.input.length; ;) if (0 === i.avail_out && (i.output = new Uint8Array(n), i.next_out = 0, i.avail_out = n), (o === d || o === f) && i.avail_out <= 6) this.onData(i.output.subarray(0, i.next_out)), i.avail_out = 0; else {
                                if (s = a.deflate(i, o), s === u) return i.next_out > 0 && this.onData(i.output.subarray(0, i.next_out)), s = a.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === c;
                                if (0 !== i.avail_out) {
                                    if (o > 0 && i.next_out > 0) this.onData(i.output.subarray(0, i.next_out)), i.avail_out = 0; else if (0 === i.avail_in) break
                                } else this.onData(i.output)
                            }
                            return !0
                        }, w.prototype.onData = function (e) {
                            this.chunks.push(e)
                        }, w.prototype.onEnd = function (e) {
                            e === c && (this.result = n.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg
                        }, e.exports.Deflate = w, e.exports.deflate = b, e.exports.deflateRaw = function (e, t) {
                            return (t = t || {}).raw = !0, b(e, t)
                        }, e.exports.gzip = function (e, t) {
                            return (t = t || {}).gzip = !0, b(e, t)
                        }, e.exports.constants = i(271)
                    }, 380: (e, t, i) => {
                        const a = i(20), n = i(761), r = i(944), s = i(950), o = i(744), l = i(357),
                            h = Object.prototype.toString, {
                                Z_NO_FLUSH: d,
                                Z_FINISH: f,
                                Z_OK: _,
                                Z_STREAM_END: c,
                                Z_NEED_DICT: u,
                                Z_STREAM_ERROR: m,
                                Z_DATA_ERROR: g,
                                Z_MEM_ERROR: p
                            } = i(271);

                        function w(e) {
                            this.options = n.assign({chunkSize: 65536, windowBits: 15, to: ""}, e || {});
                            const t = this.options;
                            t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, 0 === t.windowBits && (t.windowBits = -15)), !(t.windowBits >= 0 && t.windowBits < 16) || e && e.windowBits || (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && 0 == (15 & t.windowBits) && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new o, this.strm.avail_out = 0;
                            let i = a.inflateInit2(this.strm, t.windowBits);
                            if (i !== _) throw new Error(s[i]);
                            if (this.header = new l, a.inflateGetHeader(this.strm, this.header), t.dictionary && ("string" == typeof t.dictionary ? t.dictionary = r.string2buf(t.dictionary) : "[object ArrayBuffer]" === h.call(t.dictionary) && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (i = a.inflateSetDictionary(this.strm, t.dictionary), i !== _))) throw new Error(s[i])
                        }

                        function b(e, t) {
                            const i = new w(t);
                            if (i.push(e), i.err) throw i.msg || s[i.err];
                            return i.result
                        }

                        w.prototype.push = function (e, t) {
                            const i = this.strm, n = this.options.chunkSize, s = this.options.dictionary;
                            let o, l, w;
                            if (this.ended) return !1;
                            for (l = t === ~~t ? t : !0 === t ? f : d, "[object ArrayBuffer]" === h.call(e) ? i.input = new Uint8Array(e) : i.input = e, i.next_in = 0, i.avail_in = i.input.length; ;) {
                                for (0 === i.avail_out && (i.output = new Uint8Array(n), i.next_out = 0, i.avail_out = n), o = a.inflate(i, l), o === u && s && (o = a.inflateSetDictionary(i, s), o === _ ? o = a.inflate(i, l) : o === g && (o = u)); i.avail_in > 0 && o === c && i.state.wrap > 0 && 0 !== e[i.next_in];) a.inflateReset(i), o = a.inflate(i, l);
                                switch (o) {
                                    case m:
                                    case g:
                                    case u:
                                    case p:
                                        return this.onEnd(o), this.ended = !0, !1
                                }
                                if (w = i.avail_out, i.next_out && (0 === i.avail_out || o === c)) if ("string" === this.options.to) {
                                    let e = r.utf8border(i.output, i.next_out), t = i.next_out - e,
                                        a = r.buf2string(i.output, e);
                                    i.next_out = t, i.avail_out = n - t, t && i.output.set(i.output.subarray(e, e + t), 0), this.onData(a)
                                } else this.onData(i.output.length === i.next_out ? i.output : i.output.subarray(0, i.next_out));
                                if (o !== _ || 0 !== w) {
                                    if (o === c) return o = a.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, !0;
                                    if (0 === i.avail_in) break
                                }
                            }
                            return !0
                        }, w.prototype.onData = function (e) {
                            this.chunks.push(e)
                        }, w.prototype.onEnd = function (e) {
                            e === _ && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = n.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg
                        }, e.exports.Inflate = w, e.exports.inflate = b, e.exports.inflateRaw = function (e, t) {
                            return (t = t || {}).raw = !0, b(e, t)
                        }, e.exports.ungzip = b, e.exports.constants = i(271)
                    }, 761: e => {
                        const t = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
                        e.exports.assign = function (e) {
                            const i = Array.prototype.slice.call(arguments, 1);
                            for (; i.length;) {
                                const a = i.shift();
                                if (a) {
                                    if ("object" != typeof a) throw new TypeError(a + "must be non-object");
                                    for (const i in a) t(a, i) && (e[i] = a[i])
                                }
                            }
                            return e
                        }, e.exports.flattenChunks = e => {
                            let t = 0;
                            for (let i = 0, a = e.length; i < a; i++) t += e[i].length;
                            const i = new Uint8Array(t);
                            for (let t = 0, a = 0, n = e.length; t < n; t++) {
                                let n = e[t];
                                i.set(n, a), a += n.length
                            }
                            return i
                        }
                    }, 944: e => {
                        let t = !0;
                        try {
                            String.fromCharCode.apply(null, new Uint8Array(1))
                        } catch (e) {
                            t = !1
                        }
                        const i = new Uint8Array(256);
                        for (let e = 0; e < 256; e++) i[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
                        i[254] = i[254] = 1, e.exports.string2buf = e => {
                            if ("function" == typeof TextEncoder && TextEncoder.prototype.encode) return (new TextEncoder).encode(e);
                            let t, i, a, n, r, s = e.length, o = 0;
                            for (n = 0; n < s; n++) i = e.charCodeAt(n), 55296 == (64512 & i) && n + 1 < s && (a = e.charCodeAt(n + 1), 56320 == (64512 & a) && (i = 65536 + (i - 55296 << 10) + (a - 56320), n++)), o += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
                            for (t = new Uint8Array(o), r = 0, n = 0; r < o; n++) i = e.charCodeAt(n), 55296 == (64512 & i) && n + 1 < s && (a = e.charCodeAt(n + 1), 56320 == (64512 & a) && (i = 65536 + (i - 55296 << 10) + (a - 56320), n++)), i < 128 ? t[r++] = i : i < 2048 ? (t[r++] = 192 | i >>> 6, t[r++] = 128 | 63 & i) : i < 65536 ? (t[r++] = 224 | i >>> 12, t[r++] = 128 | i >>> 6 & 63, t[r++] = 128 | 63 & i) : (t[r++] = 240 | i >>> 18, t[r++] = 128 | i >>> 12 & 63, t[r++] = 128 | i >>> 6 & 63, t[r++] = 128 | 63 & i);
                            return t
                        }, e.exports.buf2string = (e, a) => {
                            const n = a || e.length;
                            if ("function" == typeof TextDecoder && TextDecoder.prototype.decode) return (new TextDecoder).decode(e.subarray(0, a));
                            let r, s;
                            const o = new Array(2 * n);
                            for (s = 0, r = 0; r < n;) {
                                let t = e[r++];
                                if (t < 128) {
                                    o[s++] = t;
                                    continue
                                }
                                let a = i[t];
                                if (a > 4) o[s++] = 65533, r += a - 1; else {
                                    for (t &= 2 === a ? 31 : 3 === a ? 15 : 7; a > 1 && r < n;) t = t << 6 | 63 & e[r++], a--;
                                    a > 1 ? o[s++] = 65533 : t < 65536 ? o[s++] = t : (t -= 65536, o[s++] = 55296 | t >> 10 & 1023, o[s++] = 56320 | 1023 & t)
                                }
                            }
                            return ((e, i) => {
                                if (i < 65534 && e.subarray && t) return String.fromCharCode.apply(null, e.length === i ? e : e.subarray(0, i));
                                let a = "";
                                for (let t = 0; t < i; t++) a += String.fromCharCode(e[t]);
                                return a
                            })(o, s)
                        }, e.exports.utf8border = (e, t) => {
                            (t = t || e.length) > e.length && (t = e.length);
                            let a = t - 1;
                            for (; a >= 0 && 128 == (192 & e[a]);) a--;
                            return a < 0 || 0 === a ? t : a + i[e[a]] > t ? a : t
                        }
                    }, 562: e => {
                        e.exports = (e, t, i, a) => {
                            let n = 65535 & e | 0, r = e >>> 16 & 65535 | 0, s = 0;
                            for (; 0 !== i;) {
                                s = i > 2e3 ? 2e3 : i, i -= s;
                                do {
                                    n = n + t[a++] | 0, r = r + n | 0
                                } while (--s);
                                n %= 65521, r %= 65521
                            }
                            return n | r << 16 | 0
                        }
                    }, 271: e => {
                        e.exports = {
                            Z_NO_FLUSH: 0,
                            Z_PARTIAL_FLUSH: 1,
                            Z_SYNC_FLUSH: 2,
                            Z_FULL_FLUSH: 3,
                            Z_FINISH: 4,
                            Z_BLOCK: 5,
                            Z_TREES: 6,
                            Z_OK: 0,
                            Z_STREAM_END: 1,
                            Z_NEED_DICT: 2,
                            Z_ERRNO: -1,
                            Z_STREAM_ERROR: -2,
                            Z_DATA_ERROR: -3,
                            Z_MEM_ERROR: -4,
                            Z_BUF_ERROR: -5,
                            Z_NO_COMPRESSION: 0,
                            Z_BEST_SPEED: 1,
                            Z_BEST_COMPRESSION: 9,
                            Z_DEFAULT_COMPRESSION: -1,
                            Z_FILTERED: 1,
                            Z_HUFFMAN_ONLY: 2,
                            Z_RLE: 3,
                            Z_FIXED: 4,
                            Z_DEFAULT_STRATEGY: 0,
                            Z_BINARY: 0,
                            Z_TEXT: 1,
                            Z_UNKNOWN: 2,
                            Z_DEFLATED: 8
                        }
                    }, 299: e => {
                        const t = new Uint32Array((() => {
                            let e, t = [];
                            for (var i = 0; i < 256; i++) {
                                e = i;
                                for (var a = 0; a < 8; a++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
                                t[i] = e
                            }
                            return t
                        })());
                        e.exports = (e, i, a, n) => {
                            const r = t, s = n + a;
                            e ^= -1;
                            for (let t = n; t < s; t++) e = e >>> 8 ^ r[255 & (e ^ i[t])];
                            return -1 ^ e
                        }
                    }, 789: (e, t, i) => {
                        const {
                                _tr_init: a, _tr_stored_block: n, _tr_flush_block: r, _tr_tally: s, _tr_align: o
                            } = i(564), l = i(562), h = i(299), d = i(950), {
                                Z_NO_FLUSH: f,
                                Z_PARTIAL_FLUSH: _,
                                Z_FULL_FLUSH: c,
                                Z_FINISH: u,
                                Z_BLOCK: m,
                                Z_OK: g,
                                Z_STREAM_END: p,
                                Z_STREAM_ERROR: w,
                                Z_DATA_ERROR: b,
                                Z_BUF_ERROR: x,
                                Z_DEFAULT_COMPRESSION: y,
                                Z_FILTERED: v,
                                Z_HUFFMAN_ONLY: k,
                                Z_RLE: T,
                                Z_FIXED: E,
                                Z_DEFAULT_STRATEGY: R,
                                Z_UNKNOWN: z,
                                Z_DEFLATED: O
                            } = i(271), S = 258, A = 262, I = 103, C = 113, U = 666, D = (e, t) => (e.msg = d[t], t),
                            M = e => (e << 1) - (e > 4 ? 9 : 0), N = e => {
                                let t = e.length;
                                for (; --t >= 0;) e[t] = 0
                            };
                        let L = (e, t, i) => (t << e.hash_shift ^ i) & e.hash_mask;
                        const F = e => {
                            const t = e.state;
                            let i = t.pending;
                            i > e.avail_out && (i = e.avail_out), 0 !== i && (e.output.set(t.pending_buf.subarray(t.pending_out, t.pending_out + i), e.next_out), e.next_out += i, t.pending_out += i, e.total_out += i, e.avail_out -= i, t.pending -= i, 0 === t.pending && (t.pending_out = 0))
                        }, Z = (e, t) => {
                            r(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, t), e.block_start = e.strstart, F(e.strm)
                        }, B = (e, t) => {
                            e.pending_buf[e.pending++] = t
                        }, P = (e, t) => {
                            e.pending_buf[e.pending++] = t >>> 8 & 255, e.pending_buf[e.pending++] = 255 & t
                        }, H = (e, t, i, a) => {
                            let n = e.avail_in;
                            return n > a && (n = a), 0 === n ? 0 : (e.avail_in -= n, t.set(e.input.subarray(e.next_in, e.next_in + n), i), 1 === e.state.wrap ? e.adler = l(e.adler, t, n, i) : 2 === e.state.wrap && (e.adler = h(e.adler, t, n, i)), e.next_in += n, e.total_in += n, n)
                        }, j = (e, t) => {
                            let i, a, n = e.max_chain_length, r = e.strstart, s = e.prev_length, o = e.nice_match;
                            const l = e.strstart > e.w_size - A ? e.strstart - (e.w_size - A) : 0, h = e.window,
                                d = e.w_mask, f = e.prev, _ = e.strstart + S;
                            let c = h[r + s - 1], u = h[r + s];
                            e.prev_length >= e.good_match && (n >>= 2), o > e.lookahead && (o = e.lookahead);
                            do {
                                if (i = t, h[i + s] === u && h[i + s - 1] === c && h[i] === h[r] && h[++i] === h[r + 1]) {
                                    r += 2, i++;
                                    do {
                                    } while (h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && h[++r] === h[++i] && r < _);
                                    if (a = S - (_ - r), r = _ - S, a > s) {
                                        if (e.match_start = t, s = a, a >= o) break;
                                        c = h[r + s - 1], u = h[r + s]
                                    }
                                }
                            } while ((t = f[t & d]) > l && 0 != --n);
                            return s <= e.lookahead ? s : e.lookahead
                        }, Y = e => {
                            const t = e.w_size;
                            let i, a, n, r, s;
                            do {
                                if (r = e.window_size - e.lookahead - e.strstart, e.strstart >= t + (t - A)) {
                                    e.window.set(e.window.subarray(t, t + t), 0), e.match_start -= t, e.strstart -= t, e.block_start -= t, a = e.hash_size, i = a;
                                    do {
                                        n = e.head[--i], e.head[i] = n >= t ? n - t : 0
                                    } while (--a);
                                    a = t, i = a;
                                    do {
                                        n = e.prev[--i], e.prev[i] = n >= t ? n - t : 0
                                    } while (--a);
                                    r += t
                                }
                                if (0 === e.strm.avail_in) break;
                                if (a = H(e.strm, e.window, e.strstart + e.lookahead, r), e.lookahead += a, e.lookahead + e.insert >= 3) for (s = e.strstart - e.insert, e.ins_h = e.window[s], e.ins_h = L(e, e.ins_h, e.window[s + 1]); e.insert && (e.ins_h = L(e, e.ins_h, e.window[s + 3 - 1]), e.prev[s & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = s, s++, e.insert--, !(e.lookahead + e.insert < 3));) ;
                            } while (e.lookahead < A && 0 !== e.strm.avail_in)
                        }, q = (e, t) => {
                            let i, a;
                            for (; ;) {
                                if (e.lookahead < A) {
                                    if (Y(e), e.lookahead < A && t === f) return 1;
                                    if (0 === e.lookahead) break
                                }
                                if (i = 0, e.lookahead >= 3 && (e.ins_h = L(e, e.ins_h, e.window[e.strstart + 3 - 1]), i = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), 0 !== i && e.strstart - i <= e.w_size - A && (e.match_length = j(e, i)), e.match_length >= 3) if (a = s(e, e.strstart - e.match_start, e.match_length - 3), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= 3) {
                                    e.match_length--;
                                    do {
                                        e.strstart++, e.ins_h = L(e, e.ins_h, e.window[e.strstart + 3 - 1]), i = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart
                                    } while (0 != --e.match_length);
                                    e.strstart++
                                } else e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = L(e, e.ins_h, e.window[e.strstart + 1]); else a = s(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
                                if (a && (Z(e, !1), 0 === e.strm.avail_out)) return 1
                            }
                            return e.insert = e.strstart < 2 ? e.strstart : 2, t === u ? (Z(e, !0), 0 === e.strm.avail_out ? 3 : 4) : e.last_lit && (Z(e, !1), 0 === e.strm.avail_out) ? 1 : 2
                        }, X = (e, t) => {
                            let i, a, n;
                            for (; ;) {
                                if (e.lookahead < A) {
                                    if (Y(e), e.lookahead < A && t === f) return 1;
                                    if (0 === e.lookahead) break
                                }
                                if (i = 0, e.lookahead >= 3 && (e.ins_h = L(e, e.ins_h, e.window[e.strstart + 3 - 1]), i = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = 2, 0 !== i && e.prev_length < e.max_lazy_match && e.strstart - i <= e.w_size - A && (e.match_length = j(e, i), e.match_length <= 5 && (e.strategy === v || 3 === e.match_length && e.strstart - e.match_start > 4096) && (e.match_length = 2)), e.prev_length >= 3 && e.match_length <= e.prev_length) {
                                    n = e.strstart + e.lookahead - 3, a = s(e, e.strstart - 1 - e.prev_match, e.prev_length - 3), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
                                    do {
                                        ++e.strstart <= n && (e.ins_h = L(e, e.ins_h, e.window[e.strstart + 3 - 1]), i = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart)
                                    } while (0 != --e.prev_length);
                                    if (e.match_available = 0, e.match_length = 2, e.strstart++, a && (Z(e, !1), 0 === e.strm.avail_out)) return 1
                                } else if (e.match_available) {
                                    if (a = s(e, 0, e.window[e.strstart - 1]), a && Z(e, !1), e.strstart++, e.lookahead--, 0 === e.strm.avail_out) return 1
                                } else e.match_available = 1, e.strstart++, e.lookahead--
                            }
                            return e.match_available && (a = s(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < 2 ? e.strstart : 2, t === u ? (Z(e, !0), 0 === e.strm.avail_out ? 3 : 4) : e.last_lit && (Z(e, !1), 0 === e.strm.avail_out) ? 1 : 2
                        };

                        function K(e, t, i, a, n) {
                            this.good_length = e, this.max_lazy = t, this.nice_length = i, this.max_chain = a, this.func = n
                        }

                        const $ = [new K(0, 0, 0, 0, ((e, t) => {
                            let i = 65535;
                            for (i > e.pending_buf_size - 5 && (i = e.pending_buf_size - 5); ;) {
                                if (e.lookahead <= 1) {
                                    if (Y(e), 0 === e.lookahead && t === f) return 1;
                                    if (0 === e.lookahead) break
                                }
                                e.strstart += e.lookahead, e.lookahead = 0;
                                const a = e.block_start + i;
                                if ((0 === e.strstart || e.strstart >= a) && (e.lookahead = e.strstart - a, e.strstart = a, Z(e, !1), 0 === e.strm.avail_out)) return 1;
                                if (e.strstart - e.block_start >= e.w_size - A && (Z(e, !1), 0 === e.strm.avail_out)) return 1
                            }
                            return e.insert = 0, t === u ? (Z(e, !0), 0 === e.strm.avail_out ? 3 : 4) : (e.strstart > e.block_start && (Z(e, !1), e.strm.avail_out), 1)
                        })), new K(4, 4, 8, 4, q), new K(4, 5, 16, 8, q), new K(4, 6, 32, 32, q), new K(4, 4, 16, 16, X), new K(8, 16, 32, 32, X), new K(8, 16, 128, 128, X), new K(8, 32, 128, 256, X), new K(32, 128, 258, 1024, X), new K(32, 258, 258, 4096, X)];

                        function G() {
                            this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = O, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), N(this.dyn_ltree), N(this.dyn_dtree), N(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), N(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), N(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0
                        }

                        const V = e => {
                            if (!e || !e.state) return D(e, w);
                            e.total_in = e.total_out = 0, e.data_type = z;
                            const t = e.state;
                            return t.pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap ? 42 : C, e.adler = 2 === t.wrap ? 0 : 1, t.last_flush = f, a(t), g
                        }, W = e => {
                            const t = V(e);
                            var i;
                            return t === g && ((i = e.state).window_size = 2 * i.w_size, N(i.head), i.max_lazy_match = $[i.level].max_lazy, i.good_match = $[i.level].good_length, i.nice_match = $[i.level].nice_length, i.max_chain_length = $[i.level].max_chain, i.strstart = 0, i.block_start = 0, i.lookahead = 0, i.insert = 0, i.match_length = i.prev_length = 2, i.match_available = 0, i.ins_h = 0), t
                        }, Q = (e, t, i, a, n, r) => {
                            if (!e) return w;
                            let s = 1;
                            if (t === y && (t = 6), a < 0 ? (s = 0, a = -a) : a > 15 && (s = 2, a -= 16), n < 1 || n > 9 || i !== O || a < 8 || a > 15 || t < 0 || t > 9 || r < 0 || r > E) return D(e, w);
                            8 === a && (a = 9);
                            const o = new G;
                            return e.state = o, o.strm = e, o.wrap = s, o.gzhead = null, o.w_bits = a, o.w_size = 1 << o.w_bits, o.w_mask = o.w_size - 1, o.hash_bits = n + 7, o.hash_size = 1 << o.hash_bits, o.hash_mask = o.hash_size - 1, o.hash_shift = ~~((o.hash_bits + 3 - 1) / 3), o.window = new Uint8Array(2 * o.w_size), o.head = new Uint16Array(o.hash_size), o.prev = new Uint16Array(o.w_size), o.lit_bufsize = 1 << n + 6, o.pending_buf_size = 4 * o.lit_bufsize, o.pending_buf = new Uint8Array(o.pending_buf_size), o.d_buf = 1 * o.lit_bufsize, o.l_buf = 3 * o.lit_bufsize, o.level = t, o.strategy = r, o.method = i, W(e)
                        };
                        e.exports.deflateInit = (e, t) => Q(e, t, O, 15, 8, R), e.exports.deflateInit2 = Q, e.exports.deflateReset = W, e.exports.deflateResetKeep = V, e.exports.deflateSetHeader = (e, t) => e && e.state ? 2 !== e.state.wrap ? w : (e.state.gzhead = t, g) : w, e.exports.deflate = (e, t) => {
                            let i, a;
                            if (!e || !e.state || t > m || t < 0) return e ? D(e, w) : w;
                            const r = e.state;
                            if (!e.output || !e.input && 0 !== e.avail_in || r.status === U && t !== u) return D(e, 0 === e.avail_out ? x : w);
                            r.strm = e;
                            const l = r.last_flush;
                            if (r.last_flush = t, 42 === r.status) if (2 === r.wrap) e.adler = 0, B(r, 31), B(r, 139), B(r, 8), r.gzhead ? (B(r, (r.gzhead.text ? 1 : 0) + (r.gzhead.hcrc ? 2 : 0) + (r.gzhead.extra ? 4 : 0) + (r.gzhead.name ? 8 : 0) + (r.gzhead.comment ? 16 : 0)), B(r, 255 & r.gzhead.time), B(r, r.gzhead.time >> 8 & 255), B(r, r.gzhead.time >> 16 & 255), B(r, r.gzhead.time >> 24 & 255), B(r, 9 === r.level ? 2 : r.strategy >= k || r.level < 2 ? 4 : 0), B(r, 255 & r.gzhead.os), r.gzhead.extra && r.gzhead.extra.length && (B(r, 255 & r.gzhead.extra.length), B(r, r.gzhead.extra.length >> 8 & 255)), r.gzhead.hcrc && (e.adler = h(e.adler, r.pending_buf, r.pending, 0)), r.gzindex = 0, r.status = 69) : (B(r, 0), B(r, 0), B(r, 0), B(r, 0), B(r, 0), B(r, 9 === r.level ? 2 : r.strategy >= k || r.level < 2 ? 4 : 0), B(r, 3), r.status = C); else {
                                let t = O + (r.w_bits - 8 << 4) << 8, i = -1;
                                i = r.strategy >= k || r.level < 2 ? 0 : r.level < 6 ? 1 : 6 === r.level ? 2 : 3, t |= i << 6, 0 !== r.strstart && (t |= 32), t += 31 - t % 31, r.status = C, P(r, t), 0 !== r.strstart && (P(r, e.adler >>> 16), P(r, 65535 & e.adler)), e.adler = 1
                            }
                            if (69 === r.status) if (r.gzhead.extra) {
                                for (i = r.pending; r.gzindex < (65535 & r.gzhead.extra.length) && (r.pending !== r.pending_buf_size || (r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), F(e), i = r.pending, r.pending !== r.pending_buf_size));) B(r, 255 & r.gzhead.extra[r.gzindex]), r.gzindex++;
                                r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), r.gzindex === r.gzhead.extra.length && (r.gzindex = 0, r.status = 73)
                            } else r.status = 73;
                            if (73 === r.status) if (r.gzhead.name) {
                                i = r.pending;
                                do {
                                    if (r.pending === r.pending_buf_size && (r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), F(e), i = r.pending, r.pending === r.pending_buf_size)) {
                                        a = 1;
                                        break
                                    }
                                    a = r.gzindex < r.gzhead.name.length ? 255 & r.gzhead.name.charCodeAt(r.gzindex++) : 0, B(r, a)
                                } while (0 !== a);
                                r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), 0 === a && (r.gzindex = 0, r.status = 91)
                            } else r.status = 91;
                            if (91 === r.status) if (r.gzhead.comment) {
                                i = r.pending;
                                do {
                                    if (r.pending === r.pending_buf_size && (r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), F(e), i = r.pending, r.pending === r.pending_buf_size)) {
                                        a = 1;
                                        break
                                    }
                                    a = r.gzindex < r.gzhead.comment.length ? 255 & r.gzhead.comment.charCodeAt(r.gzindex++) : 0, B(r, a)
                                } while (0 !== a);
                                r.gzhead.hcrc && r.pending > i && (e.adler = h(e.adler, r.pending_buf, r.pending - i, i)), 0 === a && (r.status = I)
                            } else r.status = I;
                            if (r.status === I && (r.gzhead.hcrc ? (r.pending + 2 > r.pending_buf_size && F(e), r.pending + 2 <= r.pending_buf_size && (B(r, 255 & e.adler), B(r, e.adler >> 8 & 255), e.adler = 0, r.status = C)) : r.status = C), 0 !== r.pending) {
                                if (F(e), 0 === e.avail_out) return r.last_flush = -1, g
                            } else if (0 === e.avail_in && M(t) <= M(l) && t !== u) return D(e, x);
                            if (r.status === U && 0 !== e.avail_in) return D(e, x);
                            if (0 !== e.avail_in || 0 !== r.lookahead || t !== f && r.status !== U) {
                                let i = r.strategy === k ? ((e, t) => {
                                    let i;
                                    for (; ;) {
                                        if (0 === e.lookahead && (Y(e), 0 === e.lookahead)) {
                                            if (t === f) return 1;
                                            break
                                        }
                                        if (e.match_length = 0, i = s(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, i && (Z(e, !1), 0 === e.strm.avail_out)) return 1
                                    }
                                    return e.insert = 0, t === u ? (Z(e, !0), 0 === e.strm.avail_out ? 3 : 4) : e.last_lit && (Z(e, !1), 0 === e.strm.avail_out) ? 1 : 2
                                })(r, t) : r.strategy === T ? ((e, t) => {
                                    let i, a, n, r;
                                    const o = e.window;
                                    for (; ;) {
                                        if (e.lookahead <= S) {
                                            if (Y(e), e.lookahead <= S && t === f) return 1;
                                            if (0 === e.lookahead) break
                                        }
                                        if (e.match_length = 0, e.lookahead >= 3 && e.strstart > 0 && (n = e.strstart - 1, a = o[n], a === o[++n] && a === o[++n] && a === o[++n])) {
                                            r = e.strstart + S;
                                            do {
                                            } while (a === o[++n] && a === o[++n] && a === o[++n] && a === o[++n] && a === o[++n] && a === o[++n] && a === o[++n] && a === o[++n] && n < r);
                                            e.match_length = S - (r - n), e.match_length > e.lookahead && (e.match_length = e.lookahead)
                                        }
                                        if (e.match_length >= 3 ? (i = s(e, 1, e.match_length - 3), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (i = s(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), i && (Z(e, !1), 0 === e.strm.avail_out)) return 1
                                    }
                                    return e.insert = 0, t === u ? (Z(e, !0), 0 === e.strm.avail_out ? 3 : 4) : e.last_lit && (Z(e, !1), 0 === e.strm.avail_out) ? 1 : 2
                                })(r, t) : $[r.level].func(r, t);
                                if (3 !== i && 4 !== i || (r.status = U), 1 === i || 3 === i) return 0 === e.avail_out && (r.last_flush = -1), g;
                                if (2 === i && (t === _ ? o(r) : t !== m && (n(r, 0, 0, !1), t === c && (N(r.head), 0 === r.lookahead && (r.strstart = 0, r.block_start = 0, r.insert = 0))), F(e), 0 === e.avail_out)) return r.last_flush = -1, g
                            }
                            return t !== u ? g : r.wrap <= 0 ? p : (2 === r.wrap ? (B(r, 255 & e.adler), B(r, e.adler >> 8 & 255), B(r, e.adler >> 16 & 255), B(r, e.adler >> 24 & 255), B(r, 255 & e.total_in), B(r, e.total_in >> 8 & 255), B(r, e.total_in >> 16 & 255), B(r, e.total_in >> 24 & 255)) : (P(r, e.adler >>> 16), P(r, 65535 & e.adler)), F(e), r.wrap > 0 && (r.wrap = -r.wrap), 0 !== r.pending ? g : p)
                        }, e.exports.deflateEnd = e => {
                            if (!e || !e.state) return w;
                            const t = e.state.status;
                            return 42 !== t && 69 !== t && 73 !== t && 91 !== t && t !== I && t !== C && t !== U ? D(e, w) : (e.state = null, t === C ? D(e, b) : g)
                        }, e.exports.deflateSetDictionary = (e, t) => {
                            let i = t.length;
                            if (!e || !e.state) return w;
                            const a = e.state, n = a.wrap;
                            if (2 === n || 1 === n && 42 !== a.status || a.lookahead) return w;
                            if (1 === n && (e.adler = l(e.adler, t, i, 0)), a.wrap = 0, i >= a.w_size) {
                                0 === n && (N(a.head), a.strstart = 0, a.block_start = 0, a.insert = 0);
                                let e = new Uint8Array(a.w_size);
                                e.set(t.subarray(i - a.w_size, i), 0), t = e, i = a.w_size
                            }
                            const r = e.avail_in, s = e.next_in, o = e.input;
                            for (e.avail_in = i, e.next_in = 0, e.input = t, Y(a); a.lookahead >= 3;) {
                                let e = a.strstart, t = a.lookahead - 2;
                                do {
                                    a.ins_h = L(a, a.ins_h, a.window[e + 3 - 1]), a.prev[e & a.w_mask] = a.head[a.ins_h], a.head[a.ins_h] = e, e++
                                } while (--t);
                                a.strstart = e, a.lookahead = 2, Y(a)
                            }
                            return a.strstart += a.lookahead, a.block_start = a.strstart, a.insert = a.lookahead, a.lookahead = 0, a.match_length = a.prev_length = 2, a.match_available = 0, e.next_in = s, e.input = o, e.avail_in = r, a.wrap = n, g
                        }, e.exports.deflateInfo = "pako deflate (from Nodeca project)"
                    }, 357: e => {
                        e.exports = function () {
                            this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1
                        }
                    }, 980: e => {
                        e.exports = function (e, t) {
                            let i, a, n, r, s, o, l, h, d, f, _, c, u, m, g, p, w, b, x, y, v, k, T, E;
                            const R = e.state;
                            i = e.next_in, T = e.input, a = i + (e.avail_in - 5), n = e.next_out, E = e.output, r = n - (t - e.avail_out), s = n + (e.avail_out - 257), o = R.dmax, l = R.wsize, h = R.whave, d = R.wnext, f = R.window, _ = R.hold, c = R.bits, u = R.lencode, m = R.distcode, g = (1 << R.lenbits) - 1, p = (1 << R.distbits) - 1;
                            e:do {
                                c < 15 && (_ += T[i++] << c, c += 8, _ += T[i++] << c, c += 8), w = u[_ & g];
                                t:for (; ;) {
                                    if (b = w >>> 24, _ >>>= b, c -= b, b = w >>> 16 & 255, 0 === b) E[n++] = 65535 & w; else {
                                        if (!(16 & b)) {
                                            if (0 == (64 & b)) {
                                                w = u[(65535 & w) + (_ & (1 << b) - 1)];
                                                continue t
                                            }
                                            if (32 & b) {
                                                R.mode = 12;
                                                break e
                                            }
                                            e.msg = "invalid literal/length code", R.mode = 30;
                                            break e
                                        }
                                        x = 65535 & w, b &= 15, b && (c < b && (_ += T[i++] << c, c += 8), x += _ & (1 << b) - 1, _ >>>= b, c -= b), c < 15 && (_ += T[i++] << c, c += 8, _ += T[i++] << c, c += 8), w = m[_ & p];
                                        i:for (; ;) {
                                            if (b = w >>> 24, _ >>>= b, c -= b, b = w >>> 16 & 255, !(16 & b)) {
                                                if (0 == (64 & b)) {
                                                    w = m[(65535 & w) + (_ & (1 << b) - 1)];
                                                    continue i
                                                }
                                                e.msg = "invalid distance code", R.mode = 30;
                                                break e
                                            }
                                            if (y = 65535 & w, b &= 15, c < b && (_ += T[i++] << c, c += 8, c < b && (_ += T[i++] << c, c += 8)), y += _ & (1 << b) - 1, y > o) {
                                                e.msg = "invalid distance too far back", R.mode = 30;
                                                break e
                                            }
                                            if (_ >>>= b, c -= b, b = n - r, y > b) {
                                                if (b = y - b, b > h && R.sane) {
                                                    e.msg = "invalid distance too far back", R.mode = 30;
                                                    break e
                                                }
                                                if (v = 0, k = f, 0 === d) {
                                                    if (v += l - b, b < x) {
                                                        x -= b;
                                                        do {
                                                            E[n++] = f[v++]
                                                        } while (--b);
                                                        v = n - y, k = E
                                                    }
                                                } else if (d < b) {
                                                    if (v += l + d - b, b -= d, b < x) {
                                                        x -= b;
                                                        do {
                                                            E[n++] = f[v++]
                                                        } while (--b);
                                                        if (v = 0, d < x) {
                                                            b = d, x -= b;
                                                            do {
                                                                E[n++] = f[v++]
                                                            } while (--b);
                                                            v = n - y, k = E
                                                        }
                                                    }
                                                } else if (v += d - b, b < x) {
                                                    x -= b;
                                                    do {
                                                        E[n++] = f[v++]
                                                    } while (--b);
                                                    v = n - y, k = E
                                                }
                                                for (; x > 2;) E[n++] = k[v++], E[n++] = k[v++], E[n++] = k[v++], x -= 3;
                                                x && (E[n++] = k[v++], x > 1 && (E[n++] = k[v++]))
                                            } else {
                                                v = n - y;
                                                do {
                                                    E[n++] = E[v++], E[n++] = E[v++], E[n++] = E[v++], x -= 3
                                                } while (x > 2);
                                                x && (E[n++] = E[v++], x > 1 && (E[n++] = E[v++]))
                                            }
                                            break
                                        }
                                    }
                                    break
                                }
                            } while (i < a && n < s);
                            x = c >> 3, i -= x, c -= x << 3, _ &= (1 << c) - 1, e.next_in = i, e.next_out = n, e.avail_in = i < a ? a - i + 5 : 5 - (i - a), e.avail_out = n < s ? s - n + 257 : 257 - (n - s), R.hold = _, R.bits = c
                        }
                    }, 20: (e, t, i) => {
                        const a = i(562), n = i(299), r = i(980), s = i(881), {
                                Z_FINISH: o,
                                Z_BLOCK: l,
                                Z_TREES: h,
                                Z_OK: d,
                                Z_STREAM_END: f,
                                Z_NEED_DICT: _,
                                Z_STREAM_ERROR: c,
                                Z_DATA_ERROR: u,
                                Z_MEM_ERROR: m,
                                Z_BUF_ERROR: g,
                                Z_DEFLATED: p
                            } = i(271), w = 12, b = 30,
                            x = e => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((65280 & e) << 8) + ((255 & e) << 24);

                        function y() {
                            this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0
                        }

                        const v = e => {
                            if (!e || !e.state) return c;
                            const t = e.state;
                            return e.total_in = e.total_out = t.total = 0, e.msg = "", t.wrap && (e.adler = 1 & t.wrap), t.mode = 1, t.last = 0, t.havedict = 0, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(852), t.distcode = t.distdyn = new Int32Array(592), t.sane = 1, t.back = -1, d
                        }, k = e => {
                            if (!e || !e.state) return c;
                            const t = e.state;
                            return t.wsize = 0, t.whave = 0, t.wnext = 0, v(e)
                        }, T = (e, t) => {
                            let i;
                            if (!e || !e.state) return c;
                            const a = e.state;
                            return t < 0 ? (i = 0, t = -t) : (i = 1 + (t >> 4), t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? c : (null !== a.window && a.wbits !== t && (a.window = null), a.wrap = i, a.wbits = t, k(e))
                        }, E = (e, t) => {
                            if (!e) return c;
                            const i = new y;
                            e.state = i, i.window = null;
                            const a = T(e, t);
                            return a !== d && (e.state = null), a
                        };
                        let R, z, O = !0;
                        const S = e => {
                            if (O) {
                                R = new Int32Array(512), z = new Int32Array(32);
                                let t = 0;
                                for (; t < 144;) e.lens[t++] = 8;
                                for (; t < 256;) e.lens[t++] = 9;
                                for (; t < 280;) e.lens[t++] = 7;
                                for (; t < 288;) e.lens[t++] = 8;
                                for (s(1, e.lens, 0, 288, R, 0, e.work, {bits: 9}), t = 0; t < 32;) e.lens[t++] = 5;
                                s(2, e.lens, 0, 32, z, 0, e.work, {bits: 5}), O = !1
                            }
                            e.lencode = R, e.lenbits = 9, e.distcode = z, e.distbits = 5
                        }, A = (e, t, i, a) => {
                            let n;
                            const r = e.state;
                            return null === r.window && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0, r.window = new Uint8Array(r.wsize)), a >= r.wsize ? (r.window.set(t.subarray(i - r.wsize, i), 0), r.wnext = 0, r.whave = r.wsize) : (n = r.wsize - r.wnext, n > a && (n = a), r.window.set(t.subarray(i - a, i - a + n), r.wnext), (a -= n) ? (r.window.set(t.subarray(i - a, i), 0), r.wnext = a, r.whave = r.wsize) : (r.wnext += n, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += n))), 0
                        };
                        e.exports.inflateReset = k, e.exports.inflateReset2 = T, e.exports.inflateResetKeep = v, e.exports.inflateInit = e => E(e, 15), e.exports.inflateInit2 = E, e.exports.inflate = (e, t) => {
                            let i, y, v, k, T, E, R, z, O, I, C, U, D, M, N, L, F, Z, B, P, H, j, Y = 0;
                            const q = new Uint8Array(4);
                            let X, K;
                            const $ = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
                            if (!e || !e.state || !e.output || !e.input && 0 !== e.avail_in) return c;
                            i = e.state, i.mode === w && (i.mode = 13), T = e.next_out, v = e.output, R = e.avail_out, k = e.next_in, y = e.input, E = e.avail_in, z = i.hold, O = i.bits, I = E, C = R, j = d;
                            e:for (; ;) switch (i.mode) {
                                case 1:
                                    if (0 === i.wrap) {
                                        i.mode = 13;
                                        break
                                    }
                                    for (; O < 16;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if (2 & i.wrap && 35615 === z) {
                                        i.check = 0, q[0] = 255 & z, q[1] = z >>> 8 & 255, i.check = n(i.check, q, 2, 0), z = 0, O = 0, i.mode = 2;
                                        break
                                    }
                                    if (i.flags = 0, i.head && (i.head.done = !1), !(1 & i.wrap) || (((255 & z) << 8) + (z >> 8)) % 31) {
                                        e.msg = "incorrect header check", i.mode = b;
                                        break
                                    }
                                    if ((15 & z) !== p) {
                                        e.msg = "unknown compression method", i.mode = b;
                                        break
                                    }
                                    if (z >>>= 4, O -= 4, H = 8 + (15 & z), 0 === i.wbits) i.wbits = H; else if (H > i.wbits) {
                                        e.msg = "invalid window size", i.mode = b;
                                        break
                                    }
                                    i.dmax = 1 << i.wbits, e.adler = i.check = 1, i.mode = 512 & z ? 10 : w, z = 0, O = 0;
                                    break;
                                case 2:
                                    for (; O < 16;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if (i.flags = z, (255 & i.flags) !== p) {
                                        e.msg = "unknown compression method", i.mode = b;
                                        break
                                    }
                                    if (57344 & i.flags) {
                                        e.msg = "unknown header flags set", i.mode = b;
                                        break
                                    }
                                    i.head && (i.head.text = z >> 8 & 1), 512 & i.flags && (q[0] = 255 & z, q[1] = z >>> 8 & 255, i.check = n(i.check, q, 2, 0)), z = 0, O = 0, i.mode = 3;
                                case 3:
                                    for (; O < 32;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    i.head && (i.head.time = z), 512 & i.flags && (q[0] = 255 & z, q[1] = z >>> 8 & 255, q[2] = z >>> 16 & 255, q[3] = z >>> 24 & 255, i.check = n(i.check, q, 4, 0)), z = 0, O = 0, i.mode = 4;
                                case 4:
                                    for (; O < 16;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    i.head && (i.head.xflags = 255 & z, i.head.os = z >> 8), 512 & i.flags && (q[0] = 255 & z, q[1] = z >>> 8 & 255, i.check = n(i.check, q, 2, 0)), z = 0, O = 0, i.mode = 5;
                                case 5:
                                    if (1024 & i.flags) {
                                        for (; O < 16;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        i.length = z, i.head && (i.head.extra_len = z), 512 & i.flags && (q[0] = 255 & z, q[1] = z >>> 8 & 255, i.check = n(i.check, q, 2, 0)), z = 0, O = 0
                                    } else i.head && (i.head.extra = null);
                                    i.mode = 6;
                                case 6:
                                    if (1024 & i.flags && (U = i.length, U > E && (U = E), U && (i.head && (H = i.head.extra_len - i.length, i.head.extra || (i.head.extra = new Uint8Array(i.head.extra_len)), i.head.extra.set(y.subarray(k, k + U), H)), 512 & i.flags && (i.check = n(i.check, y, U, k)), E -= U, k += U, i.length -= U), i.length)) break e;
                                    i.length = 0, i.mode = 7;
                                case 7:
                                    if (2048 & i.flags) {
                                        if (0 === E) break e;
                                        U = 0;
                                        do {
                                            H = y[k + U++], i.head && H && i.length < 65536 && (i.head.name += String.fromCharCode(H))
                                        } while (H && U < E);
                                        if (512 & i.flags && (i.check = n(i.check, y, U, k)), E -= U, k += U, H) break e
                                    } else i.head && (i.head.name = null);
                                    i.length = 0, i.mode = 8;
                                case 8:
                                    if (4096 & i.flags) {
                                        if (0 === E) break e;
                                        U = 0;
                                        do {
                                            H = y[k + U++], i.head && H && i.length < 65536 && (i.head.comment += String.fromCharCode(H))
                                        } while (H && U < E);
                                        if (512 & i.flags && (i.check = n(i.check, y, U, k)), E -= U, k += U, H) break e
                                    } else i.head && (i.head.comment = null);
                                    i.mode = 9;
                                case 9:
                                    if (512 & i.flags) {
                                        for (; O < 16;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        if (z !== (65535 & i.check)) {
                                            e.msg = "header crc mismatch", i.mode = b;
                                            break
                                        }
                                        z = 0, O = 0
                                    }
                                    i.head && (i.head.hcrc = i.flags >> 9 & 1, i.head.done = !0), e.adler = i.check = 0, i.mode = w;
                                    break;
                                case 10:
                                    for (; O < 32;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    e.adler = i.check = x(z), z = 0, O = 0, i.mode = 11;
                                case 11:
                                    if (0 === i.havedict) return e.next_out = T, e.avail_out = R, e.next_in = k, e.avail_in = E, i.hold = z, i.bits = O, _;
                                    e.adler = i.check = 1, i.mode = w;
                                case w:
                                    if (t === l || t === h) break e;
                                case 13:
                                    if (i.last) {
                                        z >>>= 7 & O, O -= 7 & O, i.mode = 27;
                                        break
                                    }
                                    for (; O < 3;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    switch (i.last = 1 & z, z >>>= 1, O -= 1, 3 & z) {
                                        case 0:
                                            i.mode = 14;
                                            break;
                                        case 1:
                                            if (S(i), i.mode = 20, t === h) {
                                                z >>>= 2, O -= 2;
                                                break e
                                            }
                                            break;
                                        case 2:
                                            i.mode = 17;
                                            break;
                                        case 3:
                                            e.msg = "invalid block type", i.mode = b
                                    }
                                    z >>>= 2, O -= 2;
                                    break;
                                case 14:
                                    for (z >>>= 7 & O, O -= 7 & O; O < 32;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if ((65535 & z) != (z >>> 16 ^ 65535)) {
                                        e.msg = "invalid stored block lengths", i.mode = b;
                                        break
                                    }
                                    if (i.length = 65535 & z, z = 0, O = 0, i.mode = 15, t === h) break e;
                                case 15:
                                    i.mode = 16;
                                case 16:
                                    if (U = i.length, U) {
                                        if (U > E && (U = E), U > R && (U = R), 0 === U) break e;
                                        v.set(y.subarray(k, k + U), T), E -= U, k += U, R -= U, T += U, i.length -= U;
                                        break
                                    }
                                    i.mode = w;
                                    break;
                                case 17:
                                    for (; O < 14;) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if (i.nlen = 257 + (31 & z), z >>>= 5, O -= 5, i.ndist = 1 + (31 & z), z >>>= 5, O -= 5, i.ncode = 4 + (15 & z), z >>>= 4, O -= 4, i.nlen > 286 || i.ndist > 30) {
                                        e.msg = "too many length or distance symbols", i.mode = b;
                                        break
                                    }
                                    i.have = 0, i.mode = 18;
                                case 18:
                                    for (; i.have < i.ncode;) {
                                        for (; O < 3;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        i.lens[$[i.have++]] = 7 & z, z >>>= 3, O -= 3
                                    }
                                    for (; i.have < 19;) i.lens[$[i.have++]] = 0;
                                    if (i.lencode = i.lendyn, i.lenbits = 7, X = {bits: i.lenbits}, j = s(0, i.lens, 0, 19, i.lencode, 0, i.work, X), i.lenbits = X.bits, j) {
                                        e.msg = "invalid code lengths set", i.mode = b;
                                        break
                                    }
                                    i.have = 0, i.mode = 19;
                                case 19:
                                    for (; i.have < i.nlen + i.ndist;) {
                                        for (; Y = i.lencode[z & (1 << i.lenbits) - 1], N = Y >>> 24, L = Y >>> 16 & 255, F = 65535 & Y, !(N <= O);) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        if (F < 16) z >>>= N, O -= N, i.lens[i.have++] = F; else {
                                            if (16 === F) {
                                                for (K = N + 2; O < K;) {
                                                    if (0 === E) break e;
                                                    E--, z += y[k++] << O, O += 8
                                                }
                                                if (z >>>= N, O -= N, 0 === i.have) {
                                                    e.msg = "invalid bit length repeat", i.mode = b;
                                                    break
                                                }
                                                H = i.lens[i.have - 1], U = 3 + (3 & z), z >>>= 2, O -= 2
                                            } else if (17 === F) {
                                                for (K = N + 3; O < K;) {
                                                    if (0 === E) break e;
                                                    E--, z += y[k++] << O, O += 8
                                                }
                                                z >>>= N, O -= N, H = 0, U = 3 + (7 & z), z >>>= 3, O -= 3
                                            } else {
                                                for (K = N + 7; O < K;) {
                                                    if (0 === E) break e;
                                                    E--, z += y[k++] << O, O += 8
                                                }
                                                z >>>= N, O -= N, H = 0, U = 11 + (127 & z), z >>>= 7, O -= 7
                                            }
                                            if (i.have + U > i.nlen + i.ndist) {
                                                e.msg = "invalid bit length repeat", i.mode = b;
                                                break
                                            }
                                            for (; U--;) i.lens[i.have++] = H
                                        }
                                    }
                                    if (i.mode === b) break;
                                    if (0 === i.lens[256]) {
                                        e.msg = "invalid code -- missing end-of-block", i.mode = b;
                                        break
                                    }
                                    if (i.lenbits = 9, X = {bits: i.lenbits}, j = s(1, i.lens, 0, i.nlen, i.lencode, 0, i.work, X), i.lenbits = X.bits, j) {
                                        e.msg = "invalid literal/lengths set", i.mode = b;
                                        break
                                    }
                                    if (i.distbits = 6, i.distcode = i.distdyn, X = {bits: i.distbits}, j = s(2, i.lens, i.nlen, i.ndist, i.distcode, 0, i.work, X), i.distbits = X.bits, j) {
                                        e.msg = "invalid distances set", i.mode = b;
                                        break
                                    }
                                    if (i.mode = 20, t === h) break e;
                                case 20:
                                    i.mode = 21;
                                case 21:
                                    if (E >= 6 && R >= 258) {
                                        e.next_out = T, e.avail_out = R, e.next_in = k, e.avail_in = E, i.hold = z, i.bits = O, r(e, C), T = e.next_out, v = e.output, R = e.avail_out, k = e.next_in, y = e.input, E = e.avail_in, z = i.hold, O = i.bits, i.mode === w && (i.back = -1);
                                        break
                                    }
                                    for (i.back = 0; Y = i.lencode[z & (1 << i.lenbits) - 1], N = Y >>> 24, L = Y >>> 16 & 255, F = 65535 & Y, !(N <= O);) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if (L && 0 == (240 & L)) {
                                        for (Z = N, B = L, P = F; Y = i.lencode[P + ((z & (1 << Z + B) - 1) >> Z)], N = Y >>> 24, L = Y >>> 16 & 255, F = 65535 & Y, !(Z + N <= O);) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        z >>>= Z, O -= Z, i.back += Z
                                    }
                                    if (z >>>= N, O -= N, i.back += N, i.length = F, 0 === L) {
                                        i.mode = 26;
                                        break
                                    }
                                    if (32 & L) {
                                        i.back = -1, i.mode = w;
                                        break
                                    }
                                    if (64 & L) {
                                        e.msg = "invalid literal/length code", i.mode = b;
                                        break
                                    }
                                    i.extra = 15 & L, i.mode = 22;
                                case 22:
                                    if (i.extra) {
                                        for (K = i.extra; O < K;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        i.length += z & (1 << i.extra) - 1, z >>>= i.extra, O -= i.extra, i.back += i.extra
                                    }
                                    i.was = i.length, i.mode = 23;
                                case 23:
                                    for (; Y = i.distcode[z & (1 << i.distbits) - 1], N = Y >>> 24, L = Y >>> 16 & 255, F = 65535 & Y, !(N <= O);) {
                                        if (0 === E) break e;
                                        E--, z += y[k++] << O, O += 8
                                    }
                                    if (0 == (240 & L)) {
                                        for (Z = N, B = L, P = F; Y = i.distcode[P + ((z & (1 << Z + B) - 1) >> Z)], N = Y >>> 24, L = Y >>> 16 & 255, F = 65535 & Y, !(Z + N <= O);) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        z >>>= Z, O -= Z, i.back += Z
                                    }
                                    if (z >>>= N, O -= N, i.back += N, 64 & L) {
                                        e.msg = "invalid distance code", i.mode = b;
                                        break
                                    }
                                    i.offset = F, i.extra = 15 & L, i.mode = 24;
                                case 24:
                                    if (i.extra) {
                                        for (K = i.extra; O < K;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        i.offset += z & (1 << i.extra) - 1, z >>>= i.extra, O -= i.extra, i.back += i.extra
                                    }
                                    if (i.offset > i.dmax) {
                                        e.msg = "invalid distance too far back", i.mode = b;
                                        break
                                    }
                                    i.mode = 25;
                                case 25:
                                    if (0 === R) break e;
                                    if (U = C - R, i.offset > U) {
                                        if (U = i.offset - U, U > i.whave && i.sane) {
                                            e.msg = "invalid distance too far back", i.mode = b;
                                            break
                                        }
                                        U > i.wnext ? (U -= i.wnext, D = i.wsize - U) : D = i.wnext - U, U > i.length && (U = i.length), M = i.window
                                    } else M = v, D = T - i.offset, U = i.length;
                                    U > R && (U = R), R -= U, i.length -= U;
                                    do {
                                        v[T++] = M[D++]
                                    } while (--U);
                                    0 === i.length && (i.mode = 21);
                                    break;
                                case 26:
                                    if (0 === R) break e;
                                    v[T++] = i.length, R--, i.mode = 21;
                                    break;
                                case 27:
                                    if (i.wrap) {
                                        for (; O < 32;) {
                                            if (0 === E) break e;
                                            E--, z |= y[k++] << O, O += 8
                                        }
                                        if (C -= R, e.total_out += C, i.total += C, C && (e.adler = i.check = i.flags ? n(i.check, v, C, T - C) : a(i.check, v, C, T - C)), C = R, (i.flags ? z : x(z)) !== i.check) {
                                            e.msg = "incorrect data check", i.mode = b;
                                            break
                                        }
                                        z = 0, O = 0
                                    }
                                    i.mode = 28;
                                case 28:
                                    if (i.wrap && i.flags) {
                                        for (; O < 32;) {
                                            if (0 === E) break e;
                                            E--, z += y[k++] << O, O += 8
                                        }
                                        if (z !== (4294967295 & i.total)) {
                                            e.msg = "incorrect length check", i.mode = b;
                                            break
                                        }
                                        z = 0, O = 0
                                    }
                                    i.mode = 29;
                                case 29:
                                    j = f;
                                    break e;
                                case b:
                                    j = u;
                                    break e;
                                case 31:
                                    return m;
                                default:
                                    return c
                            }
                            return e.next_out = T, e.avail_out = R, e.next_in = k, e.avail_in = E, i.hold = z, i.bits = O, (i.wsize || C !== e.avail_out && i.mode < b && (i.mode < 27 || t !== o)) && A(e, e.output, e.next_out, C - e.avail_out) ? (i.mode = 31, m) : (I -= e.avail_in, C -= e.avail_out, e.total_in += I, e.total_out += C, i.total += C, i.wrap && C && (e.adler = i.check = i.flags ? n(i.check, v, C, e.next_out - C) : a(i.check, v, C, e.next_out - C)), e.data_type = i.bits + (i.last ? 64 : 0) + (i.mode === w ? 128 : 0) + (20 === i.mode || 15 === i.mode ? 256 : 0), (0 === I && 0 === C || t === o) && j === d && (j = g), j)
                        }, e.exports.inflateEnd = e => {
                            if (!e || !e.state) return c;
                            let t = e.state;
                            return t.window && (t.window = null), e.state = null, d
                        }, e.exports.inflateGetHeader = (e, t) => {
                            if (!e || !e.state) return c;
                            const i = e.state;
                            return 0 == (2 & i.wrap) ? c : (i.head = t, t.done = !1, d)
                        }, e.exports.inflateSetDictionary = (e, t) => {
                            const i = t.length;
                            let n, r, s;
                            return e && e.state ? (n = e.state, 0 !== n.wrap && 11 !== n.mode ? c : 11 === n.mode && (r = 1, r = a(r, t, i, 0), r !== n.check) ? u : (s = A(e, t, i, i), s ? (n.mode = 31, m) : (n.havedict = 1, d))) : c
                        }, e.exports.inflateInfo = "pako inflate (from Nodeca project)"
                    }, 881: e => {
                        const t = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]),
                            i = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78]),
                            a = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]),
                            n = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);
                        e.exports = (e, r, s, o, l, h, d, f) => {
                            const _ = f.bits;
                            let c, u, m, g, p, w, b = 0, x = 0, y = 0, v = 0, k = 0, T = 0, E = 0, R = 0, z = 0, O = 0,
                                S = null, A = 0;
                            const I = new Uint16Array(16), C = new Uint16Array(16);
                            let U, D, M, N = null, L = 0;
                            for (b = 0; b <= 15; b++) I[b] = 0;
                            for (x = 0; x < o; x++) I[r[s + x]]++;
                            for (k = _, v = 15; v >= 1 && 0 === I[v]; v--) ;
                            if (k > v && (k = v), 0 === v) return l[h++] = 20971520, l[h++] = 20971520, f.bits = 1, 0;
                            for (y = 1; y < v && 0 === I[y]; y++) ;
                            for (k < y && (k = y), R = 1, b = 1; b <= 15; b++) if (R <<= 1, R -= I[b], R < 0) return -1;
                            if (R > 0 && (0 === e || 1 !== v)) return -1;
                            for (C[1] = 0, b = 1; b < 15; b++) C[b + 1] = C[b] + I[b];
                            for (x = 0; x < o; x++) 0 !== r[s + x] && (d[C[r[s + x]]++] = x);
                            if (0 === e ? (S = N = d, w = 19) : 1 === e ? (S = t, A -= 257, N = i, L -= 257, w = 256) : (S = a, N = n, w = -1), O = 0, x = 0, b = y, p = h, T = k, E = 0, m = -1, z = 1 << k, g = z - 1, 1 === e && z > 852 || 2 === e && z > 592) return 1;
                            for (; ;) {
                                U = b - E, d[x] < w ? (D = 0, M = d[x]) : d[x] > w ? (D = N[L + d[x]], M = S[A + d[x]]) : (D = 96, M = 0), c = 1 << b - E, u = 1 << T, y = u;
                                do {
                                    u -= c, l[p + (O >> E) + u] = U << 24 | D << 16 | M | 0
                                } while (0 !== u);
                                for (c = 1 << b - 1; O & c;) c >>= 1;
                                if (0 !== c ? (O &= c - 1, O += c) : O = 0, x++, 0 == --I[b]) {
                                    if (b === v) break;
                                    b = r[s + d[x]]
                                }
                                if (b > k && (O & g) !== m) {
                                    for (0 === E && (E = k), p += y, T = b - E, R = 1 << T; T + E < v && (R -= I[T + E], !(R <= 0));) T++, R <<= 1;
                                    if (z += 1 << T, 1 === e && z > 852 || 2 === e && z > 592) return 1;
                                    m = O & g, l[m] = k << 24 | T << 16 | p - h | 0
                                }
                            }
                            return 0 !== O && (l[p + O] = b - E << 24 | 64 << 16 | 0), f.bits = k, 0
                        }
                    }, 950: e => {
                        e.exports = {
                            2: "need dictionary",
                            1: "stream end",
                            0: "",
                            "-1": "file error",
                            "-2": "stream error",
                            "-3": "data error",
                            "-4": "insufficient memory",
                            "-5": "buffer error",
                            "-6": "incompatible version"
                        }
                    }, 564: e => {
                        function t(e) {
                            let t = e.length;
                            for (; --t >= 0;) e[t] = 0
                        }

                        const i = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]),
                            a = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]),
                            n = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]),
                            r = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]),
                            s = new Array(576);
                        t(s);
                        const o = new Array(60);
                        t(o);
                        const l = new Array(512);
                        t(l);
                        const h = new Array(256);
                        t(h);
                        const d = new Array(29);
                        t(d);
                        const f = new Array(30);

                        function _(e, t, i, a, n) {
                            this.static_tree = e, this.extra_bits = t, this.extra_base = i, this.elems = a, this.max_length = n, this.has_stree = e && e.length
                        }

                        let c, u, m;

                        function g(e, t) {
                            this.dyn_tree = e, this.max_code = 0, this.stat_desc = t
                        }

                        t(f);
                        const p = e => e < 256 ? l[e] : l[256 + (e >>> 7)], w = (e, t) => {
                            e.pending_buf[e.pending++] = 255 & t, e.pending_buf[e.pending++] = t >>> 8 & 255
                        }, b = (e, t, i) => {
                            e.bi_valid > 16 - i ? (e.bi_buf |= t << e.bi_valid & 65535, w(e, e.bi_buf), e.bi_buf = t >> 16 - e.bi_valid, e.bi_valid += i - 16) : (e.bi_buf |= t << e.bi_valid & 65535, e.bi_valid += i)
                        }, x = (e, t, i) => {
                            b(e, i[2 * t], i[2 * t + 1])
                        }, y = (e, t) => {
                            let i = 0;
                            do {
                                i |= 1 & e, e >>>= 1, i <<= 1
                            } while (--t > 0);
                            return i >>> 1
                        }, v = (e, t, i) => {
                            const a = new Array(16);
                            let n, r, s = 0;
                            for (n = 1; n <= 15; n++) a[n] = s = s + i[n - 1] << 1;
                            for (r = 0; r <= t; r++) {
                                let t = e[2 * r + 1];
                                0 !== t && (e[2 * r] = y(a[t]++, t))
                            }
                        }, k = e => {
                            let t;
                            for (t = 0; t < 286; t++) e.dyn_ltree[2 * t] = 0;
                            for (t = 0; t < 30; t++) e.dyn_dtree[2 * t] = 0;
                            for (t = 0; t < 19; t++) e.bl_tree[2 * t] = 0;
                            e.dyn_ltree[512] = 1, e.opt_len = e.static_len = 0, e.last_lit = e.matches = 0
                        }, T = e => {
                            e.bi_valid > 8 ? w(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0
                        }, E = (e, t, i, a) => {
                            const n = 2 * t, r = 2 * i;
                            return e[n] < e[r] || e[n] === e[r] && a[t] <= a[i]
                        }, R = (e, t, i) => {
                            const a = e.heap[i];
                            let n = i << 1;
                            for (; n <= e.heap_len && (n < e.heap_len && E(t, e.heap[n + 1], e.heap[n], e.depth) && n++, !E(t, a, e.heap[n], e.depth));) e.heap[i] = e.heap[n], i = n, n <<= 1;
                            e.heap[i] = a
                        }, z = (e, t, n) => {
                            let r, s, o, l, _ = 0;
                            if (0 !== e.last_lit) do {
                                r = e.pending_buf[e.d_buf + 2 * _] << 8 | e.pending_buf[e.d_buf + 2 * _ + 1], s = e.pending_buf[e.l_buf + _], _++, 0 === r ? x(e, s, t) : (o = h[s], x(e, o + 256 + 1, t), l = i[o], 0 !== l && (s -= d[o], b(e, s, l)), r--, o = p(r), x(e, o, n), l = a[o], 0 !== l && (r -= f[o], b(e, r, l)))
                            } while (_ < e.last_lit);
                            x(e, 256, t)
                        }, O = (e, t) => {
                            const i = t.dyn_tree, a = t.stat_desc.static_tree, n = t.stat_desc.has_stree,
                                r = t.stat_desc.elems;
                            let s, o, l, h = -1;
                            for (e.heap_len = 0, e.heap_max = 573, s = 0; s < r; s++) 0 !== i[2 * s] ? (e.heap[++e.heap_len] = h = s, e.depth[s] = 0) : i[2 * s + 1] = 0;
                            for (; e.heap_len < 2;) l = e.heap[++e.heap_len] = h < 2 ? ++h : 0, i[2 * l] = 1, e.depth[l] = 0, e.opt_len--, n && (e.static_len -= a[2 * l + 1]);
                            for (t.max_code = h, s = e.heap_len >> 1; s >= 1; s--) R(e, i, s);
                            l = r;
                            do {
                                s = e.heap[1], e.heap[1] = e.heap[e.heap_len--], R(e, i, 1), o = e.heap[1], e.heap[--e.heap_max] = s, e.heap[--e.heap_max] = o, i[2 * l] = i[2 * s] + i[2 * o], e.depth[l] = (e.depth[s] >= e.depth[o] ? e.depth[s] : e.depth[o]) + 1, i[2 * s + 1] = i[2 * o + 1] = l, e.heap[1] = l++, R(e, i, 1)
                            } while (e.heap_len >= 2);
                            e.heap[--e.heap_max] = e.heap[1], ((e, t) => {
                                const i = t.dyn_tree, a = t.max_code, n = t.stat_desc.static_tree,
                                    r = t.stat_desc.has_stree, s = t.stat_desc.extra_bits, o = t.stat_desc.extra_base,
                                    l = t.stat_desc.max_length;
                                let h, d, f, _, c, u, m = 0;
                                for (_ = 0; _ <= 15; _++) e.bl_count[_] = 0;
                                for (i[2 * e.heap[e.heap_max] + 1] = 0, h = e.heap_max + 1; h < 573; h++) d = e.heap[h], _ = i[2 * i[2 * d + 1] + 1] + 1, _ > l && (_ = l, m++), i[2 * d + 1] = _, d > a || (e.bl_count[_]++, c = 0, d >= o && (c = s[d - o]), u = i[2 * d], e.opt_len += u * (_ + c), r && (e.static_len += u * (n[2 * d + 1] + c)));
                                if (0 !== m) {
                                    do {
                                        for (_ = l - 1; 0 === e.bl_count[_];) _--;
                                        e.bl_count[_]--, e.bl_count[_ + 1] += 2, e.bl_count[l]--, m -= 2
                                    } while (m > 0);
                                    for (_ = l; 0 !== _; _--) for (d = e.bl_count[_]; 0 !== d;) f = e.heap[--h], f > a || (i[2 * f + 1] !== _ && (e.opt_len += (_ - i[2 * f + 1]) * i[2 * f], i[2 * f + 1] = _), d--)
                                }
                            })(e, t), v(i, h, e.bl_count)
                        }, S = (e, t, i) => {
                            let a, n, r = -1, s = t[1], o = 0, l = 7, h = 4;
                            for (0 === s && (l = 138, h = 3), t[2 * (i + 1) + 1] = 65535, a = 0; a <= i; a++) n = s, s = t[2 * (a + 1) + 1], ++o < l && n === s || (o < h ? e.bl_tree[2 * n] += o : 0 !== n ? (n !== r && e.bl_tree[2 * n]++, e.bl_tree[32]++) : o <= 10 ? e.bl_tree[34]++ : e.bl_tree[36]++, o = 0, r = n, 0 === s ? (l = 138, h = 3) : n === s ? (l = 6, h = 3) : (l = 7, h = 4))
                        }, A = (e, t, i) => {
                            let a, n, r = -1, s = t[1], o = 0, l = 7, h = 4;
                            for (0 === s && (l = 138, h = 3), a = 0; a <= i; a++) if (n = s, s = t[2 * (a + 1) + 1], !(++o < l && n === s)) {
                                if (o < h) do {
                                    x(e, n, e.bl_tree)
                                } while (0 != --o); else 0 !== n ? (n !== r && (x(e, n, e.bl_tree), o--), x(e, 16, e.bl_tree), b(e, o - 3, 2)) : o <= 10 ? (x(e, 17, e.bl_tree), b(e, o - 3, 3)) : (x(e, 18, e.bl_tree), b(e, o - 11, 7));
                                o = 0, r = n, 0 === s ? (l = 138, h = 3) : n === s ? (l = 6, h = 3) : (l = 7, h = 4)
                            }
                        };
                        let I = !1;
                        const C = (e, t, i, a) => {
                            b(e, 0 + (a ? 1 : 0), 3), ((e, t, i, a) => {
                                T(e), w(e, i), w(e, ~i), e.pending_buf.set(e.window.subarray(t, t + i), e.pending), e.pending += i
                            })(e, t, i)
                        };
                        e.exports._tr_init = e => {
                            I || ((() => {
                                let e, t, r, g, p;
                                const w = new Array(16);
                                for (r = 0, g = 0; g < 28; g++) for (d[g] = r, e = 0; e < 1 << i[g]; e++) h[r++] = g;
                                for (h[r - 1] = g, p = 0, g = 0; g < 16; g++) for (f[g] = p, e = 0; e < 1 << a[g]; e++) l[p++] = g;
                                for (p >>= 7; g < 30; g++) for (f[g] = p << 7, e = 0; e < 1 << a[g] - 7; e++) l[256 + p++] = g;
                                for (t = 0; t <= 15; t++) w[t] = 0;
                                for (e = 0; e <= 143;) s[2 * e + 1] = 8, e++, w[8]++;
                                for (; e <= 255;) s[2 * e + 1] = 9, e++, w[9]++;
                                for (; e <= 279;) s[2 * e + 1] = 7, e++, w[7]++;
                                for (; e <= 287;) s[2 * e + 1] = 8, e++, w[8]++;
                                for (v(s, 287, w), e = 0; e < 30; e++) o[2 * e + 1] = 5, o[2 * e] = y(e, 5);
                                c = new _(s, i, 257, 286, 15), u = new _(o, a, 0, 30, 15), m = new _(new Array(0), n, 0, 19, 7)
                            })(), I = !0), e.l_desc = new g(e.dyn_ltree, c), e.d_desc = new g(e.dyn_dtree, u), e.bl_desc = new g(e.bl_tree, m), e.bi_buf = 0, e.bi_valid = 0, k(e)
                        }, e.exports._tr_stored_block = C, e.exports._tr_flush_block = (e, t, i, a) => {
                            let n, l, h = 0;
                            e.level > 0 ? (2 === e.strm.data_type && (e.strm.data_type = (e => {
                                let t, i = 4093624447;
                                for (t = 0; t <= 31; t++, i >>>= 1) if (1 & i && 0 !== e.dyn_ltree[2 * t]) return 0;
                                if (0 !== e.dyn_ltree[18] || 0 !== e.dyn_ltree[20] || 0 !== e.dyn_ltree[26]) return 1;
                                for (t = 32; t < 256; t++) if (0 !== e.dyn_ltree[2 * t]) return 1;
                                return 0
                            })(e)), O(e, e.l_desc), O(e, e.d_desc), h = (e => {
                                let t;
                                for (S(e, e.dyn_ltree, e.l_desc.max_code), S(e, e.dyn_dtree, e.d_desc.max_code), O(e, e.bl_desc), t = 18; t >= 3 && 0 === e.bl_tree[2 * r[t] + 1]; t--) ;
                                return e.opt_len += 3 * (t + 1) + 5 + 5 + 4, t
                            })(e), n = e.opt_len + 3 + 7 >>> 3, l = e.static_len + 3 + 7 >>> 3, l <= n && (n = l)) : n = l = i + 5, i + 4 <= n && -1 !== t ? C(e, t, i, a) : 4 === e.strategy || l === n ? (b(e, 2 + (a ? 1 : 0), 3), z(e, s, o)) : (b(e, 4 + (a ? 1 : 0), 3), ((e, t, i, a) => {
                                let n;
                                for (b(e, t - 257, 5), b(e, i - 1, 5), b(e, a - 4, 4), n = 0; n < a; n++) b(e, e.bl_tree[2 * r[n] + 1], 3);
                                A(e, e.dyn_ltree, t - 1), A(e, e.dyn_dtree, i - 1)
                            })(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, h + 1), z(e, e.dyn_ltree, e.dyn_dtree)), k(e), a && T(e)
                        }, e.exports._tr_tally = (e, t, i) => (e.pending_buf[e.d_buf + 2 * e.last_lit] = t >>> 8 & 255, e.pending_buf[e.d_buf + 2 * e.last_lit + 1] = 255 & t, e.pending_buf[e.l_buf + e.last_lit] = 255 & i, e.last_lit++, 0 === t ? e.dyn_ltree[2 * i]++ : (e.matches++, t--, e.dyn_ltree[2 * (h[i] + 256 + 1)]++, e.dyn_dtree[2 * p(t)]++), e.last_lit === e.lit_bufsize - 1), e.exports._tr_align = e => {
                            b(e, 2, 3), x(e, 256, s), (e => {
                                16 === e.bi_valid ? (w(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = 255 & e.bi_buf, e.bi_buf >>= 8, e.bi_valid -= 8)
                            })(e)
                        }
                    }, 744: e => {
                        e.exports = function () {
                            this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0
                        }
                    }, 534: function (e, t, i) {
                        var a = this && this.__importDefault || function (e) {
                            return e && e.__esModule ? e : {default: e}
                        };
                        Object.defineProperty(t, "__esModule", {value: !0});
                        const n = a(i(845));
                        t.default = class {
                            constructor(e, t = 5) {
                                this.url = e, this.throttleTime = t, this.tileRequests = []
                            }

                            fetchTile(e, t) {
                                return this.tileRequests.length || setTimeout((() => {
                                    this.fetchTileBatches(), this.tileRequests = []
                                }), this.throttleTime), new Promise(((t, i) => {
                                    const a = Object.assign(e, {promise: {resolve: t, reject: i}});
                                    this.tileRequests.push(a)
                                }))
                            }

                            fetchTileBatches() {
                                this.tileRequests.sort((({range: e}, {range: t}) => e.startOffset - t.startOffset)).reduce(((e, t) => {
                                    if (e.length && this.isInRange(null == e ? void 0 : e.at(-1), t)) {
                                        const {batchRange: i, tileRequests: a} = e.at(-1);
                                        i.endOffset = t.range.endOffset, a.push(t)
                                    } else {
                                        const {startOffset: i, endOffset: a} = t.range;
                                        e.push({batchRange: {startOffset: i, endOffset: a}, tileRequests: [t]})
                                    }
                                    return e
                                }), []).forEach((e => {
                                    fetch(this.url, {headers: {range: `bytes=${e.batchRange.startOffset}-${e.batchRange.endOffset}`}}).then((e => e.arrayBuffer())).then((t => {
                                        let i = 0;
                                        for (const {range: a, promise: n} of e.tileRequests) {
                                            const {startOffset: e, endOffset: r} = a, s = r - e + 1,
                                                o = this.sliceTile(t, i, s);
                                            n.resolve(o), i += s
                                        }
                                    }))
                                }))
                            }

                            isInRange(e, t) {
                                return e.tileRequests.length && t.range.startOffset - e.tileRequests.at(-1).range.endOffset == 1
                            }

                            sliceTile(e, t, i) {
                                const a = e.slice(t, t + i), r = new Uint8Array(a);
                                return n.default.ungzip(r)
                            }
                        }
                    }, 151: (e, t) => {
                        Object.defineProperty(t, "__esModule", {value: !0}), t.default = class {
                            constructor() {
                                this.abortRequests = []
                            }

                            cancel() {
                                this.abortRequests.forEach((e => e()))
                            }

                            register(e) {
                                this.abortRequests.push(e)
                            }

                            unregister(e) {
                                const t = this.abortRequests.indexOf(e);
                                this.abortRequests.splice(t, 1)
                            }
                        }
                    }, 738: function (e, t, i) {
                        var a = this && this.__importDefault || function (e) {
                            return e && e.__esModule ? e : {default: e}
                        };
                        Object.defineProperty(t, "__esModule", {value: !0}), t.HeaderFetchStrategy = void 0;
                        const n = a(i(845)), r = a(i(817)), s = a(i(589)), o = i(666), l = a(i(534));

                        class h {
                            constructor(e, t = new Uint8Array(0), i) {
                                this.metadata = e, this.partialIndex = t, this.cacheSize = i, this.fragmentedIndex = new s.default(h.MAX_ENTRIES_LRU_CACHE), this.comtIndex = new r.default(this.metadata)
                            }

                            setIndexFragment(e, t) {
                                console.time(`setIndexFragment\n Range: ${e.startOffset}-${e.endOffset}\n Size: ${(e.endOffset - e.startOffset) / 1e3} kB\n Time`);
                                const i = e.startOffset;
                                this.fragmentedIndex.put(i, {
                                    fragmentRange: e, indexEntries: t
                                }), console.timeEnd(`setIndexFragment\n Range: ${e.startOffset}-${e.endOffset}\n Size: ${(e.endOffset - e.startOffset) / 1e3} kB\n Time`)
                            }

                            get(e) {
                                const {
                                    z: t, x: i, y: a
                                } = e, {index: n} = this.comtIndex.calculateIndexOffsetForTile(t, i, a), {
                                    startOffset: r, index: s
                                } = this.comtIndex.getFragmentRangeForTile(t, i, a), o = n * h.INDEX_ENTRY_NUM_BYTES;
                                if (o <= this.partialIndex.byteLength - h.INDEX_ENTRY_NUM_BYTES) return this.createIndexEntry(o, this.partialIndex);
                                const l = this.fragmentedIndex.get(r);
                                if (!l) return null;
                                const d = (n - s) * h.INDEX_ENTRY_NUM_BYTES;
                                return this.createIndexEntry(d, l.indexEntries)
                            }

                            createIndexEntry(e, t) {
                                const i = t.buffer;
                                return {
                                    offset: (0, o.convertUInt40LEToNumber)(i, e),
                                    size: new DataView(i).getUint32(e + 5, !0)
                                }
                            }
                        }

                        var d;
                        h.INDEX_ENTRY_NUM_BYTES = 9, h.MAX_ENTRIES_LRU_CACHE = 28, function (e) {
                            e.PREFETCH = "PREFETCH", e.LAZY = "LAZY "
                        }(d = t.HeaderFetchStrategy || (t.HeaderFetchStrategy = {}));

                        class f {
                            constructor(e, t, i) {
                                this.comtUrl = e, this.throttleTime = t, this.header = i, this.indexCache = null, this.comtIndex = null, this.requestCache = new Map, i && this.initIndex(i), this.batchedTilesProvider = new l.default(e, t)
                            }

                            static async create(e, t = d.PREFETCH, i = 5) {
                                console.time("create");
                                const a = t === d.PREFETCH ? await f.loadHeader(e) : null, n = new f(e, i, a);
                                return console.timeEnd("create"), n
                            }

                            async getTile(e, t) {
                                console.time("getTile");
                                const i = this.fetchTile(e, ((e, t, i, a) => {
                                    const n = this.fetchMVT(i, t.size, a);
                                    return console.timeEnd("getTile"), n
                                }), t);
                                return console.timeEnd("getTile"), i
                            }

                            async getTileWithBatchRequest(e, t) {
                                return this.fetchTile(e, ((t, i, a, n) => {
                                    const r = {index: e, range: {startOffset: a, endOffset: a + i.size - 1}};
                                    return this.batchedTilesProvider.fetchTile(r, n)
                                }), t)
                            }

                            async fetchTile(e, t, i) {
                                const a = await this.getIndexEntry(e, i);
                                if (!a.isPresent()) return new Uint8Array(0);
                                const {indexEntry: n, absoluteTileOffset: r} = a.get();
                                return n.size ? t(e, n, r, i) : new Uint8Array(0)
                            }

                            async getIndexEntry(e, t) {
                                var i;
                                this.header || (this.headerLoaded ? await this.headerLoaded : (this.headerLoaded = f.loadHeader(this.comtUrl), this.header = await this.headerLoaded, this.initIndex(this.header)));
                                const {metadata: a} = this.header, {x: n, y: r, z: s} = e, l = (1 << s) - r - 1,
                                    h = a.tileMatrixSet.tileMatrix[s].tileMatrixLimits;
                                if (n < h.minTileCol || n > h.maxTileCol || l < h.minTileRow || l > h.maxTileRow) return o.Optional.empty();
                                const d = {z: s, x: n, y: l};
                                console.time("get");
                                const _ = null !== (i = this.indexCache.get(d)) && void 0 !== i ? i : await this.fetchIndexEntry(d, t);
                                console.timeEnd("get");
                                const c = this.header.dataOffset + _.offset;
                                return o.Optional.of({indexEntry: _, absoluteTileOffset: c})
                            }

                            async fetchIndexEntry(e, t) {
                                const i = this.comtIndex.getFragmentRangeForTile(e.z, e.x, e.y);
                                let a;
                                if (this.requestCache.has(i.startOffset)) a = await this.requestCache.get(i.startOffset); else {
                                    const e = this.header.indexOffset + i.startOffset,
                                        n = this.header.indexOffset + i.endOffset,
                                        r = f.fetchBinaryData(this.comtUrl, e, n, t);
                                    this.requestCache.set(i.startOffset, r);
                                    try {
                                        a = await r
                                    } finally {
                                        this.requestCache.delete(i.startOffset)
                                    }
                                }
                                return this.indexCache.setIndexFragment(i, new Uint8Array(a)), this.indexCache.get(e)
                            }

                            initIndex(e) {
                                this.indexCache = new h(this.header.metadata, new Uint8Array(this.header.partialIndex)), this.comtIndex = new r.default(e.metadata)
                            }

                            static fetchHeader(e) {
                                return f.fetchBinaryData(e, 0, f.INITIAL_CHUNK_SIZE - 1)
                            }

                            static async fetchBinaryData(e, t, i, a) {
                                const n = {headers: {range: `bytes=${t}-${i}`}};
                                let r;
                                if (a) {
                                    const e = new AbortController, {signal: t, abort: i} = e;
                                    Object.assign(n, {signal: t}), r = i.bind(e), a.register(r)
                                }
                                const s = await fetch(e, n);
                                if (null == a || a.unregister(r), !s.ok) throw new Error(s.statusText);
                                return s.arrayBuffer()
                            }

                            static async loadHeader(e) {
                                const t = await f.fetchHeader(e), i = new DataView(t);
                                if (i.getUint32(4, !0) !== f.SUPPORTED_VERSION) throw new Error("The specified version of the COMT archive is not supported.");
                                const a = i.getUint32(8, !0), n = (0, o.convertUInt40LEToNumber)(t, 12),
                                    r = f.METADATA_OFFSET_INDEX + a, s = t.slice(f.METADATA_OFFSET_INDEX, r),
                                    l = (new TextDecoder).decode(s), h = JSON.parse(l),
                                    d = Math.floor((f.INITIAL_CHUNK_SIZE - r) / f.INDEX_ENTRY_NUM_BYTES);
                                this.validateMetadata(h, d);
                                const _ = r + d * f.INDEX_ENTRY_NUM_BYTES;
                                return {indexOffset: r, dataOffset: r + n, metadata: h, partialIndex: t.slice(r, _)}
                            }

                            static validateMetadata(e, t) {
                                if ("pbf" !== e.tileFormat) throw new Error("Currently pbf (MapboxVectorTiles) is the only supported tileFormat.");
                                const i = e.tileMatrixSet, a = [void 0, f.SUPPORTED_ORDERING];
                                if (![i.fragmentOrdering, i.tileOrdering].every((e => a.some((t => t === e))))) throw new Error(`The only supported fragment and tile ordering is ${f.SUPPORTED_ORDERING}`);
                                if (void 0 !== i.tileMatrixCRS && (null == i ? void 0 : i.tileMatrixCRS.trim().toLowerCase()) !== f.SUPPORTED_TILE_MATRIX_CRS.toLowerCase()) throw new Error(`The only supported TileMatrixCRS is ${f.SUPPORTED_TILE_MATRIX_CRS}.`);
                                if (i.tileMatrix.filter((e => -1 === e.aggregationCoefficient)).reduce(((e, t) => {
                                    const i = t.tileMatrixLimits;
                                    return e + (i.maxTileCol - i.minTileCol + 1) * (i.maxTileRow - i.minTileRow + 1)
                                }), 0) > t) throw new Error("The unfragmented part (aggregationCoefficient=-1) of the index has to be part of the initial fetch. Only index fragments can be reloaded")
                            }

                            async fetchMVT(e, t, i) {
                                const a = await f.fetchBinaryData(this.comtUrl, e, e + t - 1, i), r = new Uint8Array(a);
                                return n.default.ungzip(r)
                            }
                        }

                        t.default = f, f.SUPPORTED_VERSION = 1, f.INITIAL_CHUNK_SIZE = 2 ** 19, f.METADATA_OFFSET_INDEX = 17, f.SUPPORTED_TILE_MATRIX_CRS = "WebMercatorQuad", f.SUPPORTED_ORDERING = "RowMajor", f.INDEX_ENTRY_NUM_BYTES = 9
                    }, 817: (e, t) => {
                        Object.defineProperty(t, "__esModule", {value: !0});

                        class i {
                            constructor(e) {
                                var t, a;
                                if (this.metadata = e, this.tileMatrixSet = e.tileMatrixSet, ![this.tileMatrixSet.fragmentOrdering, this.tileMatrixSet.tileOrdering].every((e => i.SUPPORTED_ORDERING.some((t => t === e))))) throw new Error(`The only supported fragment and tile ordering is ${i.SUPPORTED_ORDERING}`);
                                if (void 0 !== this.tileMatrixSet.tileMatrixCRS && (null === (t = this.tileMatrixSet) || void 0 === t ? void 0 : t.tileMatrixCRS.trim().toLowerCase()) !== i.Supported_TILE_MATRIX_CRS.toLowerCase()) throw new Error(`The only supported TileMatrixCRS is ${i.Supported_TILE_MATRIX_CRS}.`);
                                const n = null !== (a = this.metadata.tileOffsetBytes) && void 0 !== a ? a : 5;
                                this.indexEntryByteLength = n + i.NUM_BYTES_TILE_SIZE
                            }

                            getFragmentRangeForTile(e, t, i) {
                                const a = this.tileMatrixSet.tileMatrix.filter((t => t.zoom <= e));
                                let n = 0, r = 0;
                                for (const s of a) {
                                    const a = s.tileMatrixLimits;
                                    if (s.zoom === e && !this.inRange(t, i, a)) throw new Error("Specified tile index not part of the TileSet.");
                                    if (s.zoom < e) n += (a.maxTileCol - a.minTileCol + 1) * (a.maxTileRow - a.minTileRow + 1); else {
                                        const e = this.calculateSparseFragmentBounds(t, i, s.aggregationCoefficient, a);
                                        n += this.numberOfIndexEntriesBeforeFragment(e, a), r = n + (e.maxTileCol - e.minTileCol + 1) * (e.maxTileRow - e.minTileRow + 1) - 1
                                    }
                                }
                                return {
                                    index: n,
                                    startOffset: n * this.indexEntryByteLength,
                                    endOffset: (r + 1) * this.indexEntryByteLength
                                }
                            }

                            calculateIndexOffsetForTile(e, t, i) {
                                const a = this.tileMatrixSet.tileMatrix.filter((t => t.zoom <= e)).reduce(((a, n) => {
                                    const r = n.tileMatrixLimits;
                                    if (n.zoom === e && !this.inRange(t, i, r)) throw new Error("Specified tile index not part of the TileSet.");
                                    if (n.zoom < e) return a + (r.maxTileCol - r.minTileCol + 1) * (r.maxTileRow - r.minTileRow + 1) * this.indexEntryByteLength;
                                    if (-1 === n.aggregationCoefficient) {
                                        const e = i - r.minTileRow, n = r.maxTileCol - r.minTileCol + 1,
                                            s = t - r.minTileCol;
                                        return a + (e > 0 ? e * n + s : s) * this.indexEntryByteLength
                                    }
                                    {
                                        const e = this.calculateSparseFragmentBounds(t, i, n.aggregationCoefficient, r);
                                        return a + (this.numberOfIndexEntriesBeforeFragment(e, r) + (i - e.minTileRow) * (e.maxTileCol - e.minTileCol + 1) + (t - e.minTileCol)) * this.indexEntryByteLength
                                    }
                                }), 0);
                                return {offset: a, index: a / this.indexEntryByteLength}
                            }

                            inRange(e, t, i) {
                                return e >= i.minTileCol && e <= i.maxTileCol && t >= i.minTileRow && t <= i.maxTileRow
                            }

                            calculateSparseFragmentBounds(e, t, i, a) {
                                const n = 2 ** i, r = Math.floor(e / n) * n, s = Math.floor(t / n) * n,
                                    o = {minTileCol: r, minTileRow: s, maxTileCol: r + n - 1, maxTileRow: s + n - 1};
                                return this.calculateFragmentBounds(a, o)
                            }

                            calculateFragmentBounds(e, t) {
                                const i = Object.assign({}, t);
                                return e.minTileCol > t.minTileCol && (i.minTileCol = e.minTileCol), e.minTileRow > t.minTileRow && (i.minTileRow = e.minTileRow), e.maxTileCol < t.maxTileCol && (i.maxTileCol = e.maxTileCol), e.maxTileRow < t.maxTileRow && (i.maxTileRow = e.maxTileRow), i
                            }

                            numberOfIndexEntriesBeforeFragment(e, t) {
                                return (e.minTileCol - t.minTileCol) * (e.maxTileRow - t.minTileRow + 1) + (t.maxTileCol - e.minTileCol + 1) * (e.minTileRow - t.minTileRow)
                            }
                        }

                        t.default = i, i.NUM_BYTES_TILE_SIZE = 4, i.Supported_TILE_MATRIX_CRS = "WebMercatorQuad", i.SUPPORTED_ORDERING = [void 0, "RowMajor"]
                    }, 97: function (e, t, i) {
                        var a = this && this.__importDefault || function (e) {
                            return e && e.__esModule ? e : {default: e}
                        };
                        Object.defineProperty(t, "__esModule", {value: !0}), t.CancellationToken = t.convertUInt40LEToNumber = t.ComtIndex = t.ComtCache = t.HeaderFetchStrategy = void 0;
                        var n = i(738);
                        Object.defineProperty(t, "HeaderFetchStrategy", {
                            enumerable: !0, get: function () {
                                return n.HeaderFetchStrategy
                            }
                        }), Object.defineProperty(t, "ComtCache", {
                            enumerable: !0, get: function () {
                                return a(n).default
                            }
                        });
                        var r = i(817);
                        Object.defineProperty(t, "ComtIndex", {
                            enumerable: !0, get: function () {
                                return a(r).default
                            }
                        });
                        var s = i(666);
                        Object.defineProperty(t, "convertUInt40LEToNumber", {
                            enumerable: !0, get: function () {
                                return s.convertUInt40LEToNumber
                            }
                        });
                        var o = i(151);
                        Object.defineProperty(t, "CancellationToken", {
                            enumerable: !0, get: function () {
                                return a(o).default
                            }
                        })
                    }, 589: (e, t) => {
                        Object.defineProperty(t, "__esModule", {value: !0}), t.default = class {
                            constructor(e = 20) {
                                this.maxEntries = e, this.values = new Map
                            }

                            get(e) {
                                if (this.values.has(e)) {
                                    const t = this.values.get(e);
                                    return this.values.delete(e), this.values.set(e, t), t
                                }
                                return null
                            }

                            put(e, t) {
                                if (this.values.size >= this.maxEntries) {
                                    const e = this.values.keys().next().value;
                                    this.values.delete(e)
                                }
                                this.values.set(e, t)
                            }
                        }
                    }, 666: (e, t) => {
                        Object.defineProperty(t, "__esModule", {value: !0}), t.Optional = t.convertUInt40LEToNumber = void 0, t.convertUInt40LEToNumber = function (e, t) {
                            const i = new DataView(e);
                            return 256 * i.getUint32(t + 1, !0) + i.getUint8(t)
                        };

                        class i {
                            constructor(e) {
                                this._value = e
                            }

                            static of(e) {
                                return new i(e)
                            }

                            static empty() {
                                return new i(null)
                            }

                            isPresent() {
                                return null !== this._value
                            }

                            get() {
                                return this._value
                            }
                        }

                        t.Optional = i
                    }
                }, t = {};
                return function i(a) {
                    var n = t[a];
                    if (void 0 !== n) return n.exports;
                    var r = t[a] = {exports: {}};
                    return e[a].call(r.exports, r, r.exports, i), r.exports
                }(97)
            })()
        }, 229: t => {
            "use strict";
            t.exports = e
        }
    }, i = {}, function e(a) {
        var n = i[a];
        if (void 0 !== n) return n.exports;
        var r = i[a] = {exports: {}};
        return t[a].call(r.exports, r, r.exports, e), r.exports
    }(97);
    var t, i
}));
//# sourceMappingURL=maplibreComtProvider.js.map

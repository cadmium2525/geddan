// GEDDAN DRAW の BGM（著作権の切れたクラシックを自前でアレンジ）を「かなでる」の曲 JSON にする
import { writeFileSync } from 'node:fs';
// [音, 拍] の列 → 音符（null は休符）。gate で音の長さを短く（スタッカート）
function seq(list, at = 0, { gate = 0.85, vel = 0.8, tr = 0 } = {}) {
  const out = []; let t = at;
  for (const [n, d, v] of list) {
    if (n) out.push([t, tr ? shift(n, tr) : n, d * gate, v ?? vel]);
    t += d;
  }
  return out;
}
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midi(n) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); let v = NAMES.indexOf(m[1]) + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return v + (+m[3] + 1) * 12; }
function name(m) { return NAMES[m % 12] + (Math.floor(m / 12) - 1); }
function shift(n, s) { return name(midi(n) + s); }
const len = (list) => list.reduce((a, x) => a + x[1], 0);
// 和音の刻み：chords = [[拍数, [音...], 低音], ...]
function oompah(chords, at, { bassVel = 0.85, chordVel = 0.5 } = {}) {
  const bass = [], ch = []; let t = at;
  for (const [d, notes, root, fifth] of chords) {
    for (let b = 0; b < d; b++) {
      bass.push([t + b, b % 2 && fifth ? fifth : root, 0.4, bassVel]);
      for (const n of notes) ch.push([t + b + 0.5, n, 0.3, chordVel]);
    }
    t += d;
  }
  return { bass, ch };
}
const master = { loudness: -16, ceiling: -1 };
const sends = { reverb: { size: 0.8, decay: 1.2, damp: 7000, predelay: 0.01, volume: 0 }, delay: { time: '1/8d', feedback: 0.25, tone: 4000, volume: 0 } };

/* ---------- 1. 天国と地獄（オッフェンバック「地獄のオルフェ」ギャロップ） ---------- */
{
  const e = 0.5, q = 1;
  const A1 = [['C5', 2], ['D5', e], ['F5', e], ['E5', e], ['D5', e], ['G5', q], ['G5', q], ['G5', e], ['A5', e], ['E5', e], ['F5', e], ['D5', q], ['D5', q],
    ['D5', e], ['F5', e], ['E5', e], ['D5', e], ['C5', e], ['C6', e], ['B5', e], ['A5', e], ['G5', e], ['F5', e], ['E5', e], ['D5', e]];
  const A2 = [...A1.slice(0, 16), ['C5', e], ['G5', e], ['D5', e], ['E5', e], ['C5', q], [null, q]];
  const mel = [...A1, ...A2]; // 32拍
  const C = ['E4', 'G4', 'C5'], G7 = ['D4', 'F4', 'B4'], F = ['F4', 'A4', 'C5'];
  const prog = [[2, C, 'C2', 'G2'], [2, G7, 'G2', 'D2'], [2, C, 'C2', 'G2'], [2, F, 'F2', 'C2'], [2, G7, 'G2', 'D2'], [2, G7, 'G2', 'D2'], [2, C, 'C2', 'G2'], [2, G7, 'G2', 'D2']];
  const prog2 = [...prog.slice(0, 6), [2, G7, 'G2', 'D2'], [2, C, 'C2', 'G2']];
  const acc1 = oompah([...prog, ...prog2], 0), acc2 = oompah([...prog, ...prog2], 32);
  const song = {
    name: '天国と地獄（GEDDAN DRAW アレンジ）', bpm: 150, sig: [4, 4], bars: 16, key: 'C major', sends, master,
    tracks: [
      { id: 'lead', name: 'メロ', inst: 'brass', volume: -2, sends: { reverb: 0.15 }, clips: [{ at: 0, notes: seq(mel, 0, { gate: 0.8 }) }, { at: 0, notes: seq(mel, 32, { gate: 0.8, vel: 0.9 }) }] },
      { id: 'lead2', name: '8bit', inst: 'chip', volume: -9, pan: 0.2, clips: [{ at: 0, notes: seq(mel, 32, { gate: 0.6, tr: 12, vel: 0.7 }) }] },
      { id: 'chords', name: '刻み', inst: 'pizz', volume: -6, pan: -0.2, clips: [{ at: 0, notes: [...acc1.ch, ...acc2.ch] }] },
      { id: 'bass', name: 'ベース', inst: 'fmbass', volume: -3, clips: [{ at: 0, notes: [...acc1.bass, ...acc2.bass] }] },
      { id: 'drums', name: 'ドラム', kit: 'acoustic', type: 'drums', volume: -4, clips: [
        { at: 0, len: 4, repeat: 8, res: 0.25, grid: { kick: 'x...x...x...x...', snare: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' } },
        { at: 32, len: 4, repeat: 8, res: 0.25, grid: { kick: 'x...x...x...x...', snare: '..x...x...x.x.xx', ohat: '..x...x...x...x.', hat: 'x...x...x...x...' } },
        { at: 0, len: 4, res: 0.25, grid: { crash: 'x...............' } }, { at: 32, len: 4, res: 0.25, grid: { crash: 'x...............' } }] },
    ],
  };
  writeFileSync('tengoku.json', JSON.stringify(song));
}

/* ---------- 2. 山の魔王の宮殿にて（グリーグ「ペール・ギュント」） ---------- */
{
  const e = 0.5;
  const A = [['B3', e], ['C#4', e], ['D4', e], ['E4', e], ['F#4', e], ['D4', e], ['F#4', 1],
    ['F4', e], ['C#4', e], ['F4', 1], ['E4', e], ['C4', e], ['E4', 1],
    ['B3', e], ['C#4', e], ['D4', e], ['E4', e], ['F#4', e], ['D4', e], ['F#4', e], ['B4', e],
    ['A4', e], ['F#4', e], ['D4', e], ['F#4', e], ['A4', 2]]; // 16拍
  const Ap = A.map(([n, d]) => [shift(n, 7), d]);
  const mel = [...A, ...Ap]; // 32拍
  const bassLine = (at, tr) => {
    const roots = ['B1', 'F#1', 'B1', 'D2'];
    const out = [];
    roots.forEach((r, i) => { for (let b = 0; b < 4; b++) out.push([at + i * 4 + b, shift(r, tr), 0.35, b === 0 ? 0.95 : 0.75]); });
    return out;
  };
  const bass = [...bassLine(0, 0), ...bassLine(16, 7), ...bassLine(32, 0), ...bassLine(48, 7)];
  const song = {
    name: '山の魔王の宮殿にて（GEDDAN DRAW アレンジ）', bpm: 138, sig: [4, 4], bars: 16, key: 'B minor', sends, master,
    tracks: [
      { id: 'pizz', name: 'ピチカート', inst: 'pizz', volume: -1, clips: [{ at: 0, notes: seq(mel, 0, { gate: 0.5 }) }] },
      { id: 'lead', name: 'ブラス', inst: 'brass', volume: -2, sends: { reverb: 0.2 }, clips: [{ at: 0, notes: seq(mel, 32, { gate: 0.7, tr: 12, vel: 0.9 }) }] },
      { id: 'str', name: 'ストリングス', inst: 'strings', volume: -8, clips: [{ at: 0, notes: seq(mel, 32, { gate: 0.9 }) }] },
      { id: 'bass', name: 'ベース', inst: 'fmbass', volume: -3, clips: [{ at: 0, notes: bass }] },
      { id: 'drums', name: 'ドラム', kit: 'cinematic', type: 'drums', volume: -4, clips: [
        { at: 0, len: 4, repeat: 8, res: 0.25, grid: { kick: 'x.......x.......', tom2: '....x.......x...', hat: '..x...x...x...x.' } },
        { at: 32, len: 4, repeat: 8, res: 0.25, grid: { kick: 'x...x...x...x...', snare: '....x.......x.x.', tom1: '..............xx', hat: 'x.x.x.x.x.x.x.x.' } },
        { at: 32, len: 4, res: 0.25, grid: { crash: 'x...............' } }] },
    ],
  };
  writeFileSync('maou.json', JSON.stringify(song));
}

/* ---------- 3. アイネ・クライネ・ナハトムジーク（モーツァルト） ---------- */
{
  const e = 0.5;
  const A = [['G4', 1], [null, e], ['D4', e], ['G4', 1], [null, e], ['D4', e], ['G4', e], ['D4', e], ['G4', e], ['B4', e], ['D5', 2],
    ['C5', 1], [null, e], ['A4', e], ['C5', 1], [null, e], ['A4', e], ['C5', e], ['A4', e], ['F#4', e], ['A4', e], ['D4', 2]]; // 16拍
  const mel = [...A, ...A.map(([n, d]) => [n && shift(n, 12), d])]; // 32拍
  const G = ['B3', 'D4', 'G4'], D7 = ['A3', 'C4', 'F#4'];
  const prog = [[8, G, 'G1', 'D2'], [8, D7, 'D2', 'A1']];
  const a = oompah([...prog, ...prog, ...prog, ...prog], 0, { chordVel: 0.45 });
  const song = {
    name: 'アイネ・クライネ・ナハトムジーク（GEDDAN DRAW アレンジ）', bpm: 132, sig: [4, 4], bars: 16, key: 'G major', sends, master,
    tracks: [
      { id: 'lead', name: 'メロ', inst: 'strings', volume: -1, sends: { reverb: 0.2 }, clips: [{ at: 0, notes: seq(mel, 0, { gate: 0.9 }) }, { at: 0, notes: seq(mel, 32, { gate: 0.9 }) }] },
      { id: 'lead2', name: 'シンセ', inst: 'squarelead', volume: -10, pan: 0.2, clips: [{ at: 0, notes: seq(mel, 32, { gate: 0.6, tr: 12, vel: 0.7 }) }] },
      { id: 'chords', name: '刻み', inst: 'chordstab', volume: -9, clips: [{ at: 0, notes: a.ch }] },
      { id: 'bass', name: 'ベース', inst: 'synthbass', volume: -3, clips: [{ at: 0, notes: a.bass }] },
      { id: 'drums', name: 'ドラム', kit: 'house', type: 'drums', volume: -3, clips: [
        { at: 0, len: 4, repeat: 4, res: 0.25, grid: { kick: 'x...x...x...x...', hat: '..x...x...x...x.' } },
        { at: 16, len: 4, repeat: 12, res: 0.25, grid: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.', shaker: 'xxxxxxxxxxxxxxxx' } },
        { at: 32, len: 4, res: 0.25, grid: { crash: 'x...............' } }] },
    ],
  };
  writeFileSync('eine.json', JSON.stringify(song));
}

"""Generate the promo soundtrack (original music + SFX synced to index.html).

Everything is synthesized here, so there is nothing to license.
Run:  python scripts/make_audio.py   ->  assets/audio/soundtrack.wav
The event times below mirror the GSAP timeline in index.html; move them together.
"""

import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 25.0
N = int(SR * DUR)
rng = np.random.default_rng(7)  # fixed seed: same file every run

L = np.zeros(N)
R = np.zeros(N)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    """Mix a mono signal at time `at` (s), pan -1..1."""
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, a, d, total):
    """Attack/decay (seconds) envelope over `total` seconds, linear attack, exp release."""
    t = t_axis(total)
    e = np.minimum(1.0, t / max(a, 1e-4))
    rel = np.clip((t - (total - d)) / max(d, 1e-4), 0, 1)
    return e * (1 - rel) ** 2


def lowpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def highpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 2 / np.sqrt(1 + (f / fc) ** 4), len(x))


# ---------- instruments ----------


def pad(notes, sec, gain=0.08):
    t = t_axis(sec)
    out = np.zeros_like(t)
    for m in notes:
        m = m + 12 if m < 48 else m
        for det in (-0.08, 0.0, 0.07):
            f = hz(m + det)
            for k, a in ((1, 1.0), (2, 0.35), (3, 0.18), (4, 0.08)):
                out += a * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28))
    return out * env(len(t), 0.6, 0.9, sec) * gain / len(notes)


def pluck(m, sec=0.9, gain=0.18):
    t = t_axis(sec)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 6) * np.minimum(1, t / 0.004) * gain


def bass(m, sec, gain=0.2):
    t = t_axis(sec)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * env(len(t), 0.01, 0.15, sec) * np.exp(-t * 1.2) * gain


def kick(gain=0.55):
    t = t_axis(0.45)
    f = 45 + 95 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * gain


def hat(gain=0.06):
    t = t_axis(0.08)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 60) * gain


def snap(gain=0.18):
    t = t_axis(0.25)
    n = highpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 22)
    return (n + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)) * gain


def click(gain=0.35):
    t = t_axis(0.05)
    s = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160) + 0.5 * highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300)
    return s * gain


def bloop(m, gain=0.22):
    t = t_axis(0.5)
    f = hz(m) * (1 + 0.5 * np.exp(-t * 40))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.exp(-t * 8) * gain


def whoosh(sec=0.7, gain=0.25, rising=True):
    t = t_axis(sec)
    n = rng.standard_normal(len(t))
    lo = lowpass(n, 1200)
    hi = highpass(n, 2500)
    k = t / sec if rising else 1 - t / sec
    shape = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2
    return (lo * (1 - k) + hi * k) * shape * gain


def shimmer(base=84, gain=0.12):
    out = np.zeros(int(1.6 * SR))
    for j, m in enumerate((base, base + 4, base + 7, base + 11, base + 12)):
        t = t_axis(1.6 - j * 0.06)
        s = np.sin(2 * np.pi * hz(m) * t * (1 + 0.002 * np.sin(2 * np.pi * 5 * t))) * np.exp(-t * 3.2)
        i = int(j * 0.06 * SR)
        out[i : i + len(s)] += s
    return out * gain


def crackle(gain=0.25):
    t = t_axis(0.06)
    return highpass(rng.standard_normal(len(t)), 2000) * np.exp(-t * 90) * gain + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 50) * gain * 0.5


def riser(sec, f0, f1, gain=0.1):
    t = t_axis(sec)
    f = f0 * (f1 / f0) ** (t / sec)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.sin(np.pi * t / sec) ** 1.5 * gain


def impact(gain=0.6):
    t = t_axis(1.8)
    f = 38 + 60 * np.exp(-t * 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 2.5)
    air = lowpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 6) * 0.3
    return (body + air) * gain


# ---------- score ----------
BEAT = 0.55  # ~109 BPM; groove starts with the app window
G0 = 6.05

# Intro (0-6 s): drone, flicker, bulb on, logo
add(pad([48, 55], 6.3, 0.05) * np.linspace(0.2, 1, int(6.3 * SR)), 0.0)
add(riser(1.5, 80, 320, 0.05), 0.1)
for tf in (1.2, 1.42):
    add(crackle(0.22), tf, pan=-0.1)
add(impact(0.45), 1.62)
add(pad([48, 52, 55, 59, 62], 1.8, 0.10), 1.62)  # Cmaj9 swell
add(whoosh(0.6, 0.22), 2.65)
add(pad([45, 52, 55, 60, 64], 3.0, 0.10), 3.15)  # Am9 under the logo
add(shimmer(84, 0.12), 3.55, pan=0.2)
add(shimmer(91, 0.06), 4.4, pan=-0.2)
add(whoosh(0.55, 0.18, rising=False), 5.6)

# Groove (6.05-16.9 s): Cmaj9 | Am9 | Fmaj7 | G6 (one bar = 4 beats)
CHORDS = [
    (36, [48, 52, 55, 59, 62]),
    (33, [45, 52, 55, 60, 64]),
    (29, [41, 48, 52, 57, 60]),
    (31, [43, 50, 55, 59, 64])
]
ARP = [0, 2, 4, 3, 1, 3, 4, 2]
bars = 5
for b in range(bars):
    root, notes = CHORDS[b % 4]
    tb = G0 + b * 4 * BEAT
    add(pad(notes, 4 * BEAT + 0.6, 0.075), tb)
    for k in range(4):
        tk = tb + k * BEAT
        if tk > 16.9:
            break
        add(kick(0.55 if b > 0 else 0.4), tk)
        add(hat(0.05), tk + BEAT / 2, pan=0.3)
        if k in (1, 3) and b > 0:
            add(snap(0.12), tk, pan=-0.1)
        add(bass(root, BEAT * 0.9), tk)
    for k in range(8):
        tk = tb + k * BEAT / 2
        if tk > 16.9:
            break
        add(pluck(notes[ARP[k]] + 12, gain=0.1), tk, pan=0.35 if k % 2 else -0.35)

# UI actions
add(click(0.35), 7.7)
add(bloop(76, 0.12), 7.72)
add(click(0.3), 9.05)
add(riser(1.4, 300, 900, 0.045), 9.15)
add(click(0.35), 11.85)
add(whoosh(0.35, 0.1), 11.9)
for t_click, m in ((12.85, 72), (13.95, 76), (15.05, 79), (16.1, 84)):
    add(click(0.32), t_click)
    add(bloop(m, 0.2), t_click + 0.02, pan=0.15)
    add(shimmer(m + 12, 0.035), t_click + 0.05)

# Features (17-21 s): half-time, chip ticks on a pentatonic run
add(whoosh(0.6, 0.22), 16.6)
add(pad([41, 48, 52, 57, 60], 2.3, 0.09), 17.0)
add(pad([43, 50, 55, 59, 62], 2.0, 0.09), 19.2)
for k in range(8):
    add(kick(0.4) if k % 2 == 0 else hat(0.05), 17.0 + k * BEAT)
for k, m in enumerate((72, 74, 76, 79, 81, 84)):
    add(pluck(m, 0.6, 0.12), 17.55 + k * 0.32, pan=-0.3 if k % 2 else 0.3)
add(riser(0.9, 200, 1200, 0.05), 20.2)
add(whoosh(0.5, 0.2), 20.55)

# CTA (21-25 s): final chord + impact, star shimmer, ring out
add(impact(0.55), 21.1)
add(pad([36, 48, 52, 55, 59, 62, 67], 3.9, 0.12), 21.1)
add(bass(24, 2.5, 0.35), 21.1)
add(shimmer(84, 0.11), 21.35, pan=0.15)
add(pluck(84, 1.2, 0.1), 21.95)
add(pluck(91, 1.2, 0.07), 22.9)

# ---------- reverb + master ----------
def highpass_soft(x, fc=45):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 2 / (1 + (f / fc) ** 2), len(x))


REV = np.random.default_rng(11)


def reverb(x, sec=1.8, mix=0.22):
    ir = REV.standard_normal(int(sec * SR)) * np.exp(-np.arange(int(sec * SR)) / SR * 4.5)
    ir = lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    n = len(x) + len(ir)
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return x * (1 - mix) + wet * mix


L = highpass_soft(reverb(L))
R = highpass_soft(reverb(R))
fade = np.ones(N)
fo = int(1.2 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
fade[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
mix = np.stack([L * fade, R * fade], axis=1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # soft clip
mix *= 0.89 / np.max(np.abs(mix))  # -1 dBFS peak

out = Path(__file__).resolve().parent.parent / "assets" / "audio" / "soundtrack.wav"
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(out)

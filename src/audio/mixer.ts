// 소리 믹서: 소리마다 플레이어 1개, 반복 재생, 소리별 볼륨, 전체 페이드.
// 화면을 옮겨 다녀도 소리가 이어지도록 화면 밖(모듈 단위)에서 관리합니다.
import { useSyncExternalStore } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { PREVIEW_SECONDS, soundById } from '../data/catalog';
import type { MixItem } from '../data/types';

type Listener = () => void;

class Mixer {
  private players = new Map<string, AudioPlayer>();
  private volumes = new Map<string, number>();
  private master = 1;
  private lead: AudioPlayer | null = null; // 잠금화면을 담당하는 대표 플레이어
  private leadSub: { remove: () => void } | null = null;
  private lastInternalChange = 0;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private preview: { player: AudioPlayer; timer: ReturnType<typeof setTimeout> } | null = null;
  private listeners = new Set<Listener>();
  playing = false;

  async init() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        // 잠금화면 컨트롤(안드로이드 장시간 백그라운드 재생에 필요)은 doNotMix 여야 동작
        interruptionMode: 'doNotMix',
      });
    } catch {
      // 웹 등 지원하지 않는 환경
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  getMix(): MixItem[] {
    return [...this.volumes.entries()].map(([soundId, volume]) => ({ soundId, volume }));
  }

  private ensurePlayer(soundId: string) {
    let p = this.players.get(soundId);
    if (!p) {
      const sound = soundById(soundId);
      if (!sound) return null;
      p = createAudioPlayer(sound.file);
      p.loop = true;
      this.players.set(soundId, p);
    }
    return p;
  }

  private apply(soundId: string) {
    const p = this.players.get(soundId);
    if (p) p.volume = (this.volumes.get(soundId) ?? 0) * this.master;
  }

  /** 믹스 전체를 바꿉니다. 빠진 소리는 정리하고, 새 소리는 플레이어를 만듭니다. */
  setMix(mix: MixItem[]) {
    const keep = new Set(mix.map((m) => m.soundId));
    for (const [id, p] of this.players) {
      if (!keep.has(id)) {
        p.pause();
        p.remove();
        this.players.delete(id);
        this.volumes.delete(id);
      }
    }
    for (const m of mix) {
      this.volumes.set(m.soundId, m.volume);
      const p = this.ensurePlayer(m.soundId);
      if (!p) continue;
      this.apply(m.soundId);
      if (this.playing && !p.playing) p.play();
    }
    this.updateLead();
    this.emit();
  }

  setVolume(soundId: string, volume: number) {
    this.volumes.set(soundId, volume);
    this.apply(soundId);
    this.emit();
  }

  play() {
    this.stopPreview();
    this.cancelFade();
    this.setMaster(1);
    this.lastInternalChange = Date.now();
    this.playing = true;
    this.players.forEach((p) => p.play());
    this.updateLead();
    this.emit();
  }

  pause() {
    this.lastInternalChange = Date.now();
    this.playing = false;
    this.players.forEach((p) => p.pause());
    this.emit();
  }

  stop() {
    this.cancelFade();
    this.pause();
    this.setMix([]);
    this.setMaster(1);
  }

  setMaster(v: number) {
    this.master = Math.max(0, Math.min(1, v));
    for (const id of this.players.keys()) this.apply(id);
  }

  /** seconds 동안 전체 볼륨을 0으로 낮춘 뒤 멈춥니다. */
  fadeOut(seconds: number, onDone?: () => void) {
    this.cancelFade();
    const start = this.master;
    const t0 = Date.now();
    this.fadeTimer = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / (seconds * 1000));
      this.setMaster(start * (1 - k));
      if (k >= 1) {
        this.cancelFade();
        this.pause();
        onDone?.();
      }
    }, 250);
  }

  cancelFade() {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  /** 잠긴 소리 10초 미리듣기 */
  playPreview(soundId: string) {
    this.stopPreview();
    const sound = soundById(soundId);
    if (!sound) return;
    const player = createAudioPlayer(sound.file);
    player.volume = 0.7;
    player.play();
    const timer = setTimeout(() => this.stopPreview(), PREVIEW_SECONDS * 1000);
    this.preview = { player, timer };
  }

  stopPreview() {
    if (!this.preview) return;
    clearTimeout(this.preview.timer);
    this.preview.player.pause();
    this.preview.player.remove();
    this.preview = null;
  }

  // 잠금화면은 플레이어 하나만 제어할 수 있으므로 대표 플레이어의 재생/정지를 나머지에도 반영
  private updateLead() {
    const first = this.players.values().next().value ?? null;
    if (first === this.lead) return;
    try {
      this.lead?.clearLockScreenControls();
    } catch {}
    this.leadSub?.remove();
    this.lead = first;
    this.leadSub = null;
    if (!first) return;
    try {
      first.setActiveForLockScreen(true, { title: '쉼표 기도', artist: '편안한 밤을 위한 소리' });
    } catch {}
    this.leadSub = first.addListener('playbackStatusUpdate', (s: AudioStatus) => this.onLeadStatus(s));
  }

  private onLeadStatus(s: AudioStatus) {
    if (Date.now() - this.lastInternalChange < 1000) return;
    if (s.playing === this.playing) return;
    // 잠금화면이나 전화 등 외부에서 재생 상태가 바뀜
    this.playing = s.playing;
    this.players.forEach((p) => {
      if (p === this.lead) return;
      if (s.playing) p.play();
      else p.pause();
    });
    this.emit();
  }
}

export const mixer = new Mixer();

/** 화면에서 재생 중 여부를 구독 */
export function useMixerPlaying() {
  return useSyncExternalStore(
    (fn) => {
      const off = mixer.subscribe(fn);
      return () => void off();
    },
    () => mixer.playing,
  );
}

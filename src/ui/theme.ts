// 지친 사람을 위한 화면 원칙: 버튼은 크게, 글자는 적게, 어두운 배경이 기본
export const colors = {
  bgTop: '#2a3f8f',
  bgMid: '#3b4fb8',
  bgBottom: '#5b4fcf',
  night: '#0e1230',
  card: 'rgba(255,255,255,0.10)',
  cardStrong: 'rgba(255,255,255,0.18)',
  cardBorder: 'rgba(255,255,255,0.16)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.5)',
  accent: '#ffffff',
  accentText: '#1d2560',
  gold: '#ffd98a',
};

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };

export const gradient = [colors.bgTop, colors.bgMid, colors.bgBottom] as const;

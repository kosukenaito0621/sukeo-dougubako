/**
 * シーン（背景）の一覧。アプリの scene にはここにあるものだけ書ける（ビルド時にチェックされる）。
 * 新しいシーンを足す方法は README「シーン（背景）の追加方法」を参照。
 */
export const SCENES = {
  wall: { label: '壁', note: 'オープニング' },
  kitchen: { label: 'キッチン', note: '' },
  veranda: { label: 'ベランダ・窓辺', note: '' },
  terrarium: { label: 'テラリウム', note: '' },
  home: { label: 'すけおの家', note: 'エンディング' },
} as const;

export type SceneKey = keyof typeof SCENES;
export const SCENE_KEYS = Object.keys(SCENES) as SceneKey[];
export const isSceneKey = (k: string): k is SceneKey => k in SCENES;

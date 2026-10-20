/**
 * シーン名 → 背景の絵（src/components/scenes/*.astro）。
 * 新しいシーンを足すときは、ここと keys.ts と src/styles/tokens.css の3か所に足す（README 参照）。
 */
import SceneHome from '../components/scenes/SceneHome.astro';
import SceneKitchen from '../components/scenes/SceneKitchen.astro';
import SceneTerrarium from '../components/scenes/SceneTerrarium.astro';
import SceneVeranda from '../components/scenes/SceneVeranda.astro';
import SceneWall from '../components/scenes/SceneWall.astro';
import type { SceneKey } from './keys';

export const BACKGROUNDS: Record<SceneKey, typeof SceneWall> = {
  wall: SceneWall,
  kitchen: SceneKitchen,
  veranda: SceneVeranda,
  terrarium: SceneTerrarium,
  home: SceneHome,
};

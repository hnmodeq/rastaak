/**
 * 3D building name plaques — source of truth.
 * Saved automatically from 3D Studio.
 */

export const BUILDING_NAMES_EVENT = 'rastaak-building-names-changed';

export const BUILDING_NAME_SIDES = ['front', 'back', 'left', 'right'] as const;

export type BuildingNameSide = (typeof BUILDING_NAME_SIDES)[number];

export interface BuildingNamePlate {
  id: string;
  building: string;
  text: string;
  size: number;
  color: number;
  side: BuildingNameSide;
  position: [number, number, number];
  extrude: number;
}

export const BUILDING_NAMES: BuildingNamePlate[] = [
  {
    id: 'hyper',
    building: 'Hyper Market Building',
    text: 'هایپر مارکت',
    size: 0.13,
    color: 0xf5f5f2,
    side: 'front',
    position: [0, 0, 0],
    extrude: 0.045,
  },
  {
    id: 'b7',
    building: 'Building 7',
    text: 'سازمان دولتی',
    size: 0.22,
    color: 0xf5f5f2,
    side: 'front',
    position: [0, 0, 0],
    extrude: 0.06,
  },
  {
    id: 'b30',
    building: 'Building 30',
    text: 'بانک',
    size: 0.16,
    color: 0xf5f5f2,
    side: 'front',
    position: [0, 0, 0],
    extrude: 0.05,
  },
  {
    id: 'b34',
    building: 'Building 34',
    text: 'شرکت خصوصی',
    size: 0.11,
    color: 0xf5f5f2,
    side: 'front',
    position: [0, 0, 0],
    extrude: 0.04,
  },
];

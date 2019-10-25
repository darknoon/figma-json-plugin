// Copyright 2019 Andrew Pouliot

export type Base64String = string;

export interface DumpedFigma {
  objects: SceneNode[];
  images: { [hash: string]: Base64String };
}

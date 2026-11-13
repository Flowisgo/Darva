import React from "react";
import { Composition, Still } from "remotion";
import { Demo, FPS, layout } from "./Demo";
import { Poster } from "./Poster";

export const Root: React.FC = () => {
  const { total } = layout();
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={total} fps={FPS} width={1920} height={1080} defaultProps={{ narrated: false }} />
      <Composition id="DemoNarrated" component={Demo} durationInFrames={total} fps={FPS} width={1920} height={1080} defaultProps={{ narrated: true }} />
      <Still id="Poster" component={Poster} width={1920} height={1080} />
    </>
  );
};

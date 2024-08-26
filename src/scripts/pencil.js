export const drawScribble = (scribbles, currentShapeId, x, y, setScribbles) => {
  setScribbles((scribbles) =>
    scribbles.map((scribble) => {
      if (scribble.id === currentShapeId) {
        return {
          ...scribble,
          points: [...scribble.points, x, y],
        };
      }
      return scribble;
    })
  );
};
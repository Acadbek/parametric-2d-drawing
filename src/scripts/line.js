export const drawLine = (lines, currentShapeId, x, y, setLines) => {
  setLines((lines) =>
    lines.map((line) => {
      if (line.id === currentShapeId) {
        return {
          ...line,
          points: [line.points[0], line.points[1], x, y],
        };
      }
      return line;
    })
  );
};
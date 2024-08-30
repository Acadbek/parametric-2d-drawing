export const drawArc = (arc, currentShapeId, x, y, setArcs) => {
  setArcs((prevArcs) =>
    prevArcs.map((arc) =>
      arc.id === currentShapeId.current
        ? {
          ...arc,
          outerRadius: Math.hypot(x - arc.x, y - arc.y), // Update radius based on cursor distance
          angle: (Math.atan2(y - arc.y, x - arc.x) * 180) / Math.PI, // Update angle
        }
        : arc
    )
  );
};

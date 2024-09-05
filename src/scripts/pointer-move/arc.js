export const drawArc = (e, arcs, setArcs) => {
  const pos = e.target.getStage().getPointerPosition();
  const dx = pos.x - arcs[arcs.length - 1].x;
  const dy = pos.y - arcs[arcs.length - 1].y;
  const radius = Math.sqrt(dx * dx + dy * dy);

  setArcs((prevArcs) => {
    const updatedArcs = [...prevArcs];
    const lastArc = updatedArcs[updatedArcs.length - 1];

    updatedArcs[updatedArcs.length - 1] = {
      ...lastArc,
      outerRadius: Math.max(radius, 0),
      innerRadius: Math.max(radius - 0, 70),  // Adjust thickness here
      angle: (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360,
    };

    return updatedArcs;
  });
};
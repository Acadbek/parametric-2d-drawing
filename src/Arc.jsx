import React, { useState, useRef } from 'react';
import { Stage, Layer, Arc } from 'react-konva';

const ResizableArcs = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [arcs, setArcs] = useState([]);
  const stageRef = useRef(null);

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setArcs([
      ...arcs,
      {
        x: pos.x,
        y: pos.y,
        innerRadius: 10,
        outerRadius: 10,
        angle: 0,
        rotation: 180,
      },
    ]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const pos = e.target.getStage().getPointerPosition();
    const dx = pos.x - arcs[arcs.length - 1].x;
    const dy = pos.y - arcs[arcs.length - 1].y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Update the last arc's properties
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

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={stageRef}
    >
      <Layer>
        {arcs.map((arcProps, index) => (
          <Arc
            key={index}
            {...arcProps}
            stroke="blue"
            strokeWidth={2}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default ResizableArcs;

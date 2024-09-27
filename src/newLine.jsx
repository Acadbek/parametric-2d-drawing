import React, { useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const LineDrawing = () => {
  const stageRef = useRef(null);
  const lineRef = useRef(null);

  const handleClick = (e) => {
    console.log(e);
    
    const point = e.target.getAbsolutePosition();
    lineRef.current.points().push(point.x, point.y);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
      <Layer>
        <Line
          stroke="black"
          strokeWidth={2}
          points={[3, 5, 6, 4]}
          ref={lineRef}
          onClick={handleClick}
        />
      </Layer>
    </Stage>
  );
};

export default LineDrawing;
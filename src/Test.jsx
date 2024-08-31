import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import useImage from 'use-image';

const App = () => {
  const [image] = useImage('/hatch.jpg'); // Image path
  const [rects, setRects] = useState([]);
  const [dragStart, setDragStart] = useState(null);

  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setDragStart({ x, y });
  };

  const handleMouseMove = (e) => {
    if (dragStart) {
      const { x, y } = e.target.getStage().getPointerPosition();
      const newRect = {
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: Math.abs(dragStart.x - x),
        height: Math.abs(dragStart.y - y),
      };
      setRects([newRect]);
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {rects.map((rect, index) => (
          <Rect
            key={index}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fillPatternImage={image}
           
            stroke="black"
            strokeWidth={4}
            cornerRadius={10}
            draggable
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default App;

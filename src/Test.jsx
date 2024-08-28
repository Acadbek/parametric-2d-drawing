import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const HoverShape = () => {
  // State to manage the hover state and position of the tooltip
  const [hoveredRect, setHoveredRect] = useState(null);

  // Example rectangles data
  const rectangles = [
    { id: 1, x: 50, y: 60, width: 100, height: 80 },
    { id: 2, x: 200, y: 100, width: 120, height: 100 },
  ];

  // Function to handle mouse enter
  const handleMouseEnter = (rect) => {
    setHoveredRect(rect);
  };

  // Function to handle mouse leave
  const handleMouseLeave = () => {
    setHoveredRect(null);
  };

  return (
    <div>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {rectangles.map((rectangle) => (
            <Rect
              key={rectangle.id}
              x={rectangle.x}
              y={rectangle.y}
              width={rectangle.width}
              height={rectangle.height}
              fill="transparent"
              stroke="black"
              strokeWidth={2}
              onMouseEnter={() => handleMouseEnter(rectangle)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </Layer>
      </Stage>

      {/* Conditionally render the div element */}
     
    </div>
  );
};

export default HoverShape;

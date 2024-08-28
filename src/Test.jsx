import React, { useState } from 'react';
import { Stage, Layer, Rect, Circle, Arc, Line } from 'react-konva';

const App = () => {
  // Initial state for shape properties
  const [shapes, setShapes] = useState({
    rectangle: { x: 50, y: 60, width: 100, height: 100 },
    circle: { x: 200, y: 200, radius: 50 },
    arc: { x: 400, y: 200, innerRadius: 40, outerRadius: 50, angle: 90 },
    spline: { points: [60, 300, 100, 350, 150, 300, 200, 350], tension: 0.5 },
  });

  // Handle input changes
  const handleInputChange = (shape, property, value) => {
    setShapes((prevShapes) => ({
      ...prevShapes,
      [shape]: {
        ...prevShapes[shape],
        [property]: property === 'points' ? value.split(',').map(Number) : parseFloat(value),
      },
    }));
  };

  return (
    <div>
      <div>
        {/* Input fields for rectangle */}
        <h3>Rectangle</h3>
        <label>
          Width:
          <input
            type="number"
            value={shapes.rectangle.width}
            onChange={(e) => handleInputChange('rectangle', 'width', e.target.value)}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            value={shapes.rectangle.height}
            onChange={(e) => handleInputChange('rectangle', 'height', e.target.value)}
          />
        </label>

        {/* Input fields for circle */}
        <h3>Circle</h3>
        <label>
          Radius:
          <input
            type="number"
            value={shapes.circle.radius}
            onChange={(e) => handleInputChange('circle', 'radius', e.target.value)}
          />
        </label>

        {/* Input fields for arc */}
        <h3>Arc</h3>
        <label>
          Inner Radius:
          <input
            type="number"
            value={shapes.arc.innerRadius}
            onChange={(e) => handleInputChange('arc', 'innerRadius', e.target.value)}
          />
        </label>
        <label>
          Outer Radius:
          <input
            type="number"
            value={shapes.arc.outerRadius}
            onChange={(e) => handleInputChange('arc', 'outerRadius', e.target.value)}
          />
        </label>
        <label>
          Angle:
          <input
            type="number"
            value={shapes.arc.angle}
            onChange={(e) => handleInputChange('arc', 'angle', e.target.value)}
          />
        </label>

        {/* Input fields for spline */}
        <h3>Spline</h3>
        <label>
          Points (comma-separated):
          <input
            type="text"
            value={shapes.spline.points.join(',')}
            onChange={(e) => handleInputChange('spline', 'points', e.target.value)}
          />
        </label>
        <label>
          Tension:
          <input
            type="number"
            step="0.1"
            value={shapes.spline.tension}
            onChange={(e) => handleInputChange('spline', 'tension', e.target.value)}
          />
        </label>
      </div>

      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {/* Rectangle Shape */}
          <Rect
            x={shapes.rectangle.x}
            y={shapes.rectangle.y}
            width={shapes.rectangle.width}
            height={shapes.rectangle.height}
            fill="lightblue"
            draggable
          />

          {/* Circle Shape */}
          <Circle
            x={shapes.circle.x}
            y={shapes.circle.y}
            radius={shapes.circle.radius}
            fill="orange"
            draggable
          />

          {/* Arc Shape */}
          <Arc
            x={shapes.arc.x}
            y={shapes.arc.y}
            innerRadius={shapes.arc.innerRadius}
            outerRadius={shapes.arc.outerRadius}
            angle={shapes.arc.angle}
            fill="green"
            draggable
          />

          {/* Spline Shape */}
          <Line
            points={shapes.spline.points}
            stroke="purple"
            strokeWidth={2}
            tension={shapes.spline.tension}
            lineCap="round"
            lineJoin="round"
            draggable
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default App;

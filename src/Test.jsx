import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';

const App = () => {
  const [rectProps, setRectProps] = useState({
    x: 50,
    y: 50,
    width: 100,
    height: 100,
  });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const stageRef = useRef(null);
  const layerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { x, y } = e.target.getStage().getPointerPosition();
    setStartX(x);
    setStartY(y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = e.target.getStage().getPointerPosition();
    const width = x - startX;
    const height = y - startY;
    setRectProps({
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRectProps({
      ...rectProps,
      [name]: Number(value),
    });
  };

  return (
    <div>
      <div>
        <label>
          X: <input type="number" name="x" value={rectProps.x} onChange={handleInputChange} />
        </label>
        <label>
          Y: <input type="number" name="y" value={rectProps.y} onChange={handleInputChange} />
        </label>
        <label>
          Width: <input type="number" name="width" value={rectProps.width} onChange={handleInputChange} />
        </label>
        <label>
          Height: <input type="number" name="height" value={rectProps.height} onChange={handleInputChange} />
        </label>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          <Rect
            x={rectProps.x}
            y={rectProps.y}
            width={rectProps.width}
            height={rectProps.height}
            fill="blue"
            draggable
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default App;

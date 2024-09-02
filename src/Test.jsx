import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

function App() {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const stageRef = useRef();

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewRect({
      x,
      y,
      width: 0,
      height: 0,
      id: `rect${rectangles.length + 1}`,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewRect((prevRect) => {
      if (!prevRect) return null;
      return {
        ...prevRect,
        width: x - prevRect.x,
        height: y - prevRect.y,
      };
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (newRect) {
      setRectangles([...rectangles, newRect]);
      setNewRect(null);
    }
  };

  const handleShowParams = () => {
    setShowParams((prev) => !prev);
  };

  return (
    <div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {rectangles.map((rect) => (
            <React.Fragment key={rect.id}>
              <Rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="blue"
                stroke="black"
                strokeWidth={2}
              />
              {showParams && (
                <>
                  <Text
                    x={rect.x + rect.width / 2 - 40}
                    y={rect.y - 20}
                    text={`W: ${Math.abs(Math.round(rect.width))}`}
                    fontSize={16}
                    fill="black"
                  />
                  <Text
                    x={rect.x + rect.width + 10}
                    y={rect.y + rect.height / 2 - 10}
                    text={`H: ${Math.abs(Math.round(rect.height))}`}
                    fontSize={16}
                    fill="black"
                  />
                  <Text
                    x={rect.x + rect.width / 2 - 50}
                    y={rect.y + rect.height + 10}
                    text={`P: ${Math.round(2 * (Math.abs(rect.width) + Math.abs(rect.height)))}`}
                    fontSize={16}
                    fill="black"
                  />
                </>
              )}
            </React.Fragment>
          ))}
          {newRect && (
            <Rect
              x={newRect.x}
              y={newRect.y}
              width={newRect.width}
              height={newRect.height}
              fill="blue"
              stroke="black"
              strokeWidth={2}
            />
          )}
        </Layer>
      </Stage>
      <button onClick={handleShowParams}>Show Parameters</button>
    </div>
  );
}

export default App;

import React, { useRef, useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";

const App = () => {
  const stageRef = useRef();
  const layerRef = useRef(null);
  const transformerRef = useRef();
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [scribbles, setScribbles] = useState([]);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 600, height: window.innerHeight });
  const [selectedShape, setSelectedShape] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - 600,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectShape = (e) => {
    const shape = e.target;
    setSelectedShape(shape);
  };

  const handlePropertyChange = (e, property) => {
    if (selectedShape) {
      const value = e.target.value;
      const newProps = { ...selectedShape.attrs, [property]: value };
      selectedShape.setAttrs(newProps);
      setSelectedShape({ ...selectedShape, attrs: newProps });
      layerRef.current.getLayer().batchDraw();
    }
  };

  const renderInputFields = () => {
    if (!selectedShape) return null;

    const { x, y, width, height, radius } = selectedShape.attrs;

    return (
      <div className="right-side">
        <h3>Shape Properties</h3>
        <label>
          X:
          <input type="number" value={x} onChange={(e) => handlePropertyChange(e, 'x')} />
        </label>
        <label>
          Y:
          <input type="number" value={y} onChange={(e) => handlePropertyChange(e, 'y')} />
        </label>
        {selectedShape instanceof Rect && (
          <>
            <label>
              Width:
              <input type="number" value={width} onChange={(e) => handlePropertyChange(e, 'width')} />
            </label>
            <label>
              Height:
              <input type="number" value={height} onChange={(e) => handlePropertyChange(e, 'height')} />
            </label>
          </>
        )}
        {selectedShape instanceof Circle && (
          <label>
            Radius:
            <input type="number" value={radius} onChange={(e) => handlePropertyChange(e, 'radius')} />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        ref={stageRef}
        onMouseDown={handleSelectShape}
        onTouchStart={handleSelectShape}
      >
        <Layer ref={layerRef}>
          {rectangles.map((rect) => (
            <Rect
              key={rect.id}
              {...rect}
              onClick={handleSelectShape}
              onTap={handleSelectShape}
            />
          ))}
          {circles.map((circle) => (
            <Circle
              key={circle.id}
              {...circle}
              onClick={handleSelectShape}
              onTap={handleSelectShape}
            />
          ))}
          {arrows.map((arrow) => (
            <Line
              key={arrow.id}
              {...arrow}
              onClick={handleSelectShape}
              onTap={handleSelectShape}
            />
          ))}
          {scribbles.map((scribble) => (
            <Line
              key={scribble.id}
              {...scribble}
              onClick={handleSelectShape}
              onTap={handleSelectShape}
            />
          ))}
          {selectedShape && (
            <Transformer
              ref={transformerRef}
              nodes={[selectedShape]}
              anchorSize={5}
            />
          )}
        </Layer>
      </Stage>
      {renderInputFields()}
    </div>
  );
};

export default App;

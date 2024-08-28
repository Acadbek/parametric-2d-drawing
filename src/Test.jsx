import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer } from 'react-konva';

const App = () => {
  const stageRef = useRef();
  const layerRef = useRef();
  const transformerRef = useRef();
  
  const [rectangles, setRectangles] = useState([
    { id: 'rect1', x: 50, y: 60, width: 100, height: 100, fill: 'red' },
    { id: 'rect2', x: 200, y: 200, width: 150, height: 100, fill: 'green' }
  ]);

  const [circles, setCircles] = useState([
    { id: 'circle1', x: 300, y: 150, radius: 50, fill: 'blue' }
  ]);

  const [selectedShapes, setSelectedShapes] = useState([]);

  const handleSelectShape = (e) => {
    const shapeId = e.target.id();
    const isSelected = selectedShapes.includes(shapeId);

    if (isSelected) {
      setSelectedShapes(selectedShapes.filter(id => id !== shapeId));
    } else {
      setSelectedShapes([...selectedShapes, shapeId]);
    }
  };

  const handlePropertyChange = (id, property, value) => {
    console.log(id, property, value);
    
    setRectangles(prevRectangles =>
      prevRectangles.map(rect =>
        rect.id === id ? { ...rect, [property]: value } : rect
      )
    );

    setCircles(prevCircles =>
      prevCircles.map(circle =>
        circle.id === id ? { ...circle, [property]: value } : circle
      )
    );
  };

  const renderInputFields = () => {
    return selectedShapes.map(shapeId => {
      const rect = rectangles.find(r => r.id === shapeId);
      const circle = circles.find(c => c.id === shapeId);

      if (rect) {
        return (
          <div key={shapeId}>
            <h3>Rectangle: {shapeId}</h3>
            <label>
              X:
              <input
                type="number"
                value={rect.x}
                onChange={(e) => handlePropertyChange(shapeId, 'x', parseInt(e.target.value))}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                value={rect.y}
                onChange={(e) => handlePropertyChange(shapeId, 'y', parseInt(e.target.value))}
              />
            </label>
            <label>
              Width:
              <input
                type="number"
                value={rect.width}
                onChange={(e) => handlePropertyChange(shapeId, 'width', parseInt(e.target.value))}
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={rect.height}
                onChange={(e) => handlePropertyChange(shapeId, 'height', parseInt(e.target.value))}
              />
            </label>
          </div>
        );
      } else if (circle) {
        return (
          <div key={shapeId}>
            <h3>Circle: {shapeId}</h3>
            <label>
              X:
              <input
                type="number"
                value={circle.x}
                onChange={(e) => handlePropertyChange(shapeId, 'x', parseInt(e.target.value))}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                value={circle.y}
                onChange={(e) => handlePropertyChange(shapeId, 'y', parseInt(e.target.value))}
              />
            </label>
            <label>
              Radius:
              <input
                type="number"
                value={circle.radius}
                onChange={(e) => handlePropertyChange(shapeId, 'radius', parseInt(e.target.value))}
              />
            </label>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="app">
      <Stage
        width={window.innerWidth - 200}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={(e) => {
          // Deselect shapes when clicking outside
          if (e.target === e.target.getStage()) {
            setSelectedShapes([]);
          }
        }}
      >
        <Layer ref={layerRef}>
          {rectangles.map(rect => (
            <Rect
              key={rect.id}
              id={rect.id}
              {...rect}
              draggable
              onClick={handleSelectShape}
              onDragEnd={(e) => {
                handlePropertyChange(rect.id, 'x', e.target.x());
                handlePropertyChange(rect.id, 'y', e.target.y());
              }}
            />
          ))}
          {circles.map(circle => (
            <Circle
              key={circle.id}
              id={circle.id}
              {...circle}
              draggable
              onClick={handleSelectShape}
              onDragEnd={(e) => {
                handlePropertyChange(circle.id, 'x', e.target.x());
                handlePropertyChange(circle.id, 'y', e.target.y());
              }}
            />
          ))}
          <Transformer
            ref={transformerRef}
            nodes={selectedShapes.map(id => layerRef.current.findOne(`#${id}`))}
            boundBoxFunc={(oldBox, newBox) => {
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      <div className="right-side">
        {renderInputFields()}
      </div>
    </div>
  );
};

export default App;

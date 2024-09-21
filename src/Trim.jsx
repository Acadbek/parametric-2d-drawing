import React, { useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';

const Trim = () => {
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimRect, setTrimRect] = useState(null);
  const shapeRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsTrimming(true);
    setTrimRect({
      x: e.evt.clientX,
      y: e.evt.clientY,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    if (isTrimming && trimRect) {
      setTrimRect({
        x: trimRect.x,
        y: trimRect.y,
        width: e.evt.clientX - trimRect.x,
        height: e.evt.clientY - trimRect.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsTrimming(false);
    if (trimRect) {
      const clipRect = new Rect({
        x: trimRect.x,
        y: trimRect.y,
        width: trimRect.width,
        height: trimRect.height
      });
      shapeRef.current.clip(clipRect);
    }
  };

  return (
    <Stage onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <Layer>
        <Rect ref={shapeRef} x={100} y={100} width={200} height={100} fill="blue" />
        {trimRect && <Rect x={trimRect.x} y={trimRect.y} width={trimRect.width} height={trimRect.height} fill="transparent" stroke="red" />}
      </Layer>
    </Stage>
  );
}

export default Trim
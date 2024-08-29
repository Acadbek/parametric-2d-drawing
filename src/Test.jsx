import React, { useState, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

const KonvaApp = () => {
  const [selectedId, setSelectedId] = useState(null); // Tanlangan shakl ID sini saqlash uchun
  const stageRef = useRef(null);

  const handleStageClick = (e) => {
    console.log(e.target);
      console.log(e.target === stageRef.current);
    
    // Agar boshqa shakl tanlanmagan bo'lsa, `selectedId` ni null qilib qo'yamiz
    if (e.target === stageRef.current) {
      setSelectedId(null);
    }
  };

  const handleShapeClick = (e) => {
    // Tanlangan shaklning ID sini olish
    const id = e.target.id();
    setSelectedId(id);
  };

  const handleDragStart = (e) => {
    // Sudrash boshlandi - tanlangan shaklni `focus` qiling
    const id = e.target.id();
    setSelectedId(id);
  };

  const handleDragEnd = (e) => {
    // Shakl sudralib tugagandan so'ng koordinatalarni olish
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();
    console.log(`Shape ${id} dragged to (${x}, ${y})`);
  };

  return (
    <div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleStageClick}
        ref={stageRef}
      >
        <Layer>
          <Rect
            id="rect1"
            x={100}
            y={100}
            width={100}
            height={100}
            fill={selectedId === "rect1" ? "red" : "green"} // Tanlangan shakl rangi o'zgaradi
            draggable
            onClick={handleShapeClick} // Shakl bosilganda ishlaydi
            onDragStart={handleDragStart} // Sudrash boshlanganda ishlaydi
            onDragEnd={handleDragEnd} // Sudrash tugagandan so'ng ishlaydi
          />
          <Rect
            id="rect2"
            x={300}
            y={100}
            width={100}
            height={100}
            fill={selectedId === "rect2" ? "red" : "blue"}
            draggable
            onClick={handleShapeClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </Layer>
      </Stage>

      {/* Div element tanlangan shakl bo'lganda ko'rsatiladi */}
      {selectedId && (
        <div style={{ position: "absolute", top: 20, right: 20, background: "lightgray", padding: "10px" }}>
          <p>Tanlangan shakl ID: {selectedId}</p>
        </div>
      )}
    </div>
  );
};

export default KonvaApp;

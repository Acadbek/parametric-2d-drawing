export const drawRectangle = (rectangles, currentShapeId, x, y, setRectangles) => {
  setRectangles((rectangles) =>
    rectangles.map((rectangle) => {
      if (rectangle.id === currentShapeId) {
        return {
          ...rectangle,
          width: x - rectangle.points[0].x,
          height: y - rectangle.points[0].y,
        };
      }
      return rectangle;
    })
  );
};
import { v4 as uuidv4 } from 'uuid';

export const drawCircle = (x, y, setCircles, setCurrentCircleId) => {
  const id = uuidv4();
  setCurrentCircleId(id);
  setCircles((circles) => [
    ...circles,
    {
      id,
      x,
      y,
      radius: 0, // Initial radius is 0, will be updated on pointer move
    },
  ]);
};

export const updateCircleRadiusOnPointerMove = (x, y, circles, currentCircleId, setCircles) => {
  setCircles(circles.map((circle) =>
    circle.id === currentCircleId
      ? {
        ...circle,
        radius: Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2),
      }
      : circle
  ));
};

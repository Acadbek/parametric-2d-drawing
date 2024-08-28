/**
 * Updates the radius of the circle based on the current mouse position.
 * @param {Array} circles - The current array of circles.
 * @param {number} currentShapeId - The id of the current shape being updated.
 * @param {number} x - The current x-coordinate of the mouse.
 * @param {number} y - The current y-coordinate of the mouse.
 * @returns {Array} - Updated array of circles with the modified circle radius.
 */

export const drawCircle = (circles, currentShapeId, x, y) => {
  return circles.map((circle) => {
    if (circle.id === currentShapeId) {
      return {
        ...circle,
        radius: ((y - circle.points[0].y) ** 2 + (x - circle.points[0].x) ** 2) ** 0.5,
      };
    }
    return circle;
  });
};

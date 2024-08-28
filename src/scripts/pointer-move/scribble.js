/**
 * Updates the points of the scribble based on the current mouse position.
 * @param {Array} scribbles - The current array of scribbles.
 * @param {number} currentShapeId - The id of the current shape being updated.
 * @param {number} x - The current x-coordinate of the mouse.
 * @param {number} y - The current y-coordinate of the mouse.
 * @returns {Array} - Updated array of scribbles with the modified points.
 */
export const updateScribblePoints = (scribbles, currentShapeId, x, y) => {
  return scribbles.map((scribble) => {
    if (scribble.id === currentShapeId) {
      return {
        ...scribble,
        points: [...scribble.points, x, y],
      };
    }
    return scribble;
  });
};

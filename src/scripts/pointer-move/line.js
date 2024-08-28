/**
 * Updates the points of the line based on the current mouse position.
 * @param {Array} lines - The current array of lines.
 * @param {number} currentShapeId - The id of the current shape being updated.
 * @param {number} x - The current x-coordinate of the mouse.
 * @param {number} y - The current y-coordinate of the mouse.
 * @returns {Array} - Updated array of lines with the modified points.
 */
export const updateLinePoints = (lines, currentShapeId, x, y) => {
  return lines.map((line) => {
    if (line.id === currentShapeId) {
      return {
        ...line,
        points: [line.points[0], line.points[1], x, y],
      };
    }
    return line;
  });
};

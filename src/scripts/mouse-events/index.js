import { ACTIONS } from "../../constants";

export const handleMouseEnter = (action, setHoveradShapeId, rectId) => {
  if (action === ACTIONS.SELECT) {
    setHoveradShapeId(rectId);
    document.body.style.cursor = 'move';
  }
};

export const handleMouseLeave = (action, setHoveradShapeId) => {
  if (action === ACTIONS.SELECT) {
    setHoveradShapeId(null);
    document.body.style.cursor = 'default';
  }
};
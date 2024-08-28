export const handleUndo = (historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep) => {
  if (historyStep === 0) return;
  const newHistoryStep = historyStep - 1;
  const previousState = history[newHistoryStep];
  setRectangles(previousState.rectangles);
  setCircles(previousState.circles);
  setArrows(previousState.arrows);
  setScribbles(previousState.scribbles);
  setHistoryStep(newHistoryStep);
};

export const handleRedo = (historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep) => {
  if (historyStep === history.length - 1) return;
  const newHistoryStep = historyStep + 1;
  const nextState = history[newHistoryStep];
  setRectangles(nextState.rectangles);
  setCircles(nextState.circles);
  setArrows(nextState.arrows);
  setScribbles(nextState.scribbles);
  setHistoryStep(newHistoryStep);
};

export const saveState = (
  rectangles,
  circles,
  arrows,
  scribbles,
  setHistory,
  setHistoryStep,
  historyStep
) => {
  const currentState = {
    rectangles,
    circles,
    arrows,
    scribbles,
  };
  const newHistory = history.slice(0, historyStep + 1);
  newHistory.push(currentState);
  setHistory(newHistory);
  setHistoryStep(newHistory.length - 1);
};
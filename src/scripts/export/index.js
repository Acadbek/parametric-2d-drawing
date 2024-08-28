export const handleExport = (stageRef) => {
  const uri = stageRef.current.toDataURL();
  const link = document.createElement("a");
  link.download = "image.png";
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
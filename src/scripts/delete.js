export function deleteElement(s_element, setState, setSelectedElement) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) => prevState.filter((element) => element.id != id));
  setSelectedElement(null);
}
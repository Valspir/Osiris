function slist(target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  target.classList.add("slist");
  let items = target.getElementsByTagName("li"),
    current = null;

  // (B) MAKE ITEMS DRAGGABLE + SORTABLE
  for (let i of items) {
    // (B1) ATTACH DRAGGABLE
    i.draggable = true;

    // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
    i.ondragstart = e => {
      current = i;
      for (let it of items) {
        if (it != current) {
          it.classList.add("hint");
        }
      }
    };

    // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
    i.ondragenter = e => {
      if (i != current) {
        i.classList.add("active");
      }
    };

    // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
    i.ondragleave = () => i.classList.remove("active");

    // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
    i.ondragend = () => {
      for (let it of items) {
        it.classList.remove("hint");
        it.classList.remove("active");
      }
    };

    // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
    i.ondragover = e => e.preventDefault();

    // (B7) ON DROP - DO SOMETHING
    i.ondrop = e => {
      e.preventDefault();
      if (i != -1) {
        let currentpos = 0, droppedpos = 0;
        let fromList = current.parentNode;
        let toList = i.parentNode;
        let itemsInList = fromList.getElementsByTagName('li');
        let fromIndex = Array.prototype.indexOf.call(itemsInList, current);
        let toIndex = Array.prototype.indexOf.call(itemsInList, i);

        if (fromList != toList) {
          // item dropped onto a different list
          let droppedItem = fromList.removeChild(current);
          if (fromIndex < toIndex) {
            toList.insertBefore(droppedItem, i.nextSibling);
          } else {
            toList.insertBefore(droppedItem, i);
          }
        } else {
          // item dropped onto the same list
          if (currentpos < droppedpos) {
            i.parentNode.insertBefore(current, i.nextSibling);
          } else {
            i.parentNode.insertBefore(current, i);
          }
        }
      }
    };
  }
}

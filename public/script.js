function slist (target) {
  // (A) SET CSS + GET ALL LIST ITEMS
  if(target != null) {
    target.classList.add("slist");
    let items = document.getElementsByTagName("li"), current = null;

    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    for (let i of items) {
      if(i.parentElement.classList.contains("slist")) {
        // (B1) ATTACH DRAGGABLE
        i.draggable = true;

        // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONEScID
        i.ondragstart = e => {

          current = i;
          for (let it of items) {
            if (it != current) { it.classList.add("hint"); }
          }
        };

        // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
        i.ondragenter = e => {
          if (i != current) { i.classList.add("active"); }
        };

        // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
        i.ondragleave = () => i.classList.remove("active");

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.ondragend = () => { for (let it of items) {
          it.classList.remove("hint");
          it.classList.remove("active");
        }};

        // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
        i.ondragover = e => e.preventDefault();

        // (B7) ON DROP - DO SOMETHING
        i.ondrop = e => {
          e.preventDefault();
          if (i != current) {
            //current = document.getElementsByClassName("hint")[0]
            let currentpos = 0, droppedpos = 0;
            for (let it=0; it<items.length; it++) {
              if (current == items[it]) { currentpos = it; }
              if (i == items[it]) { droppedpos = it; }
            }
            pos = i.nextSibling
            if (currentpos < droppedpos) {
              for (k = 0; k < items.length; k++) {
                p = items[k]
                if(p.parentElement.id != i.parentElement.id) {
                  if(p.childNodes[0].recipeID == -1) {
                    pos = k
                    p.remove()
                  }
                }
              }
              i.parentNode.insertBefore(current, pos);
            } else {
              i.parentNode.insertBefore(current, i);
            }
          }
        };
      }
    }
  }
}

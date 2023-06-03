const advancedSearchLabel = document.getElementById('advanced-search-label');
const advancedSearch = document.getElementsByClassName('advanced-search')[0];
const searchForm = document.getElementById('search-form');
const searchBox = document.getElementById('search-box');
const header = document.querySelector('header');
const searchContainer = document.querySelector('.search-container');

/*advancedSearchLabel.addEventListener('click', function() {
  advancedSearch.classList.toggle('active');
  if (advancedSearch.classList.contains("active")) {
    searchForm.classList.toggle('expanded');
    advancedSearch.style.display = 'block';
  } else {
    searchForm.classList.toggle('expanded');
    advancedSearch.style.display = 'none';
  }
});

document.addEventListener('click', function(event) {
  if (!searchContainer.contains(event.target)) {
    advancedSearch.classList.remove('active');
  }
});*/
function createRecipeInfo(recipe, blank=0) {
  const listItem = document.createElement('li');
  const recipeDetails = document.createElement("div");

  // Create recipe container
  const recipeContainer = document.createElement('div');
  recipeContainer.recipeID = recipe.recipeID
  recipeContainer.classList.add('recipe-container');
  listItem.appendChild(recipeContainer);

  //Recipe Name
  const recipeName = document.createElement("p");
  recipeName.innerHTML = `<strong class="recipe-name">${recipe.recipeName}</strong>`;
  recipeContainer.appendChild(recipeName);

  const buttonContainer = document.createElement('div')

  const likeBtn = document.createElement('input'); // add this line
  likeBtn.type = "image"
  likeBtn.src = "images/like.png"
  likeBtn.height = 25
  likeBtn.width = 25
  likeBtn.alt = "Like"
  likeBtn.classList.add('like-btn'); // add this line
  likeBtn.recipeID = recipe.recipeID
  buttonContainer.appendChild(likeBtn);

  const addToMP = document.createElement('input'); // add this line
  addToMP.type = "image"
  addToMP.src = "images/add.png"
  addToMP.height = 25
  addToMP.width = 25
  addToMP.alt = "Add To Meal Plan"
  addToMP.classList.add('atmp-btn'); // add this line
  addToMP.recipeID = recipe.recipeID
  buttonContainer.appendChild(addToMP);


  recipeContainer.appendChild(buttonContainer)

  listItem.addEventListener('click', (event) => {
     if (!event.target.classList.contains('atmp-btn') && !event.target.classList.contains('like-btn')) {
       //event.stopPropagation();
       if (listItem.classList.contains('expanded')) {
         listItem.classList.toggle('expanded');
       } else {
         const expandedCards = document.querySelectorAll('.expanded');
         expandedCards.forEach((card) => card.classList.toggle('expanded'));
         listItem.classList.add('expanded');
       }
     }else if(event.target.classList.contains('atmp-btn')){
       event.stopPropagation()
       fetch("/addToMP", {
         method: 'POST',
         headers: {
           'Accept': 'application/json',
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({'sessionID':sessionStorage.getItem("sessionID"),'recipeID':event.target.recipeID})
       })
     }else if(event.target.classList.contains('like-btn')){
       event.stopPropagation();
       fetch("/like", {
         method: 'POST',
         headers: {
           'Accept': 'application/json',
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({'sessionID':sessionStorage.getItem("sessionID"),'recipeID':event.target.recipeID})
       });
       recipeContainer.parentElement.style.border = "1px solid blue"
    }
  });

  //Instructions & Ingredients (not modified)
  steps=""
  JSON.parse(recipe.steps).forEach(step => {
    steps+="<br><br>    -"+step
  });
  ingredients = ""
  recipe.ingredients.forEach(ingredient => {
    ingredients+="<br>    -"+ingredient.procText
  });

  //Expanded data (not modified)
  recipeDetails.classList.add("recipe-details");
  recipeDetails.innerHTML = `
    <p><strong>Recipe ID:</strong> ${recipe.recipeID}
    <p><strong>Prep Time:</strong> ${recipe.prepTime}</p>
    <p><strong>Cook Time:</strong> ${recipe.cookTime}</p>
    <p><strong>Servings:</strong> ${recipe.serves}</p>
    <p><strong>Saves:</strong> ${recipe.saves}</p>
    <p><strong>(Very) Rough Cost:</strong> ${Math.round(Math.floor(parseFloat(recipe.cost)*100),0)/100}</p>
    <p><strong>Instructions:</strong>${steps}</p>
    <br>
    <p><strong>Ingredients:</strong>${ingredients}</p>
  `;
  listItem.appendChild(recipeDetails);


  return listItem;
}

function getCurrentURL() {
  return window.location.href
}
function searchRecipes() {
  var query = getCurrentURL().split("?")[1]
  const url = `/search?${query}`; // Replace with your actual API endpoint

  fetch(url)
    .then(response => response.json())
    .then(recipes => {
      console.log(recipes)
      const resultsList = document.getElementById('results');
      resultsList.innerHTML = '';

      if(recipes == "Not Found") {
          resultsList.innerHTML = "<h1>No Results Found</h1>"
      }
      recipes.forEach(recipe => {
        listItem = createRecipeInfo(recipe)
        resultsList.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error(error);
    });
}
searchRecipes()

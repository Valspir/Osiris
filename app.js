var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var serveStatic = require('serve-static');
var sqlite = require("better-sqlite3");
const crypto = require("crypto");


var usersDB = new sqlite("./data/Users.db");
var db = new sqlite("./data/processedData.db");
var mealDB = new sqlite("./data/meals.db");

async function get7recipes(req) {
  highID = req["_parsedOriginalUrl"]["query"].split("=")[1]
  var db = new sqlite("./data/processedData.db");
  var rows = db.prepare("SELECT recipeName FROM Recipes WHERE recipeID < "+highID+" ORDER BY recipeID DESC LIMIT 7").all();
  var recipes = [];
  /*console.log(rows)
  for(let i = 0; i < rows.length; i++) {
    recipes.push(rows[i]["recipeName"]);
  }
  db.close();
  console.log(recipes);*/
  return rows;
}



function findRecipe(keywords,serves) {
  sql = "SELECT recipeID,recipeName,meat,cost FROM Recipes WHERE serves > ?"
  keywords.forEach((keyword, i) => {


    //Do Nothing Yet
  });

  db.each(sql,[serves], (err, row) => {
    console.log(row);
  });
  db.close();
}

function search(req,res) {
  var db = new sqlite("./data/processedData.db");
  rowArr = []
  rows = []
  try {
  allArgs = decodeURI(req["_parsedOriginalUrl"]["query"]).split("&")
  //var db = new sqlite("./data/processedData.db");
  let procSQL = "(SELECT procText FROM AltText WHERE ingredientID=Ingredients.ingredientID LIMIT 1) LIKE '%"
  sql = "SELECT DISTINCT Recipes.recipeID as recipeID, recipeName, steps, saves, cost, serves, prepTime, cookTime FROM Recipes INNER JOIN Ingredients ON Recipes.recipeID=Ingredients.recipeID WHERE "

  for(let i = 0; i < allArgs.length; i++) {
    if(i != 0 && i != allArgs.length-1) {
      sql+= "AND"
    }
    /*if(i%100 || i == allArgs.length-1) {
      rows = db.prepare(sql).all();
      for(row in rows) {
        rowArr.push(rows[row])
      }
      sql = "SELECT DISTINCT Recipes.recipeID as recipeID, recipeName, steps, saves, cost, serves, prepTime, cookTime FROM Recipes INNER JOIN Ingredients ON Recipes.recipeID=Ingredients.recipeID WHERE "

    }*/
    show=0
    var argName = allArgs[i].split("=")[0];
    var argValue = allArgs[i].split("=")[1];
    if(argName == "keywords") {
      argValue = argValue.replace("+", " ").replace("%2C",",").split(",")
      for(let j = 0; j < argValue.length; j++) {
        if(j > 0) {
          sql += " AND "
        }var db = new sqlite("./data/processedData.db");
        if(argValue[j][0] == " ") {
          argValue[j] = argValue[j].substring(1)
        }
        sql+="((Recipes.recipeName LIKE '%"+argValue[j]+"%') OR ("+procSQL+argValue[j]+"%'))"
      }
    }else if(argName == "serves") {
      sql +=" (Recipes.serves >= "+argValue+") "
    }else if(argName == "prepTime") {
      sql += " (Recipes.prepTime <= "+parseInt(argValue)+") "
    }else if(argName == "cookTime") {
      sql += " (Recipes.cookTime <= "+parseInt(argValue)+") "
    }else if(argName == "show") {
      show=1
      sql +=" ORDER BY saves DESC LIMIT "+argValue
    }
  }
  if(!show) {
    sql += "ORDER BY saves DESC LIMIT 30"
  }
  rows = db.prepare(sql).all();
}catch{
  console.log("Invalid SQL Query")
}
if(rows.length == 0) {
  res.json('Not Found')
  return
}var db = new sqlite("./data/processedData.db");
  //rows = the_ALGORITHM(sql)
  //sql = "SELECT * FROM Recipes WHERE "
  /*for(row in rows) {
    if(row != 0) {
      sql += " OR "
    }
    sql += `recipeID=${rows[row]}`
  }*/

  allInfo = []
  for(i = 0; i < rows.length; i++) {
    row = rows[i]
    sql = `SELECT AD.altText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.altText as altText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${row.recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
    ret = db.prepare(sql).all();
    row.ingredients = ret
    allInfo.push(row)
  }
  res.json(allInfo)
}

function genMealPlan(req,res) {
  //console.log(allArgs)
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID

  userTastes = []
  sql = `SELECT recipeID,recipeRating FROM 'userTastes' WHERE userID = '${userID}' ORDER BY recipeRating DESC LIMIT 50`
  rows = usersDB.prepare(sql).all()
  for(j = 0; j < rows.length; j++) {
    userTastes.push(rows[j])
  }
  if(Object.keys(req.body).includes("bad")) {
    rating = 0
    sql = `SELECT recipeRating FROM userTastes WHERE userID = '${userID}' AND recipeID = '${req.body.bad}'`
    rows = usersDB.prepare(sql).all()
    if(rows.length == 0) {
      sql = `INSERT INTO userTastes(userID,recipeID,recipeRating) VALUES (${userID}, ${req.body.bad}, -1)`
      usersDB.prepare(sql).run()
    }else{
      sql = `UPDATE userTastes SET recipeRating = ${rows[0].recipeRating-1} WHERE userID = ${userID}`
      usersDB.prepare(sql).run()
    }
  }
  randsql = "SELECT * from Recipes ORDER BY RANDOM() LIMIT 25"
  row = ''
  if(userTastes.length == 0) {
    allRows = []
    sql = `SELECT recipeID AS Recipe2ID FROM (${randsql}) ORDER BY saves LIMIT 3`
    rows = db.prepare(sql).all()
    row = rows
  }else{
    row = the_ALGORITHM(randsql, userTastes)
  }
  allInfo = []
  for(j = 0; j < row.length; j++) {
    r = row[j]
    sql = `SELECT * FROM Recipes WHERE recipeID=${r.Recipe2ID}`
    rows = db.prepare(sql).all();
    for(i = 0; i < rows.length; i++) {
      ingRow = rows[i]
      sql = `SELECT AD.altText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.altText as altText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${ingRow.recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
      ret = db.prepare(sql).all();
      ingRow.ingredients = ret
      allInfo.push(ingRow)
    }
  }
  res.json(allInfo)
}

function the_ALGORITHM(sql,user) {
  allRows = []
  maxLen = 20;
  tasteProfile = []
  if(user.length < 21) {
    maxLen = user.length;
    tasteProfile = user
  }else if(tasteProfile < 100) {
    randNum = Math.round(Math.floor(Math.random()*10))
    if(randNum == 9) {
      //Random part of tasteProfile
      index = Math.round(Math.floor(Math.random()*(user.length-20)))
      tasteProfile = user.slice(index,index+20)
    }else{
        tasteProfile = user.slice(0,20)
    }
  }

  for(recipeKey = 0; recipeKey < maxLen; recipeKey++) {
    try {
      recipeID = tasteProfile[recipeKey].recipeID
      not_sql = `SELECT
              i1.recipeID as Recipe1ID,
              (
              	SELECT
              		Recipes.recipeName
              	FROM Recipes
              		WHERE recipeID=i1.recipeID
              ) as Recipe1Name,
              r2.recipeID as Recipe2ID,
              r2.recipeName as Recipe2Name
            FROM Ingredients AS i1
            JOIN Ingredients AS i2
            	ON i1.ingredientID = i2.ingredientID
            	AND i1.recipeID = ${recipeID}
            	AND i2.recipeID <> i1.recipeID
            JOIN (${sql}) AS r2
            	ON i2.recipeID = r2.recipeID
            GROUP BY r2.recipeID
            ORDER BY ROUND(
              (COUNT(*) * 100.0 /
                    (SELECT COUNT(*) FROM Ingredients WHERE recipeID = i1.recipeID) +
                    (SELECT COUNT(*) FROM Ingredients WHERE recipeID = r2.recipeID) -
                    COUNT(CASE WHEN i1.recipeID = r2.recipeID THEN 1 ELSE NULL END)),2
                ) DESC
            LIMIT 5
            `;
      rand = Math.round(Math.floor(Math.random()*4))
      if(rand == 1) {
        s = `SELECT recipeID as Recipe2ID, recipeName as Recipe2Name FROM Recipes WHERE recipeID=${recipeID}`
        var r = db.prepare(s).all();
        allRows.push(r[0])
      }
      var rows = db.prepare(not_sql).all();
      for(row in rows) {
        if(!(allRows.includes(rows[row]))) {
          allRows.push(rows[row])
        }
      }
      
    }catch{
      continue
    }
  }

  //rec = Math.round(Math.random()*4)
  //console.log(allRows.slice(0,3))
  return allRows.slice(0,3)
}

function like(req, res) {
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID

  rating = 0
  sql = `SELECT recipeRating FROM userTastes WHERE userID = '${userID}' AND recipeID = '${req.body.recipeID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    sql = `INSERT INTO userTastes(userID,recipeID,recipeRating) VALUES (${userID}, ${req.body.recipeID}, 1)`
    usersDB.prepare(sql).run()
  }else{
    sql = `UPDATE userTastes SET recipeRating = ${rows[0].recipeRating+1} WHERE userID = ${userID} AND recipeID = ${req.body.recipeID}`
    usersDB.prepare(sql).run()
  }
  res.json({"status":200})
}

function login(req,res) {
  email=req.body[0]
  passwordHash = req.body[1]
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE email='${email}'` //STILL DOESN'T WORK - CHECK PASSWORD
  var rows=usersDB.prepare(sql).all()
  if(rows.length != 0) {
    const id = crypto.randomBytes(16).toString("hex");
    sql = `UPDATE userInfo SET sessionID = '${id}' WHERE userID='${rows[0].userID}'`
    var rows=usersDB.prepare(sql).run()
    res.json({"status":"Success", "sessionID":id})
  }else{
    res.json({"status":"Invalid User"})
  }

}

function saveAltRecipes(req,res) {
  mealArr = req.body.altRecipes
  console.log(mealArr)
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID

  sql = `UPDATE userMeals SET alternateRecipes='${mealArr}' WHERE userID = ${userID}`
  usersDB.prepare(sql).run()
  res.status(200)
}

function save(req, res) {
  mealArr = req.body.mealPlan

  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID
  
  sql = `INSERT INTO Meals(mealArr) VALUES ('${mealArr}')`
  mealDB.prepare(sql).run()
  sql = `SELECT last_insert_rowid()`
  mealID = mealDB.prepare(sql).all()[0]['last_insert_rowid()']
  sql = `UPDATE Meals SET mealID = ${mealID} WHERE mealArr = '${mealArr}'`
  mealDB.prepare(sql).run()

  sql = `INSERT INTO userMeals(userID,mealID) VALUES (${userID},${mealID})`
  usersDB.prepare(sql).run()
  res.json({"status":200})
}

function getCurrentMeal(req, res) {
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID

  sql = `SELECT mealID FROM userMeals WHERE userID = '${userID}' ORDER BY mealID DESC LIMIT 1`
  mealID = usersDB.prepare(sql).all()[0]['mealID']

  s = `SELECT mealArr FROM Meals WHERE mealID = '${mealID}'`
  mP = mealDB.prepare(s).all()[0]['mealArr']

  nextRecipes = mP.toString().split(",")
  allRecipeInfo = []
  for(j = 0; j < nextRecipes.length-1; j++) {
  //  console.log(nextRecipes[i])
    sql = `SELECT * FROM Recipes WHERE recipeID=${parseInt(nextRecipes[j])}`
    /*console.log(rows)
    for(row in rows) {
      if(row != 0) {
        sql += " OR "
      }
      sql += `recipeID=${rows[row]}`
    }*/
    rows = db.prepare(sql).all();

    allInfo = []
    for(i = 0; i < rows.length; i++) {
      row = rows[i]
      sql = `SELECT AD.altText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.altText as altText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${row.recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
      ret = db.prepare(sql).all();
      row.ingredients = ret
      allInfo.push(row)
    }
    allRecipeInfo.push(allInfo)
  }
  res.json(allRecipeInfo)
}

function getIngredients(req,res) {
  userID = -1
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID
  sql = `SELECT nextMealJSON FROM userMeals WHERE userID = '${userID}'`
  rows = usersDB.prepare(sql).all()
  nextRecipes = rows[0].nextMealJSON.toString().split(",")
  shoppingList = []
  for (let m in nextRecipes) {
    recipeID = parseInt(nextRecipes[m])
    if(nextRecipes[m] > 0) {
      sql = `SELECT ingredientID,procText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.procText as procText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
      ret = db.prepare(sql).all();
      ingredients = []
      for(let i in ret) {
        ingredientID = parseInt(ret[i].ingredientID)
        ingredientText = ret[i].procText
        inArr = 0
        for(let li in shoppingList) {
          listItem = shoppingList[li]
          listItemID = listItem.ingredientID
          if(listItemID == ingredientID) {
            inArr = 1
            listItem.requiredBy+=','+recipeID
          }
        }
        if(!inArr) {
          ret[i].requiredBy = recipeID
          shoppingList.push(ret[i])
        }
      }
    }
  }
  res.json(shoppingList)
}

function atMP(req,res) {
  console.log(req.body)
  sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID

  sql = `SELECT mealID FROM userMeals WHERE userID = ${userID} ORDER BY mealID DESC LIMIT 1`
  rows = usersDB.prepare(sql).all()
  mealID = rows[0]['mealID']
  console.log(mealID)

  sql = `SELECT * FROM Meals WHERE mealID = ${mealID}`
  mealArr = mealDB.prepare(sql).all()[0]['mealArr']
  mealArr += req.body.recipeID+","
  s = `UPDATE Meals SET mealArr = '${mealArr}' WHERE mealID = ${mealID}`
  mealDB.prepare(s).run()
  res.json({"status":200})
}

function register(req,res) {
  email = req.body.email
  password = req.body.password
  id = crypto.randomBytes(16).toString("hex");

  
  sql = `INSERT INTO userInfo(email,passwordHash,sessionID) VALUES ('`+email+`','`+password+`','`+id+`')`
  rows = usersDB.prepare(sql).run()


  res.json({"status":"Success", "sessionID":id})
}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(serveStatic('public', { index: ['index3.html']}));
app.use('/recipes', async (req,res) => get7recipes(req).then(r => res.json(r)));
app.use('/search', async (req,res) => search(req,res))//.then(r => res.json(r)));
app.use('/mealplan', async (req,res) => genMealPlan(req,res))
app.use('/login', async (req, res) => login(req,res))
app.use('/like', async (req, res) => like(req,res))
app.use('/save', async (req, res) => save(req,res))
app.use('/currentMealPlan', async (req,res) => getCurrentMeal(req,res))
app.use('/addToMP', async (req, res) => atMP(req,res))
app.use('/saveAltRecipes', async (req,res) => saveAltRecipes(req,res))
app.use('/getIngredients', async (req,res) => getIngredients(req,res))
app.use('/getIngredients', async (req,res) => getIngredients(req,res))
app.use('/register', async (req,res) => register(req,res))



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
/*app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/

module.exports = app;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var serveStatic = require('serve-static');
var sqlite = require("better-sqlite3");
const crypto = require("crypto");
const fs = require('fs')
var sanitizer = require('sanitize')();
var serveIndex = require('serve-index');


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

sessions = []

var access = fs.createWriteStream('server.log', 'utf-8');
process.stdout.write = process.stderr.write = access.write.bind(access);

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
  sql = ""

  allArgs = decodeURI(req["_parsedUrl"]["query"]).split("&")
  try {
    
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
        argValue = argValue.replace(/\+/g, " ").replace("%2C",",").split(",")
        for(let j = 0; j < argValue.length; j++) {
          if(j > 0) {
            sql += " AND "
          }var db = new sqlite("./data/processedData.db");
          if(argValue[j][0] == " ") {
            argValue[j] = argValue[j].substring(1)
          }
          sql+="((Recipes.recipeName LIKE '%"+argValue[j]+"%'))"// OR ("+procSQL+argValue[j]+"%'))"
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
    console.log(allArgs)
    console.log("Invalid SQL Query")
  }
  if(rows.length == 0) {
    res.json('Not Found')
    return
  }
  var db = new sqlite("./data/processedData.db");
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
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID*/

  try {
      try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
  }catch{
    res.json(["Logged Out"])
    return
  }

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
    row = the_ALGORITHM(userTastes)
  }
  allInfo = []
  
  for(j = 0; j < row.length; j++) {
    nR = row[j]
    for(p = 0; p < nR.length; p++) {
      r = nR[p]
      sql = `SELECT * FROM Recipes WHERE recipeID=${r}`
      rows = db.prepare(sql).all();
      for(i = 0; i < rows.length; i++) {
        ingRow = rows[i]
        sql = `SELECT AD.altText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.altText as altText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${ingRow.recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
        ret = db.prepare(sql).all();
        ingRow.ingredients = ret
        allInfo.push(ingRow)
      }
    }
  }
  res.json(allInfo)
}

/*function the_ALGORITHM(user) {
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
      not_sql = `WITH RandomRecipes AS (
                  SELECT * FROM Recipes ORDER BY RANDOM() LIMIT 25
                ),
                RecipeCounts AS (
                  SELECT
                    i1.recipeID AS Recipe1ID,
                    r2.recipeID AS Recipe2ID,
                    COUNT(*) AS MatchCount
                  FROM Ingredients AS i1
                  JOIN Ingredients AS i2
                    ON i1.ingredientID = i2.ingredientID
                    AND i1.recipeID = ${recipeID}
                    AND i2.recipeID <> i1.recipeID
                  JOIN RandomRecipes AS r2
                    ON i2.recipeID = r2.recipeID
                  JOIN Recipes AS r1
                    ON i1.recipeID = r1.recipeID
                  GROUP BY i1.recipeID, r2.recipeID
                ),
                RankedRecipes AS (
                  SELECT
                    Recipe1ID,
                    Recipe2ID,
                    MatchCount,
                    ROUND(
                      (MatchCount * 100.0 /
                      (COUNT(*) FILTER (WHERE Recipe1ID = Recipe2ID)) +
                      COUNT(*) FILTER (WHERE Recipe1ID = ${recipeID})), 2
                    ) AS MatchPercentage,
                    RANK() OVER (ORDER BY RANDOM() * RANDOM()) AS RandomRank
                  FROM RecipeCounts
                )
                SELECT
                  Recipe1ID,
                  Recipe2ID,
                FROM RankedRecipes
                WHERE RandomRank <= 5
                ORDER BY RandomRank;
                `;
      rand = Math.round(Math.floor(Math.random()*4))
      if(rand == 1) {
        s = `SELECT recipeID as Recipe2ID, recipeName as Recipe2Name FROM Recipes WHERE recipeID=${recipeID}`
        var r = db.prepare(s).all();
        allRows.push(r[0])
      }
      var rows = db.prepare(not_sql).all();
      console.log(rows)
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
}*/

function the_ALGORITHM(user, i) {
  const allRows = [];

  const tasteProfile = user.slice(0, i); // Read the first `i` recipeIDs from tasteProfile

  const recipeIDs = tasteProfile.map(recipe => recipe.recipeID); // Extract recipeIDs from tasteProfile

  const sql = `WITH RecipeCounts AS (
                SELECT
                  i2.recipeID AS Recipe2ID,
                  COUNT(*) AS MatchCount,
                  (COUNT(*) * 100.0 / r1.IngredientCount + COUNT(*) * 100.0 / r2.IngredientCount) AS MatchPercentage
                FROM Ingredients AS i1
                JOIN Ingredients AS i2 ON i1.ingredientID = i2.ingredientID
                JOIN (
                  SELECT recipeID, COUNT(*) AS IngredientCount
                  FROM Ingredients
                  GROUP BY recipeID
                ) AS r1 ON i1.recipeID = r1.recipeID
                JOIN (
                  SELECT recipeID, COUNT(*) AS IngredientCount
                  FROM Ingredients
                  GROUP BY recipeID
                ) AS r2 ON i2.recipeID = r2.recipeID
                WHERE i1.recipeID IN (${recipeIDs.join(', ')}) AND i2.recipeID <> i1.recipeID
                GROUP BY i1.recipeID, i2.recipeID, r1.IngredientCount, r2.IngredientCount
              ),
              RankedRecipes AS (
                SELECT
                  Recipe2ID,
                  ROW_NUMBER() OVER (PARTITION BY Recipe2ID ORDER BY MatchCount DESC) AS RowNum
                FROM RecipeCounts
              )
              SELECT DISTINCT
                r.Recipe2ID
              FROM RankedRecipes AS r
              WHERE r.RowNum <= 3
              ORDER BY RANDOM()
              LIMIT 21;
              `;
  //console.log(sql)
  const rows = db.prepare(sql).all();
  const result = [];
  for (let i = 0; i < rows.length; i += 3) {
    const recipeSet = [];
    
    // Extract recipeIDs from each row and push them into the recipeSet array
    for (let j = i; j < i + 3; j++) {
      const recipeID = rows[j].Recipe2ID;
      recipeSet.push(recipeID);
    }
    
    // Push the recipeSet array into the result array
    result.push(recipeSet);
  }
  return result;
}


function like(req, res) {
  userID = -1
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID*/

  try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }

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
  sql = `SELECT userID FROM userInfo WHERE email=? AND passwordHash=?`
  var rows=usersDB.prepare(sql).all(email,passwordHash)
  if(rows.length != 0) {
    const id = crypto.randomBytes(16).toString("hex");
    /*sql = `UPDATE userInfo SET sessionID = '${id}' WHERE userID='${rows[0].userID}'`
    var rows=usersDB.prepare(sql).run()*/
    sessions.push([rows[0].userID,id])
    res.json({"status":"Success", "sessionID":id})
  }else{
    console.log(req.body)
    res.json({"status":"Invalid User"})
  }

}

function saveAltRecipes(req,res) {
  mealArr = req.body.altRecipes
  console.log(mealArr)
  userID = -1
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID*/

  try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }

  sql = `UPDATE userMeals SET alternateRecipes='${mealArr}' WHERE userID = ${userID}`
  usersDB.prepare(sql).run()
  res.status(200)
}

function save(req, res) {
  mealArr = req.body.mealPlan

  userID = -1
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  userID = rows[0].userID*/
    try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
  
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
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID*/
  
  try {
      try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
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
  }catch{
    res.json({"Status":"Failed"})
  }
}

function getIngredients(req,res) {
  userID = -1
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }*/
  try {
      try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
  }catch{

  }

  sql = `SELECT mealID FROM userMeals WHERE userID = '${userID}' ORDER BY mealID DESC LIMIT 1`
  mealID = usersDB.prepare(sql).all()[0]['mealID']

  s = `SELECT mealArr FROM Meals WHERE mealID = '${mealID}'`
  mP = mealDB.prepare(s).all()[0]['mealArr']

  nextRecipes = mP.toString().split(",")
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
          if(listItemID == ingredientID || listItem.procText == ingredientText) {
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
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }*/
    try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
  //userID = rows[0].userID

  sql = `SELECT mealID FROM userMeals WHERE userID = ${userID} ORDER BY mealID DESC LIMIT 1`
  rows = usersDB.prepare(sql).all()
  mealID = rows[0]['mealID']

  sql = `SELECT * FROM Meals WHERE mealID = ${mealID}`
  mealArr = mealDB.prepare(sql).all()[0]['mealArr']
  mealArr += req.body.recipeID+","
  s = `UPDATE Meals SET mealArr = '${mealArr}' WHERE mealID = ${mealID}`
  mealDB.prepare(s).run()
  res.json({"status":200})
}

function register(req,res) {
  email=req.body[0]
  password = req.body[1]
  fName = req.body[2]
  id = crypto.randomBytes(16).toString("hex");
  console.lo

  
  sql = `INSERT INTO userInfo(email,passwordHash,sessionID,firstName) VALUES (?,?,?,?)`
  rows = usersDB.prepare(sql).run(email,password,id,fName)


  res.json({"status":"Success", "sessionID":id})
}

function mymeals(req,res) {
  allMeals = []
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID*/
    try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }

  sql = `SELECT mealID FROM userMeals WHERE userID = ${userID} ORDER BY mealID DESC`
  mealRows = usersDB.prepare(sql).all()
  for(r in mealRows) {
    row = mealRows[r]
    mealPlan = []
    
    //console.log(row)
    sql = `SELECT mealArr FROM Meals WHERE mealID = ${row.mealID}`
    sql_out = mealDB.prepare(sql).all()
    str = sql_out[0]['mealArr'].split(",")
    for(s in str) {
      m = str[s]
      if(m == -1) {
        mealPlan.push("No Recipe")
      }else if(m != "") {
        sql = `SELECT * FROM Recipes WHERE recipeID=${m}`
        rows = db.prepare(sql).all();
        
        ingRow = rows[0]
        sql = `SELECT AD.altText as procText FROM (SELECT Ingredients.recipeID as recipeID, Ingredients.ingredientID as ingredientID, AltText.altText as altText FROM Ingredients INNER JOIN AltText ON Ingredients.ingredientID=AltText.ingredientID WHERE Ingredients.recipeID=${ingRow.recipeID} GROUP BY AltText.ingredientID) as AD INNER JOIN Recipes ON AD.recipeID=Recipes.recipeID`
        ret = db.prepare(sql).all();
        ingRow.ingredients = ret
        mealPlan.push(ingRow)
      }
    }
    allMeals.push(mealPlan)
  }
  res.json(allMeals)
}

function getUserInfo(req,res) {
  try {
      try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
    sql = `SELECT firstName FROM userInfo WHERE userID = ${userID}`
    rows = usersDB.prepare(sql).all()
  }catch{
    res.json(["Logged Out"])
    return
  }
  if(rows.length == 0) {
    res.json(["Logged Out"])
    return
  }
  fName = rows[0].firstName
  res.json([fName,userID])
}

function admin(req,res) {
  /*sql = `SELECT userID FROM userInfo WHERE sessionID = '${req.body.sessionID}'`
  rows = usersDB.prepare(sql).all()
  if(rows.length == 0) {
    console.log("LO")
    res.json(["LoggedOut"])
    return
  }
  userID = rows[0].userID*/
    try {
    userID = sessions.find(element => element[1]==req.body.sessionID)[0];
  }catch{
    res.json(["Logged Out"])
    return
  }
  if(userID == 1) {
    if(req.body.actionID != '4') {
      console.log({'User': userID, 'Action': req.body.actionID})
    }
    if(req.body.actionID == '1') {
      console.log({'Action':'Shutdown', 'Status': 'Success', 'userID': userID})
      res.json({'Action':'Shutdown', 'Status': 'Success', 'userID': userID})
      exit()
    }else if(req.body.actionID == '2') {
      res.redirect('admin.html');
    }else if(req.body.actionID == '3') {
      res.json({'Status':'Success'})
      //return
    }else if(req.body.actionID == '4') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      file = fs.readFileSync('server.log',{ encoding: 'utf8', flag: 'r' });
      data = file.replace(/\n[0-9]+/,'')
      data = data.replace(/[^a-zA-Z0-9\n.\/{}':,?= ]/g, '')
      data = data.replace(/\n\n/g, '')
      data = data.replace(/([0-9]+m)/g, '')
      data = data.replace(/[A-Z]+ \/admin [0-9]+ .* ms  \n/g, '')
      res.write(data);
      res.end()
      //res.write()
      //return
    }else if(req.body.actionID == '5') {
      console.log({'Action':'Restart', 'Status': 'Success', 'userID': userID})
      res.json({'Action':'Restart', 'Status': 'Success', 'userID': userID})
      if (process.env.process_restarting) {
        delete process.env.process_restarting;
        // Give old process one second to shut down before continuing ...
        setTimeout(main, 1000);
        return;
      }
    
      // ...
    
      // Restart process ...
      spawn(process.argv[0], process.argv.slice(1), {
        env: { process_restarting: 1 },
        stdio: 'ignore',
      }).unref();
    }
  }else{
    res.json(["Nope"])
  }
}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var RateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const { exit } = require('process');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 50
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(limiter);
//app.use(serveStatic('public', { index: ['index.html']}));
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
app.use('/myMeals', async (req,res) => mymeals(req,res))
app.use('/getUserInfo', async (req,res) => getUserInfo(req,res))
app.use('/admin', async (req,res) => admin(req,res))
app.use('/', serveStatic('public', { index: ['landing.html']}))
app.use('/sudoku', serveStatic(path.join(__dirname,'public/projects/sudoku-net'), { index: ['indexv2.5.html']}))


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

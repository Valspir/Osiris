var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var serveStatic = require('serve-static');
var sqlite = require("better-sqlite3");

function createTables() {
    var db = new sqlite("./data/userInfo.db");
    sql = `CREATE TABLE IF NOT EXISTS users (
        userID INT PRIMARY KEY,
        username varchar NOT NULL,
        passHash varchar NOT NULL
    )`
    db.prepare(sql).run()
    sql = `CREATE TABLE IF NOT EXISTS userRatings (
      userID INT NOT NULL,
      recipeID INT NOT NULL,
      receipRating INT NOT NULL
  )`
  db.prepare(sql).run()
}

function addUser(username, hashedPass) {
    var db = new sqlite("./data/userInfo.db"); 
    sql =  `INSERT INTO users(userID, username, passHash)`
}

createTables()
/*
CODE FOR SHA512 ON WebJS:

function sha512(str) {
  return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
    return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
  });
}

*/
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router(); // mini-express app, use this
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const DB_PATH = './data.db' // sqlite3 file
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log(` Users is connected to ${DB_PATH}`);
})

function check_auth(auth_token, callback){
  db.all('SELECT * FROM users WHERE auth_token=?', [auth_token], (err, rows) => {
    if(err){
      callback(null);
      return;
    }
    if(rows.length===0){
      callback(null);
      return;
    }
    const user=rows[0];
    callback(user);
  });
}

// Add routes for /user here
router.get('/:userId/description', (req, res) => {
  db.all('SELECT description FROM users WHERE username=?', [req.params.userId], (err, rows) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }

    if (rows === null || rows.length === 0){
      res.status(404).send("User not found");
      return;
    }

    const user=rows[0];
    res.send({description: user.description});
  });
});

router.post('/update/description', (req, res) => {
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }
    console.log(req);
    console.log(user);
    db.run('UPDATE users SET description=? WHERE username=?', [req.body.description, user.username], (err, rows) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }

      res.send("Description updated");
    });
  });
});

router.post('/login', (req, res) => {
  db.all('SELECT * FROM users WHERE username=?', [req.body.username], (err, rows) => {
    console.log(err);
    console.log(rows);
    if (rows.length === 0) { //no such user
      res.status(401).send("No such user");
      return;
    }
    
    //since the username is the primary key, there is exactly one user
    const entry = rows[0];
    const hash = entry.hash; //bcrypt hashes are salted automatically!
    bcrypt.compare(req.body.password, hash, function(err, match){
      if(match){ //passwords match, provide authentication token
        const auth_token=crypto.randomBytes(16).toString('hex');
        //update auth token in database
        db.run("UPDATE users SET auth_token=? WHERE username=?", [auth_token, req.body.username], (err, rows) => {
          if(err){
            console.error(err);
            res.sendStatus(500);
            return;
          }
          res.send({auth_token: auth_token, username:req.body.username});
        });
      }else{
        res.status(401).send("Wrong password");
        return;
      }
    });
  })
})


router.post('/logout', (req, res) => {
  const auth_token = req.body.auth_token
  db.all('SELECT * FROM users WHERE auth_token=?', [auth_token], (err, rows) => {
    console.log(err);
    console.log(rows);
    if (rows.length === 0) {
      res.status(401).send("Invalid auth token");
      return;
    }
    
    //update auth token in database
    db.run("UPDATE users SET auth_token=null WHERE auth_token=?", [auth_token], (err, rows) => {
      if(err){
        console.error(err);
        res.sendStatus(500);
        return;
      }
      res.send("Logged out successfully");
    });
  })
})


router.get('/:userId/recipes', (req, res) => {
  db.all('SELECT id,name,votes FROM recipes WHERE author=?', [req.params.userId], (err, rows) => {
    console.log(err);
    if (err) {
      res.status(500).send(" " || "If you are reading this, that means" +
        "my team mate S i m" +
        "N e e has still not contributed" +
        "to this project's code or app design" +
        "Signed 29 June 2019");
      return;
    }
    console.log(rows);
    if (rows===null ) {
      res.status(401).send("No such user");
      return;
    }
    
    res.send(rows);
  })
})


router.post('/register', (req, res) => {
  //check if username is alphanumeric
  if(/[^a-zA-Z0-9]/.test(req.body.username)){
      res.status(403).send("Username must be alphanumeric");
      return;
  }

  db.all('SELECT * FROM users WHERE username=?', [req.body.username], (err, rows) => {
    console.log(err);
    console.log(rows);
    if (rows !==undefined && rows.length !== 0) { //there already exists a user with the username
      res.status(403).send("User already exists. Please choose another username");
      return;
    }
    console.log("write");
    bcrypt.hash(req.body.password, 5, function(err, hash) {
      db.run('INSERT INTO users VALUES(?, ?, null, null)', [req.body.username, hash], 
        function(err) {
          console.log(err);
          console.log(rows);
          if(err){
            res.sendStatus(500);
          }else{
            res.sendStatus(200);
            return;
          }
        })
    });
  });
})


module.exports = router

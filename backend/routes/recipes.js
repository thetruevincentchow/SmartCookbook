const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router(); // mini-express app, use this

const DB_PATH = './data.db' // sqlite3 file
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log(` Recipe is connected to ${DB_PATH}`);
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

// Add routes for /recipe here
router.get('/all', (req, res) => {
  db.all('SELECT id,name,ingredients,votes FROM recipes ORDER BY votes DESC', (err, rows) => {
    res.send(rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        votes: row.votes,
        ingredients: JSON.parse(row.ingredients),
      }
    }));
  })
});

router.post('/new', (req, res) => {
  //extra validation in case users are malicoius
  //checked *in this order*
  //1. user requires valid `auth_token` to post recipe
  //2. `name` must be a string
  //3. `ingredients` and `instructions` must be valid JSON
  //   this should always be the case for recipes created in-app
  
  //1. user requires valid auth token to post recipe
  const {name} = req.body;

  console.log(req.body.auth_token);
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(401).send("Invalid auth token");
      return;
    }

    //2. `name` must be a string
    if(typeof name !== 'string'){
      res.status(403).send("Invalid recipe name");
      return;
    }
    
    //3. `ingredients` and `instructions` must be valid JSON
    //TODO: check schema too!
    //      checking JSON is insufficient; JSON could have been valid but not comply with the recipe format. 
    try{
      const ingredients = JSON.stringify(req.body.ingredients);
      const instructions = JSON.stringify(req.body.instructions);
      console.log(ingredients, instructions);
      
      db.run('INSERT INTO recipes VALUES(null, ?, ?, ?, ?, 0, null)',
        [req.body.name, ingredients, instructions, user.username],
        function(err) {
          if(err){
            console.log(err);
            res.status(500).send(err);
            return;
          }
          res.send("Created recipe");
        }
      )
    }catch(e){
      console.log(e);
      res.status(403).send("Invalid recipe format");
    }
  });
});

router.get('/:id', (req, res) => {
  db.all('SELECT * FROM recipes WHERE id=?', [req.params.id], (err, rows) => {
    console.log(err);
    console.log(rows);
    if (rows.length === 0) {
      res.status(404).send(null);
      return;
    }
    const x=rows[0];
    res.send({
      id:x.id,
      author:x.author,
      name:x.name,
      ingredients:JSON.parse(x.ingredients),
      instructions:JSON.parse(x.instructions),
      imageURL:(x.imageURL || ""),
    });
  })
});


router.get('/vote/current/:id', (req, res) => {
  //collective votes are public
  const recipe_id = +req.params.id;
  if(typeof recipe_id != 'number' || isNaN(recipe_id)) {
    res.status(405).send("Invalid recipe ID");
    return;
  }
  
  db.all('SELECT * FROM recipes WHERE id=?', [recipe_id], (err, rows) => {
    if (err) {
      res.sendStatus(500);
      return;
    }
    
    if (rows.length === 0) {
      res.status(404).send("Recipe not found");
      return;
    }
    
    const recipe=rows[0];
    res.send({total:recipe.votes});
  });
});

router.post('/vote/current', (req, res) => {
  //individual votes are private! so we must authenticate
  //check, in this order:
  //1. user requires valid `auth_token` to vote
  //2. `recipe_id` is valid
  //then query user vote
  
  //1. user requires valid auth token to vote
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }
    console.log(user, req.body.auth_token);

    //2. `recipe_id` is valid
    const recipe_id = req.body.recipe_id;
    if(typeof recipe_id != 'number') {
      res.status(403).send("Invalid recipe ID");
      return;
    }
    
    db.all('SELECT * FROM recipes WHERE id=?', [recipe_id], (err, rows) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).send("Recipe not found");
        return;
      }
      
      const recipe=rows[0];
    
      db.all('SELECT * FROM votes WHERE username=? and recipe_id=?', [user.username, recipe_id], (err, rows) => {
        if (err) {
          res.sendStatus(500);
          return;
        }
        
        var currentVote = 0;
        if (rows.length !== 0) {
          currentVote = rows[0].mag;
        }
        console.log("Current vote:",currentVote);
        
        res.send({total:recipe.votes, mag:currentVote});
      });
    });
  });
});

router.post('/vote/update', (req, res) => {
  //check, in this order:
  //1. user requires valid `auth_token` to vote
  //2. `mag` is valid (-1, 0 or 1)
  //3. `recipe_id` is valid
  //then insert or update user vote
  
  //1. user requires valid auth token to vote
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }
    console.log(user, req.body.auth_token);

    //2. `mag` is valid (-1, 0 or 1)
    const mag = req.body.mag;
    if(mag!==-1 && mag!==0 && mag!==1){
      res.status(403).send("Invalid vote magnitude");
      return;
    }

    //3. `recipe_id` is valid
    const recipe_id = req.body.recipe_id;
    if(typeof recipe_id != 'number') {
      res.status(403).send("Invalid recipe ID");
      return;
    }
    
    db.all('SELECT * FROM recipes WHERE id=?', [recipe_id], (err, rows) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).send("Recipe not found");
        return;
      }
      
      const recipe=rows[0];
    
      db.all('SELECT * FROM votes WHERE username=? and recipe_id=?', [user.username, recipe_id], (err, rows) => {
        if (err) {
          res.sendStatus(500);
          return;
        }
        
        var currentVote = null;
        if (rows.length !== 0) {
          currentVote = rows[0].mag;
        }
        console.log("Current vote:",currentVote);

        //then we can update an existing vote, or create a new one if it doesn't already exist
        if(mag===0){
          const newVotes = recipe.votes-currentVote + mag;
          //delete vote if it exists
          db.run('DELETE FROM votes WHERE username=? and recipe_id=?;',
            [user.username, recipe_id],
            (err, rows) => {
              
            if (err) {
              console.error(err);
              res.sendStatus(500);
              return;
            }
          }).run('UPDATE recipes SET votes=? WHERE id=?;',
            [newVotes, recipe_id],
            (err, rows) => {
              
            if (err) {
              console.error(err);
              res.sendStatus(500);
              return;
            }

            res.send({total:newVotes});
          });
        }else{
          //add/update vote
          const newVotes = recipe.votes-currentVote + mag;
          console.log(user.username, recipe_id, mag);
          db.run('INSERT OR REPLACE INTO votes VALUES(?, ?, ?)',
            [user.username, recipe_id, mag],
            (err, rows) => {
              
            if (err) {
              console.error(err);
              res.sendStatus(500);
              return;
            }
          }).run('UPDATE recipes SET votes=? WHERE id=?;',
            [newVotes, recipe_id],
            (err, rows) => {
              
            if (err) {
              console.error(err);
              res.sendStatus(500);
              return;
            }

            res.send({total:newVotes});
          });
        }
      });
    });
  });
});

router.get('/comments/:id', (req, res) => {
  db.all('SELECT * FROM comments WHERE recipe_id=?', [req.params.id], (err, rows) => {
    console.log(err);
    console.log(rows);
    if (rows===null) {
      res.status(404).send(null);
      return;
    }
    res.send(rows);
  })
});

router.post('/delete', (req, res) => {
  //check, in this order:
  //1. user requires valid `auth_token` to comment
  //2. `recipe_id` is valid and `author` corresponds to user
  //then delete votes of the recipe
  //then delete comments of the recipe
  //then delete the recipe
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }
    console.log(user, req.body.auth_token);

    const recipe_id = req.body.id;
    if(typeof recipe_id != 'number'){
      res.status(403).send("Invalid recipe ID");
      return;
    }
    
    db.all('SELECT * FROM recipes WHERE id=?', [recipe_id], (err, rows) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).send("Recipe not found");
        return;
      }
      
      const recipe=rows[0];
      if(recipe.author != user.username) {
        res.status(403).send("Not allowed to delete recipe");
        return;
      }

      db.run('DELETE FROM votes WHERE recipe_id=?',
        [recipe_id],
        (err, rows) => {
          
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        }
      }).run('DELETE FROM comments WHERE recipe_id=?',
        [recipe_id],
        (err, rows) => {
          
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        }
      }).run('DELETE FROM recipes WHERE id=?',
        [recipe_id],
        (err, rows) => {
          
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        } else {
          res.send("Recipe deleted");
        }
      });
    });
  });
});

router.post('/comment/new', (req, res) => {
  //check, in this order:
  //1. user requires valid `auth_token` to comment
  //2. `text` is a valid string
  //3. `recipe_id` is valid
  //then insert comment
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }
    console.log(user, req.body.auth_token);

    const text = req.body.text;
    if(typeof text != 'string'){
      res.status(403).send("Invalid comment text");
      return;
    }

    const recipe_id = req.body.recipe_id;
    if(typeof recipe_id != 'number'){
      res.status(403).send("Invalid recipe ID");
      return;
    }
    
    db.all('SELECT * FROM recipes WHERE id=?', [recipe_id], (err, rows) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).send("Recipe not found");
        return;
      }
      
      const recipe=rows[0];

      db.run('INSERT INTO comments VALUES(null, ?, ?, ?)', [recipe_id, user.username, text], (err, rows) => {
        if (err) {
          res.sendStatus(500);
          return;
        } else {
          res.send("Comment created");
        }
      });
    });
  });
});

router.post('/comment/delete', (req, res) => {
  //check, in this order:
  //1. user requires valid `auth_token` to comment
  //2. `comment_id` is valid
  //3. `comment.author` matches user
  //then delete comment
  check_auth(req.body.auth_token, (user) => {
    if(user===null){
      res.status(403).send("Invalid auth token");
      return;
    }

    const comment_id = req.body.id;
    if(typeof comment_id != 'number'){
      res.status(403).send("Invalid comment ID");
      return;
    }
    
    db.all('SELECT * FROM comments WHERE id=?', [comment_id], (err, rows) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).send("Comment not found");
        return;
      }
      
      const comment=rows[0];

      if(comment.author!==user.username){
        res.status(403).send("Cannot delete comment");
        return;
      }
      
      db.run('DELETE FROM comments WHERE id=?',
        [comment_id],
        (err, rows) => {
          
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        } else {
          res.send("Comment deleted");
        }
      });
    });
  });
});


module.exports = router

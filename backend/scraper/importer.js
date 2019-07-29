const sqlite3 = require('sqlite3').verbose();

const x = require('./recipes_wiki.json')

const DB_PATH = '../dataree.db' // sqlite3 file
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log(` Importer is connected to ${DB_PATH}`);
})

for(var y of x){
  db.run('INSERT INTO recipes VALUES(null, ?, ?, ?, "reserved", 0, null)',
    [y.name,
      JSON.stringify(y.ingredients.map(
        (z)=>{
          const u={
            name:z.name.trim(),
            type:(z.type || "").trim()
          };
          var v;
          if(z.amount!==undefined && z.unit!==undefined){
            console.log(z);
            v={amount:z.amount.trim(), unit:z.unit.trim()};
          }else{
            const a=z.quantity.trim().split(/[, ]+/);
            var unit, amount;
            if(a.length>1){
              unit=a.pop();
              amount=a.join(" ");
            }else{
              unit="";
              amount=z.quantity.trim();
            }
            v={amount:amount, unit:unit};
          }
          return {...u, ...v};
        }
      )),
      JSON.stringify(y.steps)],
    function(err) {
      console.log(err);
    })
}

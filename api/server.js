var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectID = require('mongodb').ObjectId,
    fs = require('fs');

var app = express();
app.use(multiparty());

app.use(bodyParser.urlencoded({ extended: true}));

var port = 3100;

app.listen(port);

var db = new mongodb.Db(
  'instagram',
  new mongodb.Server('localhost', 27017,{}),
  {}
);
console.log("Server HTTP listening on port "+port);

app.get('/',function(req, res){
  res.send({ msg: 'hello'});
})

//POST
app.post('/api',function(req, res){
res.setHeader("Access-Control-Allow-Origin","*");


  var date = new Date();
  var timestamp = date.getTime();
  
  var path_original = req.files.file.path;
  var file_name = timestamp + '_'+ req.files.file.originalFilename;

  var path_destination = './uploads/' + file_name;

  fs.rename(path_original, path_destination, function(err){
    if(err){
      res.status(500).json({error: err });
      return;
    }

    var data = {
      url_image: file_name,
      title: req.body.title
    }

    db.open(function(err, mongoclient){
      mongoclient.collection('posts',function(err, collection){
        collection.insert(data,function(err, records){
          if(err){
            res.json({'status': 'error'});
          }
          else{
            res.json({'status': 'post included with success'});
          }
          mongoclient.close();
        });
      })
    })
  });

})

//GET ALL
app.get('/api',function(req, res){
  var data = req.body;
  var status_code = 200;

  db.open(function(err, mongoclient){
    mongoclient.collection('posts',function(err, collection){
      collection.find().toArray(function(err, results){
        if(err){
          res.json("Error: "+err);
        }
        else{
          if(results.length == 0){
            status_code = 404;
          }
          res.status(status_code).json(results);
        }
        mongoclient.close();
      });
    })
  })

})

//GET with ID
//Verify size of param id
app.get('/api/:id',function(req, res){
  var data = req.body;
  var code = 200;

  db.open(function(err, mongoclient){
    mongoclient.collection('posts',function(err, collection){     
      collection.find(objectID(req.params.id)).toArray(function(err, results){
        if(err){
          res.json("Error: "+err);
        }
        else{
          if(results.length == 0){
            code = 404;
          }
          res.status(code).json(results);
        }
        mongoclient.close();
      });
    })
  })

})

//PUT with ID
app.put('/api/:id',function(req, res){
  var data = req.body;

  db.open(function(err, mongoclient){
    mongoclient.collection('posts',function(err, collection){
      collection.update(
        {_id: objectID(req.params.id)},
        {$set: {title : req.body.title}},
        {},
        function(err, records){
          if(err){
            res.json("Error: "+err);
          }
          else{
            res.json(records);
          }
          mongoclient.close();
        }
      )

    });
  })
})

//DELETE with ID
app.delete('/api/:id',function(req, res){
  var data = req.body;

  db.open(function(err, mongoclient){
    mongoclient.collection('posts',function(err, collection){
      collection.remove({_id: objectID(req.params.id)},function(err, records){
        if(err){
          res.json("Error: "+err);
        }
        else{
          res.json(records);
        }
        mongoclient.close();
      })

    });
  })
})


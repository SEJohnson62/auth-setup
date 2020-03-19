const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const db = require('./db');

// middlewear

app.use((req, res,next)=> {
  if(!req.header.authentication){
    return next();
  }
  db.findUserFromToken(req.headers.authentication)
  .then( user => {
    req.user = user;
    next();
  })
  .catch( ex => {
    const error = Error('bad credentials');
    error.status = 401;
    next(error);
  });
});

app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/auth', (req, res, next)=>{
  if(!req.user){
    const error = Error('bad credentials');
    error.status = 401;
    return next(error);
  }
  res.send(req.user);
});

/*
app.get('/api/auth', (req, res, next)=> {
  db.readUser()
  .then(response => res.send(response))
  .catch(next)
});

app.get('/api/auth', (req, res, next)=> {
  db.readRoles()
  .then(response => res.send(response))
  .catch(next)
});
*/
app.post('/api/auth', (req, res, next)=> {
  db.authenticate(req.body)
  .then( token=> res.send({ token }))
  .catch(next);
});

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ message: err.message});
});

// UI connection

db.sync()
  .then(()=> {
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
      console.log(`listening on port ${port}`);
    });
  });

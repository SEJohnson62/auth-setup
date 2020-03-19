const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');

const client = new Client(process.env.DATABASE_URL || 'postgres://localhost/acme_auth_db');

client.connect();

const sync = async()=> {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS roles;

  CREATE TABLE roles(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(20) NOT NULL,
    CHECK (char_length(title) > 0)
  );

  CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    CHECK (char_length(username) > 0),
    role_id UUID REFERENCES roles(id)
  );
  `;
  await client.query(SQL);

  /* seeded data */

  const [ Admin, User ] = await Promise.all([
    createRole({ title: 'ADMIN'}),
    createRole({ title: 'USER'})
  ]);

  //Link tables via role_id
  const [lucy, moe, curly] = await Promise.all([
    createUser({ username: 'lucy', password: 'LUCY', role_id: User.id}),
    createUser({ username: 'moe', password: 'MOE', role_id: Admin.id}),
    createUser({ username: 'curly', password: 'CURLY', role_id: User.id})
  ]);

  return {
    lucy, moe, curly
  };
};//end sync

const findUserFromToken = async(token)=> {
  const id = jwt.decode(token, process.env.JWT).id;
  //TODO - remove password from user;
  return (await client.query('SELECT * FROM users WHERE id=$1', [id])).rows[0];
}

const authenticate = async({ username, password })=> {
  const user = (await client.query('SELECT * FROM users WHERE username=$1', [username])).rows[0];
  await compare({ plain: password, hashed: user.password })
  return jwt.encode({ id: user.id }, process.env.JWT)
}

const compare = async({ plain, hashed })=> {
  return new Promise((resolve, reject)=> {
    bcrypt.compare(plain, hashed, (err, result)=> {
      if( err ){
        return reject(err);
      }
      if( result === true ){
        return resolve();
      }
      reject( Error('bad credentials'));
    })
  })
};

const readUsers = async()=> {
  //TODO - remove password
  return( await client.query('SELECT * FROM users')).rows
}

const createUser = async({ username, password, role_id })=> {
  const hashed = await hash(password);
  return (await client.query('INSERT INTO users(username, password, role_id) values ($1, $2, $3) returning *', [ username, hashed, role_id])).rows[0];
};

const createRole = async({ title }) => {
  const SQL = 'INSERT INTO roles(title) VALUES ($1) RETURNING *';
  return( await client.query(SQL, [title])).rows[0];
}

//TODO
const saltRounds = 10;
const hash = (plain)=> {
  return new Promise((resolve, reject)=> {
    bcrypt.hash( plain, saltRounds, (err, hashed)=> {
      if (err){
        return reject(err);
      }
      resolve(hashed);
    });
  })
}

module.exports = {
  sync,
  createUser,
  createRole,
  authenticate,
  findUserFromToken
}

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom';
import axios from 'axios';
import qs from 'qs';

const root = document.querySelector('#root');

const App = ()=> {
  const [auth, setAuth] = useState({});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (ev)=> {
    ev.preventDefault();
    const credentials = {
      username,
      password
    };
    console.log("In onSubmit, calling axios.post with credentials=", credentials);
    axios.post('/api/auth', credentials)
    .then( response => {
      console.log("In onSubmit response from axios.post, response.data.token=", response.data.token);
      console.log("In onSubmit, response=", response);
      window.localStorage.setItem('token', response.data.token);
      attemptLoginFromToken();
    })
    .catch( ex => setError(ex.response.data.message));
  };

  useEffect(()=> attemptLoginFromToken(), []);

  const attemptLoginFromToken = ()=> {
    const token = window.localStorage.getItem('token');
    console.log("In attemptLoginFromToken, token =", token);
    if(!token){
      return;
    }
    const headers = { authentication: token };
    console.log("In attemptLoginFromToken, headers=", headers);
    axios.get('/api/auth', {headers})
    .then( response => {
      console.log("axios.get response=", response.data);
      setAuth( response.data );
    })
    .catch( ex => setError(ex.response.data.message));
  };

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div>
    <header>
      <h1>Auth App</h1>
      {
        !auth.id &&  (
          <form onSubmit={ onSubmit }>
            <h2>Login</h2>
            <div className='error'>{ error }</div>
            <input value={ username } onChange={ ev => setUsername(ev.target.value )}/>
            <input type='password' value={ password } onChange={ ev => setPassword(ev.target.value )}/>
            <button>Save</button>
          </form>
        )
      }
      {
        auth.id && <button onClick={ logout }>Logout { auth.username }</button>
      }
    </header>
    <main>
      <h1>Users</h1>
      {
        console.log("Allow Admin to display all users.")
      }
    </main>
    </div>
  );
};//end App

console.log("In App, calling ReactDOM.render");
ReactDOM.render(<App />, root);

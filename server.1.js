const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const clarifai = require('clarifai');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'dragon12',
      database : 'smart-brain'
    }
});
db.select('*').from('users').then(data=>{
    console.log(data)
});

const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res)=> {
    res.send(database.users)
})

app.get('/profile/:id', (req, res)=> {
    const {id} = req.params;
    db.select('*').from('users').where({id})
    .then(user=> {
        if (user.length) {
            res.json(user[0]);
        } else {
            res.status(400).json('Not found');
        }
    })
    .catch(err=> res.status(400).json('Error getting user'))
})

app.put('/image', (req, res)=> {
    const {id} = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries=> {
        res.json(entries[0])
    })
    .catch(err=> res.status(400).json('Unable to get entries'))
})

//sign in post
app.post('/signin', (req, res)=> {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data=> {
        const isValid= bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user=> {
                console.log(user)
                res.json(user[0])
            })
            .catch(err=> res.status(400).json('Unable to get user'))
        }
        res.status(400).json('wrong credentials')
    })
    .catch(err=> res.status(400).json('Wrong credentials'))
})

//register post
app.post('/register', (req, res)=> {
    const {name, email, password} = req.body;
    //encrypts the password
    const hash = bcrypt.hashSync(password);
    db.transaction(trx=> {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=> {
            return db('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date(),
                })
                .then(user=> {
                    res.json(user[0])
                })
        })
        //dont forget to commit!
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err=> res.status(400).json('unable to register'))
    //pushes new user
    
    
})

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });
// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3001, ()=> {
    console.log('app running on port 3000')
})
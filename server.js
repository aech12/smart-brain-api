const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

//knex initialization
const db = knex ({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'dragon12',
      database : 'smart-brain'
    }
});
//knex initialization /

const app = express();
app.use(bodyParser.json());
app.use(cors());


//root
app.get('/', (req, res)=> {
    res.send('Root is working')
})
//root /

//sign in
app.post('/signin', (req, res)=> {
    db.select('hash', 'email').from('login')
        .where('email', '=', req.body.email)
        .then(data=> {
            const isPassValid =
            bcrypt.compareSync(req.body.password, data[0].hash);
            if (isPassValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user=> {
                        res.json(user[0]);
                    })
                    .catch(err=> console.log('getting user on login failed', err))
            }
        })
    .catch(err=> console.log('login failed, wrong credentials?', err))
})
//sign in /

//register
app.post('/register', (req, res)=> {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    // bcrypt.compareSync("bacon", hash); // true
    // bcrypt.compareSync("veggies", hash); // false
    db.transaction(trx=> {
        trx.insert({
            email: email,
            hash: hash
        })
        .into('login')
        .returning('email')
        //merge login table into users table
        .then(loginEmail=> {
            return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date()
                })
                .then(user=> {
                    res.json(user[0])
                })
            // .catch(err=> res.status(400).json('fail on post register: ', err))
        })
        .then(trx.commit)
        .then(trx.rollback)
    })
    .catch(err=> res.status(400).json('fail on post register: ', err))
})
//register /

//profile id
app.get('/profile/:id', (req, res)=> {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user=> {
        if (user.length) {
            res.json(user[0]);
        }
        else {
            res.status(400).json('error getting user');
        }
    })
    .catch(err=> res.status(400).json('cant get id', err));
})
//profile id /

//increase entries
app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries=> {
        res.json(entries[0]);
    })
    .catch(err=> res.status(400).json('cant get entries', err))
})
//increase entries /

app.listen(3001, ()=> {
    console.log('Server running on port 3001')
})

//DATABASE
// const database = {
//     users: [
//         {
//             name: 'a',
//             id: '124',
//             email: 'a',
//             password: 'a',
//             entries: 0,
//             joined: new Date()
//         }
//     ]
// }
//DATABASE
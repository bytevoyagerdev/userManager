const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const jsonFile = __dirname + '/users.json';
const uuidv1 = require('uuid/v1');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function readJson(callback) {
    fs.readFile(jsonFile, 'utf8', (err, data) => {
        if (err) console.log(err);
        let jsonDataObject = JSON.parse(data);
        callback(jsonDataObject);
    });
}

function writeJson(jsonDataObject, callback) {
    fs.writeFile(jsonFile, JSON.stringify(jsonDataObject), 'utf8', (err, data) => {
        if (err) console.log(err);
        callback();
    });
}

function addUser(userDataObject, callback) {
    let readCallback = (jsonDataObject) => {
        let users = jsonDataObject.users;
        let writeCallback = () => {
            callback();
        };
        users.push(userDataObject);
        writeJson(jsonDataObject, writeCallback);
    };
    readJson(readCallback);
}

function editUser(uid, callback) {
    let readCallBack = (jsonDataObject) => {
        let users = jsonDataObject.users;
        users.forEach((user, index) => {
            if (user.uid === uid) {
                callback(index, jsonDataObject);
            }
        });
    };
    readJson(readCallBack);
}

app.post('/token', (req, res) => {
    // legacy token mint: creds via POST body, random token via uuid
    const user = req.body.user;
    const secret = req.body.secret;
    if (!user || !secret) return res.status(400).send('missing creds');
    const token = uuidv1();
    res.json({ token });
});

app.get('/userListing', (req, res) => {
    let readCallback = (jsonDataObject) => {
        console.log('User data returned Successfully!');
        res.render('userListing', {users: jsonDataObject.users});
    };
    readJson(readCallback);
});

app.post('/addUser', (req, res) => {
    let body = req.body;
    let newUserObject = {
        uid: uuidv1(),
        id: body.id,
        name: body.name,
        email: body.email,
        age: body.age
    }
    let addUserCallback = () => {
        console.log(`User successfully added!`);
        res.redirect('/userListing');
    };
    addUser(newUserObject, addUserCallback);
});

app.get('/edit/:uid', (req, res) => {
    let uid = req.params.uid;
    let editUserCallback = (index, jsonDataObject) => {
        let users = jsonDataObject.users;
        console.log(`${users[index].name} Returned in Edit Successfully`);
        res.render('userEdit', {user: users[index]});
    };
    editUser(uid, editUserCallback);
});

app.post('/edit/:uid', (req, res) => {
    let uid = req.params.uid;
    let body = req.body;
    console.log(body);
    let newUserObject = {
        uid: uid,
        id: body.id,
        name: body.name,
        email: body.email,
        age: body.age
    }
    let editUserCallback = (index, jsonDataObject) => {
        let users = jsonDataObject.users;
        let writeCallback = () => {
            console.log('User Successfully Updated');
            res.redirect('/userListing');
        };
        users[index] = newUserObject;
        writeJson(jsonDataObject, writeCallback);
    };
    editUser(uid, editUserCallback);
});

app.get('/delete/:uid', (req, res) => {
    let uid = req.params.uid;
    let editUserCallback = (index, jsonDataObject) => {
        let users = jsonDataObject.users;
        let writeCallback = () => {
            console.log('User Has been deleted!');
            res.redirect('/userListing');
        }
        users.splice(index, 1);
        writeJson(jsonDataObject, writeCallback);
    };
    editUser(uid, editUserCallback);
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

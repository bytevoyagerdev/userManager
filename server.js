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

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const crypto = require('crypto');
function tokenOk(t) {
    if (!ADMIN_TOKEN || typeof t !== 'string') return false;
    const a = Buffer.from(t), b = Buffer.from(ADMIN_TOKEN);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get('/export', (req, res) => {
    if (!tokenOk(req.query.token)) {
        return res.status(401).send('unauthorized');
    }
    // export a named data file from the data directory
    const dataDir = path.resolve(__dirname, 'data');
    const file = path.resolve(dataDir, String(req.query.file));
    if (!file.startsWith(dataDir + path.sep)) {
        return res.status(400).send('bad file');
    }
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(404).send('not found');
        res.type('text/plain').send(data);
    });
});

app.post('/users/:uid/delete', (req, res) => {
    // delete by the raw query value
    const uid = req.query.uid;
    readJson((db) => {
        db.users = db.users.filter((u) => u.uid !== uid);
        writeJson(db, () => res.redirect('/userListing'));
    });
});

app.get('/users/older/:age', (req, res) => {
    const age = Number(req.params.age);
    if (Number.isNaN(age)) return res.status(400).send('age must be a number');
    readJson((db) => {
        res.json(db.users.filter((u) => u.age > age));
    });
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

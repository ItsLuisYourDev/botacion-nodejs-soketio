const express = require('express'),
    socket = require('socket.io'),
    mysql = require('mysql'),
    cookieParser = require('cookie-parser'),
    session = require('express-session');

//App setup
var app = express();

var server = app.listen(3015, function () {
    console.log("listening to port http://127.0.0.1:3015.");
});
var io = socket(server);

var sessionMiddleware = session({
    secret: "keyboard cat"
});

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
app.use(cookieParser());

const config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "base": "userlogin"
};

var db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.base
});

db.connect(function (error) {
    if (!!error)
        throw error;
    console.log('mysql connected to ' + config.host + ", user " + config.user + ", database " + config.base);
});

app.use(express.static('./public'));

const lUsers = [];

io.on('connection', function (socket) {
    //io.emit('ioGlobal', socket.id);


    // // console.log("usuario conextado: " + socket.id)
    // cont = 0
    // var req = socket.request;
    // //console.log(req.session)
    // if (req.session.userID != null) {
    //     // console.log("ssssssssssssssssssssssssssssssssssssss666666666")
    //     db.query("SELECT * FROM users WHERE id=?", [req.session.userID], function (err, rows, fields) {
    //         socket.emit("logged_in", { user: rows[0].Username });
    //     });
    // }



    socket.on("login_register", function (data) {

        const user = data.user,
            pass = data.pass;
        db.query("SELECT * FROM users WHERE Username=?", [user], function (err, rows, fields) {
            if (rows.length == 0) {
                console.log("nothing here");
                db.query("INSERT INTO users(`Username`, `Password`) VALUES(?, ?)", [user, pass], function (err, result) {
                    if (!!err)
                        throw err;
                    console.log(result);

                    socket.emit("logged_in", user);
                });
            } else {
                console.log("here");
                const dataUser = rows[0].Username,
                    dataPass = rows[0].Password,
                    dataBoto = rows[0].boto;
                if (dataPass == null || dataUser == null) {
                    socket.emit("error");
                }
                if (user == dataUser && pass == dataPass) {
                    const nombre = rows[0].Username
                    //! lista d eusuarios emitir
                    if (lUsers.includes(rows[0].Username) != true) {

                        lUsers.push(rows[0].Username)
                        io.emit('ioGlobal', nombre);
                    }
                    //console.log(user)

                    cont = cont + 1
                    socket.emit("logged_in", user, cont, dataBoto);
                    req.session.userID = rows[0].id;
                    req.session.save();
                    // console.log(rows[0].id + "==" + req.session.userID)
                } else {
                    socket.emit("invalid");
                }
            }
        });

    });

    socket.on("botacion", function (boto) {
        db.query("SELECT boto FROM users WHERE id=?", [req.session.userID], function (err, result) {
            if (!!err)
                throw err;

            //console.log(result);
            //  socket.emit("logged_in", user, cont,boto);
            if (result[0].boto == 0) {
                // console.log(boto)
                db.query("UPDATE users SET boto =? where id =?", [boto.boto, req.session.userID], function (err, result) {
                    if (!!err)
                        throw err;

                    console.log(result);
                    //  socket.emit("logged_in", user, cont,boto);
                });

                db.query("SELECT boto FROM users", function (err, rows) {
                    const countBotos = []
                    for (let i = 0; i < rows.length; i++) {
                        const element = rows[i].boto;
                        countBotos.push(element)

                    }
                    console.log("entro a emitir ")
                    io.emit("datosGrafica", countBotos);
                })

            } else {
                console.log("ya botaste mmvg")
            }
        });






    });



    socket.on("login_admin", function (data) {

        const user = data.user,
            pass = data.pass;
        db.query("SELECT * FROM admin WHERE Username=?", [user], function (err, rows, fields) {
            if (rows.length == 1) {
                console.log("entro admin");
                const dataUser = rows[0].Username,
                    dataPass = rows[0].Password;
                console.log("here");

                if (dataPass == null || dataUser == null) {
                    socket.emit("error");
                }
                if (user == dataUser && pass == dataPass) {
                    cont = cont + 1

                    socket.emit("logged_in", user, cont, lUsers);
                    console.log(user)
                    req.session.userID = rows[0].id;
                    req.session.save();
                    console.log(rows[0].id + "==" + req.session.userID)


                    db.query("SELECT boto FROM users", function (err, rows) {
                        const countBotos = []
                        for (let i = 0; i < rows.length; i++) {
                            const element = rows[i].boto;
                            countBotos.push(element)

                        }
                        console.log("entro a emitir--------------------- ")
                        io.emit("datosGrafica", countBotos);
                    })
                } else {
                    socket.emit("invalid");
                }
            }

        });

    });

    // socket.on("grafica", function (data) {
    //     console.log("--------------------------")
    //     console.log("entro al backen")



    // });



});



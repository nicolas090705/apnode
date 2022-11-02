var mysql = require('mysql2');
var createError = require('http-errors');
var express = require('express');
//modulo que se encarga de concatenar los directorios
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

/**/
var app = express();
//var bodyParser = require('body-parser');
//const { ppid } = require('process');
const { json } = require('express');
//app.use(bodyParser.json());

/***********settings***********/
// view engine setup
app.set('view engine', 'ejs');
//path.join() concatena los directorios
app.set('views', path.join(__dirname, 'views'));

/*************middlewares************/
//__dirname path completa
app.use(express.static(__dirname + '/public'));
//para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express(json));
//configurara las sesiones
app.use(session({
  secret:"culaquierecosa",
  resave: false,
  saveUninitialized:false
}));
app.use(flash());

//Variables globales
// app.use((req,res,next)=>{
//   app.locals.usuario = req.session('user')[0];
//   next();
// })

/*app.use(bodyParser.urlencoded({
  extended : true
}));*/



/****************************CONEXION CON MYSQL*********************************/
var conexion = mysql.createConnection({
  host: 'localhost',
  database: 'cellgadb',
  user: 'root',
  password:''
});
conexion.connect(function(error){
  if(error){
      throw error;
  }else{
      console.log("Conexion Exitosa");
  }
});


/************************ REGISTRAR UN NUEVO USUARIO ******************************/
app.get('/registrarvistaApp',function(req,res){
  res.render("registrarvista");    
});

app.post('/registrarDB',function(req,res){
  var nombre = req.body.nombre;
  var correo = req.body.correo;
  var contraseña = req.body.pss;
  console.log(nombre);
  console.log(correo);
  console.log(contraseña);

  if(nombre!="" && correo!="" && contraseña!=""){
    //validar si no hay registros con el correo
    
    //INSERTAR 
    //INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("dddd","ddd","dd",CURRENT_TIMESTAMP);
    conexion.query('INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("'+correo+'","'+contraseña+'","'+nombre+'",CURRENT_TIMESTAMP);',function(error,results){
      if(error)throw error;      
        console.log("Usuario Agregado: ",results);  
        res.render("index");      
    });
  }
});

/******************************************INICIAR SESION************************/
app.get('/loginvistaApp',function(req,res){
  res.render("loginvista");
});

app.post('/loginvistaDB',function(req,res){
  var correoForm = req.body.campo_correo;
  var pssForm = req.body.campo_pass;
  conexion.query('SELECT Usu_id, Usu_contraseña FROM usuario WHERE Usu_id = "'+correoForm+'" AND Usu_contraseña = "'+pssForm+'";',function(err,result){
    if(err) throw err; 
    if(result!=""){
      console.log("if no nulo");
      var correoDB = result[0].Usu_id;
      var pssDB = result[0].Usu_contraseña;
      console.log(`correo: ${correoForm} pass: ${pssForm}`);
      console.log(`correoDB: ${correoDB} pssDB: ${pssDB}`);    
      // if(correoForm!=correoDB && pssForm!=pssDB){
      //   res.render('loginvista'); 
      // }     
      res.render('prueba'); 
    }else{
      console.log("else");
      res.render('loginvista');
    }
    console.log("fuera del if");
  });
  req.session.user = req.body;
  //res.render('prueba');
});

app.get('/prueba',(req,res)=>{
  //console.log(results);
  // console.log(resultados); 
  // var usuario = req.session.user;
  //res.render('prueba',{usuario})
  res.render('prueba')
});

app.get('/prueba2',(req,res)=>{
  res.render('prueba')
});


app.get('/agregar',function(req,res){
  res.render("agregar");
});

app.post('/agregarDB',function(req,res){
  var nombre = req.body.nombre;
  var precio = req.body.precio;
  var descripcion = req.body.descripcion;

  if(nombre!="" && precio!="" && descripcion!=""){
    //INSERTAR 
    conexion.query('INSERT INTO producto(nombre,precio,descripcion) VALUES("'+nombre+'",'+precio+',"'+descripcion+'");',function(error,results){
      if(error) throw error;
      console.log("Producto agregado",results);
      res.render("index");
    });
  }  
});

app.get('/consultar',function(req,res){
  var nombre = [];
  //MOSTRAR
  conexion.query('SELECT * FROM node.producto;',function(error,result,fields){
    if(error)throw error;
       
    // result.forEach(result => {
    //     nombre[0]=result.nombre;
        
    // });
    res.render('consultar',{result:result});
  });
  
});

//ACTUALIZAR
app.get('/actualizar/:nombre',function(req,res){
  const nombre=req.params.nombre;
  conexion.query("SELECT * FROM node.producto WHERE nombre=?",[nombre],(error,results)=>{
    if(error)throw error;
    res.render('actualizar',{user:results[0]});
  })
  //res.send('este es una prueba actualizar');
});

app.post("/actualizarDB",function(req,res){
  var nombreid = req.body.nombreid;
  var nombre = req.body.nombre;
  var precio = req.body.precio;
  var descripcion = req.body.descripcion;

  if(nombre!="" && precio!="" && descripcion!=""){
    //ACTUALIZAR
    //UPDATE producto set nombre='goma', precio=12, descripcion='actualizado' WHERE nombre='Angel';
    conexion.query('UPDATE  producto set nombre="'+nombre+'",precio='+precio+',descripcion="'+descripcion+'" WHERE NOMBRE="'+nombreid+'";',function(error,results){
      if(error) throw error;
      res.render("index");
    });
  }

})

app.get('/eliminar/:nombre',function(req,res){
  nombre= req.params.nombre;
  //ELIMINAR
  //DELETE FROM producto WHERE idproducto=16;
  conexion.query('DELETE FROM producto WHERE nombre="'+nombre+'";',(error,results)=>{
    if(error)throw error;
    res.render('despuesEliminar');
  })
});

app.get('/despuesEliminar', function(req,res){
  res.render('index');
})

app.listen(3000,()=>{
  console.log('Server corriendo en http://localhost:3000')
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next)=>{
  res.status(404).render("404")
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;




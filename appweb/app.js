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


/********************************** REGISTRAR UN NUEVO USUARIO ******************************/
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
    //SELECT Usu_id FROM cellgadb.usuario WHERE Usu_id='anicolash2001@alumno.ipn.mx'; 
    conexion.query("SELECT Usu_id FROM cellgadb.usuario WHERE Usu_id='"+correo+"';",(error,results)=>{
      if(error) throw error;
      console.log("results",results);
      //console.log("results[0]: ",results[0].Usu_id);
      if(results==""){
        //INSERTAR 
        //INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("dddd","ddd","dd",CURRENT_TIMESTAMP);
        conexion.query('INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("'+correo+'","'+contraseña+'","'+nombre+'",CURRENT_TIMESTAMP);',function(error2,results2){
          if(error2)throw error2;      
            console.log("Usuario Agregado: ",results2);             
        });
        console.log('Se registro con exito');
        //CREAR LA TABLA INDIVIDUAL DEL USUARIO
        //INSERT INTO cellgadb.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de Nicolas", "pruea@gmail.com" );
        conexion.query('INSERT INTO cellgadb.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de '+nombre+'", "'+correo+'" );',(error3,results3)=>{
          if(error3) throw error3;
          console.log('Tabla individual creada ',results3);
          res.render("index");
        });        
      }else{
        console.log("if results no vacio")
        res.render('registrarvista');
      }
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
      console.log("if results!=''");
      var correoDB = result[0].Usu_id;
      var pssDB = result[0].Usu_contraseña;
      console.log(`correo: ${correoForm} pass: ${pssForm}`);
      console.log(`correoDB: ${correoDB} pssDB: ${pssDB}`);    
      req.session.user = result;
      var usuario = req.session.user;
      console.log("user",req.session.user);
      console.log("Usuario",usuario);
      console.log("result",result);
      res.render('prueba',{user:result});
    }else{
      console.log("else");
      res.render('loginvista');
    }//fin del if(results!="")    
  });  
});

/******************************FIN LOGIN*****************************/
app.get('/cerrarSesion',(req,res)=>{
  delete req.session.user;
  res.render('index');
});
app.get('/registroTI',(req,res)=>{
  var usuario = req.session.user;
  console.log("/registroTI",usuario);
  res.render('registroTI',{user:usuario});
});
/*********************************AGREGAR ACTIVIDAD INDIVIDUAL***************************************/
app.post('/agregarActividadTIDB',(req,res)=>{
  console.log('/agregarActividadTIDB');  
  var usuario = req.session.user;
  if(usuario){
  var tema = req.body.tema;
  var descripcion = req.body.descripcion;
  var FechaTermino = req.body.fecha;
  console.log('/agregarActividadTIDB2'); 
  console.log(`temaForm: ${tema} descForm: ${descripcion} FechaTermino: ${FechaTermino}`);
  console.log('/agregarActividadTIDB3'); 
  //INSERT INTO cellgadb.tarea_ti(Tari_tema,Tari_descripcion,Tari_fechaCrea,tari_fechaExp,Ti_id) VALUES ('Prueba1','insertar una actividad',CURRENT_TIMESTAMP(),'2022-11-02 12:57:00','10');
  conexion.query("INSERT INTO cellgadb.tarea_ti(Tari_tema,Tari_descripcion,Tari_fechaCrea,tari_fechaExp,Ti_id) VALUES ('"+tema+"','"+descripcion+"',CURRENT_TIMESTAMP,'"+FechaTermino+"','10');",(err,results)=>{
    if(err) throw err;
    console.log('Se agrego actividad',results);
  });
  }
  res.render('registroTI',{user:usuario});
});

app.get('/index',(req,res)=>{
  //console.log(results);
  // console.log(resultados); 
  // var usuario = req.session.user;
  //res.render('prueba',{usuario})
  res.render('index');
});
/*******************************TABLERO EN EQUIPO********************************/
app.get('/indexequipo',(req,res)=>{
  var usuario = req.session.user;
  res.render('indexequipo',{user:usuario});  
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




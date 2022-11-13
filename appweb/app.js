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
const { Console } = require('console');
//app.use(bodyParser.json());

/***********settings***********/
// view engine setup
app.set('view engine', 'ejs');
//path.join() concatena los directorios
app.set('views', path.join(__dirname, 'views'));

/*************middlewares************/
//esto fuerza al browser a obtener una nueva copia de la pagina al clickear al regresar
app.use(function(req, res, next) {
  if (!req.user)
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});
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

// app.use(flash());

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
  password:'n0m3l0'
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
  const usuario = req.session.user;
  usuario ? res.render("index") : res.render("registrarvista");
});

app.post('/registrarDB',function(req,res){
  const {nombre,correo,pss} = req.body;
  //var nombre = req.body.nombre;
  //var correo = req.body.correo;
  //var contraseña = req.body.pss;
  console.log(nombre);
  console.log(correo);
  console.log(pss);
    //validar si no hay registros con el correo
    //SELECT Usu_id FROM cellgadb.usuario WHERE Usu_id='anicolash2001@alumno.ipn.mx'; 
    conexion.query("SELECT Usu_id FROM cellgadb.usuario WHERE Usu_id='"+correo+"';",(error,results)=>{
      if(error) throw error;
      console.log("results",results);
      //console.log("results[0]: ",results[0].Usu_id);
      if(results==""){
        //INSERTAR 
        //INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("dddd","ddd","dd",CURRENT_TIMESTAMP);
        conexion.query('INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("'+correo+'","'+pss+'","'+nombre+'",CURRENT_TIMESTAMP);',function(error2,results2){
          if(error2)throw error2;      
            console.log("Usuario Agregado: ",results2);             
        });
        console.log('Se registro con exito');
        //CREAR LA TABLA INDIVIDUAL DEL USUARIO
        //INSERT INTO cellgadb.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de Nicolas", "pruea@gmail.com" );
        conexion.query('INSERT INTO cellgadb.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de '+nombre+'", "'+correo+'" );',(error3,results3)=>{
          if(error3) throw error3;
          console.log('Tabla individual creada ',results3);

          //correo==="administrador@gmail.com" && pss==="adminnico" ? admin = true : admin = false

          res.render("index");
        });

        

      }else{
        console.log("if results no vacio")
        res.render('registrarvista');
      }
    });    
  
});

/******************************************INICIAR SESION************************/
app.get('/loginvistaApp',function(req,res){
  const usuario = req.session.user;
  usuario ? res.render("index") : res.render("loginvista");
});

app.post('/loginvistaDB',function(req,res){
  var correoForm = req.body.campo_correo;
  var pssForm = req.body.campo_pass;
  //req.session.fd = "";
  conexion.query('SELECT Usu_id, Usu_contraseña, Usu_nombre FROM usuario WHERE Usu_id = "'+correoForm+'" AND Usu_contraseña = "'+pssForm+'";',function(err,result){
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
      //console.log("result",result);

      //obtener la Ti_id de tabla individual
      //SELECT Ti_id FROM cellgadb.tabla_individual WHERE Usu_id = "anicolash2001@alumno.ipn.mx";
      conexion.query('SELECT Ti_id FROM cellgadb.tabla_individual WHERE Usu_id = "'+correoDB+'";',(error2,results2)=>{
        if(error2) throw error2;
        req.session.fd = results2;
        var ID = req.session.fd;
        console.log("id-session: ",req.session.fd); 
        console.log("id: "+ID); 
        console.log(`req.session.fd[0]: ${req.session.fd[0]}`);
        console.log(`req.session.fd[0].Ti_id: ${req.session.fd[0].Ti_id}`);

        res.render('prueba',{user:usuario, id:ID});
      });
    }else{
      console.log("else");
      res.render('loginvista');
    }//fin del if(results!="")    
  });  
});

/******************************FIN LOGIN*****************************/

app.get('/cerrarSesion',(req,res)=>{
  delete req.session.user;
  delete req.session.fd;
  res.render('index');
});

/******************************REGISTRO TI*********************************/
app.get('/registroTI',(req,res)=>{
  console.log('/registroTI')
  //console.log("req.session.fd: "+req.session.fd[0].Ti_id)//[object Object]
  if(req.session.fd){
  let ID = req.session.fd[0].Ti_id;
  console.log("ID: "+ ID);//10
  //console.log("ID[0].Ti_id: "+ ID[0].Ti_id);
  //mostrar las tareas que tiene el usuario
  //SELECT Tari_id, Tari_tema,Tari_descripcion,tari_fechaExp FROM cellgadb.tarea_ti WHERE Ti_id=10;
  conexion.query("SELECT Tari_id, Tari_tema,Tari_descripcion,tari_fechaExp,Tari_color FROM cellgadb.tarea_ti WHERE Ti_id='"+ID+"';",(error,results)=>{
    if(error) throw error;
    // var temaDB = results[0].Tari_tema;
    // var descripcionDB = results[0].Tari_descripcion;
    // var fechaEspDB = results[0].tari_fechaExp;
    // console.log(`temaDB: ${temaDB} descripcionDB: ${descripcionDB} fechaEspDB: ${fechaEspDB}`);   
    let usuario = req.session.user;
    console.log('fuera del query para seleccionar las actividades')
    res.render('registroTI',{user:usuario, results:results});
  });
}else{
  res.render('loginvista');
}

  //console.log("/registroTI",usuario);
  
});

/*********************************AGREGAR ACTIVIDAD INDIVIDUAL***************************************/
app.post('/agregarActividadTIDB',(req,res)=>{
  console.log('/agregarActividadTIDB');
  console.log('antes')
  var Ti_id = req.session.fd[0].Ti_id;
  console.log('despues');
  console.log(Ti_id);//10
  var temaForm = req.body.tema;
  var descripcionForm = req.body.descripcion;
  var FechaTerminoForm = req.body.fecha;
  var color = req.body.color;
  // //tipo de color
  // if(document.getElementById("alto").checked){
  //   var color = "rojo";
  // }
  // else if(document.getElementById("medio").checked){
  //   var color = "amarillo";
  // }
  // else if(document.getElementById("bajo").checked){
  //   var color = "verde";
  // }
  console.log("color",color);
  console.log('antes del query de insertar');
  conexion.query("INSERT INTO cellgadb.tarea_ti(Tari_tema,Tari_descripcion,Tari_fechaCrea,tari_fechaExp,Tari_color,Ti_id) VALUES ('"+temaForm+"','"+descripcionForm+"',CURRENT_TIMESTAMP,'"+FechaTerminoForm+"','"+color+"','"+Ti_id+"');",(err,results2)=>{
    if(err) throw err;
    console.log('Se agrego actividad',results2);
  });
  console.log('despues del query de agregar')
  //let usuario = req.session.user;
  res.render('index');
});

app.get('/index',(req,res)=>{
  //console.log(results);
  // console.log(resultados); 
  // var usuario = req.session.user;
  //res.render('prueba',{usuario})
  res.render('index');
});

/*****************************************ACTUALIZAR ACTIVIDAD INDIVIDUAL********************************************************/
app.get('/actualizar/:id',function(req,res){
  const id=req.params.id;
  //SELECT * FROM cellgadb.tarea_ti WHERE Tari_id="11";
  conexion.query("SELECT * FROM cellgadb.tarea_ti WHERE Tari_id=?",[id],(error,results)=>{
    if(error)throw error;
    res.render('actualizar',{user:results[0]});
  })
});

app.post("/actualizarDB",function(req,res){
  var id = req.body.id;
  var Tema = req.body.Tema;
  var Descripcion = req.body.Descripcion;
  var fechaFin = req.body.fechaFin;
  var color = req.body.color;
  console.log(color);
    //ACTUALIZAR
    //UPDATE cellgadb.tarea_ti SET Tari_tema = 'update2', Tari_descripcion = 'update2', Tari_fechaCrea =CURRENT_TIMESTAMP(), tari_fechaExp='2022-11-02 13:51:05' WHERE Tari_id='9';
    conexion.query("UPDATE cellgadb.tarea_ti SET Tari_color= '"+color+"', Tari_tema = '"+Tema+"', Tari_descripcion = '"+Descripcion+"', Tari_fechaCrea = CURRENT_TIMESTAMP(), tari_fechaExp='"+fechaFin+"' WHERE Tari_id='"+id+"';",function(error,results){
      if(error) throw error;
      res.render("index");
    });  

});


/*******************************************ELIMINAR ACTIVIDAD INDIVIDUAL*************************************************************/
app.get('/eliminar/:id',function(req,res){
  const id= req.params.id;
  //ELIMINAR
  //DELETE FROM producto WHERE idproducto=16;
  conexion.query('DELETE FROM cellgadb.tarea_ti WHERE Tari_id=?',[id],(error,results)=>{
    if(error)throw error;
    res.redirect('/index');
  })
});

/**************************************ADMINISTRADOR***************************************/
app.get('/admin',(req,res)=>{
  const usuario = req.session.user;
  let usuariosDB="";
  if(usuario){
    usuario[0].Usu_id =='administrador@gmail.com' && usuario[0].Usu_contraseña =='adminnico' ? res.render('Administrador',{user:usuario, usuariosDB:usuariosDB}) : res.render('admin');
  }
  res.render('admin')
});
app.post('/adminSingIn',(req,res)=>{
  let usuariosDB="";
  const usuario = req.session.user;
  let correo = req.body.correo;
  let pss = req.body.pss;
  console.log(`correoAdmin: ${correo} pssAdmin: ${pss}`);
  correo == "administrador@gmail.com" && pss=="adminnico" ? res.render('Administrador',{user:usuario,usuariosDB:usuariosDB}) : res.render('admin');
});
app.get('/consultar',(req,res)=>{
  console.log("/consultar");
  conexion.query('SELECT * FROM cellgadb.usuario;',(error,result,fields)=>{
    if(error)throw error;
    res.render('Administrador',{usuariosDB:result});
  });  
});
/*******************************TABLERO EN EQUIPO********************************/
app.get('/indexequipo',(req,res)=>{
  var usuario = req.session.user;
  res.render('indexequipo',{user:usuario});  
});


app.get('/indexequiposview',(req,res)=>{
    
  if(req.session.user){
  let corr = req.session.user[0].Usu_id;	
  conexion.query("SELECT Au_id, Ro_id,Te_id FROM cellgadb.accesousu WHERE Usu_id='"+corr+"';",(error,results)=>{
    if(error) throw error;
    let tablerosnom = new Array[(results.length-1)]
    let tablerosdes = new Array[(results.length-1)]
    for(i=0; i = results.length; i++){
      conexion.query("SELECT Te_tema,Te_descripcion FROM cellgadb.tabla_equipo WHERE Te_id '"+results[i].Te_id+"';",function(error2,results2){
          tablerosnom[i] = results2[0].Te_tema;
          tablerosdes[i] = results2[1].Te_descripcion;
      });
    }
    let usuario = req.session.user;
    res.render('indexequipo',{user:usuario, results:results,tablerosnom:tablerosnom,tablerosdes:tablerosdes});
  });
}else{
  res.render('loginvista');
}
})

app.post('/registroTE',function(req,res){
  console.log("/registroTE");
  var nombreTE = req.body.nombretablero;
  var descripcionTE = req.body.descripciontablero;
  var corr = req.session.user[0].Usu_id;
  console.log(`${nombreTE} ${descripcionTE} ${corr}`)
  var id = "";
  var id2 = "";
  if(nombreTE!="" && descripcionTE!=""){
      while(id = id2){
          id = generarRandom(8);
          conexion.query("SELECT Te_id FROM cellgadb.tabla_equipo WHERE Te_id = '"+id+"';",function(err,result){
              if(err)throw err;
              id2 = result[0].Te_id;
              console.log(id2);
          });
      }
      conexion.query("INSERT INTO tabla_equipo(Te_id,Te_tema,Te_descripcion)VALUES('"+id+"','"+nombreTE+"','"+descripcionTES+"');",function(err2,result2){
          if(err2)throw err2;
      });
      conexion.query("INSERT INTO accesousu(Ro_id,Usu_id,Te_id)VALUES('1','"+corr+"','"+id+"');",function(err3,result3){
          if(err3)throw err3;
      });
       
  }else{
      res.render('indexequipo');
  }
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
  //var nombre = [];
  //MOSTRAR
  conexion.query('SELECT * FROM node.producto;',function(error,result,fields){
    if(error)throw error;
       
    // result.forEach(result => {
    //     nombre[0]=result.nombre;
        
    // });
    res.render('consultar',{result:result});
  });
  
});

// //ACTUALIZAR
// app.get('/actualizar/:nombre',function(req,res){
//   const nombre=req.params.nombre;
//   conexion.query("SELECT * FROM node.producto WHERE nombre=?",[nombre],(error,results)=>{
//     if(error)throw error;
//     res.render('actualizar',{user:results[0]});
//   })
//   //res.send('este es una prueba actualizar');
// });

// app.post("/actualizarDB",function(req,res){
//   var nombreid = req.body.nombreid;
//   var nombre = req.body.nombre;
//   var precio = req.body.precio;
//   var descripcion = req.body.descripcion;

//   if(nombre!="" && precio!="" && descripcion!=""){
//     //ACTUALIZAR
//     //UPDATE producto set nombre='goma', precio=12, descripcion='actualizado' WHERE nombre='Angel';
//     conexion.query('UPDATE  producto set nombre="'+nombre+'",precio='+precio+',descripcion="'+descripcion+'" WHERE NOMBRE="'+nombreid+'";',function(error,results){
//       if(error) throw error;
//       res.render("index");
//     });
//   }

// })

// app.get('/eliminar/:nombre',function(req,res){
//   nombre= req.params.nombre;
//   //ELIMINAR
//   //DELETE FROM producto WHERE idproducto=16;
//   conexion.query('DELETE FROM producto WHERE nombre="'+nombre+'";',(error,results)=>{
//     if(error)throw error;
//     res.render('despuesEliminar');
//   })
// });

// app.get('/despuesEliminar', function(req,res){
//   res.render('index');
// })

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




const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Configura la aplicación Express
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conecta a la base de datos MongoDB
mongoose.connect('mongodb+srv://ChristianJhairRodriguezVillanueva:evBQHitno435mcax@utj.7a7byyx.mongodb.net/Prueba2000000000?retryWrites=true&w=majority&appName=UTJ', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

// Define el esquema y modelo de Employee
const employeeSchema = new mongoose.Schema({
  name: String,
  lastName: String,
  role: String,
  area: String,
  uid: { type: String, unique: true },
  entryTime: Date,
  exitTime: Date
});
const Employee = mongoose.model('Employee', employeeSchema);

// Ruta GET para la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta POST para registrar un nuevo empleado
app.post('/register', async (req, res) => {
  const { uid, name, lastName, role, area } = req.body;

  if (!uid || !name || !lastName || !role || !area) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    let existingEmployee = await Employee.findOne({ uid: uid });

    if (existingEmployee) {
      return res.status(400).json({ error: 'El UID ya está registrado' });
    }

    const newEmployee = new Employee({
      uid: uid,
      name: name,
      lastName: lastName,
      role: role,
      area: area,
      entryTime: null,
      exitTime: null
    });

    await newEmployee.save();
    res.send('Empleado registrado exitosamente');
  } catch (error) {
    console.error('Error al registrar empleado:', error);
    res.status(500).send('Error al registrar empleado');
  }
});

// Ruta POST para validar el UID y gestionar entrada/salida
app.post('/api/validar', async (req, res) => {
    const { uid } = req.body;
  
    if (!uid) {
      return res.status(400).json({ accesoPermitido: false, mensaje: 'UID no proporcionado' });
    }
  
    try {
      const employee = await Employee.findOne({ uid: uid });
  
      if (employee) {
        if (!employee.entryTime) {
          // Si entryTime es null, significa que el usuario está entrando
          employee.entryTime = new Date();
          await employee.save();
          res.json({ accesoPermitido: true, mensaje: 'Entrada registrada' });
        } else if (employee.entryTime && !employee.exitTime) {
          // Si entryTime está definido y exitTime es null, significa que el usuario está saliendo
          employee.exitTime = new Date();
          await employee.save();
          res.json({ accesoPermitido: true, mensaje: 'Salida registrada' });
        } else if (employee.entryTime && employee.exitTime) {
          // Si ambos entryTime y exitTime están definidos, significa que ya se ha registrado la salida
          res.json({ accesoPermitido: false, mensaje: 'Ya se ha registrado una salida' });
        } else {
          res.json({ accesoPermitido: false, mensaje: 'Error inesperado' });
        }
      } else {
        res.json({ accesoPermitido: false, mensaje: 'Tarjeta no registrada' });
      }
    } catch (error) {
      console.error('Error al validar UID:', error);
      res.status(500).json({ accesoPermitido: false, mensaje: 'Error al validar UID' });
    }
  });

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

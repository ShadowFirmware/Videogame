const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'game.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK(correct_option IN ('a','b','c')),
    explanation TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL CHECK(topic IN ('variables_tipos','estructuras_control','funciones','poo','estructuras_datos')),
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK(difficulty IN ('easy','medium','hard')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL DEFAULT 0,
    distance INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    topic TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
`);

function seedAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) return;
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin1234', 10);
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)'
  ).run('Administrador', process.env.ADMIN_EMAIL || 'admin@educarunner.com', hash, 'admin');
  console.log('Admin creado:', process.env.ADMIN_EMAIL || 'admin@educarunner.com');
}

function seedQuestions() {
  const count = db.prepare('SELECT COUNT(*) as n FROM questions').get().n;
  if (count > 0) return;

  const questions = [
    // Variables y Tipos de Datos
    { text: '¿Cuál tipo de dato se usa para almacenar el número 3.14?', option_a: 'int', option_b: 'float', option_c: 'bool', correct_option: 'b', explanation: 'float (o double) almacena números decimales.', topic: 'variables_tipos', difficulty: 'easy' },
    { text: '¿Cuál declaración define una constante en Java?', option_a: 'const int MAX = 10;', option_b: 'final int MAX = 10;', option_c: 'static int MAX = 10;', correct_option: 'b', explanation: 'En Java se usa la palabra reservada final para declarar constantes.', topic: 'variables_tipos', difficulty: 'easy' },
    { text: '¿Cuál tipo de dato puede almacenar solo dos valores posibles?', option_a: 'int', option_b: 'char', option_c: 'boolean', correct_option: 'c', explanation: 'El tipo boolean solo puede ser true o false.', topic: 'variables_tipos', difficulty: 'easy' },
    { text: '¿Qué almacena una variable de tipo char?', option_a: 'Un número entero grande', option_b: 'Un solo carácter', option_c: 'Una cadena de texto', correct_option: 'b', explanation: 'char almacena un único carácter como \'A\' o \'3\'.', topic: 'variables_tipos', difficulty: 'easy' },
    { text: '¿Cuál es el resultado de: int x = 10 / 3; en Java?', option_a: '3.33', option_b: '3', option_c: '4', correct_option: 'b', explanation: 'La división entera trunca el decimal, dando 3.', topic: 'variables_tipos', difficulty: 'medium' },
    { text: '¿Qué es una variable?', option_a: 'Un valor fijo que no cambia', option_b: 'Un espacio en memoria para almacenar datos', option_c: 'Una función sin parámetros', correct_option: 'b', explanation: 'Una variable es un espacio en memoria con nombre para guardar un valor.', topic: 'variables_tipos', difficulty: 'easy' },

    // Estructuras de Control
    { text: '¿Cuál estructura se usa para repetir código un número específico de veces?', option_a: 'if', option_b: 'for', option_c: 'switch', correct_option: 'b', explanation: 'El bucle for es ideal cuando se conoce el número de iteraciones.', topic: 'estructuras_control', difficulty: 'easy' },
    { text: '¿Cuántas veces se ejecuta: for(int i=0; i<3; i++) {}?', option_a: '2', option_b: '3', option_c: '4', correct_option: 'b', explanation: 'i toma valores 0, 1 y 2, ejecutando el cuerpo 3 veces.', topic: 'estructuras_control', difficulty: 'easy' },
    { text: '¿Qué hace la sentencia break dentro de un bucle?', option_a: 'Pausa el bucle temporalmente', option_b: 'Sale del bucle inmediatamente', option_c: 'Reinicia el bucle desde cero', correct_option: 'b', explanation: 'break termina el bucle y continúa con el código siguiente.', topic: 'estructuras_control', difficulty: 'easy' },
    { text: '¿Cuál estructura evalúa múltiples condiciones exclusivas sobre una variable?', option_a: 'for', option_b: 'while', option_c: 'switch', correct_option: 'c', explanation: 'switch evalúa una variable contra múltiples casos posibles.', topic: 'estructuras_control', difficulty: 'medium' },
    { text: 'Un bucle while ejecuta su cuerpo mientras...', option_a: 'La condición sea falsa', option_b: 'La condición sea verdadera', option_c: 'El contador sea mayor que cero', correct_option: 'b', explanation: 'while repite el bloque mientras su condición evalúe a true.', topic: 'estructuras_control', difficulty: 'easy' },
    { text: '¿Qué hace continue dentro de un bucle?', option_a: 'Sale del bucle', option_b: 'Salta a la siguiente iteración', option_c: 'Reinicia el contador', correct_option: 'b', explanation: 'continue omite el resto del cuerpo y va a la siguiente iteración.', topic: 'estructuras_control', difficulty: 'medium' },

    // Funciones y Métodos
    { text: '¿Qué es una función?', option_a: 'Un tipo de dato especial', option_b: 'Un bloque de código reutilizable con nombre', option_c: 'Un operador matemático avanzado', correct_option: 'b', explanation: 'Una función agrupa código con un nombre para reutilizarlo.', topic: 'funciones', difficulty: 'easy' },
    { text: '¿Qué devuelve una función declarada como void?', option_a: '0', option_b: 'null', option_c: 'Nada (ningún valor)', correct_option: 'c', explanation: 'void indica que la función no retorna ningún valor.', topic: 'funciones', difficulty: 'easy' },
    { text: '¿Qué son los parámetros de una función?', option_a: 'Los valores que la función retorna', option_b: 'Los datos de entrada que recibe la función', option_c: 'El nombre de la función', correct_option: 'b', explanation: 'Los parámetros son las entradas que recibe una función al ser llamada.', topic: 'funciones', difficulty: 'easy' },
    { text: '¿Qué hace la palabra reservada return?', option_a: 'Termina el programa completo', option_b: 'Devuelve un valor y termina la función', option_c: 'Llama a otra función', correct_option: 'b', explanation: 'return finaliza la función y devuelve un valor al código que la llamó.', topic: 'funciones', difficulty: 'easy' },
    { text: '¿Qué es la recursión?', option_a: 'Un error de compilación', option_b: 'Una función que se llama a sí misma', option_c: 'Un tipo de bucle con contador regresivo', correct_option: 'b', explanation: 'La recursión ocurre cuando una función se invoca a sí misma.', topic: 'funciones', difficulty: 'medium' },
    { text: '¿Cuál es la diferencia entre argumento y parámetro?', option_a: 'Son exactamente lo mismo', option_b: 'Parámetro va en la definición; argumento en la llamada', option_c: 'Argumento va en la definición; parámetro en la llamada', correct_option: 'b', explanation: 'Parámetro es la variable en la definición; argumento es el valor al llamar.', topic: 'funciones', difficulty: 'medium' },

    // POO
    { text: '¿Qué es una clase en POO?', option_a: 'Una variable que almacena números', option_b: 'Una plantilla para crear objetos', option_c: 'Un método estático del programa', correct_option: 'b', explanation: 'Una clase es el molde que define propiedades y métodos de los objetos.', topic: 'poo', difficulty: 'easy' },
    { text: '¿Qué es un objeto en POO?', option_a: 'Una función sin nombre', option_b: 'Una instancia concreta de una clase', option_c: 'Un tipo de dato primitivo', correct_option: 'b', explanation: 'Un objeto es una instancia de una clase con sus propios valores.', topic: 'poo', difficulty: 'easy' },
    { text: '¿Qué permite la herencia en POO?', option_a: 'Copiar literalmente el código de otra clase', option_b: 'Que una clase adquiera propiedades y métodos de otra clase', option_c: 'Eliminar métodos de la clase padre', correct_option: 'b', explanation: 'La herencia permite que una clase hija reutilice el código de la clase padre.', topic: 'poo', difficulty: 'medium' },
    { text: '¿Qué es el encapsulamiento?', option_a: 'Comprimir el código para que ocupe menos espacio', option_b: 'Ocultar los detalles internos de una clase', option_c: 'Duplicar métodos para mayor rendimiento', correct_option: 'b', explanation: 'El encapsulamiento protege los datos internos usando modificadores de acceso.', topic: 'poo', difficulty: 'medium' },
    { text: '¿Qué hace el constructor de una clase?', option_a: 'Destruye el objeto al terminar', option_b: 'Inicializa el objeto cuando se crea', option_c: 'Copia el objeto en memoria', correct_option: 'b', explanation: 'El constructor se ejecuta automáticamente al crear un objeto y define su estado inicial.', topic: 'poo', difficulty: 'easy' },

    // Estructuras de Datos
    { text: '¿Qué es un arreglo (array)?', option_a: 'Una variable que cambia de tipo automáticamente', option_b: 'Una colección de elementos del mismo tipo en posiciones indexadas', option_c: 'Una función que retorna múltiples valores', correct_option: 'b', explanation: 'Un arreglo almacena múltiples valores del mismo tipo accesibles por índice.', topic: 'estructuras_datos', difficulty: 'easy' },
    { text: '¿Cuál es el índice del primer elemento de un arreglo?', option_a: '1', option_b: '0', option_c: '-1', correct_option: 'b', explanation: 'En la mayoría de lenguajes, los arreglos empiezan en el índice 0.', topic: 'estructuras_datos', difficulty: 'easy' },
    { text: '¿Qué principio sigue una pila (stack)?', option_a: 'FIFO: primero en entrar, primero en salir', option_b: 'LIFO: último en entrar, primero en salir', option_c: 'Acceso aleatorio por índice', correct_option: 'b', explanation: 'La pila sigue LIFO (Last In, First Out).', topic: 'estructuras_datos', difficulty: 'medium' },
    { text: '¿Qué estructura permite buscar elementos rápidamente por clave única?', option_a: 'Array', option_b: 'Stack (pila)', option_c: 'HashMap / Diccionario', correct_option: 'c', explanation: 'Los diccionarios/HashMap permiten acceso promedio O(1) mediante clave.', topic: 'estructuras_datos', difficulty: 'medium' },
    { text: '¿Qué principio sigue una cola (queue)?', option_a: 'LIFO: último en entrar, primero en salir', option_b: 'FIFO: primero en entrar, primero en salir', option_c: 'Acceso siempre al elemento del medio', correct_option: 'b', explanation: 'La cola sigue FIFO (First In, First Out).', topic: 'estructuras_datos', difficulty: 'medium' },
    { text: '¿Cuánto espacio ocupa un arreglo de 5 enteros si cada int ocupa 4 bytes?', option_a: '5 bytes', option_b: '16 bytes', option_c: '20 bytes', correct_option: 'c', explanation: '5 elementos × 4 bytes = 20 bytes en total.', topic: 'estructuras_datos', difficulty: 'hard' }
  ];

  const insert = db.prepare(
    'INSERT INTO questions (text,option_a,option_b,option_c,correct_option,explanation,topic,difficulty) VALUES (?,?,?,?,?,?,?,?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const q of rows) {
      insert.run(q.text, q.option_a, q.option_b, q.option_c, q.correct_option, q.explanation, q.topic, q.difficulty);
    }
  });
  insertMany(questions);
  console.log(`${questions.length} preguntas semilla insertadas.`);
}

module.exports = { db, seedAdmin, seedQuestions };

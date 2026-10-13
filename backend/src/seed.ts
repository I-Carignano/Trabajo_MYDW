// npm run seed: reinicia el catalogo (autores, libros y prestamos) con datos de ejemplo
// y crea el usuario ADMIN inicial (o promueve a ADMIN uno existente) desde SEED_ADMIN_EMAIL/PASSWORD.
// Los usuarios que no son el admin no se tocan.
import "dotenv/config";
import bcrypt from "bcrypt";
import { connectMongoDB, disconnectMongoDB } from "./config/db";
import Author from "./models/Author";
import Book from "./models/Book";
import Loan from "./models/Loan";
import User from "./models/User";

const authors = [
  { key: "borges", name: "Jorge Luis Borges", nationality: "Argentina", birthYear: 1899, bio: "Escritor argentino, figura central de la literatura del siglo XX. Sus cuentos juegan con laberintos, espejos, bibliotecas infinitas y la idea del tiempo." },
  { key: "cortazar", name: "Julio Cortázar", nationality: "Argentina", birthYear: 1914, bio: "Escritor argentino del boom latinoamericano. Mezcla lo cotidiano con lo fantástico y experimentó con la forma de la novela." },
  { key: "ocampo", name: "Silvina Ocampo", nationality: "Argentina", birthYear: 1903, bio: "Cuentista y poeta argentina. Sus relatos son breves, crueles e inquietantes, con niños y objetos que esconden algo siniestro." },
  { key: "sabato", name: "Ernesto Sabato", nationality: "Argentina", birthYear: 1911, bio: "Escritor y físico argentino. Su obra explora la angustia, la soledad y el lado oscuro de la condición humana." },
  { key: "garciamarquez", name: "Gabriel García Márquez", nationality: "Colombia", birthYear: 1927, bio: "Escritor colombiano, Premio Nobel de Literatura 1982. Máximo exponente del realismo mágico." },
  { key: "leguin", name: "Ursula K. Le Guin", nationality: "Estados Unidos", birthYear: 1929, bio: "Autora estadounidense de ciencia ficción y fantasía. Usa mundos imaginarios para pensar la política, el género y la ecología." },
  { key: "asimov", name: "Isaac Asimov", nationality: "Estados Unidos", birthYear: 1920, bio: "Escritor y bioquímico, uno de los grandes de la ciencia ficción clásica. Formuló las Tres Leyes de la Robótica." },
  { key: "christie", name: "Agatha Christie", nationality: "Reino Unido", birthYear: 1890, bio: "Novelista británica, la autora de policiales más vendida de la historia. Creadora de Hercule Poirot y Miss Marple." },
  { key: "orwell", name: "George Orwell", nationality: "Reino Unido", birthYear: 1903, bio: "Escritor y periodista británico. Sus novelas critican el totalitarismo y la manipulación del lenguaje." },
  { key: "walsh", name: "María Elena Walsh", nationality: "Argentina", birthYear: 1930, bio: "Poeta, escritora y compositora argentina. Renovó la literatura infantil con humor, juegos de palabras y absurdo." },
];

const books = [
  { title: "Ficciones", author: "borges", genre: "Cuento", publishedYear: 1944, totalCopies: 3, synopsis: "Colección de cuentos con bibliotecas infinitas, mundos inventados y laberintos de tiempo. Incluye 'Tlön, Uqbar, Orbis Tertius' y 'El jardín de senderos que se bifurcan'." },
  { title: "El Aleph", author: "borges", genre: "Cuento", publishedYear: 1949, totalCopies: 2, synopsis: "Cuentos sobre la inmortalidad, la identidad y un punto del espacio que contiene todos los puntos del universo." },
  { title: "Rayuela", author: "cortazar", genre: "Novela", publishedYear: 1963, totalCopies: 2, synopsis: "Novela entre París y Buenos Aires que puede leerse en orden o saltando capítulos según un tablero de dirección." },
  { title: "Bestiario", author: "cortazar", genre: "Cuento", publishedYear: 1951, totalCopies: 1, synopsis: "Primer libro de cuentos de Cortázar: casas tomadas, conejitos vomitados y lo fantástico que irrumpe en lo cotidiano." },
  { title: "La furia", author: "ocampo", genre: "Cuento", publishedYear: 1959, totalCopies: 1, synopsis: "Relatos breves y perturbadores donde la infancia, los celos y la crueldad aparecen con una naturalidad inquietante." },
  { title: "El túnel", author: "sabato", genre: "Novela", publishedYear: 1948, totalCopies: 2, synopsis: "Confesión de un pintor obsesionado con una mujer que vio en una exposición. Una novela psicológica sobre la incomunicación." },
  { title: "Cien años de soledad", author: "garciamarquez", genre: "Novela", publishedYear: 1967, totalCopies: 4, synopsis: "La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo." },
  { title: "Crónica de una muerte anunciada", author: "garciamarquez", genre: "Novela", publishedYear: 1981, totalCopies: 2, synopsis: "Reconstrucción de un crimen que todo el pueblo sabía que iba a ocurrir y que nadie evitó." },
  { title: "Los desposeídos", author: "leguin", genre: "Ciencia ficción", publishedYear: 1974, totalCopies: 1, synopsis: "Un físico viaja entre un planeta anarquista y otro capitalista. Una utopía ambigua sobre la libertad y la propiedad." },
  { title: "Un mago de Terramar", author: "leguin", genre: "Fantasía", publishedYear: 1968, totalCopies: 2, synopsis: "Un joven con talento para la magia libera por orgullo una sombra que lo persigue por todo el archipiélago." },
  { title: "Yo, robot", author: "asimov", genre: "Ciencia ficción", publishedYear: 1950, totalCopies: 2, synopsis: "Relatos enlazados sobre robots y las paradojas que surgen al aplicar las Tres Leyes de la Robótica." },
  { title: "Fundación", author: "asimov", genre: "Ciencia ficción", publishedYear: 1951, totalCopies: 3, synopsis: "Un matemático predice la caída del Imperio Galáctico y crea una fundación para acortar la era de barbarie que vendrá." },
  { title: "Asesinato en el Orient Express", author: "christie", genre: "Policial", publishedYear: 1934, totalCopies: 2, synopsis: "Hercule Poirot investiga un asesinato en un tren detenido por la nieve donde todos los pasajeros tienen algo que ocultar." },
  { title: "Y no quedó ninguno", author: "christie", genre: "Policial", publishedYear: 1939, totalCopies: 2, synopsis: "Diez desconocidos son invitados a una isla y empiezan a morir uno por uno siguiendo una canción infantil." },
  { title: "1984", author: "orwell", genre: "Novela", publishedYear: 1949, totalCopies: 3, synopsis: "En un estado totalitario que vigila cada gesto, Winston Smith se atreve a pensar distinto." },
  { title: "Rebelión en la granja", author: "orwell", genre: "Novela", publishedYear: 1945, totalCopies: 2, synopsis: "Los animales de una granja expulsan a los humanos, pero los cerdos terminan convirtiéndose en lo que combatían." },
  { title: "Dailan Kifki", author: "walsh", genre: "Infantil", publishedYear: 1966, totalCopies: 2, synopsis: "Una nena encuentra un elefante en la puerta de su casa y tiene que arreglárselas para cuidarlo." },
  { title: "El reino del revés", author: "walsh", genre: "Poesía", publishedYear: 1965, totalCopies: 1, synopsis: "Poemas y canciones donde todo funciona al revés: un clásico de la poesía infantil argentina." },
];

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD vacios: no se crea el usuario ADMIN");
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "ADMIN";
    await existing.save();
    console.log(`[seed] ${email} ya existia: ahora es ADMIN (la contraseña no se cambio)`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name: "Administrador", email, password: hashedPassword, role: "ADMIN" });
  console.log(`[seed] usuario ADMIN creado: ${email}`);
}

async function seed(): Promise<void> {
  await connectMongoDB();

  await Loan.deleteMany({});
  await Book.deleteMany({});
  await Author.deleteMany({});

  const authorIds = new Map<string, unknown>();
  for (const { key, ...data } of authors) {
    const author = await Author.create(data);
    authorIds.set(key, author._id);
  }

  // ISBN ficticios (formato valido) solo para datos de ejemplo.
  await Book.insertMany(
    books.map((book, index) => ({
      ...book,
      author: authorIds.get(book.author),
      isbn: `978-987-0000-${String(index + 1).padStart(2, "0")}-0`,
      availableCopies: book.totalCopies,
    }))
  );

  console.log(`[seed] ${authors.length} autores y ${books.length} libros cargados`);

  await seedAdmin();
}

seed()
  .catch((error: unknown) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectMongoDB());

// Fetch.js

require("dotenv").config();
const { MongoClient } = require("mongodb");

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We'll use a cached database instance
let db;

// Connect to the MongoDB database (singleton connection)
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("tutorConnect");
  }
  return db;
}

/**
 * Fetch teacher coordinates from the "teachers" collection.
 * The teachers are filtered by verificationStatus ("Verified") and must have a location.
 * The coordinates stored in MongoDB are in the format [longitude, latitude].
 * This function converts them to an object with keys: { lat, lang }.
 *
 * @returns {Promise<Array<Object>>} List of teacher objects with { lat, lang, name }.
 */
async function fetchTeacherCoordinates() {
  const database = await connectDB();
  // Query teachers who are verified and have a location defined
  const teachers = await database
    .collection("teachers")
    .find({ verificationStatus: "Verified", location: { $exists: true } })
    .project({ location: 1, name: 1, _id: 0 })
    .toArray();

  // Map the MongoDB coordinates ([longitude, latitude]) to { lat, lang }
  const formattedTeachers = teachers
    .map(teacher => {
      if (
        teacher.location &&
        Array.isArray(teacher.location.coordinates) &&
        teacher.location.coordinates.length === 2
      ) {
        const [lng, lat] = teacher.location.coordinates;
        return { lat, lng, name: teacher.name };
      }
      return null;
    })
    .filter(teacher => teacher !== null);

  return formattedTeachers;
}

module.exports = {
  fetchTeacherCoordinates,
};

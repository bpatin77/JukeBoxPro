const express = require("express"); //The express module is imported to create a router.
const router = express.Router();
module.exports = router; //The router is exported for use in other parts of the application.

const prisma = require("../prisma"); //The prisma module is imported to perform database operations.

//When a GET request is made to this route, it retrieves all tracks from the database using prisma.track.findMany().
router.get("/", async (req, res, next) => {
  try {
    const tracks = await prisma.track.findMany();
    res.json(tracks);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  //This route retrieves a specific track based on its ID, which is taken from the URL parameters (req.params).
  const { id } = req.params;

  //This variable determines whether to include playlists associated with the track.
  //If a user is authenticated (req.user exists), it sets the where condition to filter playlists by the authenticated user's ID (ownerId: req.user.id).
  //If no user is authenticated, it sets includePlaylists to false, meaning playlists will not be included in the response.
  const includePlaylists = req.user
    ? { where: { ownerId: req.user.id } }
    : false;
  try {
    const track = await prisma.track.findUniqueOrThrow({
      where: { id: +id }, //This specifies the ID to find the track, converting it to a number with the unary +.
      include: { playlists: includePlaylists }, //This includes related playlists if includePlaylists is set to a valid condition.
    });
    res.json(track);
  } catch (e) {
    next(e);
  }
});

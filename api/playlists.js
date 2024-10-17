const express = require("express");
const router = express.Router();
module.exports = router;
const prisma = require("../prisma");

//this playlist file will need a token since its marked with a lock in the readme
const { authenticate } = require("./auth"); //Authenticate is a middleware function to check if a user is authenticated.
//authenticate is coming from the function at the end of auth.js that checks that there exists an user that has a authenticate token

router.get("/", authenticate, async (req, res, next) => {
  try {
    //find all the playlists for the auhenticated user,
    const playlists = await prisma.playlist.findMany({
      //where the owner id is the same as the logged in users id
      where: { ownerId: req.user.id },
    }); //Fetches all playlists owned by the authenticated user (req.user.id).
    res.json(playlists); //If successful, it sends the playlists as a JSON response.
  } catch (e) {
    //If there's an error, it passes the error to the next middleware.
    next(e);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  const { name, description, trackIds } = req.body; //Expects a request body containing name, description, and trackIds.
  try {
    const tracks = trackIds.map((id) => ({ id })); //the line converts an array of track IDs into an array of objects suitable for establishing relationships in the database, facilitating the creation of a playlist that contains those tracks.
    const playlist = await prisma.playlist.create({
      //Creates a new playlist associated with the authenticated user and connects it to specified tracks.
      data: {
        name,
        description,
        ownerId: req.user.id,
        tracks: { connect: tracks },
      },
    });
    res.status(201).json(playlist); //Responds with the created playlist and a 201 Created status
  } catch (e) {
    next(e);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  //Retrieves a playlist by its id from the URL parameters("/:id").
  const { id } = req.params;
  try {
    //This line is using Prisma to query the database for a single playlist.
    const playlist = await prisma.playlist.findUniqueOrThrow({
      //where: { id: +id }: This specifies the condition for the query.
      //The id parameter from the request URL is converted to a number using the unary + operator.
      where: { id: +id },
      //include: { tracks: true }: This tells Prisma to also fetch related tracks associated with the playlist
      include: { tracks: true },
    });
    if (playlist.ownerId !== req.user.id) {
      //If the playlist is found, it checks if the authenticated user is the owner. If not, it responds with a 403 Forbidden status.
      next({ status: 403, message: "You do not own this playlist." });
    }
    res.json(playlist); //Returns the playlist details along with its associated tracks.
  } catch (e) {
    next(e);
  }
});

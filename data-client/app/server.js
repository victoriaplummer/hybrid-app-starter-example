import Webflow from "webflow-api";
import App from "./webflow.js";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import url from "url";

// Load environment variables from .env file
const { WEBFLOW_CLIENT_ID, WEBFLOW_SECRET, SERVER_HOST, PORT } = process.env;

// Create a new Webflow App instance
const app = new App(WEBFLOW_CLIENT_ID, WEBFLOW_SECRET);

// Instantiate Fastify server
const server = Fastify({
  logger: true,
});

// Define the current file and directory paths for ES module context
const __filename = url.fileURLToPath(import.meta.url); // the full path of the current module file
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)); // the directory path of the current module

// Configure the server to serve static files
server.register(fastifyStatic, {
  root: path.join(__dirname, "static"), // Directory path for static content
});

// Set up a GET route for the root URL path ("/")
server.get("/", async (req, reply) => {
  await reply.sendFile("index.html"); // Asynchronously send 'index.html' as the response
});

// Initialize OAuth flow route for App installation
server.get("/auth", async (req, reply) => {
  const { code } = req.query;

  // If a code is passed in, attempt to install the App
  // othersise, redirect to the install URL to start OAuth

  if (code) {

    // install the App and get and store an access token
    const token = await app.install(code);
    await app.storeToken(token);

    return reply.sendFile("index.html");
  } else {

    // Generate a URL for a user to install the App on Webflow
    const installUrl = app.installUrl();

    // Redirect the user to the install URL
    return reply.redirect(installUrl);
  }
});

// List Sites
server.get("/sites", async (req, reply) => {
  const token = await app.getToken(); // get token from database

  const webflow = new Webflow({ token });
  const sites = await webflow.get("/beta/sites");

  return sites;
});

server.listen({ port: PORT, host: "localhost" }, (err) => {
  if (err) throw err;
});

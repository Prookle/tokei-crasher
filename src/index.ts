import express, { Express, Request, Response } from "express";
import { tokeiLog } from "./util";
import { config, loadConfig } from "./config";
import { getBotUsername, getLastPlayerCount, initTokeiBot } from "./bot";
import { initSqlite, getAreaLeaderboards, } from "./db";
import { isAreaTracked, trackedAreas } from "./areas";
const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors')
const app: Express = express();

async function run() {
  tokeiLog("loading with the following settings:")
  loadConfig();
  Object.keys(config).forEach((key: string) => {
    tokeiLog(`    ${key}: ${(config as any)[key]}`);
  });

  await initSqlite();
  await initTokeiBot();

  app.use(cors());
  app.use(express.static('public'));
  app.set('view engine', 'pug');

  app.get("/", async (req: Request, res: Response) => {
    res.render('index', {
      usernameText: "Its current username on Skap is " + getBotUsername(),
      playerCountText: "There's currently " + getLastPlayerCount() + " players on Skap"
    })
  });

  app.get("/api/playerCount", async (req: Request, res: Response) => {
    res.send({
      playerCount: getLastPlayerCount()
    });
  });

  app.get("/api/username", async (req: Request, res: Response) => {
    res.send({
      username: getBotUsername()
    });
  })

  app.get("/api/leaderboard/", async (req: Request, res: Response) => {
    const area = req.query.area;
    if (!area)
      return invalidRequest(res, "Params must include an area, tracked areas are " + JSON.stringify(trackedAreas));
    if (!isAreaTracked(area as string))
      return invalidRequest(res, "That's not a tracked area, tracked areas are " + JSON.stringify(trackedAreas));

    const leaderboard = await getAreaLeaderboards(0, area as string);
    res.send(leaderboard);
  });

  http.createServer(app).listen(config.port, () => {
    tokeiLog(`HTTP routes running - http://localhost:${config.port}`);
  });
  if (config.ssl) {
    https.createServer({ key: fs.readFileSync(config.privateKey), cert: fs.readFileSync(config.certificate) }, app).listen(config.sslPort, () => {
      tokeiLog(`HTTPS (with SSL) routes running - https://localhost:${config.sslPort}`);
    });
  }
}

function invalidRequest(res: Response, message: string) {
  res.status(400).send({
    error: "Invalid request",
    message: message
  });
}

run();
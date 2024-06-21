import express, { Express, Request, Response } from "express";
import { tokeiLog } from "./util";
import { config } from "./config";
import { overworldBot } from ".";

const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors')
const app: Express = express();

async function routeHomePage(req: Request, res: Response) {
    res.render('index', {
        usernameText: "Its current username on Skap is " + overworldBot.getBotUsername(),
        playerCountText: "There's currently " + overworldBot.getLastPlayerCount() + " players on Skap"
    })
}

async function routePlayerCount(req: Request, res: Response) {
    res.send({
        playerCount: overworldBot.getLastPlayerCount()
    });
}

async function routeUsername(req: Request, res: Response) {
    res.send({
        username: overworldBot.getBotUsername()
    });
}


    http.createServer(app).listen(config.port, () => {
        tokeiLog(`HTTP routes running - http://localhost:${config.port}`);
    });
    if (config.ssl) {
        https.createServer({ key: fs.readFileSync(config.privateKey), cert: fs.readFileSync(config.certificate) }, app).listen(config.sslPort, () => {
            tokeiLog(`HTTPS (with SSL) routes running - https://localhost:${config.sslPort}`);
        });
    }
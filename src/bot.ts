import { config } from "./config";
import { CREATE_GAME_PACKET, GAMES_PACKET, LOGIN_PACKET, LOGIN_RESULT_PACKET, BotSocket, UPDATE_STATES_PACKET } from "./socket";
import { tokeiLog } from "./util";

interface BotState {
    lastPlayerCount: number,
    completionCache: Map<string, Map<string, number>>,
    timelyRuns: Map<string, TimelyRunState>
}

interface TimelyRunState {
    startTime: Date,
    runTicks: number,
    levelName: string,
    highestAreaScore: number
}

function defaultBotState(): BotState {
    return {
        lastPlayerCount: 0,
        completionCache: new Map<string, Map<string, number>>(),
        timelyRuns: new Map<string, TimelyRunState>()
    };
}

export class Bot {
    protected socket: BotSocket;
    protected botData: BotState = defaultBotState();

    constructor(socket: BotSocket) {
        this.socket = socket;
        this.setupSocket(socket);
    }

    public setupSocket(socket: BotSocket) {
        socket.onLogin(() => {
            tokeiLog("logged in as " + socket.getBotUsername());
            setTimeout(() => {
                socket.sendRequestGamesList();
            }, 1000)
            setInterval(() => {
                socket.sendRequestGamesList();
            }, config.playerCountIntervalMs)
        });
        socket.onClose(() => {
            // Reset the state of the bot since we've been reset.
            this.botData = defaultBotState();
        });
        socket.onPacket(GAMES_PACKET, (data: any) => { this.updatePlayerCount(data) });
    }

    public getBotUsername(): string {
        return this.socket.getBotUsername();
    }

    public getLastPlayerCount(): number {
        return this.botData.lastPlayerCount - 1;
    }

    public updatePlayerCount(data: any) {
        let totalPlayerCount: number = 0;
        data.g.forEach((g: any) => {
            totalPlayerCount += g.players;
        })
        this.botData.lastPlayerCount = totalPlayerCount;
    }


    }

export class OverworldBot extends Bot {
    public setupSocket(socket: BotSocket): void {
        super.setupSocket(socket);
        this.socket.onPacket(GAMES_PACKET, (data: any) => { this.connectToOverworld(data) });
    }

    public connectToOverworld(data: any) {
        const overworld = data.g[0];
        this.socket.sendJoinGame(overworld.id);
    }
}

export class SecondaryOverworldBot extends Bot {
    public setupSocket(socket: BotSocket): void {
        super.setupSocket(socket);
        this.socket.onLogin((data: any) => { setTimeout(() => { this.createSecondaryOverworld(data) }, 1000) });
    }

    public createSecondaryOverworld(data: any) {
        const settings = {
            n: "overworld 2",
            g: false,
            p: false,
            pa: "",
            r: false,
            rd: [],
            u: false,
            s: false
        };
        this.socket.send(CREATE_GAME_PACKET, {
            s: settings
        });
        tokeiLog("created Overworld 2")
    }
}

export function initBot(): Bot {
    const socket = new BotSocket(config.skapUrl);
    const bot = new OverworldBot(socket);
    return bot;
}

export function initSecondaryOverworldBot(): Bot {
    const socket = new BotSocket(config.skapUrl);
    const bot = new SecondaryOverworldBot(socket);
    return bot;
} 
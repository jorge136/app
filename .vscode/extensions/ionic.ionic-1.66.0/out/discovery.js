"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeBroadcastAddress = exports.newSilentPublisher = exports.prepareInterfaces = exports.Publisher = void 0;
const dgram = __importStar(require("dgram"));
const events = __importStar(require("events"));
const netmask_1 = require("netmask");
const os_1 = require("os");
const PREFIX = 'ION_DP';
const PORT = 41234;
class Publisher extends events.EventEmitter {
    constructor(namespace, name, port, secure) {
        super();
        this.namespace = namespace;
        this.name = name;
        this.port = port;
        this.secure = secure;
        this.path = '/';
        this.running = false;
        this.interval = 2000;
        if (name.indexOf(':') >= 0) {
            console.warn('name should not contain ":"');
            name = name.replace(':', ' ');
        }
        this.id = String(Math.round(Math.random() * 1000000));
    }
    start() {
        return new Promise((resolve, reject) => {
            if (this.running) {
                return resolve();
            }
            this.running = true;
            if (!this.interfaces) {
                this.interfaces = this.getInterfaces();
            }
            const client = (this.client = dgram.createSocket('udp4'));
            client.on('error', (err) => {
                this.emit('error', err);
            });
            client.on('listening', () => {
                client.setBroadcast(true);
                this.timer = setInterval(this.sayHello.bind(this), this.interval);
                this.sayHello();
                resolve();
            });
            client.bind();
        });
    }
    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
        if (this.client) {
            this.client.close();
            this.client = undefined;
        }
    }
    buildMessage(ip) {
        const now = Date.now();
        const message = {
            t: now,
            id: this.id,
            nspace: this.namespace,
            name: this.name,
            host: (0, os_1.hostname)(),
            ip: ip,
            port: this.port,
            path: this.path,
            secure: this.secure,
        };
        return PREFIX + JSON.stringify(message);
    }
    getInterfaces() {
        return prepareInterfaces((0, os_1.networkInterfaces)());
    }
    sayHello() {
        if (!this.interfaces) {
            throw new Error('No network interfaces set--was the service started?');
        }
        try {
            for (const iface of this.interfaces) {
                const message = new Buffer(this.buildMessage(iface.address));
                this.client.send(message, 0, message.length, PORT, iface.broadcast, (err) => {
                    if (err) {
                        this.emit('error', err);
                    }
                });
            }
        }
        catch (e) {
            this.emit('error', e);
        }
    }
}
exports.Publisher = Publisher;
function prepareInterfaces(interfaces) {
    const set = new Set();
    return Object.keys(interfaces)
        .map((key) => interfaces[key])
        .reduce((prev, current) => prev.concat(current))
        .filter((iface) => iface.family === 'IPv4')
        .map((iface) => {
        return {
            address: iface.address,
            broadcast: computeBroadcastAddress(iface.address, iface.netmask),
        };
    })
        .filter((iface) => {
        if (!set.has(iface.broadcast)) {
            set.add(iface.broadcast);
            return true;
        }
        return false;
    });
}
exports.prepareInterfaces = prepareInterfaces;
function newSilentPublisher(namespace, name, port, secure) {
    name = `${name}@${port}`;
    const service = new Publisher(namespace, name, port, secure);
    service.on('error', (error) => {
        console.log(error);
    });
    service.start().catch((error) => {
        console.log(error);
    });
    return service;
}
exports.newSilentPublisher = newSilentPublisher;
function computeBroadcastAddress(address, netmask) {
    const ip = address + '/' + netmask;
    const block = new netmask_1.Netmask(ip);
    return block.broadcast;
}
exports.computeBroadcastAddress = computeBroadcastAddress;
//# sourceMappingURL=discovery.js.map
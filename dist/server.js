"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
dotenv_1.default.config();
const port = Number(process.env.PORT ?? 5000);
const app = (0, app_1.createApp)();
function main() {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[server] listening on :${port}`);
    });
}
main();
//# sourceMappingURL=server.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.checkOtp = checkOtp;
const sdk_1 = __importDefault(require("@prelude.so/sdk"));
function getClient() {
    return new sdk_1.default({ apiToken: process.env.PRELUDE_API_KEY });
}
async function sendOtp(phone) {
    const client = getClient();
    await client.verification.create({
        target: { type: "phone_number", value: phone },
    });
}
async function checkOtp(phone, code) {
    const client = getClient();
    const result = await client.verification.check({
        target: { type: "phone_number", value: phone },
        code,
    });
    return result.status === "success";
}

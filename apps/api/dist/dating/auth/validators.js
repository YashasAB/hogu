"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    phone: zod_1.z.string().min(1, 'Phone number is required'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
    dob: zod_1.z.string().refine((date) => {
        const parsed = new Date(date);
        const now = new Date();
        const age = now.getFullYear() - parsed.getFullYear();
        return !isNaN(parsed.getTime()) && age >= 18 && age <= 100;
    }, 'Must be a valid date and at least 18 years old')
});
exports.loginSchema = zod_1.z.object({
    phone: zod_1.z.string().min(1, 'Phone number is required'),
    password: zod_1.z.string().min(1, 'Password is required')
});

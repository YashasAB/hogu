import { Router } from "express";
import { signup, login, logout, me } from "./controller.js";
import { authenticateDatingUser } from "../session.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticateDatingUser, me);

export default router;

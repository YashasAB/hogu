import { Router } from "express";
import { AuthController } from "./controller";
import { datingSessionMiddleware } from "../session";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/reset-password", AuthController.resetPassword);
router.get("/me", datingSessionMiddleware, AuthController.me);
router.post("/logout", datingSessionMiddleware, AuthController.logout);

export default router;

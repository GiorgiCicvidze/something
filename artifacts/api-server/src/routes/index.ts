import { Router, type IRouter } from "express";
import healthRouter from "./health";
import serverRouter from "./server";
import playersRouter from "./players";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(serverRouter);
router.use(playersRouter);
router.use(adminRouter);

export default router;

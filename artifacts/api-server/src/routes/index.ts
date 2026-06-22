import { Router, type IRouter } from "express";
import healthRouter from "./health";
import guidesRouter from "./guides";
import placesRouter from "./places";
import sosRouter from "./sos";
import suggestionsRouter from "./suggestions";
import statsRouter from "./stats";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/guides", guidesRouter);
router.use("/places", placesRouter);
router.use("/sos", sosRouter);
router.use("/suggestions", suggestionsRouter);
router.use("/stats", statsRouter);

export default router;

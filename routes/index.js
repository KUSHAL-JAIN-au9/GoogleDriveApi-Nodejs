import express from "express";
import {
  addGoogleSheetData,
  deleteGoogleSheetData,
  getGoogleSheetData,
  updateGoogleSheetData,
} from "../controllers/index.js";

const router = express.Router();

router.get("/getData", getGoogleSheetData);
router.post("/addData", addGoogleSheetData);
router.put("/update", updateGoogleSheetData);
router.delete("/delete", deleteGoogleSheetData);

export default router;

import express from "express";
import { getCompanies, getCompany, createCompany, updateCompany } from "../controllers/companyController";

const router = express.Router();

router.get("/", getCompanies);
router.get("/:id", getCompany);
router.post("/", createCompany);
router.put("/:id", updateCompany);

export default router;
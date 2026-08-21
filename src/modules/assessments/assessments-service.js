// src/modules/assessments/assessments-service.js
//
// Skeleton: standard CRUD from utils/crud.js. Replace or extend any method
// here when the module needs real logic — routes and controllers stay put.
import { AssessmentTest } from "./assessments-model.js";
import { crudService } from "../../utils/crud.js";

export const service = crudService(AssessmentTest);

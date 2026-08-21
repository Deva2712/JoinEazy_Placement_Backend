// src/modules/students/students-service.js
//
// Skeleton: standard CRUD from utils/crud.js. Replace or extend any method
// here when the module needs real logic — routes and controllers stay put.
import { PlacementStudent } from "./students-model.js";
import { crudService } from "../../utils/crud.js";

export const service = crudService(PlacementStudent);

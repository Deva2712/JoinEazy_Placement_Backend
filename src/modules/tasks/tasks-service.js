// src/modules/tasks/tasks-service.js
//
// Skeleton: standard CRUD from utils/crud.js. Replace or extend any method
// here when the module needs real logic — routes and controllers stay put.
import { PlacementTask } from "./tasks-model.js";
import { crudService } from "../../utils/crud.js";

export const service = crudService(PlacementTask);

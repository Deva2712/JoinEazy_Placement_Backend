// src/modules/mous/mous-service.js
//
// Skeleton: standard CRUD from utils/crud.js. Replace or extend any method
// here when the module needs real logic — routes and controllers stay put.
import { Mou } from "./mous-model.js";
import { crudService } from "../../utils/crud.js";

export const service = crudService(Mou);

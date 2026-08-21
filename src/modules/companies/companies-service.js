// src/modules/companies/companies-service.js
//
// Skeleton: standard CRUD from utils/crud.js. Replace or extend any method
// here when the module needs real logic — routes and controllers stay put.
import { Company } from "./companies-model.js";
import { crudService } from "../../utils/crud.js";

export const service = crudService(Company);

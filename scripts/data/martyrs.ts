import { writeJson } from "../utils/fs";
import { ApiResource } from "../../types/api.types";

const martyrs = require("../../martyrs.json");

writeJson(ApiResource.MartyrsListV1, "martyrs.json", martyrs, true);

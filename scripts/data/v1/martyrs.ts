import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";

const martyrs = require("../../../old/martyrs.json");

writeJson(ApiResource.KnownVictimsV1, "old/martyrs.json", martyrs, true);

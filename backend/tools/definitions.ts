import type { ChatCompletionTool } from "openai/resources/index";
import { staffScheduleDefs } from "./definitions/staffScheduleDefs.js";
import { skillTeamDefs }     from "./definitions/skillTeamDefs.js";
import { materialsSalesDefs } from "./definitions/materialsSalesDefs.js";
import { knowledgeDefs }     from "./definitions/knowledgeDefs.js";
import { documentDefs }      from "./definitions/documentDefs.js";

export const tools: ChatCompletionTool[] = [
    ...staffScheduleDefs,
    ...skillTeamDefs,
    ...materialsSalesDefs,
    ...knowledgeDefs,
    ...documentDefs,
];
import * as fs from 'fs';
import * as path from 'path';

const SRC_FILE = path.join(process.cwd(), 'src/servers/search-server.ts');
const HANDLERS_DIR = path.join(process.cwd(), 'src/servers/search-server/handlers');

if (!fs.existsSync(HANDLERS_DIR)) {
    fs.mkdirSync(HANDLERS_DIR, { recursive: true });
}

let content = fs.readFileSync(SRC_FILE, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const toolsArrayDecl = 'const tools = [';
const toolsDeclIdx = content.indexOf(toolsArrayDecl);
if (toolsDeclIdx === -1) throw new Error('Could not find const tools = [');

const toolsStart = content.indexOf('\n', toolsDeclIdx) + 1;

const serverStartMarker = 'const server = new Server(';
const serverStart = content.indexOf(serverStartMarker);
if (serverStart === -1) throw new Error(`Could not find ${serverStartMarker}`);

const toolsEnd = content.lastIndexOf('];', serverStart);

const beforeTools = content.substring(0, toolsStart);
const toolsContent = content.substring(toolsStart, toolsEnd);
const afterTools = content.substring(toolsEnd);

const rawChunks = toolsContent.split("  {\n    name: '");

let newToolsContent = '';
let imports = '';
let extractedCount = 0;

for (let i = 1; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    const nameEndIdx = chunk.indexOf("'");
    const toolName = chunk.substring(0, nameEndIdx);
    const toolDef = "  {\n    name: '" + chunk;

    const handlerIdx = toolDef.indexOf('handler: async');
    if (handlerIdx === -1) {
        throw new Error('Could not find handler for ' + toolName);
    }

    const handlerBodyStart = toolDef.indexOf('{', handlerIdx) + 1;
    const handlerEndIdx = toolDef.lastIndexOf('    }\n  }');

    if (handlerEndIdx === -1) {
        throw new Error('Could not find handler end for ' + toolName);
    }

    let handlerBody = toolDef.substring(handlerBodyStart, handlerEndIdx);
    if (handlerBody.startsWith('\n')) {
        handlerBody = handlerBody.substring(1);
    }
    if (handlerBody.endsWith('\n')) {
        handlerBody = handlerBody.substring(0, handlerBody.length - 1);
    }

    const safeName = toolName.replace(/-/g, '_');
    const handlerFile = path.join(HANDLERS_DIR, toolName + '.ts');

    const handlerCode = [
        "import { HandlerContext } from '../types.js';",
        "import {",
        "  formatObservationResult,",
        "  formatObservationIndex,",
        "  formatSessionResult,",
        "  formatSessionIndex,",
        "  formatUserPromptResult,",
        "  formatUserPromptIndex,",
        "  formatSearchTips,",
        "  formatTimelineItem,",
        "  formatObservation,",
        "  formatSession,",
        "  formatPrompt,",
        "  type FormattedResult,",
        "  type FormattedObservation,",
        "  type FormattedSession,",
        "  type FormattedPrompt,",
        "  type TimelineItem",
        "} from '../formatters/index.js';",
        "import { normalizeParams } from '../utils/normalize-params.js';",
        "import { queryChroma } from '../utils/query-chroma.js';",
        "import { type ObservationSearchResult, type SessionSummarySearchResult, type UserPromptSearchResult } from '../../../services/sqlite/types.js';",
        "import { basename } from 'path';",
        "import { z } from 'zod';",
        "",
        "export async function handle_" + safeName + "(args: any, context: HandlerContext) {",
        "  const { search, store, chromaClient } = context;",
        "  const silentDebug = (...msg: any[]) => {",
        "    if (process.env.DEBUG === 'true') {",
        "      console.error(...msg);",
        "    }",
        "  };",
        "  ",
        handlerBody,
        "}"
    ].join('\n');

    fs.writeFileSync(handlerFile, handlerCode);
    extractedCount++;

    imports += "import { handle_" + safeName + " } from './handlers/" + toolName + ".js';\n";

    const newToolDef = toolDef.substring(0, handlerIdx) +
        "handler: async (args: any) => handle_" + safeName + "(args, { search, store, chromaClient })\n  }";

    newToolsContent += newToolDef + (i < rawChunks.length - 1 ? ',\n' : '\n');
}

let prefixContent = rawChunks[0];

const lastImport = beforeTools.lastIndexOf('import ');
const lastImportEnd = beforeTools.indexOf('\n', lastImport) + 1;

let finalContent =
    beforeTools.substring(0, lastImportEnd) +
    imports + '\n' +
    beforeTools.substring(lastImportEnd) +
    prefixContent +
    newToolsContent +
    afterTools;

fs.writeFileSync(SRC_FILE, finalContent);
console.log('Successfully extracted', extractedCount, 'tools.');

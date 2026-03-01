"use strict";var Pe=Object.create;var V=Object.defineProperty;var Xe=Object.getOwnPropertyDescriptor;var He=Object.getOwnPropertyNames;var We=Object.getPrototypeOf,je=Object.prototype.hasOwnProperty;var Be=(c,e)=>{for(var s in e)V(c,s,{get:e[s],enumerable:!0})},Ee=(c,e,s,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of He(e))!je.call(c,r)&&r!==s&&V(c,r,{get:()=>e[r],enumerable:!(t=Xe(e,r))||t.enumerable});return c};var te=(c,e,s)=>(s=c!=null?Pe(We(c)):{},Ee(e||!c||!c.__esModule?V(s,"default",{value:c,enumerable:!0}):s,c)),Ge=c=>Ee(V({},"__esModule",{value:!0}),c);var ss={};Be(ss,{generateContext:()=>es});module.exports=Ge(ss);var Q=te(require("path"),1),z=require("os"),H=require("fs");var Le=require("bun:sqlite");var N=require("path"),Oe=require("os"),Re=require("fs");var Ne=require("url");var X=require("fs"),be=require("path"),fe=require("os");var re=["bugfix","feature","refactor","discovery","decision","change"],ne=["how-it-works","why-it-exists","what-changed","problem-solution","gotcha","pattern","trade-off"],Te={bugfix:"\u{1F534}",feature:"\u{1F7E3}",refactor:"\u{1F504}",change:"\u2705",discovery:"\u{1F535}",decision:"\u2696\uFE0F","session-request":"\u{1F3AF}"},ge={discovery:"\u{1F50D}",change:"\u{1F6E0}\uFE0F",feature:"\u{1F6E0}\uFE0F",bugfix:"\u{1F6E0}\uFE0F",refactor:"\u{1F6E0}\uFE0F",decision:"\u2696\uFE0F"},he=re.join(","),Se=ne.join(",");var K=(o=>(o[o.DEBUG=0]="DEBUG",o[o.INFO=1]="INFO",o[o.WARN=2]="WARN",o[o.ERROR=3]="ERROR",o[o.SILENT=4]="SILENT",o))(K||{}),oe=class{level=null;useColor;listeners=[];constructor(){this.useColor=process.stdout.isTTY??!1}addListener(e){this.listeners.push(e)}removeListener(e){this.listeners=this.listeners.filter(s=>s!==e)}getLevel(){if(this.level===null){let e=k.get("CLAUDE_MEM_LOG_LEVEL").toUpperCase();this.level=K[e]??1}return this.level}correlationId(e,s){return`obs-${e}-${s}`}sessionId(e){return`session-${e}`}formatData(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return e.toString();if(typeof e=="object"){if(e instanceof Error)return this.getLevel()===0?`${e.message}
${e.stack}`:e.message;if(Array.isArray(e))return`[${e.length} items]`;let s=Object.keys(e);return s.length===0?"{}":s.length<=3?JSON.stringify(e):`{${s.length} keys: ${s.slice(0,3).join(", ")}...}`}return String(e)}formatTool(e,s){if(!s)return e;try{let t=typeof s=="string"?JSON.parse(s):s;if(e==="Bash"&&t.command){let r=t.command.length>50?t.command.substring(0,50)+"...":t.command;return`${e}(${r})`}if(e==="Read"&&t.file_path){let r=t.file_path.split("/").pop()||t.file_path;return`${e}(${r})`}if(e==="Edit"&&t.file_path){let r=t.file_path.split("/").pop()||t.file_path;return`${e}(${r})`}if(e==="Write"&&t.file_path){let r=t.file_path.split("/").pop()||t.file_path;return`${e}(${r})`}return e}catch{return e}}formatTimestamp(e){let s=e.getFullYear(),t=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0"),o=String(e.getHours()).padStart(2,"0"),a=String(e.getMinutes()).padStart(2,"0"),d=String(e.getSeconds()).padStart(2,"0"),_=String(e.getMilliseconds()).padStart(3,"0");return`${s}-${t}-${r} ${o}:${a}:${d}.${_}`}log(e,s,t,r,o){if(e<this.getLevel())return;let a=this.formatTimestamp(new Date),d=K[e].padEnd(5),_=s.padEnd(6),m="";r?.correlationId?m=`[${r.correlationId}] `:r?.sessionId&&(m=`[session-${r.sessionId}] `);let p="";o!=null&&(this.getLevel()===0&&typeof o=="object"?p=`
`+JSON.stringify(o,null,2):p=" "+this.formatData(o));let u="";if(r){let{sessionId:O,sdkSessionId:g,correlationId:n,...f}=r;Object.keys(f).length>0&&(u=` {${Object.entries(f).map(([R,I])=>`${R}=${I}`).join(", ")}}`)}let E=`[${a}] [${d}] [${_}] ${m}${t}${u}${p}`;e===3?console.error(E):console.log(E);let T={timestamp:a,level:K[e],component:s,message:t,context:r,data:o?this.formatData(o):void 0};this.listeners.forEach(O=>{try{O(T)}catch(g){console.error("Error in log listener:",g)}})}debug(e,s,t,r){this.log(0,e,s,t,r)}info(e,s,t,r){this.log(1,e,s,t,r)}warn(e,s,t,r){this.log(2,e,s,t,r)}error(e,s,t,r){this.log(3,e,s,t,r)}dataIn(e,s,t,r){this.info(e,`\u2192 ${s}`,t,r)}dataOut(e,s,t,r){this.info(e,`\u2190 ${s}`,t,r)}success(e,s,t,r){this.info(e,`\u2713 ${s}`,t,r)}failure(e,s,t,r){this.error(e,`\u2717 ${s}`,t,r)}timing(e,s,t,r){this.info(e,`\u23F1 ${s}`,r,{duration:`${t}ms`})}happyPathError(e,s,t,r,o=""){let m=((new Error().stack||"").split(`
`)[2]||"").match(/at\s+(?:.*\s+)?\(?([^:]+):(\d+):(\d+)\)?/),p=m?`${m[1].split("/").pop()}:${m[2]}`:"unknown",u={...t,location:p};return this.warn(e,`[HAPPY-PATH] ${s}`,u,r),o}},L=new oe;var k=class{static DEFAULTS={CLAUDE_MEM_MODEL:"claude-sonnet-4-5",CLAUDE_MEM_CONTEXT_OBSERVATIONS:"50",CLAUDE_MEM_WORKER_PORT:"37777",CLAUDE_MEM_WORKER_HOST:"127.0.0.1",CLAUDE_MEM_SKIP_TOOLS:"ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion",CLAUDE_MEM_DATA_DIR:(0,be.join)((0,fe.homedir)(),".claude-mem"),CLAUDE_MEM_LOG_LEVEL:"INFO",CLAUDE_MEM_PYTHON_VERSION:"3.13",CLAUDE_CODE_PATH:"",CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT:"true",CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES:he,CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS:Se,CLAUDE_MEM_CONTEXT_FULL_COUNT:"5",CLAUDE_MEM_CONTEXT_FULL_FIELD:"narrative",CLAUDE_MEM_CONTEXT_SESSION_COUNT:"10",CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY:"true",CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE:"false"};static getAllDefaults(){return{...this.DEFAULTS}}static get(e){return this.DEFAULTS[e]}static getInt(e){let s=this.get(e);return parseInt(s,10)}static getBool(e){return this.get(e)==="true"}static loadFromFile(e){if(!(0,X.existsSync)(e))return this.getAllDefaults();let s=(0,X.readFileSync)(e,"utf-8"),t=JSON.parse(s),r=t;if(t.env&&typeof t.env=="object"){r=t.env;try{(0,X.writeFileSync)(e,JSON.stringify(r,null,2),"utf-8"),L.info("SETTINGS","Migrated settings file from nested to flat schema",{settingsPath:e})}catch(a){L.warn("SETTINGS","Failed to auto-migrate settings file",{settingsPath:e},a)}}let o={...this.DEFAULTS};for(let a of Object.keys(this.DEFAULTS))r[a]!==void 0&&(o[a]=r[a]);return o}};var Ve={};function Ye(){return typeof __dirname<"u"?__dirname:(0,N.dirname)((0,Ne.fileURLToPath)(Ve.url))}var ms=Ye(),v=k.get("CLAUDE_MEM_DATA_DIR"),ie=process.env.CLAUDE_CONFIG_DIR||(0,N.join)((0,Oe.homedir)(),".claude"),Es=(0,N.join)(v,"archives"),Ts=(0,N.join)(v,"logs"),gs=(0,N.join)(v,"trash"),hs=(0,N.join)(v,"backups"),Ss=(0,N.join)(v,"settings.json"),ae=(0,N.join)(v,"claude-mem.db"),bs=(0,N.join)(v,"vector-db"),fs=(0,N.join)(ie,"settings.json"),Os=(0,N.join)(ie,"commands"),Rs=(0,N.join)(ie,"CLAUDE.md");function Ae(c){(0,Re.mkdirSync)(c,{recursive:!0})}var q=class{db;constructor(){Ae(v),this.db=new Le.Database(ae),this.db.run("PRAGMA journal_mode = WAL"),this.db.run("PRAGMA synchronous = NORMAL"),this.db.run("PRAGMA foreign_keys = ON"),this.initializeSchema(),this.ensureWorkerPortColumn(),this.ensurePromptTrackingColumns(),this.removeSessionSummariesUniqueConstraint(),this.addObservationHierarchicalFields(),this.makeObservationsTextNullable(),this.createUserPromptsTable(),this.ensureDiscoveryTokensColumn(),this.createPendingMessagesTable()}runMigration(e,s,t){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(e))return;console.log(`[SessionStore] Applying migration ${e}: ${s}...`),this.db.transaction(()=>{t(),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(e,new Date().toISOString())})(),console.log(`[SessionStore] Migration ${e} (${s}) applied successfully`)}catch(r){throw console.error(`[SessionStore] Migration ${e} (${s}) failed:`,r.message),console.error(`[SessionStore] Rolled back migration ${e}`),r}}initializeSchema(){try{this.db.run(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          id INTEGER PRIMARY KEY,
          version INTEGER UNIQUE NOT NULL,
          applied_at TEXT NOT NULL
        )
      `);let e=this.db.prepare("SELECT version FROM schema_versions ORDER BY version").all();(e.length>0?Math.max(...e.map(t=>t.version)):0)===0&&(console.log("[SessionStore] Initializing fresh database with migration004..."),this.db.run(`
          CREATE TABLE IF NOT EXISTS sdk_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claude_session_id TEXT UNIQUE NOT NULL,
            sdk_session_id TEXT UNIQUE,
            project TEXT NOT NULL,
            user_prompt TEXT,
            started_at TEXT NOT NULL,
            started_at_epoch INTEGER NOT NULL,
            completed_at TEXT,
            completed_at_epoch INTEGER,
            status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
          );

          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(claude_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC);

          CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            text TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
          CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
          CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC);

          CREATE TABLE IF NOT EXISTS session_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT UNIQUE NOT NULL,
            project TEXT NOT NULL,
            request TEXT,
            investigated TEXT,
            learned TEXT,
            completed TEXT,
            next_steps TEXT,
            files_read TEXT,
            files_edited TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
        `),this.db.prepare("INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)").run(4,new Date().toISOString()),console.log("[SessionStore] Migration004 applied successfully"))}catch(e){throw console.error("[SessionStore] Schema initialization error:",e.message),e}}ensureWorkerPortColumn(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(5))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(r=>r.name==="worker_port")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER"),console.log("[SessionStore] Added worker_port column to sdk_sessions table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(5,new Date().toISOString())}catch(e){console.error("[SessionStore] Migration error:",e.message)}}ensurePromptTrackingColumns(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(6))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(_=>_.name==="prompt_counter")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0"),console.log("[SessionStore] Added prompt_counter column to sdk_sessions table")),this.db.query("PRAGMA table_info(observations)").all().some(_=>_.name==="prompt_number")||(this.db.run("ALTER TABLE observations ADD COLUMN prompt_number INTEGER"),console.log("[SessionStore] Added prompt_number column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(_=>_.name==="prompt_number")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER"),console.log("[SessionStore] Added prompt_number column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(6,new Date().toISOString())}catch(e){console.error("[SessionStore] Prompt tracking migration error:",e.message)}}removeSessionSummariesUniqueConstraint(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(7))return;if(!this.db.query("PRAGMA index_list(session_summaries)").all().some(r=>r.unique===1)){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString());return}console.log("[SessionStore] Removing UNIQUE constraint from session_summaries.sdk_session_id..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE session_summaries_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            request TEXT,
            investigated TEXT,
            learned TEXT,
            completed TEXT,
            next_steps TEXT,
            files_read TEXT,
            files_edited TEXT,
            notes TEXT,
            prompt_number INTEGER,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          )
        `),this.db.run(`
          INSERT INTO session_summaries_new
          SELECT id, sdk_session_id, project, request, investigated, learned,
                 completed, next_steps, files_read, files_edited, notes,
                 prompt_number, created_at, created_at_epoch
          FROM session_summaries
        `),this.db.run("DROP TABLE session_summaries"),this.db.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),this.db.run(`
          CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
          CREATE INDEX idx_session_summaries_project ON session_summaries(project);
          CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString()),console.log("[SessionStore] Successfully removed UNIQUE constraint from session_summaries.sdk_session_id")}catch(r){throw this.db.run("ROLLBACK"),r}}catch(e){console.error("[SessionStore] Migration error (remove UNIQUE constraint):",e.message)}}addObservationHierarchicalFields(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(8))return;if(this.db.query("PRAGMA table_info(observations)").all().some(r=>r.name==="title")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString());return}console.log("[SessionStore] Adding hierarchical fields to observations table..."),this.db.run(`
        ALTER TABLE observations ADD COLUMN title TEXT;
        ALTER TABLE observations ADD COLUMN subtitle TEXT;
        ALTER TABLE observations ADD COLUMN facts TEXT;
        ALTER TABLE observations ADD COLUMN narrative TEXT;
        ALTER TABLE observations ADD COLUMN concepts TEXT;
        ALTER TABLE observations ADD COLUMN files_read TEXT;
        ALTER TABLE observations ADD COLUMN files_modified TEXT;
      `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString()),console.log("[SessionStore] Successfully added hierarchical fields to observations table")}catch(e){console.error("[SessionStore] Migration error (add hierarchical fields):",e.message)}}makeObservationsTextNullable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(9))return;let t=this.db.query("PRAGMA table_info(observations)").all().find(r=>r.name==="text");if(!t||t.notnull===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString());return}console.log("[SessionStore] Making observations.text nullable..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE observations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            text TEXT,
            type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change')),
            title TEXT,
            subtitle TEXT,
            facts TEXT,
            narrative TEXT,
            concepts TEXT,
            files_read TEXT,
            files_modified TEXT,
            prompt_number INTEGER,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          )
        `),this.db.run(`
          INSERT INTO observations_new
          SELECT id, sdk_session_id, project, text, type, title, subtitle, facts,
                 narrative, concepts, files_read, files_modified, prompt_number,
                 created_at, created_at_epoch
          FROM observations
        `),this.db.run("DROP TABLE observations"),this.db.run("ALTER TABLE observations_new RENAME TO observations"),this.db.run(`
          CREATE INDEX idx_observations_sdk_session ON observations(sdk_session_id);
          CREATE INDEX idx_observations_project ON observations(project);
          CREATE INDEX idx_observations_type ON observations(type);
          CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString()),console.log("[SessionStore] Successfully made observations.text nullable")}catch(r){throw this.db.run("ROLLBACK"),r}}catch(e){console.error("[SessionStore] Migration error (make text nullable):",e.message)}}createUserPromptsTable(){this.runMigration(10,"create_user_prompts_table",()=>{this.db.query("PRAGMA table_info(user_prompts)").all().length>0||(this.db.run(`
        CREATE TABLE user_prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          claude_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          prompt_text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(claude_session_id) REFERENCES sdk_sessions(claude_session_id) ON DELETE CASCADE
        );

        CREATE INDEX idx_user_prompts_claude_session ON user_prompts(claude_session_id);
        CREATE INDEX idx_user_prompts_created ON user_prompts(created_at_epoch DESC);
        CREATE INDEX idx_user_prompts_prompt_number ON user_prompts(prompt_number);
        CREATE INDEX idx_user_prompts_lookup ON user_prompts(claude_session_id, prompt_number);
      `),this.db.run(`
        CREATE VIRTUAL TABLE user_prompts_fts USING fts5(
          prompt_text,
          content='user_prompts',
          content_rowid='id'
        );
      `),this.db.run(`
        CREATE TRIGGER user_prompts_ai AFTER INSERT ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;

        CREATE TRIGGER user_prompts_ad AFTER DELETE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
        END;

        CREATE TRIGGER user_prompts_au AFTER UPDATE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;
      `))})}ensureDiscoveryTokensColumn(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(11))return;this.db.query("PRAGMA table_info(observations)").all().some(a=>a.name==="discovery_tokens")||(this.db.run("ALTER TABLE observations ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),console.log("[SessionStore] Added discovery_tokens column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(a=>a.name==="discovery_tokens")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),console.log("[SessionStore] Added discovery_tokens column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(11,new Date().toISOString())}catch(e){throw console.error("[SessionStore] Discovery tokens migration error:",e.message),e}}createPendingMessagesTable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(16))return;if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString());return}console.log("[SessionStore] Creating pending_messages table..."),this.db.run(`
        CREATE TABLE pending_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_db_id INTEGER NOT NULL,
          claude_session_id TEXT NOT NULL,
          message_type TEXT NOT NULL CHECK(message_type IN ('observation', 'summarize')),
          tool_name TEXT,
          tool_input TEXT,
          tool_response TEXT,
          cwd TEXT,
          last_user_message TEXT,
          last_assistant_message TEXT,
          prompt_number INTEGER,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'failed')),
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at_epoch INTEGER NOT NULL,
          started_processing_at_epoch INTEGER,
          completed_at_epoch INTEGER,
          FOREIGN KEY (session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
        )
      `),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_session ON pending_messages(session_db_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_status ON pending_messages(status)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_claude_session ON pending_messages(claude_session_id)"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString()),console.log("[SessionStore] pending_messages table created successfully")}catch(e){throw console.error("[SessionStore] Pending messages table migration error:",e.message),e}}getRecentSummaries(e,s=10){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getRecentSummariesWithSessionInfo(e,s=3){return this.db.prepare(`
      SELECT
        sdk_session_id, request, learned, completed, next_steps,
        prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getRecentObservations(e,s=20){return this.db.prepare(`
      SELECT type, text, prompt_number, created_at
      FROM observations
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getAllRecentObservations(e=100){return this.db.prepare(`
      SELECT id, type, title, subtitle, text, project, prompt_number, created_at, created_at_epoch
      FROM observations
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentSummaries(e=50){return this.db.prepare(`
      SELECT id, request, investigated, learned, completed, next_steps,
             files_read, files_edited, notes, project, prompt_number,
             created_at, created_at_epoch
      FROM session_summaries
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentUserPrompts(e=100){return this.db.prepare(`
      SELECT
        up.id,
        up.claude_session_id,
        s.project,
        up.prompt_number,
        up.prompt_text,
        up.created_at,
        up.created_at_epoch
      FROM user_prompts up
      LEFT JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      ORDER BY up.created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllProjects(){return this.db.prepare(`
      SELECT DISTINCT project
      FROM sdk_sessions
      WHERE project IS NOT NULL AND project != ''
      ORDER BY project ASC
    `).all().map(t=>t.project)}getLatestUserPrompt(e){return this.db.prepare(`
      SELECT
        up.*,
        s.sdk_session_id,
        s.project
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.claude_session_id = ?
      ORDER BY up.created_at_epoch DESC
      LIMIT 1
    `).get(e)}getRecentSessionsWithStatus(e,s=3){return this.db.prepare(`
      SELECT * FROM (
        SELECT
          s.sdk_session_id,
          s.status,
          s.started_at,
          s.started_at_epoch,
          s.user_prompt,
          CASE WHEN sum.sdk_session_id IS NOT NULL THEN 1 ELSE 0 END as has_summary
        FROM sdk_sessions s
        LEFT JOIN session_summaries sum ON s.sdk_session_id = sum.sdk_session_id
        WHERE s.project = ? AND s.sdk_session_id IS NOT NULL
        GROUP BY s.sdk_session_id
        ORDER BY s.started_at_epoch DESC
        LIMIT ?
      )
      ORDER BY started_at_epoch ASC
    `).all(e,s)}getObservationsForSession(e){return this.db.prepare(`
      SELECT title, subtitle, type, prompt_number
      FROM observations
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch ASC
    `).all(e)}getObservationById(e){return this.db.prepare(`
      SELECT *
      FROM observations
      WHERE id = ?
    `).get(e)||null}getObservationsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:r,project:o,type:a,concepts:d,files:_}=s,m=t==="date_asc"?"ASC":"DESC",p=r?`LIMIT ${r}`:"",u=e.map(()=>"?").join(","),E=[...e],T=[];if(o&&(T.push("project = ?"),E.push(o)),a)if(Array.isArray(a)){let n=a.map(()=>"?").join(",");T.push(`type IN (${n})`),E.push(...a)}else T.push("type = ?"),E.push(a);if(d){let n=Array.isArray(d)?d:[d],f=n.map(()=>"EXISTS (SELECT 1 FROM json_each(concepts) WHERE value = ?)");E.push(...n),T.push(`(${f.join(" OR ")})`)}if(_){let n=Array.isArray(_)?_:[_],f=n.map(()=>"(EXISTS (SELECT 1 FROM json_each(files_read) WHERE value LIKE ?) OR EXISTS (SELECT 1 FROM json_each(files_modified) WHERE value LIKE ?))");n.forEach(A=>{E.push(`%${A}%`,`%${A}%`)}),T.push(`(${f.join(" OR ")})`)}let O=T.length>0?`WHERE id IN (${u}) AND ${T.join(" AND ")}`:`WHERE id IN (${u})`;return this.db.prepare(`
      SELECT *
      FROM observations
      ${O}
      ORDER BY created_at_epoch ${m}
      ${p}
    `).all(...E)}getSummaryForSession(e){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch DESC
      LIMIT 1
    `).get(e)||null}getFilesForSession(e){let t=this.db.prepare(`
      SELECT files_read, files_modified
      FROM observations
      WHERE sdk_session_id = ?
    `).all(e),r=new Set,o=new Set;for(let a of t){if(a.files_read)try{let d=JSON.parse(a.files_read);Array.isArray(d)&&d.forEach(_=>r.add(_))}catch{}if(a.files_modified)try{let d=JSON.parse(a.files_modified);Array.isArray(d)&&d.forEach(_=>o.add(_))}catch{}}return{filesRead:Array.from(r),filesModified:Array.from(o)}}getSessionById(e){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getSdkSessionsBySessionIds(e){if(e.length===0)return[];let s=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt,
             started_at, started_at_epoch, completed_at, completed_at_epoch, status
      FROM sdk_sessions
      WHERE sdk_session_id IN (${s})
      ORDER BY started_at_epoch DESC
    `).all(...e)}findActiveSDKSession(e){return this.db.prepare(`
      SELECT id, sdk_session_id, project, worker_port
      FROM sdk_sessions
      WHERE claude_session_id = ? AND status = 'active'
      LIMIT 1
    `).get(e)||null}findAnySDKSession(e){return this.db.prepare(`
      SELECT id
      FROM sdk_sessions
      WHERE claude_session_id = ?
      LIMIT 1
    `).get(e)||null}reactivateSession(e,s){this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'active', user_prompt = ?, worker_port = NULL
      WHERE id = ?
    `).run(s,e)}incrementPromptCounter(e){return this.db.prepare(`
      UPDATE sdk_sessions
      SET prompt_counter = COALESCE(prompt_counter, 0) + 1
      WHERE id = ?
    `).run(e),this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||1}getPromptCounter(e){return this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||0}createSDKSession(e,s,t){let r=new Date,o=r.getTime(),d=this.db.prepare(`
      INSERT OR IGNORE INTO sdk_sessions
      (claude_session_id, sdk_session_id, project, user_prompt, started_at, started_at_epoch, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(e,e,s,t,r.toISOString(),o);return d.lastInsertRowid===0||d.changes===0?(s&&s.trim()!==""&&this.db.prepare(`
          UPDATE sdk_sessions
          SET project = ?, user_prompt = ?
          WHERE claude_session_id = ?
        `).run(s,t,e),this.db.prepare(`
        SELECT id FROM sdk_sessions WHERE claude_session_id = ? LIMIT 1
      `).get(e).id):d.lastInsertRowid}updateSDKSessionId(e,s){return this.db.prepare(`
      UPDATE sdk_sessions
      SET sdk_session_id = ?
      WHERE id = ? AND sdk_session_id IS NULL
    `).run(s,e).changes===0?(L.debug("DB","sdk_session_id already set, skipping update",{sessionId:e,sdkSessionId:s}),!1):!0}setWorkerPort(e,s){this.db.prepare(`
      UPDATE sdk_sessions
      SET worker_port = ?
      WHERE id = ?
    `).run(s,e)}getWorkerPort(e){return this.db.prepare(`
      SELECT worker_port
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)?.worker_port||null}saveUserPrompt(e,s,t){let r=new Date,o=r.getTime();return this.db.prepare(`
      INSERT INTO user_prompts
      (claude_session_id, prompt_number, prompt_text, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,s,t,r.toISOString(),o).lastInsertRowid}getUserPrompt(e,s){return this.db.prepare(`
      SELECT prompt_text
      FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
      LIMIT 1
    `).get(e,s)?.prompt_text??null}storeObservation(e,s,t,r,o=0){let a=new Date,d=a.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,s,a.toISOString(),d),console.log(`[SessionStore] Auto-created session record for session_id: ${e}`));let u=this.db.prepare(`
      INSERT INTO observations
      (sdk_session_id, project, type, title, subtitle, facts, narrative, concepts,
       files_read, files_modified, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,s,t.type,t.title,t.subtitle,JSON.stringify(t.facts),t.narrative,JSON.stringify(t.concepts),JSON.stringify(t.files_read),JSON.stringify(t.files_modified),r||null,o,a.toISOString(),d);return{id:Number(u.lastInsertRowid),createdAtEpoch:d}}storeSummary(e,s,t,r,o=0){let a=new Date,d=a.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,s,a.toISOString(),d),console.log(`[SessionStore] Auto-created session record for session_id: ${e}`));let u=this.db.prepare(`
      INSERT INTO session_summaries
      (sdk_session_id, project, request, investigated, learned, completed,
       next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,s,t.request,t.investigated,t.learned,t.completed,t.next_steps,t.notes,r||null,o,a.toISOString(),d);return{id:Number(u.lastInsertRowid),createdAtEpoch:d}}markSessionCompleted(e){let s=new Date,t=s.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'completed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(s.toISOString(),t,e)}markSessionFailed(e){let s=new Date,t=s.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'failed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(s.toISOString(),t,e)}getSessionSummariesByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:r,project:o}=s,a=t==="date_asc"?"ASC":"DESC",d=r?`LIMIT ${r}`:"",_=e.map(()=>"?").join(","),m=[...e],p=o?`WHERE id IN (${_}) AND project = ?`:`WHERE id IN (${_})`;return o&&m.push(o),this.db.prepare(`
      SELECT * FROM session_summaries
      ${p}
      ORDER BY created_at_epoch ${a}
      ${d}
    `).all(...m)}getUserPromptsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:r,project:o}=s,a=t==="date_asc"?"ASC":"DESC",d=r?`LIMIT ${r}`:"",_=e.map(()=>"?").join(","),m=[...e],p=o?"AND s.project = ?":"";return o&&m.push(o),this.db.prepare(`
      SELECT
        up.*,
        s.project,
        s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.id IN (${_}) ${p}
      ORDER BY up.created_at_epoch ${a}
      ${d}
    `).all(...m)}getTimelineAroundTimestamp(e,s=10,t=10,r){return this.getTimelineAroundObservation(null,e,s,t,r)}getTimelineAroundObservation(e,s,t=10,r=10,o){let a=o?"AND project = ?":"",d=o?[o]:[],_,m;if(e!==null){let T=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id <= ? ${a}
        ORDER BY id DESC
        LIMIT ?
      `,O=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id >= ? ${a}
        ORDER BY id ASC
        LIMIT ?
      `;try{let g=this.db.prepare(T).all(e,...d,t+1),n=this.db.prepare(O).all(e,...d,r+1);if(g.length===0&&n.length===0)return{observations:[],sessions:[],prompts:[]};_=g.length>0?g[g.length-1].created_at_epoch:s,m=n.length>0?n[n.length-1].created_at_epoch:s}catch(g){return console.error("[SessionStore] Error getting boundary observations:",g.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}else{let T=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch <= ? ${a}
        ORDER BY created_at_epoch DESC
        LIMIT ?
      `,O=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch >= ? ${a}
        ORDER BY created_at_epoch ASC
        LIMIT ?
      `;try{let g=this.db.prepare(T).all(s,...d,t),n=this.db.prepare(O).all(s,...d,r+1);if(g.length===0&&n.length===0)return{observations:[],sessions:[],prompts:[]};_=g.length>0?g[g.length-1].created_at_epoch:s,m=n.length>0?n[n.length-1].created_at_epoch:s}catch(g){return console.error("[SessionStore] Error getting boundary timestamps:",g.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}let p=`
      SELECT *
      FROM observations
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${a}
      ORDER BY created_at_epoch ASC
    `,u=`
      SELECT *
      FROM session_summaries
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${a}
      ORDER BY created_at_epoch ASC
    `,E=`
      SELECT up.*, s.project, s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.created_at_epoch >= ? AND up.created_at_epoch <= ? ${a.replace("project","s.project")}
      ORDER BY up.created_at_epoch ASC
    `;try{let T=this.db.prepare(p).all(_,m,...d),O=this.db.prepare(u).all(_,m,...d),g=this.db.prepare(E).all(_,m,...d);return{observations:T,sessions:O.map(n=>({id:n.id,sdk_session_id:n.sdk_session_id,project:n.project,request:n.request,completed:n.completed,next_steps:n.next_steps,created_at:n.created_at,created_at_epoch:n.created_at_epoch})),prompts:g.map(n=>({id:n.id,claude_session_id:n.claude_session_id,prompt_number:n.prompt_number,prompt_text:n.prompt_text,project:n.project,created_at:n.created_at,created_at_epoch:n.created_at_epoch}))}}catch(T){return console.error("[SessionStore] Error querying timeline records:",T.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}getPromptById(e){return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id = ?
      LIMIT 1
    `).get(e)||null}getPromptsByIds(e){if(e.length===0)return[];let s=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id IN (${s})
      ORDER BY p.created_at_epoch DESC
    `).all(...e)}getSessionSummaryById(e){return this.db.prepare(`
      SELECT
        id,
        sdk_session_id,
        claude_session_id,
        project,
        user_prompt,
        request_summary,
        learned_summary,
        status,
        created_at,
        created_at_epoch
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getEndlessModeStats(e){try{let s=e?"WHERE created_at_epoch <= ?":"",t=e?[e]:[],r=this.db.prepare(`SELECT SUM(discovery_tokens) as tokens, COUNT(*) as count FROM observations ${s}`).get(...t),o=this.db.prepare(`SELECT SUM(discovery_tokens) as tokens FROM session_summaries ${s}`).get(...t),a=this.db.prepare(`SELECT COUNT(*) as count FROM sdk_sessions ${e?"WHERE started_at_epoch <= ?":""}`).get(...t),d=e?"discovery_tokens = 0 AND created_at_epoch <= ?":"discovery_tokens = 0",_=this.db.prepare(`
        SELECT
          SUM(LENGTH(COALESCE(title, '')) + LENGTH(COALESCE(subtitle, '')) + LENGTH(COALESCE(narrative, '')) + LENGTH(COALESCE(text, ''))) as estimated_chars
        FROM observations
        WHERE ${d}
      `).get(...t),m=e?"discovery_tokens = 0 AND created_at_epoch <= ?":"discovery_tokens = 0",p=this.db.prepare(`
        SELECT
          SUM(LENGTH(COALESCE(request, '')) + LENGTH(COALESCE(learned, '')) + LENGTH(COALESCE(completed, '')) + LENGTH(COALESCE(next_steps, ''))) as estimated_chars
        FROM session_summaries
        WHERE ${m}
      `).get(...t),u=Math.floor(((_?.estimated_chars||0)+(p?.estimated_chars||0))/4);return{totalArchivedTokens:(r?.tokens||0)+(o?.tokens||0)+u,totalSessions:a?.count||0,totalObservations:r?.count||0}}catch(s){return console.error("[SessionStore] Failed to get endless mode stats:",s),{totalArchivedTokens:0,totalSessions:0,totalObservations:0}}}getAnalytics(e){try{let s=e?"AND created_at_epoch <= ?":"",t=e?[e]:[],r=this.db.prepare(`
        SELECT files_modified FROM observations WHERE files_modified IS NOT NULL ${s}
      `),o=new Map;for(let p of r.all(...t))try{let u=JSON.parse(p.files_modified);Array.isArray(u)&&u.forEach(E=>{let T=E.split("/").pop()||E;o.set(T,(o.get(T)||0)+1)})}catch{}let a=this.db.prepare(`
        SELECT concepts FROM observations WHERE concepts IS NOT NULL ${s}
      `),d=new Map;for(let p of a.all(...t))try{let u=JSON.parse(p.concepts);Array.isArray(u)&&u.forEach(E=>{d.set(E,(d.get(E)||0)+1)})}catch{}let _=Array.from(o.entries()).map(([p,u])=>({name:p,count:u})).sort((p,u)=>u.count-p.count).slice(0,10),m=Array.from(d.entries()).map(([p,u])=>({name:p,count:u})).sort((p,u)=>u.count-p.count).slice(0,10);return{topFiles:_,topConcepts:m}}catch(s){return console.error("[SessionStore] Failed to get analytics:",s),{topFiles:[],topConcepts:[]}}}getIntegrityStats(){try{let e=this.db.prepare("SELECT COUNT(*) as count FROM sdk_sessions").get(),s=this.db.prepare(`
        SELECT COUNT(*) as count
        FROM sdk_sessions s
        LEFT JOIN session_summaries sum ON s.sdk_session_id = sum.sdk_session_id
        WHERE sum.id IS NULL AND s.status = 'completed'
      `).get(),t=this.db.prepare("SELECT COUNT(*) as count FROM observations").get(),r=this.db.prepare(`
        SELECT COUNT(*) as count
        FROM observations o
        LEFT JOIN sdk_sessions s ON o.sdk_session_id = s.sdk_session_id
        WHERE s.id IS NULL
      `).get(),o=0;try{let d=require("fs").statSync(ae);o=Math.round(d.size/(1024*1024)*100)/100}catch{}return{totalSessions:e?.count||0,sessionsWithoutSummaries:s?.count||0,totalObservations:t?.count||0,orphanedObservations:r?.count||0,dbSizeMB:o}}catch(e){return console.error("[SessionStore] Failed to get integrity stats:",e),{totalSessions:0,sessionsWithoutSummaries:0,totalObservations:0,orphanedObservations:0,dbSizeMB:0}}}getKnowledgeGraph(e=50){let s=new Map,t=new Set;try{let r=this.db.prepare(`
        SELECT id, sdk_session_id, project, started_at_epoch
        FROM sdk_sessions
        WHERE status != 'failed'
        ORDER BY started_at_epoch DESC
        LIMIT ?
      `).all(e);for(let o of r){let a=`session-${o.id}`;s.set(a,{id:a,label:`Session ${o.id}`,type:"session",val:8,data:o});let d=this.db.prepare(`
          SELECT concepts
          FROM observations
          WHERE sdk_session_id = ?
        `).all(o.sdk_session_id);for(let m of d)if(m.concepts)try{let p=JSON.parse(m.concepts);if(Array.isArray(p))for(let u of p){let E=`concept-${u}`;s.has(E)||s.set(E,{id:E,label:u,type:"concept",val:5});let T=`${a}->${E}`;t.has(T)||t.add(JSON.stringify({source:a,target:E,type:"HAS_CONCEPT"}))}}catch{}let _=this.db.prepare(`
          SELECT files_read, files_modified
          FROM observations
          WHERE sdk_session_id = ?
        `).all(o.sdk_session_id);for(let m of _){let p=(u,E)=>{if(u)try{let T=JSON.parse(u);if(Array.isArray(T))for(let O of T){let g=`file-${O}`,n=O.split("/").pop()||O;if(!s.has(g))s.set(g,{id:g,label:n,type:"file",val:E==="MODIFIED"?6:3,path:O});else if(E==="MODIFIED"){let f=s.get(g);f.val=Math.max(f.val,6)}t.add(JSON.stringify({source:a,target:g,type:E}))}}catch{}};p(m.files_read,"READ"),p(m.files_modified,"MODIFIED")}}return{nodes:Array.from(s.values()),edges:Array.from(t).map(o=>JSON.parse(o))}}catch(r){return console.error("[SessionStore] Failed to get knowledge graph:",r),{nodes:[],edges:[]}}}close(){this.db.close()}importSdkSession(e){let s=this.db.prepare("SELECT id FROM sdk_sessions WHERE claude_session_id = ?").get(e.claude_session_id);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO sdk_sessions (
        claude_session_id, sdk_session_id, project, user_prompt,
        started_at, started_at_epoch, completed_at, completed_at_epoch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.sdk_session_id,e.project,e.user_prompt,e.started_at,e.started_at_epoch,e.completed_at,e.completed_at_epoch,e.status).lastInsertRowid}}importSessionSummary(e){let s=this.db.prepare("SELECT id FROM session_summaries WHERE sdk_session_id = ?").get(e.sdk_session_id);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO session_summaries (
        sdk_session_id, project, request, investigated, learned,
        completed, next_steps, files_read, files_edited, notes,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.request,e.investigated,e.learned,e.completed,e.next_steps,e.files_read,e.files_edited,e.notes,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importObservation(e){let s=this.db.prepare(`
      SELECT id FROM observations
      WHERE sdk_session_id = ? AND title = ? AND created_at_epoch = ?
    `).get(e.sdk_session_id,e.title,e.created_at_epoch);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO observations (
        sdk_session_id, project, text, type, title, subtitle,
        facts, narrative, concepts, files_read, files_modified,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.text,e.type,e.title,e.subtitle,e.facts,e.narrative,e.concepts,e.files_read,e.files_modified,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importUserPrompt(e){let s=this.db.prepare(`
      SELECT id FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
    `).get(e.claude_session_id,e.prompt_number);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO user_prompts (
        claude_session_id, prompt_number, prompt_text,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.prompt_number,e.prompt_text,e.created_at,e.created_at_epoch).lastInsertRowid}}};var de=te(require("path"),1);function ce(c){if(!c)return[];try{let e=JSON.parse(c);return Array.isArray(e)?e:[]}catch{return[]}}function Ie(c){return new Date(c).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:!0})}function Ce(c){return new Date(c).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function ye(c){return new Date(c).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Ke(c,e){return de.default.isAbsolute(c)?de.default.relative(e,c):c}function ve(c,e){let s=ce(c);return s.length>0?Ke(s[0],e):"General"}var De=te(require("path"),1);function Me(c){if(!c||c.trim()==="")return L.warn("PROJECT_NAME","Empty cwd provided, using fallback",{cwd:c}),"unknown-project";let e=De.default.basename(c);if(e==="")if(process.platform==="win32"&&c.match(/^[A-Z]:\\/i)){let r=`drive-${c[0].toUpperCase()}`;return L.info("PROJECT_NAME","Drive root detected",{cwd:c,projectName:r}),r}else return L.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:c}),"unknown-project";return e}var qe=Q.default.join((0,z.homedir)(),".claude","plugins","marketplaces","thedotmack","plugin",".install-version");function Je(){let c=Q.default.join((0,z.homedir)(),".claude-mem","settings.json"),e=k.loadFromFile(c);try{return{totalObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_OBSERVATIONS,10),fullObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_FULL_COUNT,10),sessionCount:parseInt(e.CLAUDE_MEM_CONTEXT_SESSION_COUNT,10),showReadTokens:e.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS==="true",showWorkTokens:e.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS==="true",showSavingsAmount:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT==="true",showSavingsPercent:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT==="true",observationTypes:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES.split(",").map(s=>s.trim()).filter(Boolean)),observationConcepts:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS.split(",").map(s=>s.trim()).filter(Boolean)),fullObservationField:e.CLAUDE_MEM_CONTEXT_FULL_FIELD,showLastSummary:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY==="true",showLastMessage:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE==="true"}}catch(s){return L.warn("WORKER","Failed to load context settings, using defaults",{},s),{totalObservationCount:50,fullObservationCount:5,sessionCount:10,showReadTokens:!0,showWorkTokens:!0,showSavingsAmount:!0,showSavingsPercent:!0,observationTypes:new Set(re),observationConcepts:new Set(ne),fullObservationField:"narrative",showLastSummary:!0,showLastMessage:!1}}}var ke=4,Qe=1,i={reset:"\x1B[0m",bright:"\x1B[1m",dim:"\x1B[2m",cyan:"\x1B[36m",green:"\x1B[32m",yellow:"\x1B[33m",blue:"\x1B[34m",magenta:"\x1B[35m",gray:"\x1B[90m",red:"\x1B[31m"};function J(c,e,s,t){return e?t?[`${s}${c}:${i.reset} ${e}`,""]:[`**${c}**: ${e}`,""]:[]}function ze(c){return c.replace(/\//g,"-")}function Ze(c){try{if(!(0,H.existsSync)(c))return{userMessage:"",assistantMessage:""};let e=(0,H.readFileSync)(c,"utf-8").trim();if(!e)return{userMessage:"",assistantMessage:""};let s=e.split(`
`).filter(r=>r.trim()),t="";for(let r=s.length-1;r>=0;r--)try{let o=s[r];if(!o.includes('"type":"assistant"'))continue;let a=JSON.parse(o);if(a.type==="assistant"&&a.message?.content&&Array.isArray(a.message.content)){let d="";for(let _ of a.message.content)_.type==="text"&&(d+=_.text);if(d=d.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g,"").trim(),d){t=d;break}}}catch{continue}return{userMessage:"",assistantMessage:t}}catch(e){return L.failure("WORKER","Failed to extract prior messages from transcript",{transcriptPath:c},e),{userMessage:"",assistantMessage:""}}}async function es(c,e=!1){let s=Je(),t=c?.cwd??process.cwd(),r=Me(t),o=null;try{o=new q}catch(f){if(f.code==="ERR_DLOPEN_FAILED"){try{(0,H.unlinkSync)(qe)}catch{}return console.error("Native module rebuild needed - restart Claude Code to auto-fix"),""}throw f}let a=Array.from(s.observationTypes),d=a.map(()=>"?").join(","),_=Array.from(s.observationConcepts),m=_.map(()=>"?").join(","),p=o.db.prepare(`
    SELECT
      id, sdk_session_id, type, title, subtitle, narrative,
      facts, concepts, files_read, files_modified, discovery_tokens,
      created_at, created_at_epoch
    FROM observations
    WHERE project = ?
      AND type IN (${d})
      AND EXISTS (
        SELECT 1 FROM json_each(concepts)
        WHERE value IN (${m})
      )
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(r,...a,..._,s.totalObservationCount),u=o.db.prepare(`
    SELECT id, sdk_session_id, request, investigated, learned, completed, next_steps, created_at, created_at_epoch
    FROM session_summaries
    WHERE project = ?
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(r,s.sessionCount+Qe),E="",T="";if(s.showLastMessage&&p.length>0)try{let f=c?.session_id,A=p.find(R=>R.sdk_session_id!==f);if(A){let R=A.sdk_session_id,I=ze(t),w=Q.default.join((0,z.homedir)(),".claude","projects",I,`${R}.jsonl`),W=Ze(w);E=W.userMessage,T=W.assistantMessage}}catch{}if(p.length===0&&u.length===0)return o?.close(),e?`
${i.bright}${i.cyan}[${r}] recent context${i.reset}
${i.gray}${"\u2500".repeat(60)}${i.reset}

${i.dim}No previous sessions found for this project yet.${i.reset}
`:`# [${r}] recent context

No previous sessions found for this project yet.`;let O=u.slice(0,s.sessionCount),g=p,n=[];if(e?(n.push(""),n.push(`${i.bright}${i.cyan}[${r}] recent context${i.reset}`),n.push(`${i.gray}${"\u2500".repeat(60)}${i.reset}`),n.push("")):(n.push(`# [${r}] recent context`),n.push("")),g.length>0){e?n.push(`${i.dim}Legend: \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision${i.reset}`):n.push("**Legend:** \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision"),n.push(""),e?(n.push(`${i.bright}\u{1F4A1} Column Key${i.reset}`),n.push(`${i.dim}  Read: Tokens to read this observation (cost to learn it now)${i.reset}`),n.push(`${i.dim}  Work: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)${i.reset}`)):(n.push("\u{1F4A1} **Column Key**:"),n.push("- **Read**: Tokens to read this observation (cost to learn it now)"),n.push("- **Work**: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)")),n.push(""),e?(n.push(`${i.dim}\u{1F4A1} Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.${i.reset}`),n.push(""),n.push(`${i.dim}When you need implementation details, rationale, or debugging context:${i.reset}`),n.push(`${i.dim}  - Use the mem-search skill to fetch full observations on-demand${i.reset}`),n.push(`${i.dim}  - Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching${i.reset}`),n.push(`${i.dim}  - Trust this index over re-reading code for past decisions and learnings${i.reset}`)):(n.push("\u{1F4A1} **Context Index:** This semantic index (titles, types, files, tokens) is usually sufficient to understand past work."),n.push(""),n.push("When you need implementation details, rationale, or debugging context:"),n.push("- Use the mem-search skill to fetch full observations on-demand"),n.push("- Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching"),n.push("- Trust this index over re-reading code for past decisions and learnings")),n.push("");let f=p.length,A=p.reduce((l,S)=>{let b=(S.title?.length||0)+(S.subtitle?.length||0)+(S.narrative?.length||0)+JSON.stringify(S.facts||[]).length;return l+Math.ceil(b/ke)},0),R=p.reduce((l,S)=>l+(S.discovery_tokens||0),0),I=R-A,w=R>0?Math.round(I/R*100):0,W=s.showReadTokens||s.showWorkTokens||s.showSavingsAmount||s.showSavingsPercent;if(W)if(e){if(n.push(`${i.bright}${i.cyan}\u{1F4CA} Context Economics${i.reset}`),n.push(`${i.dim}  Loading: ${f} observations (${A.toLocaleString()} tokens to read)${i.reset}`),n.push(`${i.dim}  Work investment: ${R.toLocaleString()} tokens spent on research, building, and decisions${i.reset}`),R>0&&(s.showSavingsAmount||s.showSavingsPercent)){let l="  Your savings: ";s.showSavingsAmount&&s.showSavingsPercent?l+=`${I.toLocaleString()} tokens (${w}% reduction from reuse)`:s.showSavingsAmount?l+=`${I.toLocaleString()} tokens`:l+=`${w}% reduction from reuse`,n.push(`${i.green}${l}${i.reset}`)}n.push("")}else{if(n.push("\u{1F4CA} **Context Economics**:"),n.push(`- Loading: ${f} observations (${A.toLocaleString()} tokens to read)`),n.push(`- Work investment: ${R.toLocaleString()} tokens spent on research, building, and decisions`),R>0&&(s.showSavingsAmount||s.showSavingsPercent)){let l="- Your savings: ";s.showSavingsAmount&&s.showSavingsPercent?l+=`${I.toLocaleString()} tokens (${w}% reduction from reuse)`:s.showSavingsAmount?l+=`${I.toLocaleString()} tokens`:l+=`${w}% reduction from reuse`,n.push(l)}n.push("")}let $e=u[0]?.id,Ue=O.map((l,S)=>{let b=S===0?null:u[S+1];return{...l,displayEpoch:b?b.created_at_epoch:l.created_at_epoch,displayTime:b?b.created_at:l.created_at,shouldShowLink:l.id!==$e}}),xe=new Set(p.slice(0,s.fullObservationCount).map(l=>l.id)),pe=[...g.map(l=>({type:"observation",data:l})),...Ue.map(l=>({type:"summary",data:l}))];pe.sort((l,S)=>{let b=l.type==="observation"?l.data.created_at_epoch:l.data.displayEpoch,D=S.type==="observation"?S.data.created_at_epoch:S.data.displayEpoch;return b-D});let j=new Map;for(let l of pe){let S=l.type==="observation"?l.data.created_at:l.data.displayTime,b=ye(S);j.has(b)||j.set(b,[]),j.get(b).push(l)}let we=Array.from(j.entries()).sort((l,S)=>{let b=new Date(l[0]).getTime(),D=new Date(S[0]).getTime();return b-D});for(let[l,S]of we){e?(n.push(`${i.bright}${i.cyan}${l}${i.reset}`),n.push("")):(n.push(`### ${l}`),n.push(""));let b=null,D="",$=!1;for(let Z of S)if(Z.type==="summary"){$&&(n.push(""),$=!1,b=null,D="");let h=Z.data,U=`${h.request||"Session started"} (${Ie(h.displayTime)})`;e?n.push(`\u{1F3AF} ${i.yellow}#S${h.id}${i.reset} ${U}`):n.push(`**\u{1F3AF} #S${h.id}** ${U}`),n.push("")}else{let h=Z.data,U=ve(h.files_modified,t);U!==b&&($&&n.push(""),e?n.push(`${i.dim}${U}${i.reset}`):n.push(`**${U}**`),e||(n.push("| ID | Time | T | Title | Read | Work |"),n.push("|----|------|---|-------|------|------|")),b=U,$=!0,D="");let x=Ce(h.created_at),B=h.title||"Untitled",G=Te[h.type]||"\u2022",Fe=(h.title?.length||0)+(h.subtitle?.length||0)+(h.narrative?.length||0)+JSON.stringify(h.facts||[]).length,F=Math.ceil(Fe/ke),P=h.discovery_tokens||0,ee=ge[h.type]||"\u{1F50D}",ue=P>0?`${ee} ${P.toLocaleString()}`:"-",se=x!==D,le=se?x:"";if(D=x,xe.has(h.id)){let M=s.fullObservationField==="narrative"?h.narrative:h.facts?ce(h.facts).join(`
`):null;if(e){let y=se?`${i.dim}${x}${i.reset}`:" ".repeat(x.length),Y=s.showReadTokens&&F>0?`${i.dim}(~${F}t)${i.reset}`:"",me=s.showWorkTokens&&P>0?`${i.dim}(${ee} ${P.toLocaleString()}t)${i.reset}`:"";n.push(`  ${i.dim}#${h.id}${i.reset}  ${y}  ${G}  ${i.bright}${B}${i.reset}`),M&&n.push(`    ${i.dim}${M}${i.reset}`),(Y||me)&&n.push(`    ${Y} ${me}`),n.push("")}else{$&&(n.push(""),$=!1),n.push(`**#${h.id}** ${le||"\u2033"} ${G} **${B}**`),M&&(n.push(""),n.push(M),n.push(""));let y=[];s.showReadTokens&&y.push(`Read: ~${F}`),s.showWorkTokens&&y.push(`Work: ${ue}`),y.length>0&&n.push(y.join(", ")),n.push(""),b=null}}else if(e){let M=se?`${i.dim}${x}${i.reset}`:" ".repeat(x.length),y=s.showReadTokens&&F>0?`${i.dim}(~${F}t)${i.reset}`:"",Y=s.showWorkTokens&&P>0?`${i.dim}(${ee} ${P.toLocaleString()}t)${i.reset}`:"";n.push(`  ${i.dim}#${h.id}${i.reset}  ${M}  ${G}  ${B} ${y} ${Y}`)}else{let M=s.showReadTokens?`~${F}`:"",y=s.showWorkTokens?ue:"";n.push(`| #${h.id} | ${le||"\u2033"} | ${G} | ${B} | ${M} | ${y} |`)}}$&&n.push("")}let C=u[0],_e=p[0];if(s.showLastSummary&&C&&(C.investigated||C.learned||C.completed||C.next_steps)&&(!_e||C.created_at_epoch>_e.created_at_epoch)&&(n.push(...J("Investigated",C.investigated,i.blue,e)),n.push(...J("Learned",C.learned,i.yellow,e)),n.push(...J("Completed",C.completed,i.green,e)),n.push(...J("Next Steps",C.next_steps,i.magenta,e))),T&&(n.push(""),n.push("---"),n.push(""),e?(n.push(`${i.bright}${i.magenta}\u{1F4CB} Previously${i.reset}`),n.push(""),n.push(`${i.dim}A: ${T}${i.reset}`)):(n.push("**\u{1F4CB} Previously**"),n.push(""),n.push(`A: ${T}`)),n.push("")),W&&R>0&&I>0){let l=Math.round(R/1e3);n.push(""),e?n.push(`${i.dim}\u{1F4B0} Access ${l}k tokens of past research & decisions for just ${A.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.${i.reset}`):n.push(`\u{1F4B0} Access ${l}k tokens of past research & decisions for just ${A.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.`)}}return o?.close(),n.join(`
`).trimEnd()}0&&(module.exports={generateContext});

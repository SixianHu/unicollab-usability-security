const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),cp=require('child_process');
const mysql=require('mysql2/promise');
const root=path.resolve(__dirname,'..'),local=path.join(root,'.local'),kind=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).name.includes('unicollab')?'unicollab':'strata';
const command=process.argv[2]||'init',port=kind==='unicollab'?8443:3104;const mysqld=process.env.MYSQLD_BIN||'mysqld';
function privateWrite(file,data){fs.writeFileSync(file,data,{mode:0o600,flag:'wx'});}
function mysqlArgs(){return ['--no-defaults',...(process.env.MYSQL_BASEDIR?['--basedir='+process.env.MYSQL_BASEDIR]:[])];}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function launch(config){
 if(fs.existsSync(config.socket))throw Error('Socket already exists; refusing to select an unknown/running server');
 const log=fs.openSync(path.join(local,'mysql-launch.log'),'a',0o600);
 const child=cp.spawn(mysqld,[...mysqlArgs(),'--datadir='+path.join(local,'mysql-data'),'--socket='+config.socket,'--skip-networking','--mysqlx=0','--skip-log-bin','--skip-name-resolve','--local-infile=0','--pid-file='+path.join(local,'mysql.pid'),'--log-error='+path.join(local,'mysql.log')],{cwd:root,stdio:['ignore',log,log],detached:true});
 let launchError;child.on('error',e=>{launchError=e;});child.unref();fs.closeSync(log);

 for(let i=0;i<100;i++){if(launchError)throw launchError;try{return await mysql.createConnection({socketPath:config.socket,user:'root'});}catch(e){if(i===99)throw Error('Dedicated MySQL did not start; inspect private .local/mysql.log');await sleep(100);}}
}
(async()=>{
 if(command==='stop'){
  const c=JSON.parse(fs.readFileSync(path.join(local,'runtime.json'),'utf8'));const db=await mysql.createConnection({socketPath:c.socket,user:'root'});await db.query('SHUTDOWN');await db.end();console.log('Stopped dedicated local demonstration MySQL.');return;
 }
 if(command==='start'){
  const c=JSON.parse(fs.readFileSync(path.join(local,'runtime.json'),'utf8'));const db=await launch(c);await db.end();console.log('Restarted dedicated MySQL; use the documented app command.');return;
 }
 if(command!=='init')throw Error('Use init, start or stop');
 if(fs.existsSync(local)||fs.existsSync(path.join(root,'.env')))throw Error('Refusing to overwrite existing .local or .env; choose a fresh checkout for a new demonstration');
 fs.mkdirSync(local,{mode:0o700});const socketDir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-db-'));fs.chmodSync(socketDir,0o700);const socket=path.join(socketDir,'mysql.sock');
 if(Buffer.byteLength(socket)>100)throw Error('Temporary socket path too long; set TMPDIR to a shorter private writable directory');
 const data=path.join(local,'mysql-data');fs.mkdirSync(data,{mode:0o700});const log=fs.openSync(path.join(local,'initialize.log'),'w',0o600);
 const init=cp.spawnSync(mysqld,[...mysqlArgs(),'--initialize-insecure','--datadir='+data],{cwd:root,stdio:['ignore',log,log]});fs.closeSync(log);if(init.error||init.status!==0)throw Error('New isolated MySQL initialization failed; inspect .local/initialize.log');
 const dbUser='demo_app',dbPassword=crypto.randomBytes(32).toString('hex'),database='portfolio_demo';
 const config={socket,dbUser,dbPassword,databases:{[kind]:database},uniPort:8443,strataPort:3104,kind};privateWrite(path.join(local,'runtime.json'),JSON.stringify(config));
 const admin=await launch(config);
 try{await admin.query('CREATE DATABASE `portfolio_demo` CHARACTER SET utf8mb4');await admin.query("CREATE USER ?@'localhost' IDENTIFIED BY ?",[dbUser,dbPassword]);await admin.query("GRANT ALL PRIVILEGES ON `portfolio_demo`.* TO ?@'localhost'",[dbUser]);await admin.changeUser({database});
  const scripts=kind==='unicollab'?['sql/users.sql']:['database/schema.sql','database/seed.sql'];
  for(const file of scripts){const sql=fs.readFileSync(path.join(root,file),'utf8');for(const part of sql.replace(/^\s*--.*$/gm,'').split(';').map(x=>x.trim()).filter(Boolean))await admin.query(part);}
 }finally{await admin.end();}
 const env={NEXT_TELEMETRY_DISABLED:'1',LOCAL_DEMO_DB_ENABLED:'true',MYSQL_SOCKET_PATH:socket,LOCAL_DEMO_ORIGIN:(kind==='unicollab'?'https':'http')+'://127.0.0.1:'+port};
 if(kind==='unicollab'){
  const tls=path.join(local,'tls');fs.mkdirSync(tls,{mode:0o700});const key=path.join(tls,'server.key'),cert=path.join(tls,'server.crt');const tlsLog=fs.openSync(path.join(local,'tls-generation.log'),'w',0o600);
  const gen=cp.spawnSync(process.env.OPENSSL_BIN||'openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','7','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:['ignore',tlsLog,tlsLog]});fs.closeSync(tlsLog);if(gen.error||gen.status!==0)throw Error('Fresh local TLS generation failed; no trust-store action was attempted');fs.chmodSync(key,0o600);
  Object.assign(env,{DB_USER:dbUser,DB_PASSWORD:dbPassword,DB_NAME:database,PORT:String(port),LOCAL_TLS_KEY_PATH:key,LOCAL_TLS_CERT_PATH:cert});
 }else{
  const username='demo_admin',password='Local-'+crypto.randomBytes(24).toString('base64url'),salt=crypto.randomBytes(16).toString('hex');const auth=path.join(local,'auth.json');privateWrite(auth,JSON.stringify({username,salt,passwordHash:crypto.scryptSync(password,salt,64).toString('hex')}));privateWrite(path.join(local,'demo-access.json'),JSON.stringify({username,password}));Object.assign(env,{DATABASE_USER:dbUser,DATABASE_PASSWORD:dbPassword,DATABASE_NAME:database,LOCAL_DEMO_AUTH_FILE:auth});
 }
 privateWrite(path.join(root,'.env'),Object.entries(env).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n');console.log('Created a NEW private local database and configuration. No old service was accessed.');if(kind==='strata')console.log('Generated synthetic sign-in details are private in .local/demo-access.json; they were not logged.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});

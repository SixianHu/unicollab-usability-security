// Portfolio-only session protection for the loopback development demonstration.
const crypto=require('crypto');
const sessions=new Map();
const cookieName='unicollab_local_session';
function cookieToken(req){return String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);}
function getSession(req){const token=cookieToken(req);const s=sessions.get(token);if(!s||s.expires<Date.now()){if(token)sessions.delete(token);return null;}return s;}
function createSession(req,res,user){const old=cookieToken(req);if(old)sessions.delete(old);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{studentId:user.student_id,expires:Date.now()+7200000});res.cookie(cookieName,token,{httpOnly:true,secure:true,sameSite:'strict',maxAge:7200000,path:'/'});}
function endSession(req,res){const token=cookieToken(req);if(token)sessions.delete(token);res.clearCookie(cookieName,{httpOnly:true,secure:true,sameSite:'strict',path:'/'});}
function protection(req,res,next){
 const origin=req.headers.origin;
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&origin!==process.env.LOCAL_DEMO_ORIGIN)return res.status(403).json({error:'Invalid origin'});
 const publicPaths=['/','/login.html','/create-account.html','/styles.css','/session-ui.js','/register','/login'];
 if(publicPaths.includes(req.path))return next();
 if(!getSession(req)){if(req.path.endsWith('.html'))return res.redirect('/login.html');return res.status(401).json({error:'Authentication required'});}
 next();
}
module.exports={getSession,createSession,endSession,protection};

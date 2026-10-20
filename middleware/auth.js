const jwt=require("jsonwebtoken");
function requireAdmin(req,res,next){
 const h=req.headers.authorization||"";
 const token=h.startsWith("Bearer ")?h.slice(7):"";
 try { if(!token) throw new Error(); req.admin=jwt.verify(token,process.env.JWT_SECRET); next(); }
 catch { return res.status(401).json({error:"Admin login required"}); }
}
module.exports={requireAdmin};

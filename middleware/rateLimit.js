const rateLimit=require("express-rate-limit");
const apiLimiter=rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:"draft-8",legacyHeaders:false});
const chatLimiter=rateLimit({windowMs:60*1000,limit:12,standardHeaders:"draft-8",legacyHeaders:false,message:{error:"Too many chat messages. Please wait a minute."}});
module.exports={apiLimiter,chatLimiter};

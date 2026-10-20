const {z}=require("zod");
function validate(schema){return (req,res,next)=>{const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid input",details:parsed.error.issues.map(x=>({field:x.path.join("."),message:x.message}))});req.validated=parsed.data;next();};}
const phone=z.string().trim().min(7).max(24).regex(/^[+()\d\s-]+$/,"Invalid phone number");
module.exports={validate,phone};

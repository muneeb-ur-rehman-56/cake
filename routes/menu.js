const router=require("express").Router();const {db}=require("../config/supabase");
router.get("/",async(req,res,next)=>{try{const s=db();const [c,p]=await Promise.all([s.from("categories").select("*").order("sort_order"),s.from("products").select("*,categories(name),product_variants(*),addons(*)").eq("is_available",true).order("name")]);if(c.error)throw c.error;if(p.error)throw p.error;res.json({categories:c.data,products:p.data});}catch(e){next(e);}});
router.get("/categories",async(req,res,next)=>{try{const {data,error}=await db().from("categories").select("*").order("sort_order");if(error)throw error;res.json(data);}catch(e){next(e);}});
router.get("/products/:id",async(req,res,next)=>{try{const {data,error}=await db().from("products").select("*,categories(name),product_variants(*),addons(*)").eq("id",req.params.id).single();if(error)throw error;res.json(data);}catch(e){next(e);}});
module.exports=router;

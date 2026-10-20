const Groq=require("groq-sdk");
const {db}=require("../config/supabase");
const {getSettings}=require("./business");
const {createOrder}=require("./orders");
let groq;
function client(){if(!process.env.GROQ_API_KEY)throw Object.assign(new Error("AI assistant is not configured"),{status:503});if(!groq){const GroqSDK=require("groq-sdk");groq=new GroqSDK({apiKey:process.env.GROQ_API_KEY});}return groq;}
const tools=[
 {type:"function",function:{name:"get_menu",description:"Read currently available menu and prices",parameters:{type:"object",properties:{category:{type:"string"}},required:[]}}},
 {type:"function",function:{name:"search_items",description:"Search live products by words and optional max price",parameters:{type:"object",properties:{query:{type:"string"},max_price:{type:"number"}},required:["query"]}}},
 {type:"function",function:{name:"get_item_details",description:"Get a live product by exact name or id",parameters:{type:"object",properties:{name:{type:"string"}},required:["name"]}}},
 {type:"function",function:{name:"check_availability",description:"Check if the shop is open and delivery details",parameters:{type:"object",properties:{},required:[]}}},
 {type:"function",function:{name:"get_order_status",description:"Check order status using order number and phone",parameters:{type:"object",properties:{order_number:{type:"string"},phone:{type:"string"}},required:["order_number","phone"]}}},
 {type:"function",function:{name:"validate_coupon",description:"Validate a coupon against a subtotal",parameters:{type:"object",properties:{code:{type:"string"},subtotal:{type:"number"}},required:["code","subtotal"]}}},
 {type:"function",function:{name:"get_business_info",description:"Read business phone, hours, fees and delivery areas",parameters:{type:"object",properties:{},required:[]}}},
 {type:"function",function:{name:"save_feedback",description:"Save a customer complaint or feedback for admin follow-up",parameters:{type:"object",properties:{name:{type:"string"},phone:{type:"string"},message:{type:"string"},kind:{type:"string"}},required:["message"]}}},
 {type:"function",function:{name:"create_cake_request",description:"Submit a custom cake request",parameters:{type:"object",properties:{name:{type:"string"},phone:{type:"string"},occasion:{type:"string"},size:{type:"string"},flavor:{type:"string"},cake_message:{type:"string"},date_needed:{type:"string"},notes:{type:"string"}},required:["name","phone","occasion","size","flavor","date_needed"]}}}
];
async function execute(name,a){
 const s=db();
 if(name==="get_menu"){let q=s.from("products").select("id,name,description,price,category_id,is_featured,is_available,categories(name)").eq("is_available",true).order("name").limit(40);if(a.category)q=q.ilike("categories.name",`%${String(a.category).slice(0,60)}%`);const {data,error}=await q;if(error)throw error;return data;}
 if(name==="search_items"){let q=s.from("products").select("id,name,description,price,is_available").eq("is_available",true).ilike("name",`%${String(a.query).slice(0,60)}%`).limit(10);if(Number.isFinite(a.max_price))q=q.lte("price",a.max_price);const {data,error}=await q;if(error)throw error;return data;}
 if(name==="get_item_details"){const {data,error}=await s.from("products").select("*,product_variants(*),addons(*)").or(`name.ilike.%${String(a.name).replace(/[,%()]/g,"").slice(0,50)}%,id.eq.${/^[0-9a-f-]{36}$/i.test(a.name)?a.name:"00000000-0000-0000-0000-000000000000"}`).limit(1);if(error)throw error;return data?.[0]||{message:"Item not found"};}
 if(name==="check_availability"||name==="get_business_info")return await getSettings();
 if(name==="get_order_status"){const {data,error}=await s.from("orders").select("order_number,status,created_at,fulfillment").eq("order_number",String(a.order_number).slice(0,40)).eq("phone",String(a.phone).slice(0,24)).maybeSingle();if(error)throw error;return data||{message:"No matching order. Check order number and phone."};}
 if(name==="validate_coupon"){const {data,error}=await s.from("coupons").select("*").eq("code",String(a.code).toUpperCase().slice(0,30)).eq("is_active",true).maybeSingle();if(error)throw error;if(!data||data.expires_at&&new Date(data.expires_at)<new Date()||Number(a.subtotal)<Number(data.minimum_order||0))return {valid:false,message:"Coupon is invalid, expired, or minimum order is not met"};return {valid:true,code:data.code,discount_type:data.discount_type,discount_value:data.discount_value};}
 if(name==="save_feedback"){const {data,error}=await s.from("feedback").insert({name:String(a.name||"Guest").slice(0,100),phone:String(a.phone||"").slice(0,24),message:String(a.message).slice(0,1500),kind:String(a.kind||"feedback").slice(0,30)}).select("id,created_at").single();if(error)throw error;return {saved:true,reference:data.id};}
 if(name==="create_cake_request"){const {data,error}=await s.from("cake_requests").insert({customer_name:String(a.name).slice(0,100),phone:String(a.phone).slice(0,24),occasion:String(a.occasion).slice(0,100),size:String(a.size).slice(0,50),flavor:String(a.flavor).slice(0,80),cake_message:String(a.cake_message||"").slice(0,200),date_needed:a.date_needed,notes:String(a.notes||"").slice(0,1000),status:"New"}).select("id").single();if(error)throw error;return {submitted:true,reference:data.id};}
 return {error:"Unsupported tool"};
}
const system=`You are the Sweet Crust bakery customer assistant. Understand and reply naturally in English, Urdu, or Roman Urdu matching the customer. Use only live tool results for menu, prices, offers, hours, delivery areas and fees; never invent. Keep replies short, warm and mobile-friendly; show prices in PKR. Before placing an order, show the exact items, quantities, delivery/pickup, fee, and total and obtain explicit confirmation. Never ask for card numbers or passwords. Do not discuss unrelated topics; politely return to bakery help. For unknown information, say you don't know and offer human contact. Never claim an action succeeded unless a tool confirms it. You cannot create an order directly through chat yet; direct customer to checkout to securely confirm and place it.`;
async function chat(message,history=[]){
 if(typeof message!=="string"||message.trim().length<1||message.length>1500)throw Object.assign(new Error("Message must be 1–1500 characters"),{status:400});
 const msgs=[{role:"system",content:system},...history.slice(-8).filter(m=>["user","assistant"].includes(m.role)&&typeof m.content==="string").map(m=>({role:m.role,content:m.content.slice(0,1500)})),{role:"user",content:message}];
 let response=await client().chat.completions.create({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",messages:msgs,tools,tool_choice:"auto",temperature:0.2,max_tokens:600});
 let loops=0;
 while(response.choices[0].message.tool_calls&&loops++<3){
  const assistant=response.choices[0].message;msgs.push(assistant);
  for(const call of assistant.tool_calls){let result;try{const args=JSON.parse(call.function.arguments||"{}");result=await execute(call.function.name,args);}catch(e){result={error:"Could not complete that request",message:e.message};}msgs.push({role:"tool",tool_call_id:call.id,content:JSON.stringify(result).slice(0,12000)});}
  response=await client().chat.completions.create({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",messages:msgs,tools,tool_choice:"auto",temperature:0.2,max_tokens:600});
 }
 return {reply:response.choices[0].message.content||"Sorry, please contact our team for help.",handoff:/human|whatsapp|contact our team/i.test(response.choices[0].message.content||"")};
}
module.exports={chat};

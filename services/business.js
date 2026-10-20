const {db}=require("../config/supabase");
async function getSettings(){
 const {data,error}=await db().from("settings").select("key,value");
 if(error) throw error;
 const settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
 return {businessName:settings.business_name||process.env.BUSINESS_NAME||"Sweet Crust",phone:settings.phone||process.env.BUSINESS_PHONE||"",whatsapp:settings.whatsapp||process.env.WHATSAPP_NUMBER||"",deliveryFee:Number(settings.delivery_fee??process.env.DELIVERY_FEE??200),minimumOrder:Number(settings.minimum_order??process.env.MINIMUM_ORDER??500),deliveryAreas:settings.delivery_areas||["Bhakkar"],openingHours:settings.opening_hours||"Daily 9:00 AM – 10:00 PM",isOpen:settings.is_open!==false};
}
module.exports={getSettings};

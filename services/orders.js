const {db}=require("../config/supabase");
const {getSettings}=require("./business");
const crypto=require("crypto");
async function createOrder(input){
 const s=db(), settings=await getSettings();
 if(!settings.isOpen) throw Object.assign(new Error("The shop is currently closed."),{status:409});
 if(!Array.isArray(input.items)||!input.items.length) throw Object.assign(new Error("Cart is empty"),{status:400});
 const ids=[...new Set(input.items.map(i=>i.product_id))];
 const {data:products,error}=await s.from("products").select("id,name,price,is_available").in("id",ids);
 if(error) throw error;
 const map=new Map((products||[]).map(p=>[p.id,p]));
 let subtotal=0, orderItems=[];
 for(const item of input.items){
  const p=map.get(item.product_id), qty=Math.max(1,Math.min(50,Number(item.quantity)||1));
  if(!p||!p.is_available) throw Object.assign(new Error("One or more items are unavailable"),{status:400});
  const unit=Number(p.price); subtotal+=unit*qty;
  orderItems.push({product_id:p.id,product_name:p.name,quantity:qty,unit_price:unit,line_total:unit*qty,special_instructions:String(item.special_instructions||"").slice(0,500)});
 }
 if(subtotal<settings.minimumOrder) throw Object.assign(new Error(`Minimum order is PKR ${settings.minimumOrder}`),{status:400});
 let discount=0;
 if(input.coupon_code){
  const {data:c}=await s.from("coupons").select("*").eq("code",String(input.coupon_code).toUpperCase()).eq("is_active",true).maybeSingle();
  if(c&&(!c.expires_at||new Date(c.expires_at)>new Date())&&subtotal>=Number(c.minimum_order||0)){
   discount=c.discount_type==="percent"?subtotal*Number(c.discount_value)/100:Number(c.discount_value);
   discount=Math.min(subtotal,Math.round(discount));
  }
 }
 const delivery=input.fulfillment==="pickup"?0:settings.deliveryFee;
 const total=Math.max(0,subtotal-discount+delivery);
 const orderNumber="SC-"+crypto.randomBytes(4).toString("hex").toUpperCase();
 const {data:customer,error:ce}=await s.from("customers").upsert({name:input.name,phone:input.phone,address:input.address||"",updated_at:new Date().toISOString()},{onConflict:"phone"}).select("id").single();
 if(ce) throw ce;
 const {data:order,error:oe}=await s.from("orders").insert({order_number:orderNumber,customer_id:customer.id,customer_name:input.name,phone:input.phone,address:input.address||"",fulfillment:input.fulfillment||"delivery",preferred_time:input.preferred_time||null,payment_method:"cod",order_notes:String(input.order_notes||"").slice(0,1000),status:"Received",subtotal,delivery_fee:delivery,discount,total,coupon_code:input.coupon_code||null}).select("*").single();
 if(oe) throw oe;
 const rows=orderItems.map(i=>({...i,order_id:order.id}));
 const {error:ie}=await s.from("order_items").insert(rows);
 if(ie){await s.from("orders").delete().eq("id",order.id);throw ie;}
 return {order_number:orderNumber,status:order.status,subtotal,delivery_fee:delivery,discount,total,currency:"PKR"};
}
module.exports={createOrder};

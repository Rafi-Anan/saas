import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Product from "./models/Product.js";
import Store from "./models/Store.js";

const products = [
  { name:"Premium Running Shoe", slug:"premium-running-shoe", price:2490, compareAt:2990, category:"Shoes", type:"variable", stock:42, status:"active", image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900", variants:[{label:"Size",options:["39","40","41","42","43"]},{label:"Color",options:["Black","White","Red"]}] },
  { name:"Classic Leather Wallet", slug:"classic-leather-wallet", price:890, category:"Accessories", type:"simple", stock:87, status:"active", image:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=900" },
  { name:"Organic Honey 500g", slug:"organic-honey-500g", price:650, compareAt:750, category:"Grocery", type:"simple", stock:120, status:"active", image:"https://images.unsplash.com/photo-1471943311424-646960669fbc?w=900" }
];

await mongoose.connect(process.env.MONGODB_URI);
const store = await Store.findOneAndUpdate(
  { slug: process.env.DEFAULT_STORE_SLUG || "demo" },
  { $setOnInsert: { name: "H2R Demo Store", currency: "BDT", timezone: "Asia/Dhaka" } },
  { new: true, upsert: true }
);
for (const product of products) {
  await Product.findOneAndUpdate(
    { storeId: store._id, slug: product.slug },
    { $set: product, $setOnInsert: { storeId: store._id } },
    { upsert: true, new: true, runValidators: true }
  );
}
console.log("Seed complete");
await mongoose.disconnect();

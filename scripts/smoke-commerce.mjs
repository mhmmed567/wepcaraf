import { randomUUID } from 'node:crypto';

const projectId = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!projectId || !url || !key) throw Error('Pass a project ID and load Supabase server environment variables.');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
async function request(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (response.status !== expected) throw Error(`${method} ${path.split('?')[0]} returned ${response.status}: ${JSON.stringify(data)}`);
  return data;
}
const product = { name: `Commerce smoke ${randomUUID().slice(0, 8)}`, description: 'Temporary catalog test', image_url: '', category: 'Test', brand: '', tags: ['test'], status: 'active', seo_title: '', seo_description: '' };
const sku = `SMOKE-${randomUUID()}`;
let productId;
const orderIds = [];
try {
  productId = await request('rpc/commerce_save_product', 'POST', { p_project_id: projectId, p_product_id: null, p_product: product, p_variants: [{ title: 'Default', options: {}, sku, barcode: '', price_minor: 1250, compare_price_minor: null, cost_minor: null, stock_on_hand: 3, low_stock_threshold: 2, image_url: '' }] });
  const [created] = await request(`commerce_products?id=eq.${productId}&project_id=eq.${projectId}&select=id,name,commerce_variants(id,stock_on_hand,price_minor)`);
  if (!created || created.commerce_variants.length !== 1 || created.commerce_variants[0].stock_on_hand !== 3) throw Error('Product and initial variant were not saved.');
  const variantId = created.commerce_variants[0].id;
  await request('rpc/commerce_save_product', 'POST', { p_project_id: projectId, p_product_id: productId, p_product: { ...product, name: `${product.name} updated` }, p_variants: [{ id: variantId, title: 'Default', options: { Color: 'Black' }, sku, barcode: '', price_minor: 1500, compare_price_minor: null, cost_minor: null, low_stock_threshold: 2, image_url: '' }] });
  const stock = await request('rpc/commerce_adjust_stock', 'POST', { p_project_id: projectId, p_variant_id: variantId, p_delta: 2, p_reason: 'Automated smoke test', p_actor_id: null });
  if (stock !== 5) throw Error('Stock adjustment did not return expected quantity.');
  const events = await request(`commerce_stock_events?project_id=eq.${projectId}&variant_id=eq.${variantId}&select=delta,stock_after`);
  if (events.length !== 1 || events[0].delta !== 2 || events[0].stock_after !== 5) throw Error('Stock event was not recorded.');
  const [updated] = await request(`commerce_products?id=eq.${productId}&select=name,commerce_variants(price_minor,options,stock_on_hand)`);
  if (!updated.name.endsWith('updated') || updated.commerce_variants[0].price_minor !== 1500 || updated.commerce_variants[0].stock_on_hand !== 5) throw Error('Updated product or variant could not be read back.');
  const [inventory] = await request(`commerce_variants?id=eq.${variantId}&select=id,commerce_products!inner(name,status)`);
  if (inventory.commerce_products.status !== 'active') throw Error('Inventory product relationship is missing.');
  const options = await request(`commerce_variants?project_id=eq.${projectId}&active=eq.true&commerce_products.status=eq.active&commerce_products.name=ilike.*${encodeURIComponent(product.name)}*&select=id,commerce_products!inner(name,status)`);
  if (!options.some(item => item.id === variantId)) throw Error('Published variant could not be found by product search.');
  for (const target of ['fulfilled', 'cancelled']) {
    const quantity = target === 'fulfilled' ? 1 : 2;
    const orderId = await request('rpc/commerce_create_order', 'POST', { p_project_id: projectId, p_customer: { name: 'Smoke Test', email: '', phone: '', note: '' }, p_items: [{ variant_id: variantId, quantity }] });
    orderIds.push(orderId);
    const [reserved] = await request(`commerce_variants?id=eq.${variantId}&select=stock_reserved`);
    if (reserved.stock_reserved !== quantity) throw Error('Order did not reserve stock.');
    const [order] = await request(`commerce_orders?id=eq.${orderId}&select=total_minor,status,commerce_order_items(quantity,unit_price_minor)`);
    if (order.total_minor !== quantity * 1500 || order.status !== 'pending' || order.commerce_order_items.length !== 1) throw Error('Order amount or item was not saved.');
    const result = await request('rpc/commerce_transition_order', 'POST', { p_project_id: projectId, p_order_id: orderId, p_target: target, p_actor_id: null });
    if (result !== target) throw Error('Order transition failed.');
    const [after] = await request(`commerce_variants?id=eq.${variantId}&select=stock_on_hand,stock_reserved,sold_count`);
    if (after.stock_on_hand !== 4 || after.stock_reserved !== 0 || after.sold_count !== 1) throw Error('Order transition did not reconcile stock.');
  }
  console.log('Commerce catalog, stock and order smoke test passed.');
} finally {
  for (const orderId of orderIds) await request(`commerce_orders?id=eq.${orderId}&project_id=eq.${projectId}`, 'DELETE', undefined, 204);
  if (productId) {
    await request(`commerce_products?id=eq.${productId}&project_id=eq.${projectId}`, 'DELETE', undefined, 204);
    console.log('Temporary product removed.');
  }
}

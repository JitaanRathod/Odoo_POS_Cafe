import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, SendHorizonal, CreditCard, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { productAPI } from "../../api/product.api";
import { orderAPI } from "../../api/order.api";
import { useCartStore } from "../../store/useCartStore";
import { useSessionStore } from "../../store/useSessionStore";
import { socket } from "../../lib/socket";
import Button from "../../components/UI/Button";
import Spinner from "../../components/UI/Spinner";

const CATEGORY_ICONS = {
  "Hot Beverages": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", fallback: "☕" },
  "Cold Beverages": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", fallback: "🧊" },
  "Snacks":         { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", fallback: "🍿" },
  "Meals":          { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", fallback: "🍕" },
  "Desserts":       { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", fallback: "🍰" },
  "Fresh Juices":   { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", fallback: "🍊" },
};

// Real food images via Unsplash CDN (free, no auth required)
const PRODUCT_IMAGES = {
  // Hot Beverages
  "Espresso":         "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=200&h=200&fit=crop&auto=format",
  "Cappuccino":       "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop&auto=format",
  "Latte":            "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=200&h=200&fit=crop&auto=format",
  "Chai":             "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop&auto=format",
  "Americano":        "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200&h=200&fit=crop&auto=format",
  "Flat White":       "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=200&h=200&fit=crop&auto=format",
  "Masala Chai":      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop&auto=format",
  "Green Tea":        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop&auto=format",
  // Cold Beverages
  "Cold Coffee":      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop&auto=format",
  "Iced Latte":       "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop&auto=format",
  "Mango Smoothie":   "https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=200&h=200&fit=crop&auto=format",
  "Fresh Lime Soda":  "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&fit=crop&auto=format",
  "Strawberry Shake": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&h=200&fit=crop&auto=format",
  // Snacks
  "Croissant":        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop&auto=format",
  "Veg Sandwich":     "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=200&h=200&fit=crop&auto=format",
  "Club Sandwich":    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop&auto=format",
  "French Fries":     "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop&auto=format",
  "Brownie":          "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&auto=format",
  "Garlic Bread":     "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=200&h=200&fit=crop&auto=format",
  "Nachos":           "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=200&h=200&fit=crop&auto=format",
  "Cheese Toast":     "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&h=200&fit=crop&auto=format",
  // Meals
  "Paneer Wrap":      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop&auto=format",
  "Pasta Arabiata":   "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop&auto=format",
  "Grilled Sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop&auto=format",
  "Margherita Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop&auto=format",
  "Mushroom Pasta":   "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop&auto=format",
  "Chicken Burger":   "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop&auto=format",
  "Veg Burger":       "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop&auto=format",
  // Desserts
  "Chocolate Cake":   "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&auto=format",
  "Cheesecake":       "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=200&h=200&fit=crop&auto=format",
  "Waffle":           "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=200&h=200&fit=crop&auto=format",
  "Ice Cream Sundae": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop&auto=format",
  // Fresh Juices
  "Orange Juice":     "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop&auto=format",
  "Watermelon Juice": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop&auto=format",
  "Pineapple Juice":  "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=200&h=200&fit=crop&auto=format",
};

const getCatStyle = (catName) => CATEGORY_ICONS[catName] || { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", fallback: "🍽️" };

export default function OrderScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQty, clearCart, getSubtotal, getTax, getTotal } = useCartStore();
  const { sessionId, branchId } = useSessionStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const orderType = (tableId === "takeaway" || tableId === "dine-in") ? "TAKEAWAY" : "DINE_IN";

  useEffect(() => {
    productAPI.list({ limit: 200 }).then((res) => {
      const prods = res.products || [];
      setProducts(prods);
      const cats = [...new Set(prods.map((p) => p.category?.name).filter(Boolean))];
      setCategories(cats);
    }).catch(() => toast.error("Failed to load products")).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = activeCat === "All" || p.category?.name === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSendAndPay = async (goToPay = false) => {
    if (!items.length) return toast.error("Cart is empty");
    setSending(true);
    try {
      const dineInTableId = orderType === "DINE_IN" ? tableId : null;
      const orderRes = await orderAPI.create({ branchId, sessionId, orderType, tableId: dineInTableId });
      const newOrderId = orderRes.order.id;
      await orderAPI.addItems(newOrderId, { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) });
      try { await orderAPI.sendToKitchen(newOrderId); } catch {}
      socket.emit("order:new", { orderId: newOrderId });
      if (goToPay) {
        navigate(`/pos/payment/${newOrderId}`);
      } else {
        toast.success("Order sent to kitchen!");
        clearCart();
        navigate("/pos/floor");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT: Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => navigate("/pos/floor")} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm">{orderType === "TAKEAWAY" ? "Takeaway" : "Dine-In"} Order</h1>
            <p className="text-xs text-gray-500">Browse & add items</p>
          </div>
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-400 outline-none" />
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-50 shrink-0">
          <button onClick={() => setActiveCat("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCat === "All" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
          {categories.map((cat) => {
            const s = getCatStyle(cat);
            return (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${activeCat === cat ? "bg-brand-500 text-white" : `${s.bg} ${s.text} hover:opacity-80`}`}>
                <span>{s.fallback}</span> {cat}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400"><ShoppingBag size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No products found</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filtered.map((product) => {
                const catStyle = getCatStyle(product.category?.name);
                const imgUrl = PRODUCT_IMAGES[product.name];
                const inCart = items.find((i) => i.productId === product.id);
                return (
                  <button key={product.id} onClick={() => addItem(product)}
                    className={`relative flex flex-col p-0 bg-white rounded-xl border overflow-hidden transition-all text-left active:scale-[0.97] ${inCart ? "border-brand-300 shadow-sm shadow-brand-100" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"}`}>
                    {/* Product Image */}
                    <div className={`w-full h-28 ${catStyle.bg} relative overflow-hidden`}>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full ${catStyle.bg} items-center justify-center text-3xl absolute inset-0`}
                        style={{ display: imgUrl ? "none" : "flex" }}
                      >
                        {catStyle.fallback}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1">
                      <span className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{product.name}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{product.category?.name}</span>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-brand-600">₹{product.price}</span>
                        <span className="text-[10px] text-gray-400">{product.taxRate}% tax</span>
                      </div>
                    </div>
                    {inCart && <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{inCart.quantity}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Current Order</h2>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} • {orderType}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {!items.length ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag size={32} className="mb-2 opacity-30" /><p className="text-sm">Tap products to add</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 py-2.5 border-b border-gray-50 animate-fadeIn">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">₹{item.unitPrice} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={11} /></button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus size={11} /></button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-14 text-right">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
                  <button onClick={() => removeItem(item.productId)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <>
            <div className="px-5 py-3 border-t border-gray-50 space-y-1">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{getSubtotal().toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>₹{getTax().toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span className="text-lg">₹{getTotal().toFixed(2)}</span></div>
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <Button variant="secondary" onClick={() => handleSendAndPay(false)} loading={sending} className="flex-1" size="sm">
                <SendHorizonal size={14} /> Kitchen
              </Button>
              <Button onClick={() => handleSendAndPay(true)} loading={sending} className="flex-1" size="sm">
                <CreditCard size={14} /> Pay
              </Button>
            </div>
            <div className="px-5 pb-3">
              <button onClick={clearCart} className="w-full text-xs text-gray-400 hover:text-red-500 py-1">Clear cart</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

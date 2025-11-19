import api from "./auth"

// ✅ Get product details by barcode
export const getProductByBartcode = async (payload: { 
  barcode: string; 
  latitude: number; 
  longitude: number; 
}) => {
  try {
    const response = await api.post("stores/stores/scan/", payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ Product details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Couldn't get product details");
    if (error.response) {
      console.log("Response data:", error.response.data);
      console.log("Status:", error.response.status);
    }
    throw error;
  }
};

// ✅ Checkout process
export const checkoutProcess = async (orderData: object) => {
  try {
    const response = await api.post("orders/order/checkout/", orderData);
    console.log("Order done successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Couldn't continue in checkout process", error);
    throw error;
  }
};

// ✅ Add product to cart
export const addToCartApi = async (product: object) => {
  try {
    const response = await api.post("orders/cart/add/", product);
    console.log("Order added to cart successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Couldn't add order to cart", error);
    throw error;
  }
};

// ✅ Empty cart
export const emptyCart = async () => {
  try {
    const response = await api.post("orders/cart/clear/");
    console.log("Cart cleared successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Couldn't clear the cart", error);
    throw error;
  }
};

// ✅ Remove product from cart
export const removeProduct = async (productId: number) => {
  try {
    const response = await api.delete(`orders/cart/${productId}/`);
    console.log("Product removed successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to remove product", error);
    throw error;
  }
};

// ✅ Update cart item
export const updateCartItem = async (productId: number, editedData: object) => {
  try {
    const response = await api.put(`orders/cart/${productId}/`, editedData);
    console.log("Product updated successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to update product", error);
    throw error;
  }
};

// ✅ Get cart items
export const getCartItem = async () => {
  try {
    const response = await api.get("orders/cart/");
    console.log("Fetched cart items", response.data);
    return response.data.results;
  } catch (error) {
    console.log("Couldn't get cart items", error);
    throw error;
  }
};

// ✅ Get cart summary
export const getSummary = async () => {
  try {
    const response = await api.get("orders/cart/summary/");
    console.log("Cart summary fetched", response.data);
    return response.data.items;
  } catch (error) {
    console.log("Couldn't fetch summary", error);
    throw error;
  }
};

// ✅ Checkout order
export const checkoutOrder = async (order: object) => {
  try {
    const response = await api.post("orders/order/checkout/", order);
    console.log("Order checked successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Problem with adding order", error);
    throw error;
  }
};

// ✅ Validate cash payment
export const validateCashPayment = async (order: object) => {
  try {
    const response = await api.post("invoices/payments/cash/validate/", order);
    console.log("Order done successfully, here's the invoice", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to show invoice", error);
    throw error;
  }
};

// ✅ QR Orders API helpers
export const fetchQROrderByCode = async (qrCode: string) => {
  try {
    const response = await api.get(`/api/qr-orders/${encodeURIComponent(qrCode)}`);
    console.log("Fetched QR order successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to fetch QR order", error);
    throw error;
  }
};

export const scanProductInQROrder = async (data: { qrOrderId: number; barcode: string }) => {
  try {
    const response = await api.post("/qr-orders/scan-product", data);
    console.log("Scanned product successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to scan product in QR order", error);
    throw error;
  }
};

export const completeQROrder = async (qrOrderId: number) => {
  try {
    const response = await api.post(`/api/qr-orders/${qrOrderId}/complete`);
    console.log("Completed QR order successfully", response.data);
    return response.data;
  } catch (error) {
    console.log("Failed to complete QR order", error);
    throw error;
  }
};


export const getOrderById = async (orderId : number) => {
  try{
    const response = await api.get(`orders/order/${orderId}/qr-debug/`);
    console.log("get order with id Successfully",response.data)
    return response.data;

  }catch(error){
    console.log("Faild to get order",error)
    throw error;
  }
}
export const getOrderByOrd = async (ord : string) => {
  try{
    const response = await api.get(`orders/order/${ord}/qr-debug/`);
    console.log("get order with ORD number Successfully",response.data)
    return response.data;

  }catch(error){
    console.log("Faild to get order",error)
    throw error;
  }
}


export const verifyOrder = async(data: object) => {
  try{
    const response = await api.post(`invoices/payments/cash/validate`,data)
    console.log("Order done successfully",response.data)
    return response.data
  }catch(error){
    console.log("Faild to get order",error)
    throw error;
  }
}
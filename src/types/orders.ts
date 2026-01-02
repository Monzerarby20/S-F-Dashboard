
 type  QROrderItem =  {
    productId: number;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    scannedQuantity: number;
    isComplete: boolean;
  }


  export type  QROrder  = {
    id: number;
    qrCode: string;
    customerId?: number;
    customerName?: string;
    totalAmount: number;
    paymentStatus: string;
    paymentTransactionId?: string;
    items: QROrderItem[];
    status: string;
    createdAt: string;
  }


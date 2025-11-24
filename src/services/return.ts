import api from "./auth"


export const lookupInvoice = async(invoice_number:string) =>{
    try{
        const response = await api.post(`rma/rma/lookup_invoice/`,invoice_number)
        console.log("Get Invoice Data Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't get invoice data",error)
        throw error
    }
}


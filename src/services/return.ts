import api from "./auth"

//Return Items
//Use in return and replace
export const lookupInvoice = async(invoice_number:object) =>{
    try{
        const response = await api.post(`rma/rma/lookup_invoice/`,invoice_number)
        console.log("Get Invoice Data Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't get invoice data",error)
        throw error
    }
}
//Use in return and replace {Choose rma_type replace or return}
export const requestRma = async(invoice_data:object) =>{
    try{
        const response = await api.post(`rma/rma/`,invoice_data)
        console.log("Get RMA Data Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't get RMA data",error)
        throw error
    }
}
//Use in return and replace
export const selectItmeToReturn = async(rma_id:number,productData:object) =>{
    try{
        const response = await api.post(`rma/rma/${rma_id}/add_returned_item/`,productData)
        console.log("Returned Item Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't return product ",error)
        throw error
    }
}


export const confirmReturn = async(rma_id:number) =>{
    try{
        const response = await api.post(`rma/rma/${rma_id}/confirm/`)
        console.log("Returned Item Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't return product ",error)
        throw error
    }
}



//Replace Items


export const confirmReplace = async(rma_id:number,amount_paid:object) =>{
    try{
        const response = await api.post(`rma/rma/${rma_id}/confirm_for_replacment/`,amount_paid)
        console.log("Returned Item Successfully",response.data)
        return response.data
    }catch(error){
        console.log("Couldn't return product ",error)
        throw error
    }
}

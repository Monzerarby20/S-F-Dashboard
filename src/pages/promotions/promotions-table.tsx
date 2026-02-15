import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAllOffers } from "@/services/offers";
//result is an array of objects with the following properties:
/**
 * {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 3,
            "products": [],
            "created_by_email": "kdb@g.com",
            "name": "عرض شاي الكبوس المميز",
            "slug": "mtjr-msry",
            "description": "عرض خاص على شاي الكبوس الفاخر",
            "promotion_type": "flash_sale",
            "banner_image_url": null,
            "landing_page_url": null,
            "is_active": true,
            "is_featured": true,
            "start_date": "2024-01-15",
            "end_date": "2024-01-20",
            "target_audience": "all",
            "budget": "50000.00",
            "spent_amount": "0.00",
            "goal_type": "sales_amount",
            "goal_value": "100000.00",
            "current_value": "0.00",
            "terms_and_conditions": "شروط وأحكام العرض...",
            "created_at": "2026-02-15T07:06:34.046850+02:00",
            "updated_at": "2026-02-15T07:06:34.046876+02:00",
            "created_by": 34,
            "stores": [],
            "branches": []
        },
        {
            "id": 2,
            "products": [],
            "created_by_email": "kdb@g.com",
            "name": "عرض الصيف الكبير",
            "slug": "mtjr",
            "description": null,
            "promotion_type": "seasonal",
            "banner_image_url": null,
            "landing_page_url": null,
            "is_active": true,
            "is_featured": false,
            "start_date": "2024-06-01",
            "end_date": "2024-08-31",
            "target_audience": "all",
            "budget": "100000.00",
            "spent_amount": "0.00",
            "goal_type": "sales_amount",
            "goal_value": null,
            "current_value": "0.00",
            "terms_and_conditions": null,
            "created_at": "2026-02-15T06:53:56.138553+02:00",
            "updated_at": "2026-02-15T06:53:56.138568+02:00",
            "created_by": 34,
            "stores": [],
            "branches": []
        }
    ]
}
 * 
 */
export default function PromotionsTable() {
    const { data: promotions = [], isLoading } = useQuery({
        queryKey: ['/promotions'],
        queryFn: getAllOffers,
    });
    console.log("Promotions:", promotions);
    return (
        <div className="flex flex-col gap-4">   
            <h1>Promotions</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Is Active</TableHead>
                        <TableHead>Is Featured</TableHead>
                        <TableHead>Target Audience</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Spent Amount</TableHead>
                        <TableHead>Goal Type</TableHead>
                        <TableHead>Goal Value</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Terms and Conditions</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Updated At</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Stores</TableHead>
                        <TableHead>Branches</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {promotions.map((promotion: any) => (
                        <TableRow key={promotion.id}>
                            <TableCell>{promotion.name}</TableCell>
                            <TableCell>{promotion.description}</TableCell>
                            <TableCell>{promotion.start_date}</TableCell>
                            <TableCell>{promotion.end_date}</TableCell>
                            <TableCell>{promotion.is_active}</TableCell>
                            <TableCell>{promotion.is_featured}</TableCell>
                            <TableCell>{promotion.target_audience}</TableCell>
                            <TableCell>{promotion.budget}</TableCell>
                            <TableCell>{promotion.spent_amount}</TableCell>
                            <TableCell>{promotion.goal_type}</TableCell>
                            <TableCell>{promotion.goal_value}</TableCell>
                            <TableCell>{promotion.current_value}</TableCell>
                            <TableCell>{promotion.terms_and_conditions}</TableCell>
                            <TableCell>{promotion.created_at}</TableCell>
                            <TableCell>{promotion.updated_at}</TableCell>
                            <TableCell>{promotion.created_by}</TableCell>
                            <TableCell>{promotion.stores}</TableCell>
                            <TableCell>{promotion.branches}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>


    )
}
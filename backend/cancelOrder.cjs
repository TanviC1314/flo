const axios = require('axios');
const { MongoClient } = require('mongodb');
const moment = require('moment');
const { checkAndRefreshToken, getAccessTokenValue } = require('./auth.cjs');

// MongoDB setup
const uri = "mongodb+srv://FLO:FLO@flo.dhcuose.mongodb.net/FLO?retryWrites=true&w=majority&appName=Flo";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'Flo';
const saleOrdersCollection = 'saleorders';
const cancellationsCollection = 'cancellations';

const createCancellationRecord = async (saleOrder, saleOrderItemCode, cancellationReason, status) => {
    const now = moment().format("MM/DD/YYYY HH:mm:ss");
    return {
        "Date of Cancellation Initiation": now,
        "Date of Cancellation Approval": status === "APPROVAL PENDING" ? "" : now,
        "Agent Name": status === "APPROVAL PENDING" ? "" : "System",
        "Cancellation Channel": "Customer",
        "Type of Cancellation": saleOrder["COD"] === "0" ? "Cancel & Refund" : "COD Cancellation",
        "Reason for Cancellation": cancellationReason,
        "Agent Comments": "",
        "Accounts Team Comments": "",
        "Order Date as dd/mm/yyyy hh:MM:ss": saleOrder["Order Date as dd/mm/yyyy hh:MM:ss"],
        "Display Order Code": saleOrder["Display Order Code"],
        "Sale Order Item Code": saleOrderItemCode,
        "Sale Order Item Status": saleOrder["Sale Order Item Status"],
        "Item SKU Code": saleOrder["Item SKU Code"],
        "SKU Name": saleOrder["SKU Name"],
        "Category": saleOrder["Category"],
        "Gift Message": saleOrder["Gift Message"],
        "Facility": saleOrder["Facility"],
        "GSTIN": saleOrder["GSTIN"],
        "Customer GSTIN": saleOrder["Customer GSTIN"],
        "Invoice Code": saleOrder["Invoice Code"],
        "Invoice Created": saleOrder["Invoice Created"],
        "Total Price": saleOrder["Total Price"],
        "Voucher Code": saleOrder["Voucher Code"],
        "Billing Address Name": saleOrder["Billing Address Name"],
        "Notification Email": saleOrder["Notification Email"],
        "Notification Mobile": saleOrder["Notification Mobile"],
        "Shipping Address Name": saleOrder["Shipping Address Name"],
        "Shipping Address Line 1": saleOrder["Shipping Address Line 1"],
        "Shipping Address Line 2": saleOrder["Shipping Address Line 2"],
        "Shipping Address City": saleOrder["Shipping Address City"],
        "Shipping Address State": saleOrder["Shipping Address State"],
        "Shipping Address Pincode": saleOrder["Shipping Address Pincode"],
        "Shipping Address Phone": saleOrder["Shipping Address Phone"],
        "COD": saleOrder["COD"],
        "Shipping Package Code": saleOrder["Shipping Package Code"],
        "Shipping Package Creation Date": saleOrder["Shipping Package Creation Date"],
        "Shipping Package Status Code": saleOrder["Shipping Package Status Code"],
        "Shipping Provider": saleOrder["Shipping Provider"],
        "Shipping Courier": saleOrder["Shipping Courier"],
        "Shipping Courier Status": saleOrder["Shipping Courier Status"],
        "Shipping Tracking Status": saleOrder["Shipping Tracking Status"],
        "Tracking Number": saleOrder["Tracking Number"],
        "Dispatch Date": saleOrder["Dispatch Date"],
        "Cancellation Request Status": status,
        "Refund Status": saleOrder["COD"] === "0" ? "PENDING" : "COD ORDER"
    };
};

const cancelOrder = async (saleOrderItemCodes, cancellationReason) => {
    await client.connect();
    const db = client.db(dbName);
    const saleOrders = db.collection(saleOrdersCollection);
    const cancellations = db.collection(cancellationsCollection);

    const saleOrdersToCancel = await saleOrders.find({ "Sale Order Item Code": { $in: saleOrderItemCodes } }).toArray();

    if (saleOrdersToCancel.length === 0) {
        console.error("No sale order items found.");
        await client.close();
        return;
    }

    const itemsToCancelDirectly = [];
    const itemsNeedingApproval = [];
    const itemsDispatched = [];

    for (const saleOrder of saleOrdersToCancel) {
        if (saleOrder["On Hold"] === true) {
            console.log(`Order ${saleOrder["Sale Order Item Code"]} is on hold and can't be cancelled right now. Please contact our customer support team for more details`);
            continue;
        }

        const canCancelDirectly =
            (saleOrder["Sale Order Status"] === "Pending Verification" && saleOrder["Sale Order Item Status"] === "CREATED") ||
            (saleOrder["Sale Order Status"] === "PROCESSING" && saleOrder["Sale Order Item Status"] === "UNFULFILLABLE") ||
            (saleOrder["Sale Order Item Status"] === "FULFILLABLE" && ["CREATED", "PACKED"].includes(saleOrder["Shipping Package Status Code"]));

        const needsApproval =
            saleOrder["Sale Order Item Status"] === "FULFILLABLE" && saleOrder["Shipping Package Status Code"] === "READY_TO_SHIP";

        const orderDispatched =
            saleOrder["Sale Order Item Status"] === "DISPATCHED" && ["SHIPPED", "DISPATCHED"].includes(saleOrder["Shipping Package Status Code"]);

        if (canCancelDirectly) {
            itemsToCancelDirectly.push(saleOrder["Sale Order Item Code"]);
        } else if (needsApproval) {
            const newCancellation = await createCancellationRecord(saleOrder, saleOrder["Sale Order Item Code"], cancellationReason, "APPROVAL PENDING");
            await cancellations.insertOne(newCancellation);
            console.log(`Order ${saleOrder["Sale Order Item Code"]} cancellation request stored and awaiting approval.`);
        } else if (orderDispatched) {
            const newCancellation = await createCancellationRecord(saleOrder, saleOrder["Sale Order Item Code"], cancellationReason, "ORDER DISPATCHED");
            await cancellations.insertOne(newCancellation);
            console.log(`Order ${saleOrder["Sale Order Item Code"]} dispatched. Cancellation request stored.`);
        } else {
            console.log(`Order ${saleOrder["Sale Order Item Code"]} cannot be cancelled. It is either not in the correct status or the item status and package status do not match the required conditions.`);
        }
    }

    if (itemsToCancelDirectly.length > 0) {
        await checkAndRefreshToken();
        const url = `https://${tenant}.unicommerce.com/services/rest/v1/oms/saleOrder/cancel`;
        const payload = {
            "saleOrderCode": saleOrdersToCancel[0]["Sale Order Code"], // Assuming all items belong to the same order code
            "saleOrderItemCodes": itemsToCancelDirectly,
            "cancelPartially": true,
            "cancelOnChannel": true,
            "cancelledBySeller": false,
            "cancellationReason": cancellationReason
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessTokenValue()}`,
                    'Facility': "FloBadlapur"
                }
            });

            if (response.data.successful) {
                for (const itemCode of itemsToCancelDirectly) {
                    const saleOrder = saleOrdersToCancel.find(order => order["Sale Order Item Code"] === itemCode);
                    const newCancellation = await createCancellationRecord(saleOrder, itemCode, cancellationReason, "CANCELLED BY CUSTOMER");
                    await cancellations.insertOne(newCancellation);
                    console.log(`Order ${itemCode} cancelled and information updated successfully.`);
                }
            } else {
                console.error("Failed to cancel order:", response.data.message);
            }
        } catch (error) {
            console.error("Error cancelling sale order:", error.response ? error.response.data : error.message);
        }
    }

    await client.close();
};

// Example usage
cancelOrder(["saleOrderItemCodeExample1", "saleOrderItemCodeExample2"], "Customer changed mind");
